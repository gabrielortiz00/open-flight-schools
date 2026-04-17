import { NextRequest, NextResponse } from "next/server";

const ID_RE = /^[A-Z0-9]{2,5}$/;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.toUpperCase();
  if (!id || !ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid airport identifier." }, { status: 400 });
  }

  // Try the identifier as-is, then with K prefix if 3 chars and not already K-prefixed
  const candidates = [id];
  if (id.length === 3 && /^[A-Z]/.test(id)) candidates.push(`K${id}`);

  let airport = null;
  for (const candidate of candidates) {
    const res = await fetch(
      `https://aviationweather.gov/api/data/airport?ids=${candidate}&format=json`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) continue;
    const json = await res.json();
    const result = Array.isArray(json) ? json[0] : null;
    if (result?.lat && result?.lon) { airport = result; break; }
  }

  if (!airport) {
    return NextResponse.json({ error: "Airport not found." }, { status: 404 });
  }

  return NextResponse.json({ lat: airport.lat, lng: airport.lon });
}