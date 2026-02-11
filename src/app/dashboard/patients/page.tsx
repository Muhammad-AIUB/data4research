// Server Component — no "use client", no SWR, no client-side fetch.
// Data is fetched directly from Prisma at request time with ISR (revalidate = 30s).

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Session } from "next-auth";
import PatientSearch from "./PatientSearch";

// ISR: regenerate page every 30s so the list stays fresh without a full rebuild
export const revalidate = 30;

export default async function AllPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  // Auth check — redirect unauthenticated users
  // @ts-expect-error - authOptions type mismatch with next-auth overloads
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user) redirect("/login");

  const { search, page: pageParam } = await searchParams;
  const searchQuery = search?.trim() || "";
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  // Build Prisma where clause for search (same logic as the old API route)
  const whereClause = searchQuery
    ? {
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" as const } },
          { mobile: { contains: searchQuery, mode: "insensitive" as const } },
          { patientId: { contains: searchQuery, mode: "insensitive" as const } },
          { finalDiagnosis: { contains: searchQuery, mode: "insensitive" as const } },
          { tags: { has: searchQuery } },
          { relativeMobile: { contains: searchQuery, mode: "insensitive" as const } },
          { spouseMobile: { contains: searchQuery, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Single query — select only the 4 fields needed for the list card
  const patients = await prisma.patient.findMany({
    where: whereClause,
    select: { id: true, name: true, patientId: true, mobile: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
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

        {/* Client component handles search input + delete (needs interactivity) */}
        <PatientSearch initialSearch={searchQuery} />

        {patients.length === 0 ? (
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
            {patients.map((patient) => (
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
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/patients/${patient.patientId || patient.id}`}
                    className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/dashboard/patients/${patient.id}/edit`}
                    className="inline-flex items-center justify-center w-9 h-9 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm transition-all"
                    title="Edit patient"
                  >
                    <PencilIcon />
                  </Link>
                  {/* Delete is handled by the PatientDeleteButton client component below */}
                  <PatientDeleteButton id={patient.id} name={patient.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Tiny server-rendered icon — avoids importing lucide-react on the server
function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

// Isolated client component for delete — keeps the rest of the page as a server component
import PatientDeleteButton from "./PatientDeleteButton";
