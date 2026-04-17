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
        <a href="/auth/login" className="text-blue-600 hover:underline">Sign in</a>{" "}
        to leave a review.
      </p>
    );
  }

  if (done) {
    return <p className="text-sm text-green-600 font-medium">Thanks for your review!</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
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
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
      <h3 className="font-medium text-gray-900">Write a review</h3>

      {/* Star selector */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl leading-none focus:outline-none"
          >
            <span className={(hovered || rating) >= star ? "text-yellow-400" : "text-gray-300"}>
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
        placeholder="Share your experience (optional)"
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}