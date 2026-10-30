import { getDb } from "../../../../db";
import { getStaffIdentity, jsonError } from "../../../lib/staff";

const complianceTasks = [
  ["privacy_inventory", "מיפוי מידע אישי ומטרות", "לתעד איזה מידע אישי נאסף בתיק, מי משתמש בו, לאיזו מטרה, והאם כל שדה ומסמך נחוצים."],
  ["database_duties", "בדיקת חובות מאגר מידע", "לבחון עם גורם משפטי את חובת הרישום או ההודעה לרשות ואת תחולת תיקון 13 לפי סוג המידע, היקף המאגר והשימושים."],
  ["security_level", "קביעת רמת אבטחה ומסמך הגדרות", "לסווג את המאגר, לתעד את מטרותיו, סוגי המידע, בעלי התפקידים ורמת האבטחה, ולהחזיק מסמכי אבטחה מעודכנים."],
  ["access_review", "הרשאות, אימות ותיעוד גישה", "לסקור הרשאות Admin ו-Member, לוודא גישה לפי צורך, ולבדוק שתיעוד הגישה והפעולות מספיק לצורכי בקרה."],
  ["vendors_transfers", "ספקים והעברת מידע", "למפות את ספקי האחסון, הדוא״ל וה-AI, לבדוק הסכמים, מיקום עיבוד, העברה מחוץ לישראל, הרשאות, מחיקה ואירועי אבטחה."],
  ["ai_privacy", "בדיקת פרטיות בשימוש ב-AI", "לצמצם מידע שנשלח ל-AI, לתעד את מטרת העיבוד, לבדוק את תנאי הספק, ולשמור על בחינה ואישור אנושיים של ממצאים."],
  ["retention", "שמירה, ארכוב ומחיקה", "לקבוע תקופות שמירה למסמכי לקוחות, תעודות זהות ודוחות; ליישם מחיקה או הגבלת גישה לפי המדיניות והדין."],
  ["incident_response", "נוהל אירוע אבטחה", "להגדיר מי מדווח, מי חוקר ומתעד, איך מצמצמים פגיעה, ומתי נדרש דיווח מיידי לרשות להגנת הפרטיות."],
] as const;

async function requireAdmin() {
  const staff = await getStaffIdentity();
  if (!staff) return { error: jsonError("אין לך הרשאה למערכת העובדים.", 403) } as const;
  if (staff.role !== "admin") return { error: jsonError("מרכז הציות זמין למנהל בלבד.", 403) } as const;
  return { staff } as const;
}

export async function GET() {
  try {
    const access = await requireAdmin();
    if ("error" in access) return access.error;
    const db = getDb();
    const now = new Date().toISOString();
    await db.$client.batch(complianceTasks.map(([id, title, description]) =>
      db.$client.prepare(`INSERT INTO compliance_tasks (id, title, description, status, note, updated_by, updated_at)
        VALUES (?, ?, ?, 'not_started', '', ?, ?)
        ON CONFLICT(id) DO NOTHING`).bind(id, title, description, access.staff.displayName, now)
    ));
    const result = await db.$client.prepare(`SELECT id, title, description, status, note, updated_by AS updatedBy, updated_at AS updatedAt
      FROM compliance_tasks ORDER BY id`).all();
    return Response.json({ tasks: result.results ?? [] });
  } catch (error) {
    console.error("SafeDeal compliance load failed", error);
    return jsonError("לא הצלחנו לטעון את מרכז הציות.", 503);
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireAdmin();
    if ("error" in access) return access.error;
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const id = typeof body?.id === "string" ? body.id : "";
    const status = typeof body?.status === "string" ? body.status : "";
    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 2000) : "";
    if (!complianceTasks.some(([taskId]) => taskId === id) || !["not_started", "in_progress", "needs_review", "complete"].includes(status)) {
      return jsonError("המשימה או הסטטוס אינם תקינים.", 400);
    }
    const now = new Date().toISOString();
    await getDb().$client.prepare(`UPDATE compliance_tasks SET status = ?, note = ?, updated_by = ?, updated_at = ? WHERE id = ?`)
      .bind(status, note, access.staff.displayName, now, id).run();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("SafeDeal compliance update failed", error);
    return jsonError("לא הצלחנו לשמור את סטטוס המשימה.", 503);
  }
}
