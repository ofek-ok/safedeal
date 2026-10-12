import { getChatGPTUser } from "../chatgpt-auth";
import { getDb } from "../../db";

const OWNER_EMAIL = "ofekokonski99@gmail.com";

export type StaffIdentity = {
  userId: string;
  email: string;
  displayName: string;
  role: "admin" | "analyst";
};

export async function getStaffIdentity(): Promise<StaffIdentity | null> {
  const user = await getChatGPTUser();
  if (!user) return null;
  const db = getDb();
  const now = new Date().toISOString();
  if (user.userId === "vercel-protected-team" || user.email.toLowerCase() === OWNER_EMAIL) {
    await db.$client.prepare(`INSERT INTO staff_members (user_id, email, display_name, role, active, created_at)
      VALUES (?, ?, ?, 'admin', 1, ?)
      ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name, role = 'admin', active = 1`)
      .bind(user.userId, user.email.toLowerCase(), user.fullName ?? user.email, now).run();
  }
  const result = await db.$client.prepare(`SELECT user_id, email, display_name, role
    FROM staff_members WHERE (user_id = ? OR email = ?) AND active = 1 LIMIT 1`).bind(user.userId, user.email.toLowerCase()).first<{
      user_id: string; email: string; display_name: string; role: "admin" | "analyst";
    }>();
  if (!result || (result.role !== "admin" && result.role !== "analyst")) return null;
  if (result.user_id !== user.userId) {
    await db.$client.prepare(`UPDATE staff_members SET user_id = ?, display_name = ? WHERE email = ? AND user_id = ?`)
      .bind(user.userId, user.fullName ?? result.display_name, result.email, result.user_id).run();
  }
  return { userId: user.userId, email: result.email, displayName: result.display_name, role: result.role };
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function caseIsVisible(identity: StaffIdentity, caseId: string) {
  const db = getDb();
  const query = identity.role === "admin"
    ? `SELECT id FROM cases WHERE id = ? LIMIT 1`
    : `SELECT id FROM cases WHERE id = ? AND analyst_user_id = ? LIMIT 1`;
  const result = identity.role === "admin"
    ? await db.$client.prepare(query).bind(caseId).first()
    : await db.$client.prepare(query).bind(caseId, identity.userId).first();
  return Boolean(result);
}

export async function addActivity(caseId: string, identity: StaffIdentity | null, action: string, detail: string) {
  const db = getDb();
  await db.$client.prepare(`INSERT INTO activity (id, case_id, actor_user_id, actor_name, action, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), caseId, identity?.userId ?? null, identity?.displayName ?? "בקשה חדשה", action, detail, new Date().toISOString()).run();
}
