"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the MapComponent with SSR disabled
const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
      <div className="flex flex-col items-center text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p>Loading map...</p>
      </div>
    </div>
  ),
});

interface DynamicMapProps {
  clinics: Array<{
    id: string;
    name: string;
    city: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    rating?: number | null;
    reviews_count?: number | null;
  }>;
  selectedClinicId?: string | null;
}

export default function DynamicMapWrapper(props: DynamicMapProps) {
  return <DynamicMap {...props} />;
}
