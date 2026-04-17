"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NavbarAuth({ user }: { user: User | null }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="text-sm text-[#A8DADC]/80 hover:text-[#F1FAEE] px-3 py-4 transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="text-sm bg-[#457B9D] text-white px-4 py-1.5 rounded hover:bg-[#3a6987] transition-colors font-medium"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-[#A8DADC]/60 hidden sm:block">{user.email}</span>
      <button
        onClick={handleSignOut}
        className="text-sm text-[#A8DADC]/80 hover:text-[#F1FAEE] transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}