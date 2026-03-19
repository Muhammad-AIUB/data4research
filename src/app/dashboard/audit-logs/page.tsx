import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import AuditLogTable from "./AuditLogTable";

export default async function AuditLogsPage() {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track all data changes across the system
        </p>
      </div>
      <AuditLogTable />
    </div>
  );
}
