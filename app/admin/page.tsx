import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ContributionCard from "@/components/ContributionCard";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: contributions } = await supabase
    .from("contributions")
    .select("id, school_id, submitted_by, data, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="bg-[#F1FAEE] min-h-full">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-[#457B9D] uppercase tracking-widest mb-1">Admin</p>
            <h1 className="font-display text-2xl font-bold text-[#1D3557]">Moderation Queue</h1>
          </div>
          <Link href="/admin/schools" className="text-sm text-[#457B9D] hover:text-[#1D3557] font-medium transition-colors">
            Manage schools →
          </Link>
          <span className={`font-mono text-sm px-3 py-1.5 rounded-full font-medium ${
            (contributions?.length ?? 0) > 0
              ? "bg-[#E63946]/10 text-[#E63946]"
              : "bg-[#A8DADC]/30 text-[#1D3557]"
          }`}>
            {contributions?.length ?? 0} pending
          </span>
        </div>

        {!contributions?.length ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-2xl mb-2">✓</p>
            <p className="text-sm text-gray-400">Queue is clear. All submissions reviewed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contributions.map((c) => (
              <ContributionCard key={c.id} contribution={c} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}