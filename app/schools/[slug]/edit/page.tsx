import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ContributionForm from "@/components/ContributionForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditSchoolPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: school } = await supabase
    .from("schools")
    .select(`
      id, slug, name, address, city, state, zip,
      part_61, part_141, website, phone, email, description,
      certifications (cert_type),
      fleet (aircraft)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!school) notFound();

  const initial = {
    name: school.name,
    address: school.address,
    city: school.city,
    state: school.state,
    zip: school.zip,
    part_61: school.part_61,
    part_141: school.part_141,
    website: school.website ?? "",
    phone: school.phone ?? "",
    email: school.email ?? "",
    description: school.description ?? "",
    certifications: school.certifications.map((c: { cert_type: string }) => c.cert_type),
    fleet: school.fleet.map((f: { aircraft: string }) => f.aircraft),
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <Link href={`/schools/${school.slug}`} className="text-sm text-blue-600 hover:underline">
          ← Back to {school.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Suggest an edit</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your edit will be reviewed before it goes live.
        </p>
      </div>
      <ContributionForm schoolId={school.id} initial={initial} />
    </div>
  );
}