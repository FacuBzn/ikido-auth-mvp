"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface ChipToggleProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ChipToggle({ options, value, onChange, className }: ChipToggleProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-bold transition-all border-2",
            value === option
              ? "bg-[var(--ik-accent-yellow)] border-[var(--ik-accent-yellow-dark)] text-[var(--ik-text-dark)]"
              : "bg-[var(--ik-surface-1)] border-[var(--ik-outline-light)] text-white hover:bg-[var(--ik-surface-2)]",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

interface FilterChipsRowProps {
  filters: { id: string; label: string; icon?: React.ReactNode }[]
  activeFilter: string
  onFilterChange: (id: string) => void
  className?: string
}

export function FilterChipsRow({ filters, activeFilter, onFilterChange, className }: FilterChipsRowProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2",
            activeFilter === filter.id
              ? "bg-[var(--ik-accent-yellow)] border-[var(--ik-accent-yellow-dark)] text-[var(--ik-text-dark)]"
              : "bg-[var(--ik-surface-1)] border-[var(--ik-outline-light)] text-white hover:bg-[var(--ik-surface-2)]",
          )}
        >
          {filter.icon}
          {filter.label}
        </button>
      ))}
    </div>
  )
}
