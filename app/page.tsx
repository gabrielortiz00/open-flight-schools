"use client";

import dynamic from "next/dynamic";

// mapbox-gl uses browser APIs — must be loaded client-side only
const SchoolMap = dynamic(() => import("@/components/SchoolMap"), { ssr: false });

export default function Home() {
  return <SchoolMap />;
}