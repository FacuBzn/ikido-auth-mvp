"use client"

import type React from "react"

import { ArrowLeft, Settings, LogOut } from "lucide-react"

interface TopBarProps {
  showBack?: boolean
  onBack?: () => void
  showSettings?: boolean
  onSettings?: () => void
  showLogout?: boolean
  onLogout?: () => void
  coins?: number
  rightContent?: React.ReactNode
}

export function TopBar({
  showBack,
  onBack,
  showSettings,
  onSettings,
  showLogout,
  onLogout,
  coins,
  rightContent,
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={onBack} className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>BACK</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <IkidoLogo />
      </div>

      <div className="flex items-center gap-2">
        {coins !== undefined && <PointsPill points={coins} />}
        {rightContent}
        {showSettings && (
          <button
            onClick={onSettings}
            className="w-10 h-10 rounded-full bg-[var(--ik-surface-2)] border-2 border-[var(--ik-outline-light)] flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
        {showLogout && (
          <button onClick={onLogout} className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <LogOut className="w-4 h-4" />
            <span>LOGOUT</span>
          </button>
        )}
      </div>
    </div>
  )
}

export function IkidoLogo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "text-xl px-3 py-1",
    default: "text-2xl px-4 py-2",
    large: "text-3xl px-6 py-3",
  }

  return (
    <div className={`ik-btn-cyan ${sizeClasses[size]} flex items-center gap-2`}>
      <span className="text-[var(--ik-accent-yellow)]">✦</span>
      <span className="font-black tracking-wide">iKidO</span>
    </div>
  )
}

export function PointsPill({ points, size = "default" }: { points: number; size?: "small" | "default" }) {
  const sizeClasses = {
    small: "text-xs px-2 py-1",
    default: "text-sm px-3 py-1.5",
  }

  return (
    <div className={`ik-btn-primary ${sizeClasses[size]} flex items-center gap-1.5`}>
      <span className="text-[var(--ik-accent-yellow-dark)]">🪙</span>
      <span>{points} GG</span>
    </div>
  )
}
