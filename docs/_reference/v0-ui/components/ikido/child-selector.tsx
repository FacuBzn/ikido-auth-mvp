"use client"

import { cn } from "@/lib/utils"
import { Avatar } from "./avatar"
import { PointsPill } from "./top-bar"

interface Child {
  id: string
  name: string
  points: number
  variant: "girl" | "boy"
}

interface ChildSelectorProps {
  children: Child[]
  selectedId: string
  onSelect: (id: string) => void
  className?: string
}

export function ChildSelector({ children, selectedId, onSelect, className }: ChildSelectorProps) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {children.map((child) => (
        <button
          key={child.id}
          onClick={() => onSelect(child.id)}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-[var(--ik-radius-card)] transition-all",
            selectedId === child.id
              ? "bg-[var(--ik-surface-2)] border-2 border-[var(--ik-accent-yellow)]"
              : "border-2 border-transparent hover:bg-[var(--ik-surface-1)]",
          )}
        >
          <Avatar name={child.name} variant={child.variant} />
          <span className="font-bold text-white text-sm">{child.name}</span>
          {selectedId === child.id && <PointsPill points={child.points} size="small" />}
        </button>
      ))}
    </div>
  )
}
