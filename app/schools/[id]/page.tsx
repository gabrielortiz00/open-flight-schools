import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReviewForm from "@/components/ReviewForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SchoolPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: school } = await supabase
    .from("schools")
    .select(`
      id, name, address, city, state, zip,
      part_61, part_141, website, phone, email, description, status,
      certifications (cert_type),
      fleet (aircraft),
      pricing (cert_type, price_low, price_high),
      reviews (id, rating, body, created_at)
    `)
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!school) notFound();

  const safeWebsite = (() => {
    try {
      const u = new URL(school.website ?? "");
      return u.protocol === "https:" ? school.website : null;
    } catch { return null; }
  })();
  const safeEmail = school.email?.replace(/[?&#].*$/, "") ?? null;

  const avgRating =
    school.reviews.length > 0
      ? school.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
        school.reviews.length
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← Back to map
            </Link>
            <Link href={`/schools/${id}/edit`} className="text-sm text-gray-500 hover:text-gray-700">
              Suggest an edit
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{school.name}</h1>
          <p className="text-gray-500 mt-1">
            {school.address}, {school.city}, {school.state} {school.zip}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {school.part_141 && (
              <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                Part 141
              </span>
            )}
            {school.part_61 && (
              <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">
                Part 61
              </span>
            )}
            {avgRating && (
              <span className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1 rounded-full font-medium">
                ★ {avgRating.toFixed(1)} ({school.reviews.length} review{school.reviews.length !== 1 ? "s" : ""})
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {school.description && (
          <p className="text-gray-700 leading-relaxed">{school.description}</p>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* Contact */}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">Contact</h2>
            {school.phone && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Phone</p>
                <p className="text-sm text-gray-700">{school.phone}</p>
              </div>
            )}
            {safeEmail && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                <a href={`mailto:${safeEmail}`} className="text-sm text-blue-600 hover:underline">
                  {safeEmail}
                </a>
              </div>
            )}
            {safeWebsite && (
              <a
                href={safeWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:underline"
              >
                Visit website →
              </a>
            )}
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Certifications</h2>
            {school.certifications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {school.certifications.map((c: { cert_type: string }) => (
                  <span
                    key={c.cert_type}
                    className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    {c.cert_type}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Not listed</p>
            )}
          </div>

          {/* Fleet */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Fleet</h2>
            {school.fleet.length > 0 ? (
              <ul className="space-y-1">
                {school.fleet.map((f: { aircraft: string }) => (
                  <li key={f.aircraft} className="text-sm text-gray-700">
                    {f.aircraft}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">Not listed</p>
            )}
          </div>
        </div>

        {/* Pricing */}
        {school.pricing.length > 0 && (
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="divide-y">
              {school.pricing.map((p: { cert_type: string; price_low: number | null; price_high: number | null }) => (
                <div key={p.cert_type} className="flex justify-between py-2.5">
                  <span className="text-sm font-medium text-gray-700">{p.cert_type}</span>
                  <span className="text-sm text-gray-500">
                    {p.price_low && p.price_high
                      ? `$${p.price_low.toLocaleString()} – $${p.price_high.toLocaleString()}`
                      : p.price_low
                      ? `From $${p.price_low.toLocaleString()}`
                      : "Contact school"}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Prices are estimates. Contact the school for current rates.
            </p>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Reviews {school.reviews.length > 0 && `(${school.reviews.length})`}
          </h2>
          {school.reviews.length > 0 ? (
            <div className="divide-y">
              {school.reviews.map((r: { id: string; rating: number; body: string | null; created_at: string }) => (
                <div key={r.id} className="py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-500 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.body && <p className="text-sm text-gray-700">{r.body}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 pb-4">No reviews yet. Be the first to review this school.</p>
          )}
          <ReviewForm schoolId={school.id} userEmail={user?.email} />
        </div>

      </div>
    </div>
  );
}