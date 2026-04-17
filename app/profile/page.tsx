import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Submissions" };

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-[#E63946]",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: contributions } = await supabase
    .from("contributions")
    .select("id, school_id, data, status, created_at, reviewed_at, reviewer_notes")
    .eq("submitted_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="bg-[#F1FAEE] min-h-full">
      <div className="max-w-3xl mx-auto px-6 py-8">

        <div className="mb-6">
          <p className="font-mono text-xs text-[#457B9D] uppercase tracking-widest mb-1">Account</p>
          <h1 className="font-display text-2xl font-bold text-[#1D3557]">My Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>
        </div>

        {!contributions?.length ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm space-y-3">
            <p className="text-gray-400 text-sm">You haven&apos;t submitted anything yet.</p>
            <Link href="/contribute" className="text-sm text-[#457B9D] hover:text-[#1D3557] font-medium transition-colors">
              Add a flight school →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {contributions.map((c) => {
              const d = c.data as Record<string, unknown>;
              const isEdit = !!c.school_id;
              const status = c.status as string;

              return (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        <span className="font-mono text-xs text-gray-400">
                          {isEdit ? "Edit suggestion" : "New school"}
                        </span>
                      </div>
                      <p className="font-display font-semibold text-[#1D3557] truncate">
                        {typeof d.name === "string" ? d.name : "—"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {typeof d.city === "string" ? d.city : ""}
                        {typeof d.state === "string" ? `, ${d.state}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      {status === "approved" && c.school_id && (
                        <Link
                          href={`/schools/${c.school_id}`}
                          className="text-xs text-[#457B9D] hover:text-[#1D3557] font-medium transition-colors mt-1 block"
                        >
                          View listing →
                        </Link>
                      )}
                    </div>
                  </div>

                  {c.reviewer_notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-mono text-gray-400 uppercase tracking-wide mb-1">Reviewer note</p>
                      <p className="text-sm text-gray-600">{c.reviewer_notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}