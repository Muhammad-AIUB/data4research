"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AllPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useSWR(
    searchQuery
      ? `/api/patients?search=${encodeURIComponent(searchQuery)}`
      : "/api/patients",
    fetcher,
    { revalidateOnFocus: false },
  );

  const patients = data?.patients || [];
  const loading = isLoading;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // SWR will handle the fetch automatically when searchQuery changes
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            All Patients
          </h1>
          <Link
            href="/dashboard/add-patient"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all"
          >
            <span className="text-lg">+</span> Add New Patient
          </Link>
        </div>

        {/* Search Box */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-5 mb-8">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search with patient name, mobile number, diagnosis or tags..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-12 w-full h-12 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-200 text-base bg-white"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-semibold shadow transition-all"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Patient List */}
        {loading ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-16 text-center">
            <p className="text-slate-500 text-lg">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-16 text-center">
            <p className="text-slate-500 text-lg mb-4">No patients found.</p>
            <Link
              href="/dashboard/add-patient"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Add your first patient →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {patients.map((patient: { id: string; name: string; patientId?: string | null; mobile: string }) => {
              return (
                <div
                  key={patient.id}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-md border border-blue-100 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-lg hover:border-blue-300 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold text-slate-800 truncate">
                      {patient.name}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      <span className="inline-block mr-4">
                        ID:{" "}
                        <span className="text-slate-500">
                          {patient.patientId || "N/A"}
                        </span>
                      </span>
                      <span className="inline-block">
                        Mobile:{" "}
                        <span className="text-slate-500">{patient.mobile}</span>
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/patients/${patient.patientId || patient.id}`}
                    className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold shadow transition-all text-sm"
                  >
                    View Details
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
