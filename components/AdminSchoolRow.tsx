"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface School {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  status: string;
}

export default function AdminSchoolRow({ school }: { school: School }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPublished = school.status === "published";

  async function toggle() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/schools/${school.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: isPublished ? "rejected" : "published" }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Something went wrong."); setLoading(false); return; }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 gap-4">
      <div className="min-w-0">
        <Link href={`/schools/${school.slug}`} className="font-medium text-[#1D3557] hover:text-[#457B9D] transition-colors text-sm truncate block">
          {school.name}
        </Link>
        <p className="text-xs text-gray-400">{school.city}, {school.state}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {error && <p className="text-xs text-[#E63946]">{error}</p>}
        <button
          onClick={toggle}
          disabled={loading}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
            isPublished
              ? "bg-red-50 text-[#E63946] hover:bg-red-100"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          {loading ? "…" : isPublished ? "Unpublish" : "Republish"}
        </button>
      </div>
    </div>
  );
}