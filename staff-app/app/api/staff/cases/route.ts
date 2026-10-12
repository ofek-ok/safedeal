import { getDb } from "../../../../db";
import { getStaffIdentity, jsonError } from "../../../lib/staff";

export async function GET() {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const db = getDb();
    const sql = `SELECT c.id, c.case_number AS caseNumber, c.client_name AS clientName, c.client_email AS clientEmail,
      c.client_phone AS clientPhone, c.asset_type AS assetType, c.city, c.street, c.house, c.price, c.status,
      c.analyst_user_id AS analystUserId, c.analyst_email AS analystEmail, c.due_at AS dueAt,
      c.created_at AS createdAt, COUNT(DISTINCT f.id) AS findingCount, COUNT(DISTINCT d.id) AS documentCount
      FROM cases c LEFT JOIN findings f ON f.case_id = c.id LEFT JOIN documents d ON d.case_id = c.id
      ${staff.role === "admin" ? "" : "WHERE c.analyst_user_id = ?"}
      GROUP BY c.id ORDER BY c.created_at DESC LIMIT 200`;
    const result = staff.role === "admin" ? await db.$client.prepare(sql).all() : await db.$client.prepare(sql).bind(staff.userId).all();
    return Response.json({ cases: result.results ?? [] });
  } catch (error) {
    console.error("SafeDeal cases load failed", error);
    return jsonError("לא הצלחנו לטעון את התיקים.", 503);
  }
}
