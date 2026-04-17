"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1D3557] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#457B9D] focus:border-transparent transition";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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
            We sent a confirmation link to <strong className="text-[#1D3557]">{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/" className="block text-sm text-[#457B9D] hover:text-[#1D3557] font-medium mt-4 transition-colors">
            ← Back to map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[#F1FAEE]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#1D3557] font-display font-semibold text-lg hover:text-[#457B9D] transition-colors">
            <span className="text-[#457B9D]">✈</span>
            Open Flight Schools
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-[#1D3557] mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">
            Already have one?{" "}
            <Link href="/auth/login" className="text-[#457B9D] hover:text-[#1D3557] font-medium transition-colors">
              Sign in
            </Link>
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

            <div>
              <label className="block text-sm font-semibold text-[#1D3557] mb-1.5">Password</label>
              <input
                type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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
              className="w-full bg-[#1D3557] text-[#F1FAEE] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#16293f] disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}