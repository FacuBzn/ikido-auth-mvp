"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PanelCardProps {
  children: ReactNode
  className?: string
  variant?: "default" | "light" | "highlight"
}

export function PanelCard({ children, className, variant = "default" }: PanelCardProps) {
  const variantClasses = {
    default: "ik-panel",
    light:
      "bg-[#5a8ac9] border-[3px] border-[var(--ik-outline-light)] rounded-[var(--ik-radius-panel)] shadow-[var(--ik-shadow-panel)]",
    highlight:
      "bg-gradient-to-br from-[var(--ik-surface-light)] to-[var(--ik-surface-2)] border-[3px] border-[var(--ik-accent-yellow)] rounded-[var(--ik-radius-panel)] shadow-[var(--ik-shadow-panel)]",
  }

  return <div className={cn(variantClasses[variant], "p-4", className)}>{children}</div>
}
