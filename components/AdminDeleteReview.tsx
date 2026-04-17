"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminDeleteReview({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-[#E63946]/60 hover:text-[#E63946] disabled:opacity-50 transition-colors"
    >
      {loading ? "…" : "Delete"}
    </button>
  );
}