import { getDb } from "../../../../../../db";
import { caseIsVisible, getStaffIdentity, jsonError } from "../../../../../lib/staff";
import { getFilesBucket } from "../../../../../lib/storage";

const maxAnalysisBytes = 12 * 1024 * 1024;
const supportedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
type AnalysisFinding = {
  category?: unknown;
  title?: unknown;
  note?: unknown;
  severity?: unknown;
  source?: unknown;
  evidence?: unknown;
  recommendation?: unknown;
  confidence?: unknown;
};

function asText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  let caseId: string | null = null;
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const { id } = await context.params;
    caseId = id;
    if (!await caseIsVisible(staff, id)) return jsonError("התיק לא נמצא או שאינך משויך אליו.", 404);

    const apiBase = process.env.SAFEDEAL_AI_API_URL?.trim().replace(/\/+$/, "");
    const apiKey = process.env.SAFEDEAL_INTERNAL_API_KEY;
    if (!apiBase || !apiKey) return jsonError("חיבור מנוע הניתוח לא הוגדר עדיין. אפשר להוסיף ממצאים ידנית.", 503);

    const db = getDb();
    const caseRow = await db.$client.prepare(`SELECT id, case_number AS caseNumber, status, asset_type AS assetType, city, street, house,
      block, parcel, sub_parcel AS subParcel, condition, price, area, rooms, floor, monthly_rent AS monthlyRent, seller_name AS sellerName,
      amenities, intake_payload AS intakePayload FROM cases WHERE id = ?`).bind(id).first<Record<string, unknown>>();
    if (!caseRow) return jsonError("התיק לא נמצא.", 404);
    if (caseRow.status !== "מוכן לניתוח") return jsonError("סיימו את איסוף המסמכים וסמנו את התיק כמוכן לניתוח.", 409);
    const reportsCollected = await db.$client.prepare(`SELECT completed FROM case_checklist WHERE case_id = ? AND item_key = 'reports_collected'`).bind(id).first<{ completed: number }>();
    if (reportsCollected?.completed !== 1) return jsonError("סמנו בצ׳ק־ליסט שהדוחות הנדרשים נאספו או שתועד שאינם זמינים לפני הפעלת הניתוח.", 409);

    const bucket = getFilesBucket();
    if (!bucket) return jsonError("אחסון המסמכים אינו זמין כרגע.", 503);
    const documentsResult = await db.$client.prepare(`SELECT id, file_key AS fileKey, filename, content_type AS contentType, size, uploaded_at AS uploadedAt,
      document_type AS documentType, source, collected_at AS collectedAt
      FROM documents WHERE case_id = ? ORDER BY uploaded_at`).bind(id).all<{ id: string; fileKey: string; filename: string; contentType: string; size: number; uploadedAt: string; documentType: string | null; source: string | null; collectedAt: string | null }>();
    const documents = documentsResult.results ?? [];
    if (!documents.length) return jsonError("העלו לפחות מסמך אחד לפני הפעלת הניתוח.", 409);
    if (documents.length > 12 || documents.some((document) => !supportedTypes.has(document.contentType))) {
      return jsonError("אפשר לנתח עד 12 מסמכי PDF או תמונה נתמכים בכל הרצה.", 413);
    }
    const totalBytes = documents.reduce((sum, document) => sum + document.size, 0);
    if (totalBytes > maxAnalysisBytes) return jsonError("גודל המסמכים לניתוח חורג מ־12MB. הקטינו את הקבצים או נתחו אותם בסבבים.", 413);

    const lock = await db.$client.prepare(`UPDATE cases SET status = 'בניתוח', updated_at = ? WHERE id = ? AND status = 'מוכן לניתוח'`)
      .bind(new Date().toISOString(), id).run();
    if (lock.meta.changes !== 1) return jsonError("התיק כבר בטיפול או שניתוח אחר התחיל.", 409);

    const form = new FormData();
    let intakePayload: Record<string, unknown> = {};
    if (typeof caseRow.intakePayload === "string") {
      try {
        const parsed = JSON.parse(caseRow.intakePayload) as Record<string, unknown>;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) intakePayload = parsed;
      } catch { /* Keep the standard case fields when older intake data is malformed. */ }
    }
    const intakeDeal = intakePayload.deal && typeof intakePayload.deal === "object" && !Array.isArray(intakePayload.deal)
      ? intakePayload.deal as Record<string, unknown> : {};
    const intakeLocation = intakePayload.location && typeof intakePayload.location === "object" && !Array.isArray(intakePayload.location)
      ? intakePayload.location as Record<string, unknown> : {};
    const documentMetadata = documents.map((document) => ({
        filename: document.filename,
        documentType: document.documentType ?? (document.fileKey.includes("/staff/") ? "מסמך לקוח" : "נסח טאבו / אישור זכויות"),
        source: document.source ?? "הועלה על ידי הלקוח",
        collectedAt: document.collectedAt ?? document.uploadedAt,
      }));
    const caseData = {
      caseNumber: caseRow.caseNumber,
      property: {
        type: caseRow.assetType, city: caseRow.city, street: caseRow.street, houseNumber: caseRow.house,
        block: caseRow.block, parcel: caseRow.parcel, subParcel: caseRow.subParcel, condition: caseRow.condition,
        price: caseRow.price, area: caseRow.area, rooms: caseRow.rooms, floor: caseRow.floor,
        monthlyRent: caseRow.monthlyRent, sellerName: caseRow.sellerName, amenities: caseRow.amenities,
      },
      deal: {
        dealType: intakeDeal.dealType, purpose: intakeDeal.purpose, askingPrice: intakeDeal.askingPrice,
        propertyArea: intakeDeal.propertyArea, roomsCount: intakeDeal.roomsCount, floorNumber: intakeDeal.floorNumber,
        sellerNames: Array.isArray(intakeDeal.sellerNames) ? intakeDeal.sellerNames : [],
      },
      intake: { location: intakeLocation, deal: intakeDeal },
      documents: documentMetadata,
    };
    form.set("caseData", JSON.stringify(caseData));

    for (const document of documents) {
      const stored = await bucket.get(document.fileKey);
      if (!stored) throw new Error("stored document unavailable");
      const fileBytes = await new Response(stored.body).arrayBuffer();
      form.append("files", new File([fileBytes], document.filename, { type: document.contentType }), document.filename);
    }

    const endpoint = `${apiBase}/api/v1/properties/staff/analyze-documents`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "x-safedeal-internal-key": apiKey },
      body: form,
      signal: AbortSignal.timeout(90_000),
    });
    const analysis = await response.json().catch(() => null) as { summary?: unknown; missingInformation?: unknown; findings?: unknown } | null;
    if (!response.ok || !analysis || !Array.isArray(analysis.findings)) {
      throw new Error("analysis service unavailable");
    }

    const createdAt = new Date().toISOString();
    const summary = asText(analysis.summary, 2500);
    const findings = (analysis.findings as AnalysisFinding[]).slice(0, 50).filter((item) => asText(item.title, 180) && asText(item.note, 3000));
    if (!findings.length && summary) {
      findings.push({ category: "סיכום ניתוח מסמכים", title: "סיכום ניתוח AI", note: summary, severity: "בינונית", source: "מסמכי התיק", confidence: 40 });
    }
    const statements = findings.map((item) => {
      const title = asText(item.title, 180);
      const category = asText(item.category, 100) || "בדיקת מסמכים";
      const source = asText(item.source, 240) || "ניתוח AI של מסמכי התיק";
      const severity = ["גבוהה", "בינונית", "נמוכה"].includes(String(item.severity)) ? String(item.severity) : "בינונית";
      const evidence = asText(item.evidence, 1200);
      const recommendation = asText(item.recommendation, 1200);
      const note = [asText(item.note, 3000), evidence && `ראיה מהמסמך: ${evidence}`, recommendation && `להמשך בדיקה: ${recommendation}`].filter(Boolean).join("\n\n");
      const confidence = typeof item.confidence === "number" && Number.isFinite(item.confidence) ? Math.max(0, Math.min(100, Math.round(item.confidence))) : null;
      return db.$client.prepare(`INSERT INTO findings (id, case_id, category, title, note, severity, source, confidence, state, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'לבדיקה', ?)`)
        .bind(crypto.randomUUID(), id, category, title, note, severity, `ניתוח AI: ${source}`.slice(0, 240), confidence, createdAt);
    });
    const missingInformation = Array.isArray(analysis.missingInformation)
      ? analysis.missingInformation.filter((item): item is string => typeof item === "string").slice(0, 20).map((item) => item.slice(0, 200)) : [];
    const activityText = [`הניתוח הסתיים ונוצרו ${findings.length} ממצאים לבדיקה.`, summary, missingInformation.length ? `מידע נוסף שנדרש: ${missingInformation.join("; ")}` : ""].filter(Boolean).join(" ").slice(0, 5000);
    statements.unshift(db.$client.prepare(`UPDATE findings SET state = 'הוחלף', review_note = ?, reviewed_by = ?, reviewed_at = ? WHERE case_id = ? AND source LIKE 'ניתוח AI:%' AND state != 'הוחלף'`)
      .bind("הוחלף בהרצת ניתוח חדשה.", staff.displayName, createdAt, id));
    statements.push(db.$client.prepare(`UPDATE cases SET status = 'בבדיקת אנליסט', updated_at = ? WHERE id = ?`).bind(createdAt, id));
    statements.push(db.$client.prepare(`INSERT INTO case_checklist (case_id, item_key, completed, completed_by, completed_at) VALUES (?, 'ai_findings_reviewed', 0, NULL, NULL)
      ON CONFLICT(case_id, item_key) DO UPDATE SET completed = 0, completed_by = NULL, completed_at = NULL`).bind(id));
    statements.push(db.$client.prepare(`INSERT INTO activity (id, case_id, actor_user_id, actor_name, action, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), id, staff.userId, staff.displayName, "הושלם ניתוח AI", activityText, createdAt));
    await db.$client.batch(statements);
    return Response.json({ findingsCreated: findings.length, summary, missingInformation });
  } catch (error) {
    if (caseId) {
      await getDb().$client.prepare(`UPDATE cases SET status = 'מוכן לניתוח', updated_at = ? WHERE id = ? AND status = 'בניתוח'`)
        .bind(new Date().toISOString(), caseId).run().catch(() => undefined);
    }
    console.error("SafeDeal staff AI analysis failed", error instanceof Error && error.name === "TimeoutError" ? "timeout" : "analysis request failed");
    return jsonError("לא הצלחנו לנתח את התיק כרגע. המסמכים נשארו שמורים, ואפשר לנסות שוב.", 502);
  }
}
