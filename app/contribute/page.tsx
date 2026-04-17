import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ContributionForm from "@/components/ContributionForm";

export default async function ContributePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to map</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Add a flight school</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your submission will be reviewed before it goes live.
        </p>
      </div>
      <ContributionForm />
    </div>
  );
}
