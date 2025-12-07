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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 text-sm"
      >
        <Calendar className="w-4 h-4 text-blue-600" />
        <span className="text-blue-700 font-medium">{formatDate(localDate)}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-3 z-50 min-w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => adjustDate(-1)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  -1d
                </button>
                <button
                  type="button"
                  onClick={() => adjustDate(-3)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  -3d
                </button>
                <button
                  type="button"
                  onClick={() => adjustDate(-5)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  -5d
                </button>
              </div>
              <button
                type="button"
                onClick={resetToDefault}
                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
              >
                Reset
              </button>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => adjustDate(1)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  +1d
                </button>
                <button
                  type="button"
                  onClick={() => adjustDate(3)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  +3d
                </button>
                <button
                  type="button"
                  onClick={() => adjustDate(5)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  +5d
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium text-gray-600 py-1">
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
                      p-1 text-xs rounded
                      ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                      ${isToday ? 'bg-blue-100 font-bold' : ''}
                      ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
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

