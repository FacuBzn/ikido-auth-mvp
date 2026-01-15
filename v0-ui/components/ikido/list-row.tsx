"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { Check, Clock } from "lucide-react"

interface ListRowProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  points?: number
  pointsType?: "earned" | "spent" | "available"
  status?: "completed" | "pending" | "redeemed" | "remind"
  onAction?: () => void
  actionLabel?: string
  className?: string
}

export function ListRow({
  icon,
  title,
  subtitle,
  points,
  pointsType = "available",
  status,
  onAction,
  actionLabel,
  className,
}: ListRowProps) {
  const pointsColor = {
    earned: "text-[var(--ik-success)]",
    spent: "text-[var(--ik-danger)]",
    available: "text-[var(--ik-accent-yellow)]",
  }

  const statusConfig = {
    completed: { label: "Completed", color: "text-[var(--ik-success)]", icon: <Check className="w-4 h-4" /> },
    pending: { label: "Pending", color: "text-[var(--ik-warning)]", icon: <Clock className="w-4 h-4" /> },
    redeemed: { label: "Redeemed", color: "text-[var(--ik-accent-cyan)]", icon: null },
    remind: { label: "Remind", color: "text-[var(--ik-warning)]", icon: null },
  }

  return (
    <div
      className={cn(
        "bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] rounded-[var(--ik-radius-card)] p-3 flex items-center gap-3",
        className,
      )}
    >
      {icon && (
        <div className="w-10 h-10 rounded-full bg-[var(--ik-surface-2)] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="font-bold text-white text-sm truncate">{title}</div>
        {subtitle && <div className="text-[var(--ik-text-muted)] text-xs">{subtitle}</div>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {points !== undefined && (
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-bold bg-[var(--ik-surface-2)] border border-[var(--ik-outline-light)]",
              pointsColor[pointsType],
            )}
          >
            {pointsType === "earned" && "+"}
            {pointsType === "spent" && "-"}
            {points} GG
          </span>
        )}

        {status && statusConfig[status] && (
          <span className={cn("text-xs font-bold flex items-center gap-1", statusConfig[status].color)}>
            {statusConfig[status].icon}
            {statusConfig[status].label}
          </span>
        )}

        {onAction && actionLabel && (
          <button onClick={onAction} className="ik-btn-primary px-3 py-1.5 text-xs flex items-center gap-1">
            <Check className="w-3 h-3" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
