'use client'

import { useEffect } from "react"

interface Props {
  day: string
  setDay: (v: string) => void
  month: string
  setMonth: (v: string) => void
  year: string
  setYear: (v: string) => void
  onAgeChange: (age: number | "") => void
}

const days = Array.from({ length: 31 }, (_, i) => i + 1)
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

export default function DateOfBirthSelector({ day, setDay, month, setMonth, year, setYear, onAgeChange }: Props) {
  useEffect(() => {
    if (day && month && year) {
      const monthIndex = months.indexOf(month) + 1
      const birthDate = new Date(parseInt(year), monthIndex - 1, parseInt(day))
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      onAgeChange(age > 0 ? age : "")
    } else {
      onAgeChange("")
    }
  }, [day, month, year, onAgeChange])

  const handleClear = () => {
    setDay("")
    setMonth("")
    setYear("")
    onAgeChange("")
  }

  return (
    <div className="flex gap-2 items-center">
      <select
        value={day}
        onChange={(e) => setDay(e.target.value)}
        className="w-24 px-3 py-2 border rounded-md"
      >
        <option value="">Day</option>
        {days.map(d => (
          <option key={d} value={d.toString()}>{d}</option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="w-40 px-3 py-2 border rounded-md"
      >
        <option value="">Month</option>
        {months.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="w-32 px-3 py-2 border rounded-md"
      >
        <option value="">Year</option>
        {years.map(y => (
          <option key={y} value={y.toString()}>{y}</option>
        ))}
      </select>
      {(day || month || year) && (
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
          title="Clear date"
        >
          Clear
        </button>
      )}
    </div>
  )
}

