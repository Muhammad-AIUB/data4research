'use client'

import { signOut } from 'next-auth/react'
import { LogOut, User, Home, Users, Heart } from 'lucide-react'
import Link from 'next/link'
import type { Session } from 'next-auth'

interface SidebarProps {
  session: Session
}

export default function Sidebar({ session }: SidebarProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="w-64 bg-gray-800 text-white shadow-lg flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {session.user?.name}
            </h3>
            <p className="text-xs text-gray-300 truncate">
              {session.user?.email}
            </p>
          </div>
        </div>
        <span className="inline-block bg-gray-700 px-3 py-1 rounded text-sm text-white mt-2">
          {session.user?.role === 'ADMIN' ? 'ADMIN' : 'DOCTOR'}
        </span>
      </div>

      {/* Logout Button below User Info */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 text-white hover:bg-red-600 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <Home size={18} />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>

        <Link
          href="/dashboard/patients"
          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <Users size={18} />
          <span className="text-sm font-medium">All Patients</span>
        </Link>

        <Link
          href="/dashboard/favourites"
          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <Heart size={18} />
          <span className="text-sm font-medium">Favourites</span>
        </Link>

        <Link
          href="/dashboard/add-patient"
          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <span className="w-6 h-6 flex items-center justify-center text-lg">+</span>
          <span className="text-sm font-medium">Add Patient</span>
        </Link>
      </nav>
    </div>
  )
}