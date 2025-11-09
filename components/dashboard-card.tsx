"use client"

import { Card } from "@/components/ui/card"

interface DashboardCardProps {
  icon: string
  title: string
  description: string
  color: string
  onClick: () => void
}

export function DashboardCard({ icon, title, description, color, onClick }: DashboardCardProps) {
  return (
    <button onClick={onClick} className="text-left transition transform hover:scale-105">
      <Card className={`bg-gradient-to-br ${color} border-0 text-white p-6 shadow-lg hover:shadow-xl transition`}>
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-xl font-bold mb-1">{title}</h3>
        <p className="text-white/80 text-sm">{description}</p>
      </Card>
    </button>
  )
}
