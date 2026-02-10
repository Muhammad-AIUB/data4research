import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Session } from "next-auth";

export default async function DashboardPage() {
  // @ts-expect-error - authOptions type mismatch with next-auth overloads
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-10 tracking-tight">
          Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Add Patient Card */}
          <Link href="/dashboard/add-patient" className="group">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/50 group-hover:border-blue-400 group-hover:shadow-xl transition-all duration-200 p-8 flex flex-col justify-between min-h-[180px] relative overflow-hidden hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-blue-700 mb-1 group-hover:text-blue-800 transition-colors">
                    Add Patient
                  </h2>
                  <p className="text-slate-600 text-base">
                    Create a new patient record and add test reports
                  </p>
                </div>
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white text-3xl shadow-lg ml-4">
                  <span className="drop-shadow">➕</span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-5 text-[7rem] pointer-events-none select-none text-blue-900">
                +
              </div>
            </div>
          </Link>
          <Link href="/dashboard/patients" className="group">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/50 group-hover:border-blue-400 group-hover:shadow-xl transition-all duration-200 p-8 flex flex-col justify-between min-h-[180px] relative overflow-hidden hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-blue-700 mb-1 group-hover:text-blue-800 transition-colors">
                    All Patients Data
                  </h2>
                  <p className="text-slate-600 text-base">
                    View and manage all patient records and test reports
                  </p>
                </div>
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-sky-500 to-blue-600 text-white text-3xl shadow-lg ml-4">
                  <span className="drop-shadow">📋</span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-5 text-[7rem] pointer-events-none select-none text-blue-900">
                📄
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
