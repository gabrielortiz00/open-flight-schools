import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import NavbarAuth from "./NavbarAuth";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between z-10">
      <Link href="/" className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
        Open Flight Schools
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/contribute" className="text-sm text-gray-600 hover:text-gray-900">
          Add a school
        </Link>
        <NavbarAuth user={user} />
      </div>
    </nav>
  );
}