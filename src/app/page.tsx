import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'

export default async function HomePage() {
  // @ts-expect-error
  const session = await getServerSession(authOptions) as Session | null
  if (session && session.user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}