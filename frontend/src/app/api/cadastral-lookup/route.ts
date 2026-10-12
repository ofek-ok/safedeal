const STAFF_API_URL = (
  process.env.SAFEDEAL_STAFF_API_URL ?? "https://safedeal-staff.vercel.app"
).replace(/\\/+$/, "");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const street = typeof body?.street === "string" ? body.street.trim() : "";
  const houseNumber = typeof body?.houseNumber === "string" ? body.houseNumber.trim() : "";

  if (!city || !street || !houseNumber) {
    return Response.json({ message: "עיר, רחוב ומספר בית הם שדות חובה." }, { status: 400 });
  }

  try {
    const response = await fetch(`${STAFF_API_URL}/api/cadastral-lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ city, street, houseNumber }),
      signal: AbortSignal.timeout(27_000),
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({ error: "תשובה לא תקינה ממאגר הגושים והחלקות." }));
    return Response.json(result, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error("Cadastral lookup staff API request failed", timedOut ? "timeout" : "connection error");
    return Response.json(
      { code: timedOut ? "CADASTRAL_UPSTREAM_TIMEOUT" : "CADASTRAL_BACKEND_UNAVAILABLE" },
      { status: timedOut ? 504 : 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
