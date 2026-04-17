import { createClient } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/auth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user ? await checkIsAdmin(supabase, user.id) : false;

  return <NavbarClient user={user} isAdmin={isAdmin} />;
}