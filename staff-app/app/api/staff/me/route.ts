import { getStaffIdentity, jsonError } from "../../../lib/staff";

export async function GET() {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    return Response.json({ staff });
  } catch (error) {
    console.error("SafeDeal staff identity unavailable", error);
    return jsonError("מערכת העובדים אינה זמינה כרגע.", 503);
  }
}
