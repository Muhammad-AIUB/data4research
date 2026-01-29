'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavbarLogin() {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return null
  }

  return (
    <Link href="/login" className="text-white hover:text-blue-200 transition-colors">
      Login
    </Link>
  )
}

