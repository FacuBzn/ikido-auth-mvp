"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"

interface TaskCardProps {
  title: string
  points: number
  completed: boolean
  onComplete: () => void
}

export function TaskCard({ title, points, completed, onComplete }: TaskCardProps) {
  return (
    <Card
      className={`backdrop-blur border-0 p-4 transition ${
        completed ? "bg-green-400/20 border-green-400/30" : "bg-white/10 border-white/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              completed ? "bg-green-400 border-green-400" : "border-white/50"
            }`}
          >
            {completed && <Check className="w-4 h-4 text-white" />}
          </div>
          <span className={`font-semibold ${completed ? "text-white/70 line-through" : "text-white"}`}>{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-yellow-300 font-bold">+{points}</span>
          {!completed && (
            <Button
              onClick={onComplete}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm font-semibold"
            >
              Complete
            </Button>
          )}
          {completed && <span className="text-green-300 text-sm font-semibold">Done</span>}
        </div>
      </div>
    </Card>
  )
}
