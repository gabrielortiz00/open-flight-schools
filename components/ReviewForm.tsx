"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReviewForm({
  schoolId,
  userEmail,
}: {
  schoolId: string;
  userEmail: string | undefined;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!userEmail) {
    return (
      <p className="text-sm text-gray-500">
        <a href="/auth/login" className="text-[#457B9D] hover:text-[#1D3557] font-medium underline-offset-2 hover:underline transition-colors">
          Sign in
        </a>{" "}
        to leave a review.
      </p>
    );
  }

  if (done) {
    return <p className="text-sm text-green-700 font-medium">Thanks for your review!</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating."); return; }
    setError(null);
    setLoading(true);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ school_id: schoolId, rating, review_body: body }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    setDone(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gray-100">
      <h3 className="font-display font-semibold text-[#1D3557]">Write a review</h3>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl leading-none focus:outline-none transition-transform hover:scale-110"
          >
            <span className={(hovered || rating) >= star ? "text-amber-400" : "text-gray-200"}>
              ★
            </span>
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Share your experience — training quality, aircraft condition, instructors…"
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1D3557] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#457B9D] focus:border-transparent resize-none transition"
      />

      {error && <p className="text-sm text-[#E63946]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto bg-[#1D3557] text-[#F1FAEE] text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#16293f] disabled:opacity-50 transition-colors"
      >
        {loading ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}