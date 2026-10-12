import { getDb } from "../../../../db";
import { getStaffIdentity, jsonError } from "../../../lib/staff";

export async function GET() {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    if (staff.role !== "admin") return jsonError("רק מנהל יכול לנהל את רשימת העובדים.", 403);
    const result = await getDb().$client.prepare(`SELECT email, display_name AS displayName, role, active FROM staff_members ORDER BY role, display_name`).all();
    return Response.json({ team: result.results ?? [] });
  } catch (error) {
    console.error("SafeDeal team load failed", error);
    return jsonError("לא הצלחנו לטעון את רשימת העובדים.", 503);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    if (staff.role !== "admin") return jsonError("רק מנהל יכול להוסיף עובד.", 403);
    const body = await request.json() as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || body.role !== "analyst") return jsonError("הזינו כתובת דוא״ל תקינה ובחרו תפקיד אנליסט.", 400);
    const now = new Date().toISOString();
    await getDb().$client.prepare(`INSERT INTO staff_members (user_id, email, display_name, role, active, created_at)
      VALUES (?, ?, ?, 'analyst', 1, ?) ON CONFLICT(email) DO UPDATE SET role = 'analyst', active = 1`)
      .bind(`pending:${email}`, email, email, now).run();
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("SafeDeal team invite failed", error);
    return jsonError("לא הצלחנו להוסיף את העובד.", 503);
  }
}
