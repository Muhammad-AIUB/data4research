import type { AppRole } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: AppRole
    }
  }

  interface User {
    id: string
    role: AppRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    sub?: string
    role?: AppRole
  }
}
