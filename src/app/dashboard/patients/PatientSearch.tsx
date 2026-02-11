"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Client component: handles debounced search via URL search params.
// The server component re-renders with new searchParams on navigation.
export default function PatientSearch({ initialSearch }: { initialSearch: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialSearch);

  // Debounce: push new URL after 400ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("search", query.trim());
      } else {
        params.delete("search");
      }
      params.delete("page"); // reset pagination on new search
      router.push(`/dashboard/patients?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-5 mb-8">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search with patient name, mobile number, diagnosis or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 w-full h-12 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-200 text-base bg-white"
          />
        </div>
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
