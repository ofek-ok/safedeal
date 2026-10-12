const customerOrigin = "https://safedeal-coral.vercel.app";
const timeoutMs = 12_000;

type GovMapGeocodeResponse = {
  ResultType?: number;
  ResultCode?: number;
  X?: number;
  Y?: number;
};

type GovMapIntersectResponse = {
  data?: {
    PARCEL_ALL?: Array<{
      GUSH_NUM?: string | number;
      PARCEL?: string | number;
    }>;
  };
};

function allowedOrigin(origin: string | null, requestUrl: string) {
  if (!origin) return true;
  if (origin === customerOrigin || origin === new URL(requestUrl).origin) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function responseHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? customerOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function json(body: Record<string, string>, status: number, origin: string | null) {
  return Response.json(body, { status, headers: responseHeaders(origin) });
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (!allowedOrigin(origin, request.url)) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: responseHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!allowedOrigin(origin, request.url)) return json({ error: "מקור הבקשה אינו מורשה." }, 403, origin);

  // Keep GOVMAP_APP_ID in the safedeal-staff Vercel project (server-side only).
  const credential = process.env.GOVMAP_APP_ID;
  if (!credential) return json({ error: "חיבור GovMap אינו מוגדר כרגע." }, 503, origin);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 2_000) return json({ error: "פרטי הכתובת ארוכים מדי." }, 413, origin);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const street = typeof body?.street === "string" ? body.street.trim() : "";
  const houseNumber = typeof body?.houseNumber === "string" ? body.houseNumber.trim() : "";
  if (!city || !street || !houseNumber || city.length > 120 || street.length > 160 || houseNumber.length > 20) {
    return json({ error: "עיר, רחוב ומספר בית הם שדות חובה." }, 400, origin);
  }

  const address = `${street} ${houseNumber}, ${city}`;
  const govMapHeaders = {
    Accept: "application/json",
    Referer: `${customerOrigin}/`,
    Origin: customerOrigin,
  };

  try {
    const geocodeParams = new URLSearchParams({ address, type: "1", appId: credential });
    const geocodeResponse = await fetch(`https://api.govmap.gov.il/position/json?${geocodeParams}`, {
      headers: govMapHeaders,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!geocodeResponse.ok) {
      console.error("GovMap geocode failed", geocodeResponse.status);
      return json({ error: "לא ניתן לאתר את הכתובת כרגע." }, 502, origin);
    }

    const geocode = await geocodeResponse.json() as GovMapGeocodeResponse;
    const resultCode = geocode.ResultType ?? geocode.ResultCode;
    const x = typeof geocode.X === "number" ? geocode.X : Number(geocode.X);
    const y = typeof geocode.Y === "number" ? geocode.Y : Number(geocode.Y);
    if (resultCode !== 1 || !Number.isFinite(x) || !Number.isFinite(y)) {
      return json({ error: "לא נמצאו גוש וחלקה לכתובת הזו." }, 404, origin);
    }

    const parcelParams = new URLSearchParams({
      x: String(x),
      y: String(y),
      layers: "PARCEL_ALL",
      appId: credential,
    });
    const parcelResponse = await fetch(`https://api.govmap.gov.il/intersect?${parcelParams}`, {
      headers: govMapHeaders,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!parcelResponse.ok) {
      console.error("GovMap parcel lookup failed", parcelResponse.status);
      return json({ error: "לא ניתן לקבל נתוני גוש וחלקה כרגע." }, 502, origin);
    }

    const parcelData = await parcelResponse.json() as GovMapIntersectResponse;
    const parcels = parcelData.data?.PARCEL_ALL ?? [];
    const normalizedParcels = parcels.map((item) => {
      const block = item.GUSH_NUM == null ? "" : String(item.GUSH_NUM).trim();
      const parcel = item.PARCEL == null ? "" : String(item.PARCEL).trim();
      return { block, parcel };
    }).filter((item) => item.block && item.parcel);
    const uniqueParcels = [...new Map(normalizedParcels.map((item) => [`${item.block}/${item.parcel}`, item] as const)).values()];
    if (!uniqueParcels.length) return json({ error: "לא נמצאו גוש וחלקה לכתובת הזו." }, 404, origin);
    if (uniqueParcels.length > 1) return json({ error: "הכתובת חופפת ליותר מגוש או חלקה אחת. בדקו את הנתונים מול נסח הטאבו." }, 409, origin);
    const { block, parcel: parcelNumber } = uniqueParcels[0];

    return Response.json({ block, parcel: parcelNumber }, { headers: responseHeaders(origin) });
  } catch (error) {
    console.error("GovMap cadastral lookup failed", error instanceof Error && error.name === "TimeoutError" ? "timeout" : "request error");
    return json({ error: "לא ניתן להתחבר כרגע למאגר. אפשר להזין את הנתונים ידנית." }, 502, origin);
  }
}
