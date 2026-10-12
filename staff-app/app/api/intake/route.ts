import { getDb } from "../../../db";
import { getFilesBucket } from "../../lib/storage";

const maxTotalBytes = 20 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const allowedOrigin = "https://safedeal-coral.vercel.app";

function textValue(source: Record<string, unknown>, key: string, limit = 500) {
  return typeof source[key] === "string" ? (source[key] as string).trim().slice(0, limit) : "";
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function fileTypeAllowed(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = new Set(["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif"]);
  return allowedTypes.has(file.type) || (!file.type && !!extension && allowedExtensions.has(extension));
}

function fileContentType(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "pdf" ? "application/pdf" : extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : extension === "heic" ? "image/heic" : extension === "heif" ? "image/heif" : "image/jpeg";
}

function intakeResponse(body: Record<string, string>, status: number) {
  return Response.json(body, { status, headers: { "Access-Control-Allow-Origin": allowedOrigin, "Vary": "Origin", "Cache-Control": "no-store" } });
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const sameOrigin = origin === new URL(request.url).origin;
  const localOrigin = !!origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (origin !== allowedOrigin && !sameOrigin && !localOrigin) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": origin ?? allowedOrigin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600", "Vary": "Origin" } });
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    const sameOrigin = origin === new URL(request.url).origin;
    const localOrigin = !!origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (origin && origin !== allowedOrigin && !sameOrigin && !localOrigin) return Response.json({ error: "מקור הבקשה אינו מורשה." }, { status: 403 });
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > maxTotalBytes + 128_000) return intakeResponse({ error: "הקבצים חורגים ממגבלת 20MB לבקשה." }, 413);
    const form = await request.formData();
    const raw = form.get("intake");
    if (typeof raw !== "string" || raw.length > 12_000) return intakeResponse({ error: "פרטי הבקשה לא תקינים." }, 400);
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return intakeResponse({ error: "פרטי הבקשה לא תקינים." }, 400); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return intakeResponse({ error: "פרטי הבקשה לא תקינים." }, 400);
    const input = parsed as Record<string, unknown>;
    const personal = objectValue(input.personal ?? input);
    const location = objectValue(input.location ?? input);
    const deal = objectValue(input.deal ?? input);
    const sellerNames = (Array.isArray(deal.sellerNames)
      ? deal.sellerNames.filter((name): name is string => typeof name === "string")
      : [textValue(deal, "sellerName", 120)])
      .map((name) => name.trim().slice(0, 120)).filter(Boolean).slice(0, 10);
    const safeDeal = { ...deal };
    delete safeDeal.sellerName;
    delete safeDeal.sellerIdNumber;
    delete safeDeal.sellerId;
    const data = {
      name: textValue(personal, "fullName", 120) || textValue(personal, "name", 120),
      email: textValue(personal, "email", 254),
      phone: textValue(personal, "phone", 40),
      purpose: textValue(personal, "purpose", 40),
      agreeToTerms: personal.agreeToTerms === true,
      asset: textValue(deal, "dealType", 80) || textValue(input, "asset", 80),
      city: textValue(location, "city", 120),
      street: textValue(location, "street", 160),
      house: textValue(location, "houseNumber", 40) || textValue(input, "house", 40),
      block: textValue(location, "block", 40),
      parcel: textValue(location, "parcel", 40),
      subParcel: textValue(location, "subParcel", 40),
      condition: textValue(deal, "condition", 80),
      price: textValue(deal, "askingPrice", 40) || textValue(input, "price", 40),
      area: textValue(deal, "propertyArea", 40) || textValue(input, "area", 40),
      rooms: textValue(deal, "roomsCount", 40) || textValue(input, "rooms", 40),
      floor: textValue(deal, "floorNumber", 40) || textValue(input, "floor", 40),
      rent: textValue(deal, "monthlyRent", 40) || textValue(input, "rent", 40),
      seller: sellerNames.join(" · ") || textValue(deal, "sellerName", 120) || textValue(deal, "developerName", 120) || textValue(input, "seller", 120),
    };
    if (data.email && (data.email.length > 254 || !/^\S+@\S+\.\S+$/.test(data.email))) {
      return intakeResponse({ error: "בדקו את שם הלקוח ופרטי הקשר." }, 400);
    }
    const amenityFields = [
      ["hasUndergroundParking", "חניון תת קרקעי"], ["hasAbovegroundParking", "חניון עליון"], ["hasStorage", "מחסן צמוד"],
      ["hasMamad", 'ממ״ד'], ["hasElevator", "מעלית"], ["hasBalcony", "מרפסת"], ["hasGym", "חדר כושר"],
      ["hasResidentsLounge", "חדר דיירים"], ["hasRooftop", "גג דיירים"], ["isBuildingOnPillars", "בניין על עמודים"], ["hasAccessibility", "גישה לנכים"],
    ] as const;
    const amenities = amenityFields.filter(([key]) => deal[key] === true).map(([, label]) => label);
    const files = form.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
    if (files.length > 8 || files.some((file) => !fileTypeAllowed(file))) return intakeResponse({ error: "אפשר לצרף עד 8 קובצי PDF או תמונה (JPG, PNG, WEBP, HEIC, HEIF)." }, 400);
    if (files.reduce((sum, file) => sum + file.size, 0) > maxTotalBytes) return intakeResponse({ error: "הקבצים חורגים ממגבלת 20MB לבקשה." }, 413);
    const filesBucket = getFilesBucket();
    if (files.length && !filesBucket) return intakeResponse({ error: "העלאת המסמך אינה זמינה כרגע. נסו שוב מאוחר יותר." }, 503);

    const intakeData = {
      personal: { ...personal, fullName: data.name, email: data.email, phone: data.phone, purpose: data.purpose, agreeToTerms: data.agreeToTerms },
      location: { ...location, city: data.city, street: data.street, houseNumber: data.house, block: data.block, parcel: data.parcel, subParcel: data.subParcel },
      deal: {
        ...safeDeal,
        dealType: data.asset, askingPrice: data.price, propertyArea: data.area, roomsCount: data.rooms, floorNumber: data.floor,
        condition: data.condition, monthlyRent: data.rent, sellerNames,
        hasUndergroundParking: deal.hasUndergroundParking === true, hasAbovegroundParking: deal.hasAbovegroundParking === true,
        hasStorage: deal.hasStorage === true, hasMamad: deal.hasMamad === true, hasElevator: deal.hasElevator === true,
        hasBalcony: deal.hasBalcony === true, hasGym: deal.hasGym === true, hasResidentsLounge: deal.hasResidentsLounge === true,
        hasRooftop: deal.hasRooftop === true, isBuildingOnPillars: deal.isBuildingOnPillars === true, hasAccessibility: deal.hasAccessibility === true,
        hasParking: deal.hasParking === true, isRented: deal.isRented === true, hasAdditions: deal.hasAdditions === true,
        developerName: textValue(deal, "developerName", 120), developerRegNumber: textValue(deal, "developerRegNumber", 40),
        accreditedBank: textValue(deal, "accreditedBank", 120), targetDeliveryDate: textValue(deal, "targetDeliveryDate", 40),
        indexLinkage: deal.indexLinkage === true,
      },
      documents: files.map((file) => ({ name: file.name.slice(0, 180), contentType: fileContentType(file), size: file.size })),
    };

    const db = getDb();
    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`safedeal-intake:${ip}`));
    const ipHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const attempts = await db.$client.prepare(`SELECT COUNT(*) AS count FROM intake_attempts WHERE ip_hash = ? AND created_at > ?`).bind(ipHash, cutoff).first<{ count: number }>();
    if ((attempts?.count ?? 0) >= 5) return intakeResponse({ error: "נשלחו כמה בקשות בזמן קצר. נסו שוב בעוד שעה." }, 429);

    const id = crypto.randomUUID();
    const caseNumber = `SD-${new Date().getFullYear().toString().slice(-2)}-${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
    const now = new Date().toISOString();
    const uploaded: { id: string; key: string; name: string; type: string; size: number }[] = [];
    try {
      for (const file of files) {
        const docId = crypto.randomUUID();
        const cleanName = file.name.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180) || "מסמך";
        const key = `cases/${id}/${docId}`;
        const contentType = fileContentType(file);
        await filesBucket!.put(key, await file.arrayBuffer(), { httpMetadata: { contentType }, customMetadata: { documentType: "נסח טאבו / אישור זכויות", source: "הועלה על ידי הלקוח", collectedAt: now } });
        uploaded.push({ id: docId, key, name: cleanName, type: contentType, size: file.size });
      }
      const statements = [
        db.$client.prepare(`INSERT INTO cases (id, case_number, client_name, client_email, client_phone, asset_type, city, street, house, block, parcel, sub_parcel, condition, price, area, rooms, floor, monthly_rent, seller_name, seller_id, amenities, intake_payload, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'חדש', ?, ?)`) 
          .bind(id, caseNumber, data.name || "לא צוין", data.email.toLowerCase(), data.phone, data.asset || "לא צוין", data.city || "לא צוין", data.street || "לא צוין", data.house || "לא צוין", data.block || null, data.parcel || null, data.subParcel || null, data.condition || null, data.price || null, data.area || null, data.rooms || null, data.floor || null, data.rent || null, data.seller || null, null, JSON.stringify(amenities), JSON.stringify(intakeData), now, now),
        db.$client.prepare(`INSERT INTO activity (id, case_id, actor_user_id, actor_name, action, detail, created_at) VALUES (?, ?, NULL, ?, 'נפתח תיק', 'בקשת בדיקה חדשה התקבלה מטופס הלקוח.', ?)`)
          .bind(crypto.randomUUID(), id, data.name || "לקוח", now),
        db.$client.prepare(`INSERT INTO intake_attempts (ip_hash, created_at) VALUES (?, ?)`)
          .bind(ipHash, now),
        ...uploaded.map((doc) => db.$client.prepare(`INSERT INTO documents (id, case_id, file_key, filename, content_type, size, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .bind(doc.id, id, doc.key, doc.name, doc.type, doc.size, now)),
      ];
      await db.$client.batch(statements);
    } catch (error) {
      await Promise.all(uploaded.map((doc) => filesBucket?.delete(doc.key).catch(() => undefined)));
      throw error;
    }
    return intakeResponse({ caseNumber, message: "הבקשה התקבלה ונפתחה במערכת." }, 201);
  } catch (error) {
    console.error("SafeDeal intake failed", error);
    return intakeResponse({ error: "לא הצלחנו לשמור את הבקשה כרגע. הפרטים נשארו בטופס; נסו שוב." }, 500);
  }
}
