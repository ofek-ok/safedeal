import { getDb } from "../../../../../db";
import { addActivity, caseIsVisible, getStaffIdentity, jsonError } from "../../../../lib/staff";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const { id } = await context.params;
    const db = getDb();
    const finding = await db.$client.prepare(`SELECT case_id FROM findings WHERE id = ?`).bind(id).first<{ case_id: string }>();
    if (!finding || !await caseIsVisible(staff, finding.case_id)) return jsonError("הממצא לא נמצא או שאינך משויך לתיק.", 404);
    const body = await request.json() as Record<string, unknown>;
    const sets: string[] = [];
    const values: unknown[] = [];
    const editFields = ["category", "title", "note", "severity", "source", "confidence"] as const;
    const isEditing = editFields.some((key) => body[key] !== undefined);
    for (const key of editFields) {
      if (body[key] === undefined) continue;
      if (key === "confidence") {
        const confidence = body.confidence;
        if (confidence !== null && (typeof confidence !== "number" || !Number.isInteger(confidence) || confidence < 0 || confidence > 100)) return jsonError("רמת הביטחון חייבת להיות מספר בין 0 ל־100.", 400);
        sets.push("confidence = ?"); values.push(confidence);
      } else if (key === "severity") {
        if (typeof body.severity !== "string" || !["גבוהה", "בינונית", "נמוכה"].includes(body.severity)) return jsonError("רמת חומרה לא תקינה.", 400);
        sets.push("severity = ?"); values.push(body.severity);
      } else if (key === "source") {
        if (body.source !== null && typeof body.source !== "string") return jsonError("מקור לא תקין.", 400);
        sets.push("source = ?"); values.push(typeof body.source === "string" ? body.source.trim().slice(0, 240) : null);
      } else {
        const limits = { category: 100, title: 180, note: 5000 };
        const value = body[key];
        if (typeof value !== "string" || !value.trim()) return jsonError("יש למלא כותרת ותיאור תקינים.", 400);
        sets.push(`${key} = ?`); values.push(value.trim().slice(0, limits[key]));
      }
    }
    const state = body.state;
    if (state !== undefined) {
      if (typeof state !== "string" || !["אושר", "לברור", "נדחה"].includes(state)) return jsonError("מצב בדיקה לא תקין.", 400);
      sets.push("state = ?"); values.push(state);
      sets.push("review_note = ?"); values.push(typeof body.reviewNote === "string" ? body.reviewNote.trim().slice(0, 2000) : null);
      sets.push("reviewed_by = ?"); values.push(staff.displayName);
      sets.push("reviewed_at = ?"); values.push(new Date().toISOString());
    } else if (isEditing) {
      sets.push("state = 'לבדיקה'", "review_note = NULL", "reviewed_by = NULL", "reviewed_at = NULL");
    } else {
      return jsonError("לא נשלחו שינויים לשמירה.", 400);
    }
    values.push(id);
    await db.$client.batch([
      db.$client.prepare(`UPDATE findings SET ${sets.join(", ")} WHERE id = ?`).bind(...values),
      db.$client.prepare(`UPDATE case_checklist SET completed = 0, completed_by = NULL, completed_at = NULL WHERE case_id = ? AND item_key = 'ai_findings_reviewed'`).bind(finding.case_id),
      db.$client.prepare(`UPDATE cases SET status = 'בבדיקת אנליסט', updated_at = ? WHERE id = ? AND status = 'דוח מוכן'`).bind(new Date().toISOString(), finding.case_id),
    ]);
    const reviewNote = typeof body.reviewNote === "string" ? body.reviewNote.trim().slice(0, 2000) : "";
    await addActivity(finding.case_id, staff, isEditing ? "עודכן ממצא" : "בדיקת ממצא", `${state ?? "נשלח לבדיקה מחדש"}${reviewNote ? ` · ${reviewNote}` : ""}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("SafeDeal finding review failed", error);
    return jsonError("לא הצלחנו לשמור את בדיקת הממצא.", 503);
  }
}
