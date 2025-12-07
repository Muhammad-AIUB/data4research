import LoginForm from '@/components/LoginForm'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'

export default async function LoginPage() {
  // @ts-expect-error - getServerSession type inference issue with custom callbacks
  const session = await getServerSession(authOptions) as Session | null
  
  // If already logged in, redirect to home/dashboard
  if (session && session.user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Data4Research</h1>
        <LoginForm />
      </div>
    </div>
  )
}