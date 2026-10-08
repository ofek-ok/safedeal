const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const street = typeof body?.street === "string" ? body.street.trim() : "";
  const houseNumber = typeof body?.houseNumber === "string" ? body.houseNumber.trim() : "";

  if (!city || !street || !houseNumber) {
    return Response.json({ message: "עיר, רחוב ומספר בית הם שדות חובה." }, { status: 400 });
  }
  if (!API_BASE) {
    return Response.json({ code: "BACKEND_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const response = await fetch(
      `${API_BASE.replace(/\/+$/, "")}/api/v1/properties/cadastral-lookup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ city, street, houseNumber }),
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
      },
    );
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return Response.json(
        { code: response.status === 404 ? "PARCEL_NOT_FOUND" : "CADASTRAL_UPSTREAM_ERROR" },
        { status: response.status },
      );
    }

    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error("Cadastral lookup backend request failed", timedOut ? "timeout" : "connection error");
    return Response.json(
      { code: timedOut ? "CADASTRAL_UPSTREAM_TIMEOUT" : "CADASTRAL_BACKEND_UNAVAILABLE" },
      { status: timedOut ? 504 : 502 },
    );
  }
}
