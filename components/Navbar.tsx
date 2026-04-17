import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import NavbarAuth from "./NavbarAuth";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  return (
    <nav className="bg-[#1D3557] border-b border-[#16293f] px-6 py-0 flex items-center justify-between z-10 shrink-0">
      <Link
        href="/"
        className="font-display font-semibold text-[#F1FAEE] hover:text-[#A8DADC] transition-colors tracking-tight py-4 flex items-center gap-2"
      >
        <span className="text-[#A8DADC]">✈</span>
        Open Flight Schools
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href="/schools"
          className="text-sm text-[#A8DADC]/80 hover:text-[#F1FAEE] hover:bg-white/10 px-3 py-4 transition-colors"
        >
          Browse
        </Link>
        <Link
          href="/contribute"
          className="text-sm text-[#A8DADC]/80 hover:text-[#F1FAEE] hover:bg-white/10 px-3 py-4 transition-colors"
        >
          Add a school
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="text-sm text-[#A8DADC] hover:text-[#F1FAEE] hover:bg-white/10 px-3 py-4 transition-colors font-medium"
          >
            Admin
          </Link>
        )}
        <div className="ml-2 pl-3 border-l border-white/20">
          <NavbarAuth user={user} />
        </div>
      </div>
    </nav>
  );
}