"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, { MapRef, Marker, Popup } from "react-map-gl/mapbox";
import type { School } from "@/types/school";

function SchoolPin({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="View school"
      className="group cursor-pointer focus:outline-none"
    >
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
  const [schools, setSchools] = useState<School[]>([]);
  void mapRef;
  const [selected, setSelected] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchools = useCallback(async () => {
    const res = await fetch("/api/schools");
    if (res.ok) setSchools(await res.json());
    setLoading(false);
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMoveEnd = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchSchools, 300);
  }, [fetchSchools]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="w-full flex-1 min-h-0 relative">
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-[#1D3557] text-[#F1FAEE] px-4 py-2 rounded shadow-lg text-sm font-medium tracking-wide">
          Loading schools…
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
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelected(school);
            }}
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
            className="school-popup"
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