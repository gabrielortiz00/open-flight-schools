import { createClient } from "@/lib/supabase/server";
import { VALID_CERTS } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

// Decode PostGIS EWKB hex into { lng, lat }
function parseEWKB(hex: string): { lng: number; lat: number } {
  const offset = 18; // skip 1 byte order + 4 type + 4 SRID = 9 bytes = 18 hex chars
  const lng = Buffer.from(hex.slice(offset, offset + 16), "hex").readDoubleLE(0);
  const lat = Buffer.from(hex.slice(offset + 16, offset + 32), "hex").readDoubleLE(0);
  return { lng, lat };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const part61 = searchParams.get("part61");
  const part141 = searchParams.get("part141");
  const certsParam = searchParams.get("certs");

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
      certFilter.some((cert) =>
        school.certifications.some((c: { cert_type: string }) => c.cert_type === cert)
      )
    );
  }

  const parsed = schools.map(({ location, ...rest }) => ({
    ...rest,
    ...parseEWKB(location as string),
  }));

  return NextResponse.json(parsed);
}