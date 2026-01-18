import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import type { Session } from 'next-auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // @ts-expect-error - getServerSession type inference issue with custom callbacks
  const session = await getServerSession(authOptions) as Session | null
  
  // Redirect to login if not authenticated
  if (!session || !session.user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-yellow-600">
      <Sidebar session={session} />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}