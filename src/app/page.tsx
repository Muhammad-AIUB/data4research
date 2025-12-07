import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'

export default async function HomePage() {
  // @ts-expect-error - getServerSession type inference issue with custom callbacks
  const session = await getServerSession(authOptions) as Session | null
  
  // Redirect to dashboard if logged in, otherwise to login
  if (session && session.user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}