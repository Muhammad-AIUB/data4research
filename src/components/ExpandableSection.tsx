'use client'

import { ChevronDown, ChevronUp } from "lucide-react"

interface Props {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  /** Outer / header styling (border, background) */
  colorClass?: string
  /** Expanded panel background (defaults to matching header) */
  contentClassName?: string
}

export default function ExpandableSection({
  title,
  isOpen,
  onToggle,
  children,
  colorClass = "bg-gray-50 border-gray-200",
  contentClassName,
}: Props) {
  const panelClass = contentClassName ?? colorClass
  return (
    <div className={`rounded-xl overflow-hidden border shadow-sm transition-shadow hover:shadow-md ${colorClass}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left ${colorClass} hover:bg-white/80 transition-colors`}
      >
        <span className="font-semibold text-base text-slate-800">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 shrink-0 text-slate-500" aria-hidden />
        ) : (
          <ChevronDown className="w-5 h-5 shrink-0 text-slate-500" aria-hidden />
        )}
      </button>
      {isOpen && (
        <div className={`border-t border-slate-200/80 p-4 sm:p-5 ${panelClass}`}>
          {children}
        </div>
      )}
    </div>
  )
}

