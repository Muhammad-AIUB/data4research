"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

// Isolated client component for delete — only this tiny island ships JS
export default function PatientDeleteButton({ id, name }: { id: string; name: string }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete patient "${name}"? This will also delete all their test reports. This action cannot be undone.`,
      )
    )
      return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/patients?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        // Revalidate the server component page
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to delete patient.");
      }
    } catch {
      alert("Failed to delete patient. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center justify-center w-9 h-9 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg shadow-sm transition-all"
      title="Delete patient"
    >
      {deleting ? (
        <svg
          className="animate-spin w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
