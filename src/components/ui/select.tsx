'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onValueChange'> {
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ onValueChange, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        onChange={(e) => {
          onValueChange?.(e.target.value)
          props.onChange?.(e)
        }}
        {...props}
        className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ''}`}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

export const SelectTrigger = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <Select ref={ref} className={className} {...props}>
        {children}
      </Select>
    )
  }
)
SelectTrigger.displayName = 'SelectTrigger'

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <option value="">{placeholder || 'Select...'}</option>
}

export const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => {
  return <option value={value}>{children}</option>
}

