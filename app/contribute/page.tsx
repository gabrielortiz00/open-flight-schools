import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ContributionForm from "@/components/ContributionForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add a Flight School",
};

export default async function ContributePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="bg-[#F1FAEE] min-h-full">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <Link href="/" className="text-sm text-[#457B9D] hover:text-[#1D3557] font-medium transition-colors">
            ← Back to map
          </Link>
          <h1 className="font-display text-2xl font-bold text-[#1D3557] mt-3">Add a flight school</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your submission will be reviewed by our team before it goes live.
          </p>
        </div>
        <ContributionForm />
      </div>
    </div>
  );
}