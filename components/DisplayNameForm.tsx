"use client";

import { useState } from "react";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1D3557] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#457B9D] focus:border-transparent transition";

export default function DisplayNameForm({ current }: { current: string | null }) {
  const [value, setValue] = useState(current ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: value }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
    } else {
      setSaved(true);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false); }}
          maxLength={50}
          placeholder="How you'll appear on reviews"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 bg-[#1D3557] text-[#F1FAEE] rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#16293f] disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
      {saved && <p className="text-xs text-green-600 font-medium">Saved.</p>}
      {error && <p className="text-xs text-[#E63946]">{error}</p>}
    </form>
  );
}
