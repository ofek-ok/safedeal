import { getSessionStaff } from "./auth";
import { getDb } from "../../db";

export type StaffIdentity = {
  userId: string;
  email: string;
  displayName: string;
  role: "admin" | "member";
};

export async function getStaffIdentity(): Promise<StaffIdentity | null> {
  return await getSessionStaff();
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
