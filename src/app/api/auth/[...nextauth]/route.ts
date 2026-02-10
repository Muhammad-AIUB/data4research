import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
// @ts-expect-error - authOptions type mismatch with next-auth overloads
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }