import { requireChatGPTUser } from "../chatgpt-auth";
import { getStaffIdentity } from "../lib/staff";
import StaffWorkspace from "./staff-workspace";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const user = await requireChatGPTUser("/staff");
  let staff = null;
  let unavailable = false;
  try { staff = await getStaffIdentity(); } catch { unavailable = true; }
  if (!staff) return <main className="access-screen"><section><div className="brand-lockup"><span>SD</span><b>SafeDeal</b></div><p className="access-label">מערכת עבודה לצוות</p><h1>{unavailable ? "המערכת לא זמינה כרגע" : "הגישה למערכת מוגבלת"}</h1><p>{unavailable ? "לא ניתן להתחבר למסד הנתונים כרגע. נסו שוב מאוחר יותר." : "אין כרגע הרשאת צוות פעילה לפריסה הזו. בדקו את הגנת הפריסה ואת הגדרות הגישה ב־Vercel."}</p><div className="access-user">{user.displayName}</div></section></main>;
  return <StaffWorkspace initialStaff={staff} />;
}
