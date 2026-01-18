import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import NavbarLogin from './NavbarLogin'
import { SignOutButton } from './SignOutButton'
import { SettingsDropdown } from './SettingsDropdown'
import Link from 'next/link'
import type { Session } from 'next-auth'

export default async function Navbar() {
  // @ts-expect-error - getServerSession type inference issue with custom callbacks
  const session = await getServerSession(authOptions) as Session | null

  return (
    <nav className="bg-amber-700 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href={session && session.user ? "/dashboard" : "/"} className="text-xl font-bold hover:text-amber-200 transition-colors cursor-pointer">
          Data4Research
        </Link>
        {session && session.user ? (
          <div className="flex items-center">
            <span className="mr-4">Welcome {session.user.name}</span>
            <span className="bg-amber-800 px-3 py-1 rounded text-sm mr-4">
              {session.user.role === 'ADMIN' ? 'ADMIN' : 'DOCTOR'}
            </span>
            <SettingsDropdown />
            <SignOutButton />
          </div>
        ) : (
          <NavbarLogin />
        )}
      </div>
    </nav>
  )
}
