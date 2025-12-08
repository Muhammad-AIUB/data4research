'use client'

import { useState } from "react"
import { Calendar } from "lucide-react"

interface Props {
  selectedDate: Date
  onDateChange: (date: Date) => void
  defaultDate: Date
}

export default function ModalDatePicker({ selectedDate, onDateChange, defaultDate }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [localDate, setLocalDate] = useState(selectedDate)

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
  }

  const handleDateSelect = (date: Date) => {
    setLocalDate(date)
    onDateChange(date)
    setIsOpen(false)
  }

  const resetToDefault = () => {
    setLocalDate(defaultDate)
    onDateChange(defaultDate)
  }

  const adjustDate = (days: number) => {
    const newDate = new Date(localDate)
    newDate.setDate(newDate.getDate() + days)
    setLocalDate(newDate)
    onDateChange(newDate)
  }

  const adjustMonths = (months: number) => {
    const newDate = new Date(localDate)
    newDate.setMonth(newDate.getMonth() + months)
    setLocalDate(newDate)
    onDateChange(newDate)
  }

  const adjustYears = (years: number) => {
    const newDate = new Date(localDate)
    newDate.setFullYear(newDate.getFullYear() + years)
    setLocalDate(newDate)
    onDateChange(newDate)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-md border border-blue-300 text-base font-semibold shadow-sm"
      >
        <Calendar className="w-5 h-5 text-blue-700" />
        <span className="text-blue-800 font-semibold tracking-wide">{formatDate(localDate)}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white border rounded-xl shadow-2xl p-4 z-50 min-w-[320px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "-1d", action: () => adjustDate(-1), color: "bg-rose-100 hover:bg-rose-200 text-rose-700" },
                  { label: "-3d", action: () => adjustDate(-3), color: "bg-orange-100 hover:bg-orange-200 text-orange-700" },
                  { label: "-5d", action: () => adjustDate(-5), color: "bg-amber-100 hover:bg-amber-200 text-amber-800" },
                  { label: "-1m", action: () => adjustMonths(-1), color: "bg-yellow-100 hover:bg-yellow-200 text-yellow-800" },
                  { label: "-1y", action: () => adjustYears(-1), color: "bg-lime-100 hover:bg-lime-200 text-lime-800" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg shadow-sm ${item.color}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={resetToDefault}
                className="px-3 py-2 text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg shadow-sm"
              >
                Reset
              </button>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "+1d", action: () => adjustDate(1), color: "bg-emerald-100 hover:bg-emerald-200 text-emerald-800" },
                  { label: "+3d", action: () => adjustDate(3), color: "bg-teal-100 hover:bg-teal-200 text-teal-800" },
                  { label: "+5d", action: () => adjustDate(5), color: "bg-blue-100 hover:bg-blue-200 text-blue-800" },
                  { label: "+1m", action: () => adjustMonths(1), color: "bg-indigo-100 hover:bg-indigo-200 text-indigo-800" },
                  { label: "+1y", action: () => adjustYears(1), color: "bg-purple-100 hover:bg-purple-200 text-purple-800" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg shadow-sm ${item.color}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-sm">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-700 py-1">
                  {day}
                </div>
              ))}
              {Array.from({ length: 42 }).map((_, index) => {
                const firstDay = new Date(localDate.getFullYear(), localDate.getMonth(), 1)
                const startDate = new Date(firstDay)
                startDate.setDate(startDate.getDate() - firstDay.getDay())

                const date = new Date(startDate)
                date.setDate(startDate.getDate() + index)

                const isCurrentMonth = date.getMonth() === localDate.getMonth()
                const isToday = date.toDateString() === new Date().toDateString()
                const isSelected = date.toDateString() === localDate.toDateString()

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    className={`
                      p-2 text-sm rounded-lg transition
                      ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-800'}
                      ${isToday ? 'outline outline-2 outline-blue-200' : ''}
                      ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100'}
                    `}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

