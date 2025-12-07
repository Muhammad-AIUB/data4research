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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Patient Button */}
          <Link href="/dashboard/add-patient">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200 hover:border-blue-400">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Add Patient</h2>
                  <p className="text-gray-600">Create a new patient record and add test reports</p>
                </div>
                <div className="text-4xl">➕</div>
              </div>
            </div>
          </Link>

          {/* All Patients Data Button */}
          <Link href="/dashboard/patients">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 hover:border-green-400">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">All Patients Data</h2>
                  <p className="text-gray-600">View and manage all patient records and test reports</p>
                </div>
                <div className="text-4xl">📋</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
