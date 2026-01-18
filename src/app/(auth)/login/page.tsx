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
    <div className="min-h-screen flex items-stretch bg-yellow-600 relative overflow-hidden">
      {/* Left Poster Section */}
      <div className="hidden md:flex flex-col justify-center items-start w-1/2 px-12 bg-yellow-700 text-white relative z-10 shadow-2xl">
        <div className="mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl shadow-xl mb-6 animate-bounce-slow">
            <span className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg select-none">DR</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-white via-pink-200 to-yellow-100 bg-clip-text text-transparent mb-4 tracking-tight drop-shadow-lg">Data4Research</h1>
          <p className="text-lg font-medium text-white/90 max-w-lg mb-6 drop-shadow-lg">
            Advanced Patient Management System for Medical Professionals
          </p>
        </div>
        </div>
      
      {/* Right Login Card Section */}
      <div className="flex flex-1 items-center justify-center relative z-10 w-full max-w-md px-2 md:px-0">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 px-7 py-8 md:px-12 md:py-14 transition-all duration-300 flex flex-col items-center w-full max-w-md">
          {/* Logo/Brand Section (mobile only) */}
          <div className="text-center mb-6 md:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-700 rounded-2xl shadow-lg mb-3 animate-bounce-slow">
              <span className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg select-none">DR</span>
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-yellow-200 via-yellow-100 to-white bg-clip-text text-transparent mb-1 tracking-tight drop-shadow-lg">Data4Research</h1>
            <p className="text-gray-600 text-sm font-medium">Sign in to access your dashboard</p>
          </div>
          <LoginForm />
        </div>
        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Secure medical data management system
        </p>
      </div>
      {/* Custom animation for logo bounce */}
      <style>{`
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-slow { animation: bounce-slow 2.5s infinite cubic-bezier(.68,-0.55,.27,1.55); }
      `}</style>
    </div>
  )
}
