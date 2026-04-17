import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminSchoolRow from "@/components/AdminSchoolRow";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Schools" };

export default async function AdminSchoolsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: schools } = await supabase
    .from("schools")
    .select("id, slug, name, city, state, status, created_at")
    .order("name");

  const published = schools?.filter((s) => s.status === "published") ?? [];
  const unpublished = schools?.filter((s) => s.status !== "published") ?? [];

  return (
    <div className="bg-[#F1FAEE] min-h-full">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-mono text-xs text-[#457B9D] uppercase tracking-widest mb-1">Admin</p>
            <h1 className="font-display text-2xl font-bold text-[#1D3557]">Manage Schools</h1>
          </div>
          <Link href="/admin" className="text-sm text-[#457B9D] hover:text-[#1D3557] font-medium transition-colors">
            ← Moderation queue
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <p className="font-mono text-xs text-gray-400 uppercase tracking-wide">
              Published ({published.length})
            </p>
          </div>
          {published.length === 0 ? (
            <p className="text-sm text-gray-400 px-5 py-4">None.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {published.map((s) => <AdminSchoolRow key={s.id} school={s} />)}
            </div>
          )}
        </div>

        {unpublished.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <p className="font-mono text-xs text-gray-400 uppercase tracking-wide">
                Unpublished / Rejected ({unpublished.length})
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {unpublished.map((s) => <AdminSchoolRow key={s.id} school={s} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}