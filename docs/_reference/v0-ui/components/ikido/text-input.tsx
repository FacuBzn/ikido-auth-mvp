"use client"

import { cn } from "@/lib/utils"

interface TextInputProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  type?: "text" | "email" | "password"
  helper?: string
  className?: string
  error?: string
}

export function TextInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  helper,
  className,
  error,
}: TextInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-white font-bold text-sm">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="ik-input w-full px-4 py-3 text-base"
      />
      {helper && !error && <p className="text-[var(--ik-text-muted)] text-xs">{helper}</p>}
      {error && <p className="text-[var(--ik-danger)] text-xs">{error}</p>}
    </div>
  )
}
