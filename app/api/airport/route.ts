import { NextRequest, NextResponse } from "next/server";

const ID_RE = /^[A-Z0-9]{2,5}$/;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.toUpperCase();
  if (!id || !ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid airport identifier." }, { status: 400 });
  }

  const res = await fetch(
    `https://aviationweather.gov/api/data/airport?ids=${id}&format=json`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Airport lookup failed." }, { status: 502 });
  }

  const json = await res.json();
  const airport = Array.isArray(json) ? json[0] : null;
  if (!airport?.lat || !airport?.lon) {
    return NextResponse.json({ error: "Airport not found." }, { status: 404 });
  }

  return NextResponse.json({ lat: airport.lat, lng: airport.lon });
}