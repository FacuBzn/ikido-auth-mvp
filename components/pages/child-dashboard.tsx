"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TaskCard } from "@/components/task-card"
import { ArrowLeft } from "lucide-react"

interface ChildDashboardProps {
  childName: string
  onNavigate: (page: string) => void
}

export function ChildDashboard({ childName, onNavigate }: ChildDashboardProps) {
  const [totalPoints, setTotalPoints] = useState(285)
  const [tasks, setTasks] = useState([
    { id: 1, title: "Make Bed", points: 10, completed: false },
    { id: 2, title: "Take Out Garbage", points: 15, completed: false },
    { id: 3, title: "Load Dishwasher", points: 15, completed: false },
    { id: 4, title: "Read a Book", points: 10, completed: false },
  ])

  const handleCompleteTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task && !task.completed) {
      setTotalPoints((prev) => prev + task.points)
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t)))
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <button
          onClick={() => window.location.reload()}
          className="flex items-center text-white/70 hover:text-white transition font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Logout
        </button>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">Hello, {childName}</h1>

          {/* Points Display */}
          <Card className="bg-white/95 backdrop-blur border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Your GGPoints</p>
                <p className="text-4xl font-bold text-[#FFD369]">{totalPoints}</p>
              </div>
              <div className="text-5xl">🎯</div>
            </div>
          </Card>
        </div>

        {/* Tasks Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Today{"'"}s Tasks</h2>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                points={task.points}
                completed={task.completed}
                onComplete={() => handleCompleteTask(task.id)}
              />
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={() => onNavigate("rewards")}
            className="bg-yellow-400 text-[#0F4C7D] font-bold py-3 hover:bg-yellow-300 transition"
          >
            🏆 View Rewards
          </Button>
          <Button
            onClick={() => onNavigate("history")}
            className="bg-white/20 text-white font-bold py-3 hover:bg-white/30 transition"
          >
            📜 View History
          </Button>
        </div>
      </div>
    </div>
  )
}
