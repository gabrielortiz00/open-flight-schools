import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const { school_id, rating, review_body } = body as Record<string, unknown>;

  if (typeof school_id !== "string" || !UUID_RE.test(school_id)) {
    return NextResponse.json({ error: "Invalid school_id." }, { status: 400 });
  }

  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be an integer between 1 and 5." }, { status: 400 });
  }

  if (review_body !== undefined && (typeof review_body !== "string" || review_body.length > 2000)) {
    return NextResponse.json({ error: "Review body must be under 2000 characters." }, { status: 400 });
  }

  const { error } = await supabase.from("reviews").insert({
    school_id,
    user_id: user.id,
    rating,
    body: typeof review_body === "string" && review_body.trim() ? review_body.trim() : null,
  });

  if (error) {
    // unique constraint = already reviewed
    if (error.code === "23505") {
      return NextResponse.json({ error: "You have already reviewed this school." }, { status: 409 });
    }
    console.error("[/api/reviews]", error.message);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}