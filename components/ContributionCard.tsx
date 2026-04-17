"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Contribution {
  id: string;
  school_id: string | null;
  submitted_by: string;
  data: Record<string, unknown>;
  status: string;
  created_at: string;
}

export default function ContributionCard({ contribution }: { contribution: Contribution }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  const d = contribution.data;
  const isEdit = !!contribution.school_id;

  async function submit(action: "approve" | "reject") {
    setLoading(action);
    setError(null);

    const res = await fetch(`/api/admin/contributions/${contribution.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewer_notes: notes }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      setLoading(null);
      return;
    }

    setDone(action === "approve" ? "approved" : "rejected");
    setTimeout(() => router.refresh(), 800);
  }

  if (done) {
    return (
      <div className={`rounded-xl border px-5 py-4 text-sm font-semibold flex items-center gap-2 ${
        done === "approved"
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-red-50 border-red-200 text-[#E63946]"
      }`}>
        <span>{done === "approved" ? "✓" : "✕"}</span>
        <span>{typeof d.name === "string" ? d.name : "Contribution"} — {done}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Card header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-medium ${
              isEdit
                ? "bg-amber-100 text-amber-700"
                : "bg-[#457B9D]/10 text-[#457B9D]"
            }`}>
              {isEdit ? "Edit suggestion" : "New school"}
            </span>
            <h2 className="font-display text-lg font-bold text-[#1D3557] mt-1.5">
              {typeof d.name === "string" ? d.name : "—"}
            </h2>
            <p className="text-sm text-gray-500">
              {typeof d.address === "string" ? d.address : ""}
              {typeof d.city === "string" ? `, ${d.city}` : ""}
              {typeof d.state === "string" ? `, ${d.state}` : ""}
              {typeof d.zip === "string" ? ` ${d.zip}` : ""}
            </p>
          </div>
          <p className="text-xs text-gray-400 whitespace-nowrap shrink-0">
            {new Date(contribution.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Details grid */}
      <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm border-b border-gray-100">
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wide mb-1">Type</p>
          <p className="text-[#1D3557]">
            {[d.part_141 && "Part 141", d.part_61 && "Part 61"].filter(Boolean).join(" / ") || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wide mb-1">Certifications</p>
          <p className="text-[#1D3557]">
            {Array.isArray(d.certifications) && (d.certifications as string[]).length > 0
              ? (d.certifications as string[]).join(", ")
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wide mb-1">Fleet</p>
          <p className="text-[#1D3557]">
            {Array.isArray(d.fleet) && (d.fleet as string[]).length > 0
              ? (d.fleet as string[]).join(", ")
              : "—"}
          </p>
        </div>
        {typeof d.website === "string" && d.website && (
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wide mb-1">Website</p>
            <p className="text-[#457B9D] truncate">{d.website}</p>
          </div>
        )}
        {typeof d.phone === "string" && d.phone && (
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wide mb-1">Phone</p>
            <p className="text-[#1D3557]">{d.phone}</p>
          </div>
        )}
        {typeof d.email === "string" && d.email && (
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wide mb-1">Email</p>
            <p className="text-[#1D3557]">{d.email}</p>
          </div>
        )}
      </div>

      {typeof d.description === "string" && d.description && (
        <div className="px-5 py-3 text-sm text-gray-600 leading-relaxed border-b border-gray-100 bg-gray-50/50">
          {d.description}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 space-y-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reviewer notes (optional)"
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-[#1D3557] bg-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#457B9D] focus:border-transparent transition"
        />
        {error && <p className="text-sm text-[#E63946]">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={() => submit("approve")}
            disabled={!!loading}
            className="flex-1 bg-[#1D3557] hover:bg-[#16293f] disabled:opacity-50 text-[#F1FAEE] text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading === "approve" ? "Approving…" : "Approve"}
          </button>
          <button
            onClick={() => submit("reject")}
            disabled={!!loading}
            className="flex-1 bg-[#E63946]/10 hover:bg-[#E63946]/20 disabled:opacity-50 text-[#E63946] text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading === "reject" ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}