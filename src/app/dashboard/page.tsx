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
    <div className="p-8">
      <Link href="/dashboard/add-patient">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium mb-6">
          + Add New Patient
        </button>
      </Link>
      {/* Dashboard content will go here */}
    </div>
  )
}
