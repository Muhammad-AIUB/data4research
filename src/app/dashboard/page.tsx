import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Session } from 'next-auth'

export default async function DashboardPage() {
  // @ts-expect-error - getServerSession type inference issue with custom callbacks
  const session = await getServerSession(authOptions) as Session | null
  
  // Redirect to login if not authenticated
  if (!session || !session.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-yellow-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-10 tracking-tight drop-shadow-sm">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Add Patient Card */}
          <Link href="/dashboard/add-patient" className="group">
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 group-hover:border-blue-400 transition-all duration-200 p-8 flex flex-col justify-between min-h-[180px] relative overflow-hidden hover:scale-[1.025] cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-blue-800 mb-1 group-hover:text-blue-900 transition-colors">Add Patient</h2>
                  <p className="text-gray-600 text-base">Create a new patient record and add test reports</p>
                </div>
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-400 text-white text-3xl shadow-lg ml-4">
                  <span className="drop-shadow">➕</span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 text-[7rem] pointer-events-none select-none">+</div>
            </div>
          </Link>
          {/* All Patients Data Card */}
          <Link href="/dashboard/patients" className="group">
            <div className="bg-white rounded-2xl shadow-xl border border-green-100 group-hover:border-green-400 transition-all duration-200 p-8 flex flex-col justify-between min-h-[180px] relative overflow-hidden hover:scale-[1.025] cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-green-800 mb-1 group-hover:text-green-900 transition-colors">All Patients Data</h2>
                  <p className="text-gray-600 text-base">View and manage all patient records and test reports</p>
                </div>
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-400 text-white text-3xl shadow-lg ml-4">
                  <span className="drop-shadow">📋</span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 text-[7rem] pointer-events-none select-none">📄</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
