import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { UUID_RE } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid ID." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { status } = body as Record<string, unknown>;
  if (status !== "published" && status !== "rejected") {
    return NextResponse.json({ error: "Status must be 'published' or 'rejected'." }, { status: 400 });
  }

  const { error } = await supabase.from("schools").update({ status }).eq("id", id);
  if (error) {
    console.error("[admin PATCH school]", error.message);
    return NextResponse.json({ error: "Failed to update school." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}