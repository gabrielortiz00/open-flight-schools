import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const { display_name } = body as Record<string, unknown>;

  if (typeof display_name !== "string" || display_name.trim().length > 50) {
    return NextResponse.json({ error: "Display name must be 50 characters or fewer." }, { status: 400 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { error } = await admin
    .from("profiles")
    .update({ display_name: display_name.trim() || null })
    .eq("id", user.id);

  if (error) {
    console.error("[PATCH /api/profile]", error.message);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
