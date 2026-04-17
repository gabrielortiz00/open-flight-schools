import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// Simple sliding-window rate limiter (per edge instance — sufficient for early-stage traffic)
const LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/contributions": { max: 10,  windowMs: 60_000 },
  "/api/schools":       { max: 120, windowMs: 60_000 },
  "/api/airport":       { max: 30,  windowMs: 60_000 },
};

// ip -> { path -> { count, windowStart } }
const counters = new Map<string, Map<string, { count: number; windowStart: number }>>();

function checkRateLimit(ip: string, path: string): boolean {
  const limit = LIMITS[path];
  if (!limit) return true;

  const now = Date.now();
  if (!counters.has(ip)) counters.set(ip, new Map());
  const ipMap = counters.get(ip)!;

  const entry = ipMap.get(path);
  if (!entry || now - entry.windowStart >= limit.windowMs) {
    ipMap.set(path, { count: 1, windowStart: now });
    return true;
  }

  entry.count++;
  return entry.count <= limit.max;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate-limit public API routes
  const limitedPath = Object.keys(LIMITS).find((p) => pathname.startsWith(p));
  if (limitedPath) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    if (!checkRateLimit(ip, limitedPath)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  const { supabase, response } = createMiddlewareClient(request);
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};