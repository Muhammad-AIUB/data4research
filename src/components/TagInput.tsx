'use client'

import { useState } from "react"

interface Props {
  tags: string[]
  setTags: (tags: string[]) => void
}

export default function TagInput({ tags, setTags }: Props) {
  const [input, setInput] = useState("")

  const addTag = (tagText: string) => {
    const trimmed = tagText.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault()
      // Support comma-separated tags
      const tagsToAdd = input.split(',').map(t => t.trim()).filter(t => t)
      tagsToAdd.forEach(tag => addTag(tag))
      setInput("")
    }
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, idx) => idx !== index))
  }

  return (
    <div className="flex flex-wrap gap-2 border rounded-md p-2 min-h-10">
      {tags.map((tag, i) => (
        <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1 text-sm">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="hover:text-blue-600 font-bold"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add tag & press Enter (comma-separated for multiple)"
        className="flex-1 outline-none min-w-48 border-0"
      />
    </div>
  )
}

