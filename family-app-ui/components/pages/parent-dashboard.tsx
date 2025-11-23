"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DashboardCard } from "@/components/dashboard-card"
import { LogOut } from "lucide-react"

interface ParentDashboardProps {
  parentName: string
  onNavigate: (page: string) => void
}

export function ParentDashboard({ parentName, onNavigate }: ParentDashboardProps) {
  const totalPoints = 1250

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Hello, {parentName}</h1>
            <p className="text-yellow-300 text-lg font-semibold">Total GGPoints: {totalPoints}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="bg-white/20 text-white hover:bg-white/30">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Welcome Card */}
        <Card className="bg-white/10 backdrop-blur border-white/20 text-white p-6">
          <p className="text-base leading-relaxed">
            Welcome back! You have {3} active children and {5} pending tasks. Keep track of your family's progress and
            rewards.
          </p>
        </Card>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardCard
            icon="👦"
            title="Children"
            description="Manage your children"
            color="from-blue-500 to-blue-600"
            onClick={() => {}}
          />
          <DashboardCard
            icon="📋"
            title="Tasks"
            description="Create & assign tasks"
            color="from-purple-500 to-purple-600"
            onClick={() => onNavigate("task-creation")}
          />
          <DashboardCard
            icon="🏆"
            title="Rewards"
            description="View & manage rewards"
            color="from-yellow-400 to-yellow-500"
            onClick={() => onNavigate("rewards")}
          />
          <DashboardCard
            icon="📜"
            title="History"
            description="View activity history"
            color="from-green-500 to-green-600"
            onClick={() => onNavigate("history")}
          />
        </div>

        {/* Quick Stats */}
        <Card className="bg-white/10 backdrop-blur border-white/20 text-white p-6">
          <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-300">3</div>
              <p className="text-sm text-white/70">Active Children</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">12</div>
              <p className="text-sm text-white/70">Tasks Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">8</div>
              <p className="text-sm text-white/70">Rewards Redeemed</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
