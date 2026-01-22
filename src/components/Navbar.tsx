import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import NavbarLogin from '@/components/NavbarLogin'
import type { Session } from 'next-auth'

export default async function Navbar() {
  // @ts-expect-error - getServerSession type inference issue with custom callbacks
  const session = await getServerSession(authOptions) as Session | null

  return (
    <nav className="bg-yellow-600 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href={session && session.user ? "/dashboard" : "/"} className="text-xl font-bold hover:text-yellow-200 transition-colors cursor-pointer">
          Data4Research
        </Link>
        {/* Show nothing when user is logged in; hide link on /login via NavbarLogin */}
        {!session && <NavbarLogin />}
      </div>
    </nav>
  )
}
