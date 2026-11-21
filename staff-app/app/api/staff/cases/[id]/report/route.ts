import { getDb } from "../../../../../../db";
import { addActivity, caseIsVisible, getStaffIdentity, jsonError } from "../../../../../lib/staff";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const { id } = await context.params;
    if (!await caseIsVisible(staff, id)) return jsonError("התיק לא נמצא או שאינך משויך אליו.", 404);

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return jsonError("נתוני העריכה אינם תקינים.", 400);

    const db = getDb();
    const latest = await db.$client
      .prepare(`SELECT id, version, snapshot FROM reports WHERE case_id = ? ORDER BY version DESC LIMIT 1`)
      .bind(id)
      .first<{ id: string; version: number; snapshot: string }>();

    if (!latest) return jsonError("יש להפיק טיוטת דוח לפני עריכת שדות הדוח.", 404);

    let snapshot: Record<string, unknown>;
    try {
      snapshot = JSON.parse(latest.snapshot) as Record<string, unknown>;
    } catch {
      return jsonError("תוכן הדוח הקיים אינו תקין.", 409);
    }

    const caseObj = (snapshot.case && typeof snapshot.case === "object" && !Array.isArray(snapshot.case))
      ? { ...(snapshot.case as Record<string, unknown>) }
      : {};
    const reportMeta = (caseObj.report && typeof caseObj.report === "object" && !Array.isArray(caseObj.report))
      ? { ...(caseObj.report as Record<string, unknown>) }
      : {};

    const notes: string[] = [];

    if (body.safeScore !== undefined) {
      if (body.safeScore === null || body.safeScore === "") {
        delete reportMeta.safeScore;
        notes.push("ציון SafeScore הוחזר לחישוב אוטומטי");
      } else {
        const score = Number(body.safeScore);
        if (!Number.isFinite(score) || score < 0 || score > 100) {
          return jsonError("ציון SafeScore חייב להיות מספר בין 0 ל-100.", 400);
        }
        reportMeta.safeScore = Math.round(score);
        notes.push(`ציון SafeScore עודכן ל-${Math.round(score)}`);
      }
    }

    if (body.recommendationOverride !== undefined) {
      const rec = typeof body.recommendationOverride === "string" ? body.recommendationOverride.trim().slice(0, 600) : "";
      if (rec) {
        reportMeta.recommendationOverride = rec;
        notes.push("המלצת שורה תחתונה עודכנה");
      } else {
        delete reportMeta.recommendationOverride;
      }
    }

    if (body.riskTextOverride !== undefined) {
      const risk = typeof body.riskTextOverride === "string" ? body.riskTextOverride.trim().slice(0, 240) : "";
      if (risk) {
        reportMeta.riskTextOverride = risk;
        notes.push("תיאור רמת סיכון עודכן");
      } else {
        delete reportMeta.riskTextOverride;
      }
    }

    if (!notes.length) return jsonError("לא נשלחו שינויים לשמירה.", 400);

    caseObj.report = reportMeta;
    snapshot.case = caseObj;
    snapshot.editedBy = staff.displayName;
    snapshot.editedAt = new Date().toISOString();

    await db.$client
      .prepare(`UPDATE reports SET snapshot = ? WHERE id = ?`)
      .bind(JSON.stringify(snapshot), latest.id)
      .run();

    await addActivity(id, staff, "עריכת דוח ישירה", `גרסה ${latest.version} · ${notes.join(" · ")}`);

    return Response.json({ ok: true, version: latest.version, reportMeta });
  } catch (error) {
    console.error("SafeDeal report override save failed", error);
    return jsonError("לא הצלחנו לשמור את עריכת הדוח.", 503);
  }
}
