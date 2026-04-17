import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_CERTS = new Set(["PPL", "IR", "CPL", "MEL", "CFI", "CFII", "ATP"]);
const VALID_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { school_id, data: schoolData } = body as Record<string, unknown>;

  // school_id is optional (null = new school submission)
  if (school_id !== null && school_id !== undefined) {
    if (typeof school_id !== "string" || !UUID_RE.test(school_id)) {
      return NextResponse.json({ error: "Invalid school_id." }, { status: 400 });
    }
  }

  if (!schoolData || typeof schoolData !== "object") {
    return NextResponse.json({ error: "Missing school data." }, { status: 400 });
  }

  const d = schoolData as Record<string, unknown>;

  // validate required fields
  if (typeof d.name !== "string" || d.name.trim().length < 2 || d.name.trim().length > 200) {
    return NextResponse.json({ error: "Name must be between 2 and 200 characters." }, { status: 400 });
  }
  if (typeof d.address !== "string" || d.address.trim().length < 5) {
    return NextResponse.json({ error: "Address is required." }, { status: 400 });
  }
  if (typeof d.city !== "string" || d.city.trim().length < 2) {
    return NextResponse.json({ error: "City is required." }, { status: 400 });
  }
  if (typeof d.state !== "string" || !VALID_STATES.has(d.state.toUpperCase())) {
    return NextResponse.json({ error: "Invalid state." }, { status: 400 });
  }
  if (typeof d.zip !== "string" || !/^\d{5}(-\d{4})?$/.test(d.zip)) {
    return NextResponse.json({ error: "Invalid ZIP code." }, { status: 400 });
  }
  if (typeof d.part_61 !== "boolean" || typeof d.part_141 !== "boolean") {
    return NextResponse.json({ error: "Part 61/141 fields are required." }, { status: 400 });
  }
  if (!d.part_61 && !d.part_141) {
    return NextResponse.json({ error: "School must be Part 61, Part 141, or both." }, { status: 400 });
  }

  // validate optional fields
  if (d.website !== undefined && d.website !== null && d.website !== "") {
    if (typeof d.website !== "string" || !d.website.startsWith("https://")) {
      return NextResponse.json({ error: "Website must start with https://" }, { status: 400 });
    }
  }
  if (d.phone !== undefined && d.phone !== null && d.phone !== "") {
    if (typeof d.phone !== "string" || !/^[\d\s\-()+.ext]{1,20}$/.test(d.phone)) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }
  }
  if (d.email !== undefined && d.email !== null && d.email !== "") {
    if (typeof d.email !== "string" || !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(d.email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
  }
  if (d.description !== undefined && d.description !== null && d.description !== "") {
    if (typeof d.description !== "string" || d.description.length > 1000) {
      return NextResponse.json({ error: "Description must be under 1000 characters." }, { status: 400 });
    }
  }

  // validate certifications array
  if (d.certifications !== undefined) {
    if (!Array.isArray(d.certifications) || !d.certifications.every((c) => VALID_CERTS.has(c))) {
      return NextResponse.json({ error: "Invalid certifications." }, { status: 400 });
    }
  }

  // validate fleet array
  if (d.fleet !== undefined) {
    if (
      !Array.isArray(d.fleet) ||
      !d.fleet.every((f) => typeof f === "string" && f.length > 0 && f.length <= 100)
    ) {
      return NextResponse.json({ error: "Invalid fleet data." }, { status: 400 });
    }
  }

  // validate airport_id (optional)
  if (d.airport_id !== undefined && d.airport_id !== null && d.airport_id !== "") {
    if (typeof d.airport_id !== "string" || !/^[A-Z0-9]{2,5}$/.test((d.airport_id as string).toUpperCase())) {
      return NextResponse.json({ error: "Invalid airport identifier. Use 2–5 uppercase letters/numbers (e.g. SMO, KPAO)." }, { status: 400 });
    }
  }

  // sanitize and store
  const sanitized = {
    name: d.name.trim(),
    address: (d.address as string).trim(),
    city: (d.city as string).trim(),
    state: (d.state as string).toUpperCase(),
    zip: (d.zip as string).trim(),
    airport_id: typeof d.airport_id === "string" && d.airport_id.trim() ? d.airport_id.trim().toUpperCase() : null,
    part_61: d.part_61,
    part_141: d.part_141,
    website: typeof d.website === "string" && d.website.trim() ? d.website.trim() : null,
    phone: typeof d.phone === "string" && d.phone.trim() ? d.phone.trim() : null,
    email: typeof d.email === "string" && d.email.trim() ? d.email.trim() : null,
    description: typeof d.description === "string" && d.description.trim() ? d.description.trim() : null,
    certifications: Array.isArray(d.certifications) ? d.certifications : [],
    fleet: Array.isArray(d.fleet) ? d.fleet.map((f: string) => f.trim()).filter(Boolean) : [],
  };

  const { error } = await supabase.from("contributions").insert({
    school_id: school_id ?? null,
    submitted_by: user.id,
    data: sanitized,
    status: "pending",
  });

  if (error) {
    console.error("[/api/contributions]", error.message);
    return NextResponse.json({ error: "Failed to submit contribution." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
