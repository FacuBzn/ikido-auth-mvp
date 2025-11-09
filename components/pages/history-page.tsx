"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

interface HistoryPageProps {
  onBack: () => void
}

export function HistoryPage({ onBack }: HistoryPageProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "rewards">("tasks")

  const taskHistory = [
    { id: 1, title: "Make Bed", points: 10, date: "Today", status: "completed" },
    { id: 2, title: "Take Out Garbage", points: 15, date: "Yesterday", status: "completed" },
    { id: 3, title: "Load Dishwasher", points: 15, date: "2 days ago", status: "completed" },
    { id: 4, title: "Read a Book", points: 10, date: "3 days ago", status: "completed" },
  ]

  const rewardHistory = [
    { id: 1, name: "Movie Ticket", cost: 300, date: "Today", status: "redeemed" },
    { id: 2, name: "Ice Cream", cost: 100, date: "2 days ago", status: "redeemed" },
    { id: 3, name: "Video Game", cost: 250, date: "5 days ago", status: "redeemed" },
  ]

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <button onClick={onBack} className="flex items-center text-white/70 hover:text-white transition font-semibold">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <h1 className="text-4xl font-bold text-white">📜 Activity History</h1>

        {/* Tabs */}
        <div className="flex gap-2 bg-white/10 backdrop-blur rounded-lg p-1 border border-white/20">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 py-3 px-4 rounded-md font-semibold transition ${
              activeTab === "tasks" ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            ✓ Tasks
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex-1 py-3 px-4 rounded-md font-semibold transition ${
              activeTab === "rewards" ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            🎁 Rewards
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {activeTab === "tasks" &&
            taskHistory.map((item) => (
              <Card key={item.id} className="bg-white/10 backdrop-blur border-white/20 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✓</span>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-white/70">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-300">+{item.points}</p>
                    <p className="text-xs text-green-300">{item.status}</p>
                  </div>
                </div>
              </Card>
            ))}

          {activeTab === "rewards" &&
            rewardHistory.map((item) => (
              <Card key={item.id} className="bg-white/10 backdrop-blur border-white/20 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-white/70">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-300">−{item.cost}</p>
                    <p className="text-xs text-blue-300">{item.status}</p>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}
