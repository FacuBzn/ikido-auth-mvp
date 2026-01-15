"use client"

import { cn } from "@/lib/utils"

interface AvatarProps {
  name: string
  size?: "sm" | "md" | "lg"
  variant?: "girl" | "boy"
  className?: string
}

export function Avatar({ name, size = "md", variant = "girl", className }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-lg",
    md: "w-12 h-12 text-2xl",
    lg: "w-16 h-16 text-3xl",
  }

  const emoji = variant === "girl" ? "👧" : "👦"

  return (
    <div
      className={cn(
        "rounded-full bg-[var(--ik-accent-yellow)] border-3 border-[var(--ik-accent-yellow-dark)] flex items-center justify-center",
        sizeClasses[size],
        className,
      )}
    >
      {emoji}
    </div>
  )
}
