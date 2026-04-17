import { createClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: schools } = await supabase
    .from("schools")
    .select("slug, updated_at")
    .eq("status", "published");

  const schoolEntries: MetadataRoute.Sitemap = (schools ?? []).map((s) => ({
    url: `${BASE_URL}/schools/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/schools`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/contribute`, changeFrequency: "monthly", priority: 0.5 },
    ...schoolEntries,
  ];
}