import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSessionByToken, SESSION_COOKIE_NAME } from "../../../lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await deleteSessionByToken(token);
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("SafeDeal staff logout failed", error);
    return NextResponse.json({ error: "שגיאה בהתנתקות." }, { status: 500 });
  }
}
