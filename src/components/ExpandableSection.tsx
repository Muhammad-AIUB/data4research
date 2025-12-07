'use client'

import { ChevronDown, ChevronUp } from "lucide-react"

interface Props {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  colorClass?: string
}

export default function ExpandableSection({ title, isOpen, onToggle, children, colorClass = "bg-gray-50 border-gray-200" }: Props) {
  return (
    <div className={`border-2 rounded-lg overflow-hidden ${colorClass}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 ${colorClass} hover:opacity-80 transition-opacity`}
      >
        <span className="font-medium text-lg">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>
      {isOpen && (
        <div className={`p-4 ${colorClass}`}>
          {children}
        </div>
      )}
    </div>
  )
}

