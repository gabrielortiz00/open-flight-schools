import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid ID." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) {
    console.error("[admin DELETE review]", error.message);
    return NextResponse.json({ error: "Failed to delete review." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}