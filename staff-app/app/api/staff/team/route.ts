import { getDb } from "../../../../db";
import { hashPassword } from "../../../lib/auth";
import { getStaffIdentity, jsonError } from "../../../lib/staff";

export async function GET() {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    if (staff.role !== "admin") return jsonError("רק מנהל יכול לנהל את רשימת העובדים.", 403);
    const result = await getDb().$client
      .prepare(`SELECT email, display_name AS displayName, CASE WHEN role = 'analyst' THEN 'member' ELSE role END AS role, active, last_login_at AS lastLoginAt FROM staff_members ORDER BY role, display_name`)
      .all();
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
    if (staff.role !== "admin") return jsonError("רק Admin יכול להוסיף עובד.", 403);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return jsonError("נתוני המשתמש אינם תקינים.", 400);

    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const displayName = typeof body.displayName === "string" && body.displayName.trim() ? body.displayName.trim().slice(0, 120) : email;
    const role = body.role === "admin" ? "admin" : "member";
    const password = typeof body.password === "string" ? body.password : "";

    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      return jsonError("הזינו כתובת דוא״ל תקינה.", 400);
    }
    if (password.length < 8) {
      return jsonError("הסיסמה חייבת להכיל לפחות 8 תווים.", 400);
    }

    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();
    const userId = `user-${crypto.randomUUID()}`;

    await getDb().$client
      .prepare(`INSERT INTO staff_members (user_id, email, display_name, role, active, password_hash, created_at)
        VALUES (?, ?, ?, ?, 1, ?, ?)
        ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, role = excluded.role, active = 1, password_hash = excluded.password_hash`)
      .bind(userId, email, displayName, role, passwordHash, now)
      .run();

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("SafeDeal team invite failed", error);
    return jsonError("לא הצלחנו להוסיף את העובד.", 503);
  }
}
