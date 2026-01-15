"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface StatCardProps {
  icon?: ReactNode
  value: string | number
  label: string
  className?: string
}

export function StatCard({ icon, value, label, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] rounded-[var(--ik-radius-card)] p-4 flex flex-col items-center justify-center text-center",
        className,
      )}
    >
      {icon && <div className="text-[var(--ik-accent-yellow)] text-2xl mb-1">{icon}</div>}
      <div className="text-[var(--ik-accent-yellow)] text-2xl font-black">{value}</div>
      <div className="text-[var(--ik-text-muted)] text-xs font-semibold">{label}</div>
    </div>
  )
}
