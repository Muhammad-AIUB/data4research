import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import type { Session } from 'next-auth'

export const dynamic = 'force-dynamic'
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // @ts-expect-error - authOptions type mismatch with next-auth overloads
  const session = await getServerSession(authOptions) as Session | null
  if (!session || !session.user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-linear-to-br from-slate-100 via-blue-50 to-sky-100">
      <Sidebar session={session} />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}