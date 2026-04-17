import { createClient } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReviewForm from "@/components/ReviewForm";
import AdminDeleteReview from "@/components/AdminDeleteReview";
import { SPECIALTY_OPTIONS } from "@/lib/constants";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("name, city, state, description")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!school) return {};

  const title = `${school.name} — ${school.city}, ${school.state}`;
  const description = school.description
    ?? `Flight school in ${school.city}, ${school.state}. View certifications, fleet, pricing, and reviews.`;

  return { title, description, openGraph: { title, description, type: "website" } };
}

function CertBadge({ label }: { label: string }) {
  return (
    <span className="font-mono text-xs bg-[#A8DADC]/30 text-[#1D3557] px-2.5 py-1 rounded-full font-medium">
      {label}
    </span>
  );
}

function ServiceTag({ label }: { label: string }) {
  return (
    <span className="text-xs bg-[#F1FAEE] text-[#1D3557] border border-[#A8DADC] px-3 py-1 rounded-full">
      {label}
    </span>
  );
}

export default async function SchoolPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAdmin = user ? await checkIsAdmin(supabase, user.id) : false;

  const { data: school } = await supabase
    .from("schools")
    .select(`
      id, slug, name, address, city, state, zip, airport_id,
      part_61, part_141, website, phone, email, description, status,
      gi_bill, intro_flight, ground_school, financing,
      simulator, simulator_notes, founded_year, hours,
      certifications (cert_type),
      fleet (aircraft),
      specialties (specialty),
      pricing (cert_type, price_low, price_high),
      reviews (id, rating, body, display_name, created_at)
    `)
    .eq("slug", slug)
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

  const avgRating = school.reviews.length > 0
    ? school.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / school.reviews.length
    : null;

  return (
    <div className="bg-[#F1FAEE] min-h-full">

      {/* Page header band */}
      <div className="bg-[#1D3557] border-b border-[#16293f]">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <Link href="/schools" className="text-sm text-[#A8DADC]/70 hover:text-[#A8DADC] transition-colors">
              ← All schools
            </Link>
            <Link
              href={`/schools/${school.slug}/edit`}
              className="text-sm text-[#A8DADC]/70 hover:text-[#A8DADC] transition-colors"
            >
              Suggest an edit
            </Link>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F1FAEE]">{school.name}</h1>
          <p className="text-[#A8DADC] mt-1">
            {school.address}, {school.city}, {school.state} {school.zip}
          </p>

          <div className="flex gap-2 mt-4 flex-wrap">
            {school.airport_id && (
              <span className="font-mono text-xs bg-white/10 text-[#F1FAEE] border border-white/20 px-3 py-1 rounded-full font-medium tracking-wider">
                {school.airport_id}
              </span>
            )}
            {school.part_141 && (
              <span className="font-mono text-xs bg-[#457B9D]/30 text-[#A8DADC] border border-[#457B9D]/40 px-3 py-1 rounded-full font-medium">
                Part 141
              </span>
            )}
            {school.part_61 && (
              <span className="font-mono text-xs bg-[#A8DADC]/10 text-[#A8DADC] border border-[#A8DADC]/30 px-3 py-1 rounded-full font-medium">
                Part 61
              </span>
            )}
            {avgRating && (
              <span className="text-xs bg-amber-400/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-full font-medium">
                ★ {avgRating.toFixed(1)} · {school.reviews.length} review{school.reviews.length !== 1 ? "s" : ""}
              </span>
            )}
            {school.gi_bill && (
              <span className="font-mono text-xs bg-green-400/20 text-green-200 border border-green-400/30 px-3 py-1 rounded-full font-medium">
                GI Bill
              </span>
            )}
            {school.founded_year && (
              <span className="text-xs bg-white/10 text-[#F1FAEE]/70 border border-white/10 px-3 py-1 rounded-full">
                Est. {school.founded_year}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {school.description && (
          <p className="text-gray-700 leading-relaxed">{school.description}</p>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 shadow-sm">
            <h2 className="font-display font-semibold text-[#1D3557] text-sm uppercase tracking-wider">Contact</h2>
            {school.phone && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
                <p className="text-sm text-[#1D3557]">{school.phone}</p>
              </div>
            )}
            {safeEmail && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                <a href={`mailto:${safeEmail}`} className="text-sm text-[#457B9D] hover:text-[#1D3557] hover:underline transition-colors break-all">
                  {safeEmail}
                </a>
              </div>
            )}
            {safeWebsite && (
              <a
                href={safeWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-[#457B9D] hover:text-[#1D3557] font-medium transition-colors"
              >
                Visit website →
              </a>
            )}
            {school.hours && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Hours</p>
                <p className="text-sm text-[#1D3557]">{school.hours}</p>
              </div>
            )}
            {!school.phone && !safeEmail && !safeWebsite && !school.hours && (
              <p className="text-sm text-gray-400">No contact info listed.</p>
            )}
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-display font-semibold text-[#1D3557] text-sm uppercase tracking-wider mb-3">
              Certifications
            </h2>
            {school.certifications.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {school.certifications.map((c: { cert_type: string }) => (
                  <CertBadge key={c.cert_type} label={c.cert_type} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Not listed</p>
            )}
          </div>

          {/* Fleet */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-display font-semibold text-[#1D3557] text-sm uppercase tracking-wider mb-3">
              Fleet
            </h2>
            {school.fleet.length > 0 ? (
              <ul className="space-y-1.5">
                {school.fleet.map((f: { aircraft: string }) => (
                  <li key={f.aircraft} className="text-sm text-[#1D3557] flex items-center gap-2">
                    <span className="text-[#A8DADC] text-xs">▸</span>
                    {f.aircraft}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">Not listed</p>
            )}
          </div>
        </div>

        {/* Features */}
        {(school.intro_flight || school.ground_school || school.financing || school.simulator) && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-display font-semibold text-[#1D3557] text-sm uppercase tracking-wider mb-3">Services</h2>
            <div className="flex flex-wrap gap-2">
              {school.intro_flight && <ServiceTag label="Intro Flight" />}
              {school.ground_school && <ServiceTag label="Ground School" />}
              {school.simulator && <ServiceTag label={school.simulator_notes ? `Simulator — ${school.simulator_notes}` : "Simulator"} />}
              {school.financing && <ServiceTag label="Financing Available" />}
            </div>
          </div>
        )}

        {/* Specialties */}
        {school.specialties.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-display font-semibold text-[#1D3557] text-sm uppercase tracking-wider mb-3">Advanced Training</h2>
            <div className="flex flex-wrap gap-2">
              {school.specialties.map((s: { specialty: string }) => {
                const label = SPECIALTY_OPTIONS.find((o) => o.value === s.specialty)?.label ?? s.specialty;
                return <ServiceTag key={s.specialty} label={label} />;
              })}
            </div>
          </div>
        )}

        {/* Pricing */}
        {school.pricing.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-display font-semibold text-[#1D3557] text-sm uppercase tracking-wider mb-4">
              Estimated pricing
            </h2>
            <div className="divide-y divide-gray-100">
              {school.pricing.map((p: { cert_type: string; price_low: number | null; price_high: number | null }) => (
                <div key={p.cert_type} className="flex justify-between items-center py-2.5">
                  <span className="font-mono text-sm font-medium text-[#1D3557]">{p.cert_type}</span>
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
            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
              Estimates only. Contact the school for current rates.
            </p>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-display font-semibold text-[#1D3557] text-sm uppercase tracking-wider mb-4">
            Reviews {school.reviews.length > 0 && `(${school.reviews.length})`}
          </h2>
          {school.reviews.length > 0 ? (
            <div className="divide-y divide-gray-100 mb-6">
              {school.reviews.map((r: { id: string; rating: number; body: string | null; display_name: string | null; created_at: string }) => (
                <div key={r.id} className="py-4 first:pt-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-amber-400 text-sm tracking-widest">
                      {"★".repeat(r.rating)}
                      <span className="text-gray-200">{"★".repeat(5 - r.rating)}</span>
                    </span>
                    <span className="text-xs font-medium text-[#1D3557]">{r.display_name ?? "Anonymous"}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                    {isAdmin && <AdminDeleteReview reviewId={r.id} />}
                  </div>
                  {r.body && <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-6">No reviews yet. Be the first.</p>
          )}
          <ReviewForm schoolId={school.id} userEmail={user?.email} />
        </div>

      </div>
    </div>
  );
}