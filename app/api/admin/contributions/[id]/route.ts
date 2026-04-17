import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function geocode(address: string, city: string, state: string, zip: string) {
  const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}, USA`);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&country=US&limit=1`
  );
  if (!res.ok) return null;
  const json = await res.json();
  const [lng, lat] = json.features?.[0]?.center ?? [];
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return { lng, lat };
}

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "admin";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid contribution ID." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { action, reviewer_notes } = body as Record<string, unknown>;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Action must be 'approve' or 'reject'." }, { status: 400 });
  }

  // fetch the contribution
  const { data: contribution, error: fetchError } = await supabase
    .from("contributions")
    .select("*")
    .eq("id", id)
    .eq("status", "pending")
    .single();

  if (fetchError || !contribution) {
    return NextResponse.json({ error: "Contribution not found or already reviewed." }, { status: 404 });
  }

  if (action === "reject") {
    await supabase.from("contributions").update({
      status: "rejected",
      reviewed_by: user.id,
      reviewer_notes: typeof reviewer_notes === "string" ? reviewer_notes.trim() : null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);

    return NextResponse.json({ success: true });
  }

  // --- APPROVE ---
  const d = contribution.data as Record<string, unknown>;
  const isEdit = !!contribution.school_id;

  if (isEdit) {
    // update existing school
    const { error: updateError } = await supabase
      .from("schools")
      .update({
        name: d.name,
        address: d.address,
        city: d.city,
        state: d.state,
        zip: d.zip,
        part_61: d.part_61,
        part_141: d.part_141,
        website: d.website || null,
        phone: d.phone || null,
        email: d.email || null,
        description: d.description || null,
      })
      .eq("id", contribution.school_id);

    if (updateError) {
      console.error("[admin approve edit]", updateError.message);
      return NextResponse.json({ error: "Failed to update school." }, { status: 500 });
    }

    // replace certifications
    await supabase.from("certifications").delete().eq("school_id", contribution.school_id);
    if (Array.isArray(d.certifications) && d.certifications.length > 0) {
      await supabase.from("certifications").insert(
        (d.certifications as string[]).map((cert_type) => ({
          school_id: contribution.school_id,
          cert_type,
        }))
      );
    }

    // replace fleet
    await supabase.from("fleet").delete().eq("school_id", contribution.school_id);
    if (Array.isArray(d.fleet) && d.fleet.length > 0) {
      await supabase.from("fleet").insert(
        (d.fleet as string[]).map((aircraft) => ({
          school_id: contribution.school_id,
          aircraft,
        }))
      );
    }
  } else {
    // new school — geocode address first
    const coords = await geocode(
      d.address as string,
      d.city as string,
      d.state as string,
      d.zip as string
    );

    if (!coords) {
      return NextResponse.json(
        { error: "Could not geocode address. Please verify the address and try again." },
        { status: 422 }
      );
    }

    const { data: newSchool, error: insertError } = await supabase
      .from("schools")
      .insert({
        name: d.name,
        address: d.address,
        city: d.city,
        state: d.state,
        zip: d.zip,
        part_61: d.part_61,
        part_141: d.part_141,
        website: d.website || null,
        phone: d.phone || null,
        email: d.email || null,
        description: d.description || null,
        location: `POINT(${coords.lng} ${coords.lat})`,
        status: "published",
        submitted_by: contribution.submitted_by,
      })
      .select("id")
      .single();

    if (insertError || !newSchool) {
      console.error("[admin approve new]", insertError?.message);
      return NextResponse.json({ error: "Failed to create school." }, { status: 500 });
    }

    if (Array.isArray(d.certifications) && d.certifications.length > 0) {
      await supabase.from("certifications").insert(
        (d.certifications as string[]).map((cert_type) => ({
          school_id: newSchool.id,
          cert_type,
        }))
      );
    }

    if (Array.isArray(d.fleet) && d.fleet.length > 0) {
      await supabase.from("fleet").insert(
        (d.fleet as string[]).map((aircraft) => ({
          school_id: newSchool.id,
          aircraft,
        }))
      );
    }
  }

  // mark contribution approved
  await supabase.from("contributions").update({
    status: "approved",
    reviewed_by: user.id,
    reviewer_notes: typeof reviewer_notes === "string" ? reviewer_notes.trim() : null,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);

  return NextResponse.json({ success: true });
}
