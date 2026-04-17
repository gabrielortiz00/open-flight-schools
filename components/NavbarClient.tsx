"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  user: User | null;
  isAdmin: boolean;
}

export default function NavbarClient({ user, isAdmin }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const navLinks = (
    <>
      <Link href="/schools" onClick={() => setOpen(false)}
        className="text-sm text-[#A8DADC]/80 hover:text-[#F1FAEE] hover:bg-white/10 px-3 py-4 transition-colors block md:inline-block">
        Browse
      </Link>
      <Link href="/contribute" onClick={() => setOpen(false)}
        className="text-sm text-[#A8DADC]/80 hover:text-[#F1FAEE] hover:bg-white/10 px-3 py-4 transition-colors block md:inline-block">
        Add a school
      </Link>
      {isAdmin && (
        <Link href="/admin" onClick={() => setOpen(false)}
          className="text-sm text-[#A8DADC] hover:text-[#F1FAEE] hover:bg-white/10 px-3 py-4 transition-colors font-medium block md:inline-block">
          Admin
        </Link>
      )}
    </>
  );

  const authSection = user ? (
    <div className="flex items-center gap-4 px-3 py-3 md:py-0 md:px-0">
      <span className="text-xs text-[#A8DADC]/60 hidden sm:block truncate max-w-[160px]">{user.email}</span>
      <button onClick={handleSignOut}
        className="text-sm text-[#A8DADC]/80 hover:text-[#F1FAEE] transition-colors">
        Sign out
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2 px-3 py-3 md:py-0 md:px-0">
      <Link href="/auth/login" onClick={() => setOpen(false)}
        className="text-sm text-[#A8DADC]/80 hover:text-[#F1FAEE] px-3 py-1.5 transition-colors">
        Sign in
      </Link>
      <Link href="/auth/signup" onClick={() => setOpen(false)}
        className="text-sm bg-[#457B9D] text-white px-4 py-1.5 rounded hover:bg-[#3a6987] transition-colors font-medium">
        Sign up
      </Link>
    </div>
  );

  return (
    <>
      <nav className="bg-[#1D3557] border-b border-[#16293f] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <Link href="/"
          className="font-display font-semibold text-[#F1FAEE] hover:text-[#A8DADC] transition-colors tracking-tight py-4 flex items-center gap-2 text-sm sm:text-base">
          <span className="text-[#A8DADC]">✈</span>
          <span className="hidden xs:inline">Open Flight Schools</span>
          <span className="xs:hidden">OFS</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks}
          <div className="ml-2 pl-3 border-l border-white/20">
            {authSection}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden text-[#A8DADC] hover:text-[#F1FAEE] p-2 transition-colors"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-[#1D3557] border-b border-[#16293f] z-10 flex flex-col divide-y divide-white/10">
          <div className="flex flex-col">
            {navLinks}
          </div>
          <div>
            {authSection}
          </div>
        </div>
      )}
    </>
  );
}