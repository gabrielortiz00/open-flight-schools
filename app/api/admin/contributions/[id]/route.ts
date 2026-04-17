import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { UUID_RE } from "@/lib/constants";
import { toSlug } from "@/lib/utils";
import type { Contribution } from "@/types/contribution";
import { NextRequest, NextResponse } from "next/server";

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
  const c = contribution as unknown as Contribution;
  const d = c.data;
  const isEdit = !!c.school_id;

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
        airport_id: d.airport_id || null,
        part_61: d.part_61,
        part_141: d.part_141,
        website: d.website || null,
        phone: d.phone || null,
        email: d.email || null,
        description: d.description || null,
        slug: toSlug(d.name, d.city, d.state),
      })
      .eq("id", contribution.school_id);

    if (updateError) {
      console.error("[admin approve edit]", updateError.message);
      return NextResponse.json({ error: "Failed to update school." }, { status: 500 });
    }

    // replace certifications
    await supabase.from("certifications").delete().eq("school_id", contribution.school_id);
    if (d.certifications && d.certifications.length > 0) {
      await supabase.from("certifications").insert(
        d.certifications.map((cert_type) => ({
          school_id: c.school_id,
          cert_type,
        }))
      );
    }

    // replace fleet
    await supabase.from("fleet").delete().eq("school_id", c.school_id);
    if (d.fleet && d.fleet.length > 0) {
      await supabase.from("fleet").insert(
        d.fleet.map((aircraft) => ({
          school_id: c.school_id,
          aircraft,
        }))
      );
    }
  } else {
    // new school — geocode address first
    const coords = await geocode(d.address, d.city, d.state, d.zip);

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
        airport_id: d.airport_id || null,
        part_61: d.part_61,
        part_141: d.part_141,
        website: d.website || null,
        phone: d.phone || null,
        email: d.email || null,
        description: d.description || null,
        location: `POINT(${coords.lng} ${coords.lat})`,
        slug: toSlug(d.name, d.city, d.state),
        status: "published",
        submitted_by: c.submitted_by,
      })
      .select("id")
      .single();

    if (insertError || !newSchool) {
      console.error("[admin approve new]", insertError?.message);
      return NextResponse.json({ error: "Failed to create school." }, { status: 500 });
    }

    if (d.certifications && d.certifications.length > 0) {
      await supabase.from("certifications").insert(
        d.certifications.map((cert_type) => ({
          school_id: newSchool.id,
          cert_type,
        }))
      );
    }

    if (d.fleet && d.fleet.length > 0) {
      await supabase.from("fleet").insert(
        d.fleet.map((aircraft) => ({
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
