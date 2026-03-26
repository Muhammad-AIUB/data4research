'use client'

import { signOut } from 'next-auth/react'
import { LogOut, User, Home, Users, Settings, ClipboardList, X } from 'lucide-react'
import Link from 'next/link'
import type { Session } from 'next-auth'

interface SidebarProps {
  session: Session;
  onClose?: () => void;
}

export default function Sidebar({ session, onClose }: SidebarProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const navLink = (href: string, icon: React.ReactNode, label: string) => (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )

  return (
    <div className="w-64 h-full bg-gray-800 text-white shadow-lg flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold shrink-0">
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
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-700 transition-colors shrink-0 ml-2"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <span className="inline-block bg-gray-700 px-3 py-1 rounded text-sm text-white mt-2">
          {session.user?.role === 'ADMIN' ? 'ADMIN' : 'DOCTOR'}
        </span>
      </div>

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
        {navLink("/dashboard", <Home size={18} />, "Dashboard")}
        {navLink("/dashboard/patients", <Users size={18} />, "All Patients")}
        {navLink("/dashboard/settings", <Settings size={18} />, "Settings")}
        {navLink(
          "/dashboard/add-patient",
          <span className="w-[18px] h-[18px] flex items-center justify-center text-lg leading-none">+</span>,
          "Add Patient",
        )}
        {session.user?.role === 'ADMIN' &&
          navLink("/dashboard/audit-logs", <ClipboardList size={18} />, "Audit Logs")}
      </nav>
    </div>
  )
}
