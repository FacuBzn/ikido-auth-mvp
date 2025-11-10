'use client';

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"

interface DashboardCardProps {
  icon: string
  title: string
  description: string
  color: string
  onClick?: () => void
  href?: string
}

export function DashboardCard({ icon, title, description, color, onClick, href }: DashboardCardProps) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    if (href) {
      router.push(href)
      return
    }

    onClick?.()
  }, [href, onClick, router])

  const cardContent = (
    <Card className={`bg-gradient-to-br ${color} border-0 text-white p-6 shadow-lg hover:shadow-xl transition`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-white/80 text-sm">{description}</p>
    </Card>
  )

  return (
    <button onClick={handleClick} className="text-left transition transform hover:scale-105">
      {cardContent}
    </button>
  )
}
