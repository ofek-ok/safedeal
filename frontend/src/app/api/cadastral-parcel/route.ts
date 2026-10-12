type WfsFeature = {
  id?: string;
  properties?: Record<string, unknown> | null;
};

function textValue(value: unknown) {
  return value == null ? "" : String(value).trim();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const inputIds: unknown[] = Array.isArray(body?.featureIds) ? body.featureIds : [];
  const validIds: string[] = [];

  for (const value of inputIds) {
    if (typeof value !== "string" && typeof value !== "number") continue;
    const id = String(value).trim();
    if (/^[A-Za-z0-9_.:-]{1,100}$/.test(id)) validIds.push(id);
  }
  const featureIds = [...new Set(validIds)].slice(0, 10);

  if (!featureIds.length) {
    return Response.json({ error: "Missing valid parcel feature IDs." }, { status: 400 });
  }

  const wfsIds = featureIds.map((id) => id.includes(".") ? id : `PARCEL_ALL.${id}`);
  const url = new URL("https://open.govmap.gov.il/geoserver/opendata/wfs");
  url.search = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: "opendata:PARCEL_ALL",
    featureID: wfsIds.join(","),
    count: "10",
    outputFormat: "application/json",
  }).toString();

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!upstream.ok) {
      return Response.json({ error: "Parcel data source unavailable." }, { status: 502 });
    }

    const result = await upstream.json() as { features?: WfsFeature[] };
    const parcels = (result.features ?? [])
      .map((feature) => ({
        block: textValue(feature.properties?.GUSH_NUM ?? feature.properties?.gush_num),
        parcel: textValue(feature.properties?.PARCEL ?? feature.properties?.parcel),
      }))
      .filter((item) => item.block && item.parcel);

    return Response.json({
      parcels,
      featureCount: result.features?.length ?? 0,
      propertyKeys: Object.keys(result.features?.[0]?.properties ?? {}),
    });
  } catch {
    return Response.json({ error: "Parcel data source unavailable." }, { status: 502 });
  }
}
