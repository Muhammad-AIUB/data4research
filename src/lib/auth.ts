import { prisma } from '@/lib/prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import type { User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import type { Session } from 'next-auth'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          role: user.role
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    jwt: ({ token, user }: { token: JWT; user?: User }) => {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      if (!token.id && token.sub) {
        token.id = token.sub
      }
      return token
    },
    session: ({ session, token }: { session: Session; token: JWT }) => {
      if (session.user && token) {
        session.user.id = (token.id || token.sub) as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}