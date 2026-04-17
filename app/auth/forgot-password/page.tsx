"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1D3557] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#457B9D] focus:border-transparent transition";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[#F1FAEE]">
        <div className="bg-white rounded-xl border border-gray-200 p-10 w-full max-w-sm text-center shadow-sm space-y-3">
          <div className="text-4xl">✉</div>
          <h1 className="font-display text-2xl font-bold text-[#1D3557]">Check your email</h1>
          <p className="text-sm text-gray-500">
            If <strong className="text-[#1D3557]">{email}</strong> has an account, you&apos;ll receive a reset link shortly.
          </p>
          <Link href="/auth/login" className="block text-sm text-[#457B9D] hover:text-[#1D3557] font-medium mt-4 transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[#F1FAEE]">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-[#1D3557] mb-1">Reset password</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#1D3557] mb-1.5">Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-sm text-[#E63946] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#1D3557] text-[#F1FAEE] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#16293f] disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <Link href="/auth/login" className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-4 transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}