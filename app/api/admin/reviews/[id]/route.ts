import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { UUID_RE } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

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