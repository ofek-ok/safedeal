import { getDb } from "../../../../../db";
import { addActivity, caseIsVisible, getStaffIdentity, jsonError } from "../../../../lib/staff";

const statuses = ["חדש", "באיסוף מידע", "ממתין למסמכים", "מוכן לניתוח", "בניתוח", "בבדיקת אנליסט", "דוח מוכן", "שולח דוח", "דוח נשלח"];

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const { id } = await context.params;
    if (!await caseIsVisible(staff, id)) return jsonError("התיק לא נמצא או שאינך משויך אליו.", 404);
    const db = getDb();
    const [caseRow, docs, findings, activity, report, checklistResult] = await Promise.all([
      db.$client.prepare(`SELECT * FROM cases WHERE id = ?`).bind(id).first<Record<string, unknown>>(),
      db.$client.prepare(`SELECT id, file_key AS fileKey, filename, content_type AS contentType, size, uploaded_at AS uploadedAt,
        document_type AS documentType, source, collected_at AS collectedAt FROM documents WHERE case_id = ? ORDER BY uploaded_at`).bind(id).all<{ id: string; fileKey: string; filename: string; contentType: string; size: number; uploadedAt: string; documentType: string | null; source: string | null; collectedAt: string | null }>(),
      db.$client.prepare(`SELECT id, category, title, note, severity, source, confidence, state, review_note AS reviewNote, reviewed_by AS reviewedBy, reviewed_at AS reviewedAt FROM findings WHERE case_id = ? ORDER BY created_at DESC`).bind(id).all(),
      db.$client.prepare(`SELECT id, actor_name AS actorName, action, detail, created_at AS createdAt FROM activity WHERE case_id = ? ORDER BY created_at DESC LIMIT 50`).bind(id).all(),
      db.$client.prepare(`SELECT id, version, created_at AS createdAt FROM reports WHERE case_id = ? ORDER BY version DESC LIMIT 1`).bind(id).first(),
      db.$client.prepare(`SELECT item_key AS itemKey, completed, completed_by AS completedBy, completed_at AS completedAt FROM case_checklist WHERE case_id = ?`).bind(id).all<{ itemKey: string; completed: number; completedBy: string | null; completedAt: string | null }>(),
    ]);
    let intakeData: Record<string, unknown> | null = null;
    if (typeof caseRow?.intake_payload === "string") {
      try {
        const parsed = JSON.parse(caseRow.intake_payload) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) intakeData = parsed as Record<string, unknown>;
      } catch { /* Older or malformed submissions still retain their standard case fields. */ }
    }
    const documents = (docs.results ?? []).map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        contentType: doc.contentType,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
        documentType: doc.documentType ?? (doc.fileKey.includes("/staff/") ? "מסמך לקוח" : "נסח טאבו / אישור זכויות"),
        source: doc.source ?? "הועלה על ידי הלקוח",
        collectedAt: doc.collectedAt ?? doc.uploadedAt,
      }));
    const checklist = Object.fromEntries((checklistResult.results ?? []).map((item) => [item.itemKey, { completed: item.completed === 1, completedBy: item.completedBy, completedAt: item.completedAt }]));
    if (report) checklist.report_generated = { completed: true, completedBy: null, completedAt: null };
    if (caseRow?.status === "דוח נשלח") checklist.report_sent = { completed: true, completedBy: null, completedAt: null };
    return Response.json({ case: caseRow, intakeData, documents, findings: findings.results ?? [], activity: activity.results ?? [], report: report ?? null, checklist });
  } catch (error) {
    console.error("SafeDeal case load failed", error);
    return jsonError("לא הצלחנו לטעון את התיק.", 503);
  }
}

export async function PUT(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const { id } = await context.params;
    if (!await caseIsVisible(staff, id)) return jsonError("התיק לא נמצא או שאינך משויך אליו.", 404);
    const db = getDb();
    const [caseRow, findingsResult, docsResult, latest] = await Promise.all([
      db.$client.prepare(`SELECT * FROM cases WHERE id = ?`).bind(id).first<Record<string, unknown>>(),
      db.$client.prepare(`SELECT category, title, note, severity, source, confidence, state, review_note AS reviewNote, reviewed_by AS reviewedBy, reviewed_at AS reviewedAt FROM findings WHERE case_id = ? ORDER BY created_at`).bind(id).all(),
      db.$client.prepare(`SELECT filename, content_type AS contentType, size, uploaded_at AS uploadedAt FROM documents WHERE case_id = ? ORDER BY uploaded_at`).bind(id).all(),
      db.$client.prepare(`SELECT MAX(version) AS version FROM reports WHERE case_id = ?`).bind(id).first<{ version: number | null }>(),
    ]);
    if (!caseRow) return jsonError("התיק לא נמצא.", 404);
    const checklistResult = await db.$client.prepare(`SELECT item_key AS itemKey, completed FROM case_checklist WHERE case_id = ?`).bind(id).all<{ itemKey: string; completed: number }>();
    const checklist = new Map((checklistResult.results ?? []).map((item) => [item.itemKey, item.completed === 1]));
    const requiredChecklist = ["reports_collected", "data_reviewed", "data_verified", "ai_findings_reviewed"];
    const missingChecklist = requiredChecklist.filter((key) => !checklist.get(key));
    if (missingChecklist.length) return jsonError("יש להשלים את צ׳ק־ליסט האנליסט לפני הפקת הדוח.", 409);
    const approvedFindings = (findingsResult.results ?? []).filter((item) => (item as { state: string }).state === "אושר");
    const unresolved = (findingsResult.results ?? []).filter((item) => (item as { state: string }).state === "לבדיקה" || (item as { state: string }).state === "לברור");
    if (unresolved.length) return jsonError(`יש להשלים בדיקה של ${unresolved.length} ממצאים לפני יצירת הדוח.`, 409);
    if (!approvedFindings.length) return jsonError("אין ממצאים שאושרו לדוח. בדקו את טיוטת הניתוח או הוסיפו ממצא לפני ההפקה.", 409);
    const now = new Date().toISOString();
    const reportId = crypto.randomUUID();
    const version = (latest?.version ?? 0) + 1;
    const snapshot = JSON.stringify({ case: caseRow, findings: approvedFindings, documents: docsResult.results ?? [], generatedBy: staff.displayName, generatedAt: now, version });
    await db.$client.batch([
      db.$client.prepare(`INSERT INTO reports (id, case_id, version, snapshot, generated_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(reportId, id, version, snapshot, staff.displayName, now),
      db.$client.prepare(`UPDATE cases SET status = 'דוח מוכן', updated_at = ? WHERE id = ?`).bind(now, id),
      db.$client.prepare(`INSERT INTO activity (id, case_id, actor_user_id, actor_name, action, detail, created_at) VALUES (?, ?, ?, ?, 'הוכן דוח', ?, ?)`)
        .bind(crypto.randomUUID(), id, staff.userId, staff.displayName, `גרסה ${version} נוצרה לאחר בדיקת כל הממצאים.`, now),
      db.$client.prepare(`INSERT INTO case_checklist (case_id, item_key, completed, completed_by, completed_at) VALUES (?, 'report_generated', 1, ?, ?)
        ON CONFLICT(case_id, item_key) DO UPDATE SET completed = 1, completed_by = excluded.completed_by, completed_at = excluded.completed_at`)
        .bind(id, staff.displayName, now),
    ]);
    return Response.json({ reportId, version }, { status: 201 });
  } catch (error) {
    console.error("SafeDeal report generation failed", error);
    return jsonError("לא הצלחנו ליצור את הדוח.", 503);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const { id } = await context.params;
    if (!await caseIsVisible(staff, id)) return jsonError("התיק לא נמצא או שאינך משויך אליו.", 404);
    const body = await request.json() as Record<string, unknown>;
    const sets: string[] = [];
    const values: unknown[] = [];
    const notes: string[] = [];
    const editablePropertyFields = [
      { key: "block", column: "block", label: "גוש", maxLength: 12 },
      { key: "parcel", column: "parcel", label: "חלקה", maxLength: 12 },
      { key: "subParcel", column: "sub_parcel", label: "תת-חלקה", maxLength: 12 },
    ] as const;
    for (const field of editablePropertyFields) {
      if (body[field.key] === undefined) continue;
      if (body[field.key] !== null && typeof body[field.key] !== "string") return jsonError(`ערך ${field.label} אינו תקין.`, 400);
      const value = typeof body[field.key] === "string" ? body[field.key].trim().slice(0, field.maxLength) : "";
      if (value && !/^\d+$/.test(value)) return jsonError(`יש להזין מספרים בלבד בשדה ${field.label}.`, 400);
      sets.push(`${field.column} = ?`);
      values.push(value || null);
      notes.push(`${field.label}: ${value || "נמחק"}`);
    }
    if (body.status !== undefined) {
      if (typeof body.status !== "string" || !statuses.includes(body.status)) return jsonError("סטטוס לא תקין.", 400);
      if (body.status === "מוכן לניתוח") {
        const identifiers = await getDb().$client.prepare(`SELECT block, parcel FROM cases WHERE id = ?`).bind(id).first<{ block: string | null; parcel: string | null }>();
        if (!identifiers?.block || !identifiers.parcel) return jsonError("יש להשלים גוש וחלקה לפני העברת התיק לניתוח.", 409);
      }
      sets.push("status = ?"); values.push(body.status); notes.push(`סטטוס: ${body.status}`);
    }
    if (body.dueAt !== undefined) {
      if (staff.role !== "admin") return jsonError("רק Admin יכול לשנות יעד לתיק.", 403);
      const dueAt = typeof body.dueAt === "string" && body.dueAt ? body.dueAt : null;
      if (dueAt && Number.isNaN(Date.parse(dueAt))) return jsonError("תאריך יעד לא תקין.", 400);
      sets.push("due_at = ?"); values.push(dueAt); notes.push("תאריך היעד עודכן");
    }
    if (body.analystEmail !== undefined) {
      if (staff.role !== "admin") return jsonError("רק Admin יכול לשייך Member.", 403);
      const email = typeof body.analystEmail === "string" ? body.analystEmail.toLowerCase().trim() : "";
      let member: { user_id: string; email: string } | null = null;
      if (email) {
        member = await getDb().$client.prepare(`SELECT user_id, email FROM staff_members WHERE email = ? AND role IN ('member', 'analyst') AND active = 1`).bind(email).first<{ user_id: string; email: string }>();
        if (!member) return jsonError("העובד לא נמצא ברשימת ה-Member הפעילים.", 400);
      }
      sets.push("analyst_user_id = ?", "analyst_email = ?"); values.push(member?.user_id ?? null, member?.email ?? null); notes.push(member ? `שויך ל-${member.email}` : "שיוך האנליסט הוסר");
    }
    if (!sets.length) return jsonError("לא נשלחו שינויים לשמירה.", 400);
    sets.push("updated_at = ?"); values.push(new Date().toISOString(), id);
    await getDb().$client.prepare(`UPDATE cases SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
    await addActivity(id, staff, "עדכון תיק", notes.join(" · "));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("SafeDeal case update failed", error);
    return jsonError("לא הצלחנו לשמור את השינויים.", 503);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const { id } = await context.params;
    if (!await caseIsVisible(staff, id)) return jsonError("התיק לא נמצא או שאינך משויך אליו.", 404);
    const body = await request.json() as Record<string, unknown>;
    const category = typeof body.category === "string" ? body.category.trim().slice(0, 100) : "";
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 180) : "";
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 5000) : "";
    const severity = typeof body.severity === "string" && ["גבוהה", "בינונית", "נמוכה"].includes(body.severity) ? body.severity : "בינונית";
    if (!category || !title || !note) return jsonError("יש למלא תחום, כותרת ותיאור ממצא.", 400);
    const now = new Date().toISOString();
    const findingId = crypto.randomUUID();
    await getDb().$client.batch([
      getDb().$client.prepare(`INSERT INTO findings (id, case_id, category, title, note, severity, source, confidence, state, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'לבדיקה', ?)`)
        .bind(findingId, id, category, title, note, severity, typeof body.source === "string" ? body.source.trim().slice(0, 240) : null, Number.isInteger(body.confidence) ? Math.max(0, Math.min(100, body.confidence as number)) : null, now),
      getDb().$client.prepare(`UPDATE case_checklist SET completed = 0, completed_by = NULL, completed_at = NULL WHERE case_id = ? AND item_key = 'ai_findings_reviewed'`).bind(id),
      getDb().$client.prepare(`UPDATE cases SET status = 'בבדיקת אנליסט', updated_at = ? WHERE id = ? AND status = 'דוח מוכן'`).bind(now, id),
    ]);
    await addActivity(id, staff, "נוסף ממצא", title);
    return Response.json({ id: findingId }, { status: 201 });
  } catch (error) {
    console.error("SafeDeal finding create failed", error);
    return jsonError("לא הצלחנו לשמור את הממצא.", 503);
  }
}
