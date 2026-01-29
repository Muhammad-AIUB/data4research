'use client'

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export default function CalendarWithNavigation({ selectedDate, onDateChange }: Props) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const today = new Date()

  useEffect(() => {
    setCurrentDate(selectedDate)
  }, [selectedDate])

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
  }

  const formatFullDate = (date: Date) => {
    const day = date.getDate()
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const resetToToday = () => {
    const now = new Date()
    setCurrentDate(now)
    onDateChange(now)
  }

  const adjustDate = (amount: number, unit: 'day' | 'month' | 'year') => {
    const newDate = new Date(currentDate)
    
    if (unit === 'day') {
      newDate.setDate(newDate.getDate() + amount)
    } else if (unit === 'month') {
      newDate.setMonth(newDate.getMonth() + amount)
    } else if (unit === 'year') {
      newDate.setFullYear(newDate.getFullYear() + amount)
    }
    
    setCurrentDate(newDate)
    onDateChange(newDate)
  }

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const parts = value.split('/')
    if (parts.length === 3) {
      const day = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1
      const year = 2000 + parseInt(parts[2])
      const newDate = new Date(year, month, day)
      if (!isNaN(newDate.getTime())) {
        setCurrentDate(newDate)
        onDateChange(newDate)
      }
    }
  }

  return (
    <div className="bg-white border rounded-lg p-2 shadow-sm max-w-xl mx-auto">
      {/* Today's Date Display */}
      <div className="mb-2 text-center">
        <span className="text-xs text-gray-600">Today: </span>
        <span className="text-sm font-bold text-blue-600">{formatDate(today)}</span>
        <button
          onClick={resetToToday}
          className="ml-2 px-2 py-0.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
        >
          Reset to Today
        </button>
      </div>

      <div className="flex items-center justify-between mb-2 gap-1">
        {/* Left Side Buttons */}
        <div className="flex gap-0.5">
          <button
            onClick={() => adjustDate(-1, 'year')}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium"
          >
            -1Y
          </button>
          <button
            onClick={() => adjustDate(-1, 'month')}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium"
          >
            -1M
          </button>
          <button
            onClick={() => adjustDate(-5, 'day')}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium"
          >
            -5d
          </button>
          <button
            onClick={() => adjustDate(-3, 'day')}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium"
          >
            -3d
          </button>
          <button
            onClick={() => adjustDate(-1, 'day')}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium"
          >
            -1d
          </button>
        </div>

        {/* Calendar Display */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => adjustDate(-1, 'day')}
            className="p-0.5 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <div className="text-center">
            <input
              type="text"
              value={formatDate(currentDate)}
              onChange={handleDateInput}
              className="text-sm font-bold text-center border-b-2 border-blue-500 focus:outline-none w-20"
              placeholder="DD/MM/YY"
            />
            <div className="text-sm text-gray-700 mt-1">{formatFullDate(currentDate)}</div>
          </div>
          <button
            onClick={() => adjustDate(1, 'day')}
            className="p-0.5 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Right Side Buttons */}
        <div className="flex gap-0.5">
          <button
            onClick={() => adjustDate(1, 'day')}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium"
          >
            +1d
          </button>
          <button
            onClick={() => adjustDate(3, 'day')}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium"
          >
            +3d
          </button>
          <button
            onClick={() => adjustDate(5, 'day')}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium"
          >
            +5d
          </button>
          <button
            onClick={() => adjustDate(1, 'month')}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium"
          >
            +1M
          </button>
          <button
            onClick={() => adjustDate(1, 'year')}
            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium"
          >
            +1Y
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mt-2">
        <div className="grid grid-cols-7 gap-0.5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-[10px] font-medium text-gray-600 py-0.5">
              {day}
            </div>
          ))}
          {Array.from({ length: 42 }).map((_, index) => {
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
            const startDate = new Date(firstDay)
            startDate.setDate(startDate.getDate() - firstDay.getDay())
            
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + index)
            
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
            const isToday = date.toDateString() === today.toDateString()
            const isSelected = date.toDateString() === currentDate.toDateString()
            
            return (
              <button
                key={index}
                onClick={() => {
                  setCurrentDate(date)
                  onDateChange(date)
                }}
                className={`
                  p-0.5 text-[10px] rounded
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
    </div>
  )
}

