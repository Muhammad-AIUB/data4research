'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="ml-4 bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded text-sm font-medium transition-colors"
    >
      Logout
    </button>
  )
}
