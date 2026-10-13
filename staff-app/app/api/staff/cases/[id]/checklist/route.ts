import { getDb } from "../../../../../../db";
import { addActivity, caseIsVisible, getStaffIdentity, jsonError } from "../../../../../lib/staff";

const editableItems = new Set(["reports_collected", "data_reviewed", "data_verified", "ai_findings_reviewed"]);
const labels: Record<string, string> = {
  reports_collected: "איסוף הדוחות הושלם",
  data_reviewed: "בדיקת הנתונים הושלמה",
  data_verified: "מהימנות הנתונים אומתה",
  ai_findings_reviewed: "ממצאי ה-AI נבדקו",
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const { id } = await context.params;
    if (!await caseIsVisible(staff, id)) return jsonError("התיק לא נמצא או שאינך משויך אליו.", 404);
    const body = await request.json() as Record<string, unknown>;
    const itemKey = typeof body.itemKey === "string" ? body.itemKey : "";
    if (!editableItems.has(itemKey) || typeof body.completed !== "boolean") return jsonError("פריט הצ׳ק־ליסט או ערך הסימון אינם תקינים.", 400);
    const db = getDb();
    const now = new Date().toISOString();
    await db.$client.prepare(`INSERT INTO case_checklist (case_id, item_key, completed, completed_by, completed_at)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(case_id, item_key) DO UPDATE SET
      completed = excluded.completed, completed_by = excluded.completed_by, completed_at = excluded.completed_at`)
      .bind(id, itemKey, body.completed ? 1 : 0, body.completed ? staff.displayName : null, body.completed ? now : null).run();
    await addActivity(id, staff, body.completed ? "הושלם שלב בצ׳ק־ליסט" : "עודכן צ׳ק־ליסט", `${labels[itemKey]} · ${body.completed ? "הושלם" : "סומן כלא הושלם"}`);
    return Response.json({ ok: true, itemKey, completed: body.completed, completedBy: body.completed ? staff.displayName : null, completedAt: body.completed ? now : null });
  } catch (error) {
    console.error("SafeDeal checklist update failed", error);
    return jsonError("לא הצלחנו לשמור את הצ׳ק־ליסט.", 503);
  }
}
