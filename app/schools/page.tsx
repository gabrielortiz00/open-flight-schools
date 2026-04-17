import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Flight Schools",
  description: "Browse all US flight schools in the Open Flight Schools directory.",
};

interface SearchParams { q?: string; state?: string; cert?: string; }
interface Props { searchParams: Promise<SearchParams>; }

const CERT_OPTIONS = ["PPL", "IR", "CPL", "MEL", "CFI", "CFII", "ATP"];

const inputClass =
  "border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1D3557] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#457B9D] focus:border-transparent transition";

export default async function SchoolsPage({ searchParams }: Props) {
  const { q, state, cert } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("schools")
    .select("id, name, address, city, state, zip, part_61, part_141, certifications (cert_type), reviews (rating)")
    .eq("status", "published")
    .order("name");

  if (state) query = query.eq("state", state.toUpperCase());
  if (q) query = query.ilike("name", `%${q}%`);

  let { data: schools } = await query;

  if (cert && schools) {
    const upper = cert.toUpperCase();
    schools = schools.filter((s) =>
      (s.certifications as { cert_type: string }[]).some((c) => c.cert_type === upper)
    );
  }

  const hasFilters = q || state || cert;

  return (
    <div className="bg-[#F1FAEE] min-h-full">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#1D3557]">Browse Flight Schools</h1>
            <p className="text-sm text-gray-500 mt-1">
              {schools?.length ?? 0} school{schools?.length !== 1 ? "s" : ""}
              {q && <> matching <em>&quot;{q}&quot;</em></>}
              {state && <> in {state.toUpperCase()}</>}
              {cert && <> offering <span className="font-mono">{cert.toUpperCase()}</span></>}
            </p>
          </div>
          <Link href="/" className="text-sm text-[#457B9D] hover:text-[#1D3557] font-medium transition-colors">
            ← Map view
          </Link>
        </div>

        {/* Filters */}
        <form method="GET" className="flex flex-wrap gap-2 mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name…"
            className={inputClass + " w-52"}
          />
          <input
            name="state"
            defaultValue={state}
            placeholder="State (CA, TX…)"
            maxLength={2}
            className={inputClass + " w-32 uppercase"}
          />
          <select name="cert" defaultValue={cert ?? ""} className={inputClass}>
            <option value="">All certifications</option>
            {CERT_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-[#1D3557] text-[#F1FAEE] text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#16293f] transition-colors"
          >
            Filter
          </button>
          {hasFilters && (
            <Link
              href="/schools"
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center px-2 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>

        {/* List */}
        {!schools?.length ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-gray-400 text-sm">No schools found.</p>
            {hasFilters && (
              <Link href="/schools" className="text-sm text-[#457B9D] hover:underline mt-2 block">
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
            {schools.map((school) => {
              const ratings = school.reviews as { rating: number }[];
              const avg = ratings.length
                ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
                : null;
              const certs = (school.certifications as { cert_type: string }[]).map((c) => c.cert_type);

              return (
                <Link
                  key={school.id}
                  href={`/schools/${school.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#F1FAEE] transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-[#1D3557] group-hover:text-[#457B9D] transition-colors truncate">
                      {school.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {school.city}, {school.state}
                    </p>
                    {certs.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {certs.map((c) => (
                          <span key={c} className="font-mono text-xs bg-[#A8DADC]/30 text-[#1D3557] px-2 py-0.5 rounded-full">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <div className="flex gap-1.5">
                      {school.part_141 && (
                        <span className="font-mono text-xs bg-[#457B9D]/10 text-[#457B9D] px-2 py-0.5 rounded-full font-medium">
                          141
                        </span>
                      )}
                      {school.part_61 && (
                        <span className="font-mono text-xs bg-[#A8DADC]/30 text-[#1D3557] px-2 py-0.5 rounded-full font-medium">
                          61
                        </span>
                      )}
                    </div>
                    {avg !== null && (
                      <span className="text-sm text-amber-500 font-semibold whitespace-nowrap">
                        ★ {avg.toFixed(1)}
                      </span>
                    )}
                    <span className="text-gray-300 group-hover:text-[#457B9D] transition-colors text-lg">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}