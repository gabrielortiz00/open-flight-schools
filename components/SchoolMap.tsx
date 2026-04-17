"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, { MapRef, Marker, Popup } from "react-map-gl/mapbox";
import type { School } from "@/types/school";
import "mapbox-gl/dist/mapbox-gl.css";

export default function SchoolMap() {
  const mapRef = useRef<MapRef>(null);
  const [schools, setSchools] = useState<School[]>([]);
  void mapRef; // reserved for future bbox filtering
  const [selected, setSelected] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchools = useCallback(async () => {
    const res = await fetch("/api/schools");
    if (res.ok) setSchools(await res.json());
    setLoading(false);
  }, []);

  // debounced re-fetch on map move
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
    <div className="w-full h-screen relative">
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 rounded shadow text-sm text-gray-600">
          Loading schools...
        </div>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: -98.5795,
          latitude: 39.8283,
          zoom: 4,
        }}
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
            <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow cursor-pointer hover:bg-blue-500 transition-colors" />
          </Marker>
        ))}

        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="bottom"
            offset={16}
            onClose={() => setSelected(null)}
            closeOnClick={false}
          >
            <div className="p-1 min-w-[180px]">
              <p className="font-semibold text-sm leading-tight">{selected.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selected.city}, {selected.state}
              </p>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {selected.part_141 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Part 141</span>
                )}
                {selected.part_61 && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Part 61</span>
                )}
              </div>
              <a
                href={`/schools/${selected.id}`}
                className="block mt-2 text-xs text-blue-600 hover:underline"
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