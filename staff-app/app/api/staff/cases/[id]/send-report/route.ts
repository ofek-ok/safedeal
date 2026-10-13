import { getDb } from "../../../../../../db";
import { caseIsVisible, getStaffIdentity, jsonError } from "../../../../../lib/staff";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const staff = await getStaffIdentity();
  if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
  const { id } = await context.params;
  if (!await caseIsVisible(staff, id)) return jsonError("התיק לא נמצא או שאינך משויך אליו.", 404);

  const resendApiKey = process.env.RESEND_API_KEY;
  const reportFrom = process.env.SAFEDEAL_REPORT_FROM;
  if (!resendApiKey || !reportFrom) return jsonError("שליחת דוחות במייל עדיין לא הוגדרה.", 503);

  const db = getDb();
  const caseRow = await db.$client.prepare(`SELECT case_number AS caseNumber, client_name AS clientName, client_email AS clientEmail,
    asset_type AS assetType, city, street, house, block, parcel, sub_parcel AS subParcel, status FROM cases WHERE id = ?`)
    .bind(id).first<Record<string, string | null>>();
  if (!caseRow) return jsonError("התיק לא נמצא.", 404);
  if (!caseRow.clientEmail || !/^\S+@\S+\.\S+$/.test(caseRow.clientEmail)) return jsonError("לא נמצאה כתובת דוא״ל תקינה ללקוח.", 400);
  if (caseRow.status === "דוח נשלח") return jsonError("הדוח כבר נשלח ללקוח.", 409);
  if (caseRow.status !== "דוח מוכן") return jsonError("יש להפיק ולאשר דוח לפני שליחתו ללקוח.", 409);

  const checklistResult = await db.$client.prepare(`SELECT item_key AS itemKey, completed FROM case_checklist WHERE case_id = ?`).bind(id).all<{ itemKey: string; completed: number }>();
  const checklist = new Map((checklistResult.results ?? []).map((item) => [item.itemKey, item.completed === 1]));
  if (["reports_collected", "data_reviewed", "data_verified", "ai_findings_reviewed"].some((key) => !checklist.get(key))) {
    return jsonError("יש להשלים את צ׳ק־ליסט האנליסט לפני שליחת הדוח ללקוח.", 409);
  }

  const latest = await db.$client.prepare(`SELECT id, version, snapshot FROM reports WHERE case_id = ? ORDER BY version DESC LIMIT 1`)
    .bind(id).first<{ id: string; version: number; snapshot: string }>();
  if (!latest) return jsonError("לא נמצא דוח מאושר לשליחה.", 409);
  const unresolved = await db.$client.prepare(`SELECT COUNT(*) AS count FROM findings WHERE case_id = ? AND state IN ('לבדיקה', 'לברור')`)
    .bind(id).first<{ count: number }>();
  if ((unresolved?.count ?? 0) > 0) return jsonError("יש להשלים את בקרת הממצאים לפני השליחה.", 409);

  let report: { findings?: Array<Record<string, unknown>>; case?: Record<string, unknown>; generatedAt?: string };
  try { report = JSON.parse(latest.snapshot) as typeof report; }
  catch { return jsonError("תוכן הדוח אינו תקין. צרו גרסה חדשה לפני השליחה.", 409); }
  const findings = (report.findings ?? []).filter((finding) => finding.state === "אושר");
  const address = [caseRow.street, caseRow.house, caseRow.city].filter(Boolean).join(" ");
  const findingRows = findings.length ? findings.map((finding) => `<tr><td style="padding:14px;border-bottom:1px solid #e6ecee"><strong>${escapeHtml(finding.title)}</strong><div style="margin-top:6px;color:#586d75;line-height:1.7">${escapeHtml(finding.note).replace(/\n/g, "<br>")}</div><div style="margin-top:8px;color:#70848b;font-size:13px">${escapeHtml(finding.category)} · רמת חומרה: ${escapeHtml(finding.severity)}${finding.source ? ` · מקור: ${escapeHtml(finding.source)}` : ""}</div></td></tr>`).join("")
    : `<tr><td style="padding:14px;color:#586d75">לא נותרו ממצאים שאושרו לאחר בקרת האנליסט. הדוח כולל את פרטי הבדיקה והמסמכים שנבדקו.</td></tr>`;
  const html = `<!doctype html><html lang="he" dir="rtl"><body style="margin:0;background:#f3f6f7;font-family:Arial,'Noto Sans Hebrew',sans-serif;color:#213941"><div style="max-width:720px;margin:0 auto;padding:28px 14px"><div style="background:#102330;color:#fff;padding:22px 26px;border-radius:12px 12px 0 0"><div style="font-size:13px;color:#8cdac7;letter-spacing:1px">SAFEDEAL</div><h1 style="margin:12px 0 4px;font-size:25px">דוח בדיקת נאותות לנכס</h1><div style="color:#cad5d9">${escapeHtml(caseRow.caseNumber)} · גרסה ${latest.version}</div></div><div style="background:#fff;border:1px solid #e2e9eb;padding:24px 26px"><h2 style="font-size:17px;margin:0 0 14px">פרטי הנכס</h2><div style="line-height:1.9;color:#415a62">${escapeHtml(address)}<br>${escapeHtml(caseRow.assetType || "נכס")}${caseRow.block || caseRow.parcel ? ` · גוש ${escapeHtml(caseRow.block)} · חלקה ${escapeHtml(caseRow.parcel)}` : ""}</div><h2 style="font-size:17px;margin:24px 0 8px">ממצאים שאושרו בבקרת אנליסט</h2><table role="presentation" style="width:100%;border-collapse:collapse">${findingRows}</table><div style="margin-top:22px;padding:14px;background:#f2f7f6;border-radius:8px;color:#586d75;line-height:1.7;font-size:13px">הדוח מבוסס על המידע והמסמכים שנבדקו ועל ממצאים שאושרו על ידי אנליסט SafeDeal. יש לאמת פרטים מול הגורמים והמקורות הרשמיים הרלוונטיים לפני קבלת החלטה בעסקה.</div></div><div style="padding:14px 8px;text-align:center;color:#7f9197;font-size:12px">SafeDeal · בדיקת נאותות לנכס · ${new Date().toLocaleDateString("he-IL")}</div></div></body></html>`;

  const lock = await db.$client.prepare(`UPDATE cases SET status = 'שולח דוח', updated_at = ? WHERE id = ? AND status = 'דוח מוכן'`)
    .bind(new Date().toISOString(), id).run();
  if (lock.meta.changes !== 1) return jsonError("הדוח כבר בתהליך שליחה או שהסטטוס השתנה.", 409);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `safedeal-report/${id}/${latest.version}`,
      },
      body: JSON.stringify({
        from: reportFrom,
        to: [caseRow.clientEmail],
        subject: `דוח בדיקת נאותות לנכס · ${caseRow.caseNumber}`,
        html,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const result = await response.json().catch(() => null) as { id?: string } | null;
    if (!response.ok || !result?.id) throw new Error("mail send failed");
    const now = new Date().toISOString();
    await db.$client.batch([
      db.$client.prepare(`UPDATE cases SET status = 'דוח נשלח', updated_at = ? WHERE id = ?`).bind(now, id),
      db.$client.prepare(`INSERT INTO activity (id, case_id, actor_user_id, actor_name, action, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), id, staff.userId, staff.displayName, "נשלח דוח ללקוח", `גרסה ${latest.version} נשלחה בדוא״ל אל ${caseRow.clientEmail}.`, now),
      db.$client.prepare(`INSERT INTO case_checklist (case_id, item_key, completed, completed_by, completed_at) VALUES (?, 'report_sent', 1, ?, ?)
        ON CONFLICT(case_id, item_key) DO UPDATE SET completed = 1, completed_by = excluded.completed_by, completed_at = excluded.completed_at`)
        .bind(id, staff.displayName, now),
    ]);
    return Response.json({ ok: true, version: latest.version });
  } catch (error) {
    await db.$client.prepare(`UPDATE cases SET status = 'דוח מוכן', updated_at = ? WHERE id = ? AND status = 'שולח דוח'`)
      .bind(new Date().toISOString(), id).run().catch(() => undefined);
    console.error("SafeDeal final report email failed", error instanceof Error && error.name === "TimeoutError" ? "timeout" : "provider error");
    return jsonError("שליחת הדוח נכשלה. אפשר לנסות שוב לאחר בדיקת הגדרות הדוא״ל.", 502);
  }
}
