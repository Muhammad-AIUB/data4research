import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import type { Session } from 'next-auth'

export default async function Navbar() {
  // @ts-expect-error
  const session = await getServerSession(authOptions) as Session | null
  return (
    <nav className="bg-blue-700 text-white p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-end items-center">
        <Link href={session && session.user ? "/dashboard" : "/"} className="text-xl font-bold hover:text-blue-200 transition-colors cursor-pointer">
          Data4Research
        </Link>
      </div>
    </nav>
  )
}
