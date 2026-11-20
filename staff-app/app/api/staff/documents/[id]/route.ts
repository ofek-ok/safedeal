import { getDb } from "../../../../../db";
import { caseIsVisible, getStaffIdentity, jsonError } from "../../../../lib/staff";
import { getFilesBucket } from "../../../../lib/storage";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const filesBucket = getFilesBucket();
    if (!filesBucket) return jsonError("אחסון המסמכים אינו זמין.", 503);
    const { id } = await context.params;
    const inline = new URL(request.url).searchParams.get("inline") === "1";
    const doc = await getDb().$client.prepare(`SELECT case_id, file_key, filename, content_type FROM documents WHERE id = ?`).bind(id).first<{ case_id: string; file_key: string; filename: string; content_type: string }>();
    if (!doc || !await caseIsVisible(staff, doc.case_id)) return jsonError("המסמך לא נמצא או שאין לך הרשאה אליו.", 404);
    const object = await filesBucket.get(doc.file_key);
    if (!object) return jsonError("המסמך אינו זמין.", 404);
    const safeName = doc.filename.replace(/[\r\n"\\]/g, "_");
    const disposition = inline ? "inline" : "attachment";
    return new Response(object.body, { headers: { "Content-Type": doc.content_type, "Content-Disposition": `${disposition}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(doc.filename)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    console.error("SafeDeal document download failed", error);
    return jsonError("לא הצלחנו לפתוח את המסמך.", 503);
  }
}
