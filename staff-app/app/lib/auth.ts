import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "../../db";

export const SESSION_COOKIE_NAME = "safedeal_staff_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !storedHash.startsWith("scrypt:")) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;
  const [, salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  try {
    const expected = Buffer.from(keyHex, "hex");
    const actual = crypto.scryptSync(password, salt, expected.length);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(`safedeal-session:${token}`).digest("hex");
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const db = getDb();
  await db.$client.batch([
    db.$client.prepare(`INSERT INTO staff_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`).bind(tokenHash, userId, expiresAt, now),
    db.$client.prepare(`UPDATE staff_members SET last_login_at = ? WHERE user_id = ?`).bind(now, userId),
    db.$client.prepare(`DELETE FROM staff_sessions WHERE expires_at < ?`).bind(now),
  ]);
  return { token, expiresAt };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  await getDb().$client.prepare(`DELETE FROM staff_sessions WHERE token_hash = ?`).bind(tokenHash).run().catch(() => undefined);
}

export async function getSessionStaff(): Promise<{
  userId: string;
  email: string;
  displayName: string;
  role: "admin" | "member";
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();
  const row = await getDb().$client
    .prepare(
      `SELECT m.user_id, m.email, m.display_name, m.role
       FROM staff_sessions s
       INNER JOIN staff_members m ON m.user_id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND m.active = 1
       LIMIT 1`
    )
    .bind(tokenHash, now)
    .first<{ user_id: string; email: string; display_name: string; role: string }>();
  if (!row) return null;
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role === "admin" ? "admin" : "member",
  };
}

export function buildSessionCookieOptions(expiresAt: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  };
}
