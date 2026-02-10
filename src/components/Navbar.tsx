'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function Navbar() {
  const { data: session } = useSession()
  return (
    <nav className="bg-blue-700 text-white p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-end items-center">
        <Link href={session?.user ? "/dashboard" : "/"} className="text-xl font-bold hover:text-blue-200 transition-colors cursor-pointer">
          Data4Research
        </Link>
      </div>
    </nav>
  )
}
