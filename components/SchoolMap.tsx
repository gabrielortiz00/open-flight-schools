"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, { MapRef, Marker, Popup } from "react-map-gl/mapbox";
import type { School } from "@/types/school";

const CERT_OPTIONS = ["PPL", "IR", "CPL", "MEL", "CFI", "CFII", "ATP"];

interface Filters {
  part61: boolean;
  part141: boolean;
  certs: string[];
}

const DEFAULT_FILTERS: Filters = { part61: false, part141: false, certs: [] };

function buildUrl(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.part61) params.set("part61", "true");
  if (filters.part141) params.set("part141", "true");
  if (filters.certs.length > 0) params.set("certs", filters.certs.join(","));
  const qs = params.toString();
  return qs ? `/api/schools?${qs}` : "/api/schools";
}

function isActive(filters: Filters) {
  return filters.part61 || filters.part141 || filters.certs.length > 0;
}

function SchoolPin({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="View school" className="group cursor-pointer focus:outline-none">
      <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 18 12 18s12-9.75 12-18c0-6.627-5.373-12-12-12z"
          fill="#1D3557"
          className="group-hover:fill-[#457B9D] transition-colors"
        />
        <circle cx="12" cy="12" r="5" fill="#A8DADC" />
      </svg>
    </button>
  );
}

export default function SchoolMap() {
  const mapRef = useRef<MapRef>(null);
  void mapRef;

  const [schools, setSchools] = useState<School[]>([]);
  const [selected, setSelected] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [panelOpen, setPanelOpen] = useState(true);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(buildUrl(filtersRef.current));
      if (res.ok) setSchools(await res.json());
      else setFetchError(true);
    } catch {
      setFetchError(true);
    }
    setLoading(false);
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchSchools();
  }, [filters, fetchSchools]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMoveEnd = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchSchools, 300);
  }, [fetchSchools]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  function toggleCert(cert: string) {
    setFilters((prev) => ({
      ...prev,
      certs: prev.certs.includes(cert)
        ? prev.certs.filter((c) => c !== cert)
        : [...prev.certs, cert],
    }));
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const active = isActive(filters);

  return (
    <div className="w-full flex-1 min-h-0 relative">

      {/* Filter panel */}
      <div className={`absolute top-4 left-4 z-10 transition-all duration-200 ${panelOpen ? "w-[calc(100vw-2rem)] sm:w-60" : "w-auto"}`}>
        {panelOpen ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-display font-semibold text-[#1D3557] text-sm">Filters</span>
              <div className="flex items-center gap-2">
                {active && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[#E63946] hover:text-red-700 font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setPanelOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Training type */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-mono text-xs text-gray-400 uppercase tracking-wider mb-2">Training type</p>
              <div className="space-y-2">
                {[
                  { key: "part61" as const, label: "Part 61" },
                  { key: "part141" as const, label: "Part 141" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters[key]}
                      onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded accent-[#1D3557]"
                    />
                    <span className="text-sm text-[#1D3557] group-hover:text-[#457B9D] transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="px-4 py-3">
              <p className="font-mono text-xs text-gray-400 uppercase tracking-wider mb-2">Certifications</p>
              <div className="flex flex-wrap gap-1.5">
                {CERT_OPTIONS.map((cert) => (
                  <button
                    key={cert}
                    onClick={() => toggleCert(cert)}
                    className={`font-mono text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                      filters.certs.includes(cert)
                        ? "bg-[#1D3557] text-[#F1FAEE] border-[#1D3557]"
                        : "bg-white text-[#457B9D] border-[#A8DADC] hover:border-[#457B9D]"
                    }`}
                  >
                    {cert}
                  </button>
                ))}
              </div>
            </div>

            {/* School count */}
            <div className="px-4 py-2.5 bg-[#F1FAEE] border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {loading ? "Loading…" : (
                  <><span className="font-semibold text-[#1D3557]">{schools.length}</span> school{schools.length !== 1 ? "s" : ""} shown</>
                )}
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setPanelOpen(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-semibold transition-colors ${
              active
                ? "bg-[#1D3557] text-[#F1FAEE]"
                : "bg-white text-[#1D3557] border border-gray-200"
            }`}
          >
            <span>⚙</span>
            Filters
            {active && (
              <span className="bg-[#A8DADC] text-[#1D3557] font-mono text-xs px-1.5 py-0.5 rounded-full">
                {(filters.part61 ? 1 : 0) + (filters.part141 ? 1 : 0) + filters.certs.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Loading / error indicator */}
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-[#1D3557] text-[#F1FAEE] px-4 py-2 rounded shadow-lg text-sm font-medium tracking-wide pointer-events-none">
          Loading…
        </div>
      )}
      {fetchError && !loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-[#E63946] text-white px-4 py-2 rounded shadow-lg text-sm font-medium flex items-center gap-2">
          <span>Failed to load schools.</span>
          <button onClick={fetchSchools} className="underline hover:no-underline">Retry</button>
        </div>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ longitude: -98.5795, latitude: 39.8283, zoom: 4 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onLoad={fetchSchools}
        onMoveEnd={handleMoveEnd}
      >
        {schools.map((school) => (
          <Marker
            key={school.id}
            longitude={school.lng}
            latitude={school.lat}
            anchor="bottom"
            onClick={(e) => { e.originalEvent.stopPropagation(); setSelected(school); }}
          >
            <SchoolPin onClick={() => setSelected(school)} />
          </Marker>
        ))}

        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="bottom"
            offset={32}
            onClose={() => setSelected(null)}
            closeOnClick={false}
          >
            <div className="p-3 min-w-[200px]">
              <p className="font-display font-semibold text-[#1D3557] text-sm leading-snug">
                {selected.name}
              </p>
              <p className="text-xs text-[#457B9D] mt-0.5">
                {selected.city}, {selected.state}
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {selected.part_141 && (
                  <span className="font-mono text-xs bg-[#A8DADC]/30 text-[#1D3557] px-2 py-0.5 rounded-full">
                    Part 141
                  </span>
                )}
                {selected.part_61 && (
                  <span className="font-mono text-xs bg-[#A8DADC]/30 text-[#1D3557] px-2 py-0.5 rounded-full">
                    Part 61
                  </span>
                )}
              </div>
              <a
                href={`/schools/${selected.id}`}
                className="block mt-3 text-xs font-semibold text-[#457B9D] hover:text-[#1D3557] transition-colors"
              >
                View details →
              </a>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}