import { NextResponse } from "next/server";
import { getDb } from "../../../../db";
import { buildSessionCookieOptions, createSession, SESSION_COOKIE_NAME, verifyPassword } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "יש להזין כתובת דוא״ל וסיסמה." }, { status: 400 });
    }

    const user = await getDb().$client
      .prepare(`SELECT user_id, email, display_name, role, active, password_hash FROM staff_members WHERE LOWER(email) = ? LIMIT 1`)
      .bind(email)
      .first<{ user_id: string; email: string; display_name: string; role: string; active: number; password_hash: string | null }>();

    if (!user || user.active !== 1 || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "דוא״ל או סיסמה שגויים." }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.user_id);
    const response = NextResponse.json({
      ok: true,
      user: {
        userId: user.user_id,
        email: user.email,
        displayName: user.display_name,
        role: user.role === "admin" ? "admin" : "member",
      },
    });
    response.cookies.set(SESSION_COOKIE_NAME, token, buildSessionCookieOptions(expiresAt));
    return response;
  } catch (error) {
    console.error("SafeDeal staff login failed", error);
    return NextResponse.json({ error: "שגיאה בהתחברות למערכת. נסו שוב." }, { status: 503 });
  }
}
