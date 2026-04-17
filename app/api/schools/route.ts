import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_CERTS = new Set(["PPL", "IR", "CPL", "MEL", "CFI", "CFII", "ATP"]);

function parseCoord(val: string | null): number | null {
  if (val === null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const part61 = searchParams.get("part61");
  const part141 = searchParams.get("part141");
  const certsParam = searchParams.get("certs");

  // validate bounding box — reject non-finite values to prevent PostGIS injection
  const minLng = parseCoord(searchParams.get("minLng"));
  const maxLng = parseCoord(searchParams.get("maxLng"));
  const minLat = parseCoord(searchParams.get("minLat"));
  const maxLat = parseCoord(searchParams.get("maxLat"));

  const hasBbox = searchParams.has("minLng");
  if (hasBbox && (minLng === null || maxLng === null || minLat === null || maxLat === null)) {
    return NextResponse.json({ error: "Invalid bounding box parameters." }, { status: 400 });
  }

  // validate cert filter values against known set
  let certFilter: string[] = [];
  if (certsParam) {
    certFilter = certsParam.split(",").filter((c) => VALID_CERTS.has(c));
    if (certFilter.length === 0) {
      return NextResponse.json({ error: "Invalid cert filter values." }, { status: 400 });
    }
  }

  const supabase = await createClient();

  let query = supabase
    .from("schools")
    .select(`
      id,
      name,
      city,
      state,
      part_61,
      part_141,
      website,
      phone,
      location,
      certifications (cert_type),
      pricing (cert_type, price_low, price_high)
    `)
    .eq("status", "published");

  // bounding box filter using validated numeric values
  if (hasBbox && minLng !== null && maxLng !== null && minLat !== null && maxLat !== null) {
    query = query.filter(
      "location",
      "ov",
      `[${minLng},${minLat},${maxLng},${maxLat}]`
    );
  }

  if (part61 === "true") query = query.eq("part_61", true);
  if (part141 === "true") query = query.eq("part_141", true);

  const { data, error } = await query;

  if (error) {
    console.error("[/api/schools]", error.message);
    return NextResponse.json({ error: "Failed to fetch schools." }, { status: 500 });
  }

  let schools = data ?? [];

  // filter by certifications in application code
  if (certFilter.length > 0) {
    schools = schools.filter((school) =>
      certFilter.every((cert) =>
        school.certifications.some((c: { cert_type: string }) => c.cert_type === cert)
      )
    );
  }

  return NextResponse.json(schools);
}
