import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import type { Session } from 'next-auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions) as Session | null
  if (!session || !session.user) {
    redirect('/')
  }

  return <DashboardShell session={session}>{children}</DashboardShell>
}
