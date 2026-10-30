import { getDb } from "../../../../../../db";
import { caseIsVisible, getStaffIdentity, jsonError } from "../../../../../lib/staff";
import { getFilesBucket } from "../../../../../lib/storage";

const maxFileBytes = 20 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const allowedExtensions = new Set(["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif"]);
const documentTypes = new Set(["נסח טאבו / אישור זכויות", "דוח מרשם המשכונות", "דוח מתדיינים / הליכים משפטיים", "הסכם / טיוטת חוזה", "תכנון והיתרים", "מסמכי מוכר / יזם", "מסמכי רשות מקומית", "מסמך פיננסי", "אחר"]);

function cleanText(value: FormDataEntryValue | null, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function contentTypeFor(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "pdf" ? "application/pdf" : extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : extension === "heic" ? "image/heic" : extension === "heif" ? "image/heif" : "image/jpeg";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const { id } = await context.params;
    if (!await caseIsVisible(staff, id)) return jsonError("התיק לא נמצא או שאינך משויך אליו.", 404);

    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > maxFileBytes + 64_000) return jsonError("הקובץ חורג ממגבלת 20MB.", 413);
    const form = await request.formData().catch(() => null);
    if (!form) return jsonError("הקובץ לא נקלט. נסו להעלות אותו שוב.", 400);
    const file = form.get("file");
    const documentType = cleanText(form.get("documentType"), 80);
    const source = cleanText(form.get("source"), 240);
    const collectedAt = cleanText(form.get("collectedAt"), 40);
    if (!(file instanceof File) || file.size <= 0) return jsonError("בחרו קובץ להעלאה.", 400);
    if (file.size > maxFileBytes) return jsonError("הקובץ חורג ממגבלת 20MB.", 413);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedTypes.has(file.type) && !(file.type === "" && allowedExtensions.has(extension))) return jsonError("אפשר להעלות PDF או תמונה מסוג JPG, PNG, WEBP, HEIC או HEIF.", 400);
    if (!documentTypes.has(documentType)) return jsonError("בחרו סוג מסמך מהרשימה.", 400);
    if (!source) return jsonError("ציינו מאיזה מקור נאסף המסמך.", 400);
    if (collectedAt && Number.isNaN(Date.parse(collectedAt))) return jsonError("תאריך איסוף לא תקין.", 400);

    const bucket = getFilesBucket();
    if (!bucket) return jsonError("אחסון המסמכים אינו זמין כרגע.", 503);
    const db = getDb();
    const currentCount = await db.$client.prepare("SELECT COUNT(*) AS count FROM documents WHERE case_id = ?").bind(id).first<{ count: number }>();
    if ((currentCount?.count ?? 0) >= 40) return jsonError("הגעתם למגבלת 40 מסמכים בתיק.", 409);

    const documentId = crypto.randomUUID();
    const now = new Date().toISOString();
    const fileName = file.name.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180) || "מסמך";
    const fileKey = `cases/${id}/staff/${documentId}`;
    const type = contentTypeFor(file);
    const metadata = {
      documentType,
      source,
      collectedAt: collectedAt || now,
      uploadedBy: staff.displayName.slice(0, 120),
      uploadedByEmail: staff.email.slice(0, 254),
    };

    await bucket.put(fileKey, await file.arrayBuffer(), { httpMetadata: { contentType: type }, customMetadata: metadata });
    try {
    await db.$client.batch([
        db.$client.prepare("INSERT INTO documents (id, case_id, file_key, filename, content_type, size, uploaded_at, document_type, source, collected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(documentId, id, fileKey, fileName, type, file.size, now, documentType, source, collectedAt || now),
        db.$client.prepare("INSERT INTO activity (id, case_id, actor_user_id, actor_name, action, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(crypto.randomUUID(), id, staff.userId, staff.displayName, "הועלה מסמך", `${documentType} · ${fileName} · ${source}`, now),
        db.$client.prepare(`UPDATE case_checklist SET completed = 0, completed_by = NULL, completed_at = NULL WHERE case_id = ? AND item_key IN ('reports_collected', 'data_reviewed', 'data_verified', 'ai_findings_reviewed')`).bind(id),
        db.$client.prepare(`UPDATE cases SET status = 'באיסוף מידע', updated_at = ? WHERE id = ? AND status IN ('מוכן לניתוח', 'בבדיקת אנליסט', 'דוח מוכן')`).bind(now, id),
      ]);
    } catch (error) {
      await bucket.delete(fileKey).catch(() => undefined);
      throw error;
    }

    return Response.json({ id: documentId, filename: fileName, contentType: type, size: file.size, uploadedAt: now, ...metadata }, { status: 201 });
  } catch (error) {
    console.error("SafeDeal staff document upload failed", error);
    return jsonError("לא הצלחנו לשמור את המסמך בתיק.", 503);
  }
}
