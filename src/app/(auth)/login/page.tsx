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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0e7ff] via-[#f3e8ff] to-[#ffe4fa] relative overflow-hidden">
      {/* Animated SVG background for wow effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%" className="opacity-20 animate-pulse" style={{position:'absolute',top:0,left:0}}>
          <defs>
            <linearGradient id="login-bg-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a21caf" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#login-bg-grad)" />
          <circle cx="20%" cy="15%" r="120" fill="#6366f1" opacity="0.18" />
          <circle cx="80%" cy="80%" r="180" fill="#a21caf" opacity="0.13" />
        </svg>
      </div>
      <div className="relative z-10 w-full max-w-md px-4 md:px-8">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 px-6 py-10 md:px-12 md:py-14 transition-all duration-300">
          {/* Logo/Brand Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-3xl shadow-xl mb-5 animate-bounce-slow">
              <span className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg select-none">DR</span>
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-2 tracking-tight drop-shadow-lg">Data4Research</h1>
            <p className="text-gray-600 text-base font-medium">Sign in to access your dashboard</p>
          </div>
          <LoginForm />
        </div>
        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Secure medical data management system
        </p>
      </div>
      {/* Custom animation for logo bounce */}
      <style>{`
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-bounce-slow { animation: bounce-slow 2.5s infinite cubic-bezier(.68,-0.55,.27,1.55); }
      `}</style>
    </div>
  )
}