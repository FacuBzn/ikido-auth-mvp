"use client"

import type { ReactNode } from "react"

interface MobileScreenShellProps {
  children: ReactNode
}

export function MobileScreenShell({ children }: MobileScreenShellProps) {
  return (
    <div className="min-h-screen ik-bg-gradient ik-stars flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] min-h-[700px] relative z-10">{children}</div>
    </div>
  )
}
