'use client'

import type { ReactNode } from "react"
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
  /** Optional icon shown left of the title (e.g. heart for My Favorites) */
  icon?: ReactNode
  /** Classes for the icon wrapper when `icon` is set */
  iconWrapperClassName?: string
  /** Extra classes for the title span */
  titleClassName?: string
}

export default function ExpandableSection({
  title,
  isOpen,
  onToggle,
  children,
  colorClass = "bg-gray-50 border-gray-200",
  contentClassName,
  icon,
  iconWrapperClassName = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/90 text-slate-600 ring-1 ring-slate-200/70 shadow-sm",
  titleClassName,
}: Props) {
  const panelClass = contentClassName ?? colorClass
  return (
    <div className={`rounded-xl overflow-hidden border shadow-sm transition-shadow hover:shadow-md ${colorClass}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left ${colorClass} hover:bg-white/80 transition-colors`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {icon ? (
            <span className={iconWrapperClassName} aria-hidden>
              {icon}
            </span>
          ) : null}
          <span
            className={`font-semibold text-base text-slate-800 truncate ${titleClassName ?? ""}`}
          >
            {title}
          </span>
        </span>
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

