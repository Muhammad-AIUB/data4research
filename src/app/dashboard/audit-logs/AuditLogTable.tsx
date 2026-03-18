"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

const ACTION_BADGES: Record<string, string> = {
  CREATE_PATIENT: "bg-green-100 text-green-800",
  CREATE_PATIENT_TEST: "bg-green-100 text-green-800",
  UPDATE_PATIENT: "bg-amber-100 text-amber-800",
  DELETE_PATIENT: "bg-red-100 text-red-800",
};

function ChangesCell({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!before && !after) {
    return <span className="text-gray-400 text-xs">—</span>;
  }

  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);
  const count = keys.size;

  if (count === 0) {
    return <span className="text-gray-400 text-xs">—</span>;
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
      >
        {count} field{count !== 1 ? "s" : ""}
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {expanded && (
        <div className="mt-2 space-y-1 text-xs">
          {[...keys].map((key) => (
            <div key={key} className="flex gap-2">
              <span className="font-medium text-gray-600 min-w-[80px]">
                {key}:
              </span>
              {before && key in before && (
                <span className="text-red-600 line-through">
                  {formatValue(before[key])}
                </span>
              )}
              {after && key in after && (
                <span className="text-green-700">
                  {formatValue(after[key])}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "null";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

export default function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (resourceFilter) params.set("resource", resourceFilter);
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/audit-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setLogs(json.data);
      setPagination(json.pagination);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, resourceFilter, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 border-b border-gray-100">
        <select
          value={resourceFilter}
          onChange={(e) => {
            setResourceFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Resources</option>
          <option value="Patient">Patient</option>
          <option value="PatientTest">Patient Test</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Actions</option>
          <option value="CREATE_PATIENT">Create Patient</option>
          <option value="UPDATE_PATIENT">Update Patient</option>
          <option value="DELETE_PATIENT">Delete Patient</option>
          <option value="CREATE_PATIENT_TEST">Create Test</option>
        </select>
        <span className="ml-auto text-xs text-gray-400 self-center">
          {pagination.total} total entries
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Changes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {log.userName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ACTION_BADGES[log.action] || "bg-gray-100 text-gray-700"}`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {log.resource}
                    <span className="text-gray-400 text-xs ml-1">
                      {log.resourceId.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ChangesCell before={log.before} after={log.after} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <button
          onClick={() =>
            setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
          }
          disabled={pagination.page <= 1}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <span className="text-sm text-gray-500">
          Page {pagination.page} of {totalPages}
        </span>
        <button
          onClick={() =>
            setPagination((p) => ({
              ...p,
              page: Math.min(totalPages, p.page + 1),
            }))
          }
          disabled={pagination.page >= totalPages}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
