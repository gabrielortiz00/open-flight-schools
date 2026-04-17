"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1D3557] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#457B9D] focus:border-transparent transition";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
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
          <h1 className="font-display text-2xl font-bold text-[#1D3557] mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-6">
            No account?{" "}
            <Link href="/auth/signup" className="text-[#457B9D] hover:text-[#1D3557] font-medium transition-colors">
              Create one
            </Link>
          </p>

          <GoogleAuthButton label="Sign in with Google" />

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-[#1D3557]">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-[#457B9D] hover:text-[#1D3557] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}