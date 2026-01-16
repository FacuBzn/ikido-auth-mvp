"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  icon?: ReactNode
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  className,
  icon,
  size = "md",
  fullWidth,
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm min-h-[40px]",
    md: "px-6 py-3 text-base min-h-[48px]",
    lg: "px-8 py-4 text-lg min-h-[56px]",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "ik-btn-primary flex items-center justify-center gap-2",
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  loading,
  className,
  icon,
  size = "md",
  fullWidth,
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm min-h-[40px]",
    md: "px-6 py-3 text-base min-h-[48px]",
    lg: "px-8 py-4 text-lg min-h-[56px]",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "ik-btn-secondary flex items-center justify-center gap-2",
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  )
}

export function CyanButton({
  children,
  onClick,
  disabled,
  loading,
  className,
  icon,
  size = "md",
  fullWidth,
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm min-h-[40px]",
    md: "px-6 py-3 text-base min-h-[48px]",
    lg: "px-8 py-4 text-lg min-h-[56px]",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "ik-btn-cyan flex items-center justify-center gap-2",
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  )
}
