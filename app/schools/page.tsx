import { createClient } from "@/lib/supabase/server";
import { CERT_OPTIONS } from "@/lib/constants";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Flight Schools",
  description: "Browse all US flight schools in the Open Flight Schools directory.",
};

interface SearchParams { q?: string; state?: string; cert?: string; page?: string; }
interface Props { searchParams: Promise<SearchParams>; }
const PAGE_SIZE = 25;

const inputClass =
  "border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1D3557] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#457B9D] focus:border-transparent transition";

function pageUrl(params: SearchParams, page: number) {
  const p = new URLSearchParams();
  if (params.q) p.set("q", params.q);
  if (params.state) p.set("state", params.state);
  if (params.cert) p.set("cert", params.cert);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `/schools?${qs}` : "/schools";
}

export default async function SchoolsPage({ searchParams }: Props) {
  const { q, state, cert, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  // If cert filter active, get matching school IDs first
  let certSchoolIds: string[] | null = null;
  if (cert) {
    const { data } = await supabase
      .from("certifications")
      .select("school_id")
      .eq("cert_type", cert.toUpperCase());
    certSchoolIds = data?.map((r) => r.school_id) ?? [];
  }

  let query = supabase
    .from("schools")
    .select("id, name, city, state, part_61, part_141, certifications (cert_type), reviews (rating)", { count: "exact" })
    .eq("status", "published")
    .order("name")
    .range(from, to);

  if (state) query = query.eq("state", state.toUpperCase());
  if (q) query = query.ilike("name", `%${q}%`);
  if (certSchoolIds !== null) {
    if (certSchoolIds.length === 0) {
      // No schools have this cert — short-circuit
      return <EmptyPage q={q} state={state} cert={cert} hasFilters={true} />;
    }
    query = query.in("id", certSchoolIds);
  }

  const { data: schools, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const hasFilters = q || state || cert;
  const params = { q, state, cert, page: pageParam };

  return (
    <div className="bg-[#F1FAEE] min-h-full">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#1D3557]">Browse Flight Schools</h1>
            <p className="text-sm text-gray-500 mt-1">
              {count ?? 0} school{count !== 1 ? "s" : ""}
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
        <form method="GET" className="flex flex-col sm:flex-row flex-wrap gap-2 mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name…"
            className={inputClass + " w-full sm:w-52"}
          />
          <div className="flex gap-2">
            <input
              name="state"
              defaultValue={state}
              placeholder="State (CA…)"
              maxLength={2}
              className={inputClass + " w-28 uppercase"}
            />
            <select name="cert" defaultValue={cert ?? ""} className={inputClass + " flex-1 sm:flex-none"}>
              <option value="">All certs</option>
              {CERT_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-none bg-[#1D3557] text-[#F1FAEE] text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#16293f] transition-colors"
            >
              Filter
            </button>
            {hasFilters && (
              <Link
                href="/schools"
                className="flex-1 sm:flex-none text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center px-2 transition-colors"
              >
                Clear
              </Link>
            )}
          </div>
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
          <>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-400">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={pageUrl(params, page - 1)}
                      className="px-4 py-2 text-sm font-medium text-[#1D3557] bg-white border border-gray-200 rounded-lg hover:bg-[#F1FAEE] transition-colors"
                    >
                      ← Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={pageUrl(params, page + 1)}
                      className="px-4 py-2 text-sm font-medium text-[#1D3557] bg-white border border-gray-200 rounded-lg hover:bg-[#F1FAEE] transition-colors"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyPage({ q, state, cert, hasFilters }: { q?: string; state?: string; cert?: string; hasFilters: boolean }) {
  return (
    <div className="bg-[#F1FAEE] min-h-full">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-[#1D3557] mb-6">Browse Flight Schools</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No schools found{cert ? ` offering ${cert.toUpperCase()}` : ""}{state ? ` in ${state.toUpperCase()}` : ""}{q ? ` matching "${q}"` : ""}.</p>
          {hasFilters && (
            <Link href="/schools" className="text-sm text-[#457B9D] hover:underline mt-2 block">Clear filters</Link>
          )}
        </div>
      </div>
    </div>
  );
}
