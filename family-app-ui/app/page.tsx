"use client"

import { useState } from "react"
import { LoginScreen } from "@/components/screens/login-screen"
import { ParentDashboard } from "@/components/screens/parent-dashboard"
import { ParentCreateTasks } from "@/components/screens/parent-create-tasks"
import { ParentManageRewards } from "@/components/screens/parent-manage-rewards"
import { ParentHistory } from "@/components/screens/parent-history"
import { ChildDashboard } from "@/components/screens/child-dashboard"
import { ChildRewards } from "@/components/screens/child-rewards"
import { ChildHistory } from "@/components/screens/child-history"
import { RewardsScreen } from "@/components/screens/rewards-screen"
import { SuccessScreen } from "@/components/screens/success-screen"
import { ChildInfoPage } from "@/components/screens/child-info-page"
import { RoleSelection } from "@/components/screens/role-selection"
import { ParentLogin } from "@/components/screens/parent-login"
import { ChildLogin } from "@/components/screens/child-login"

type Screen =
  | "login"
  | "role-selection"
  | "parent-login"
  | "child-login"
  | "parent-dashboard"
  | "parent-manage-children"
  | "parent-manage-tasks"
  | "parent-manage-rewards"
  | "parent-history"
  | "child-info"
  | "child-dashboard"
  | "child-rewards"
  | "child-history"
  | "rewards"
  | "success"

interface Child {
  id: string
  name: string
  points: number
  parentId: string
  joinCode: string
  redeemedRewards: Array<{ id: string; name: string; redeemedDate: string }>
}

interface Reward {
  id: string
  name: string
  cost: number
  icon: string
}

interface Task {
  id: string
  name: string
  points: number
  completed: boolean
}

interface Activity {
  id: string
  childName: string
  type: "task" | "reward"
  description: string
  points: number
  date: string
}

interface JoinCode {
  code: string
  parentId: string
  createdAt: string
  used: boolean
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("role-selection")
  const [authRole, setAuthRole] = useState<"parent" | "child" | null>(null)
  const [parentId, setParentId] = useState<string | null>(null)
  const [parentEmail, setParentEmail] = useState<string>("")
  const [childId, setChildId] = useState<string | null>(null)

  const [userName, setUserName] = useState("")
  const [joinCodes, setJoinCodes] = useState<JoinCode[]>([])

  const [children, setChildren] = useState<Child[]>([
    { id: "1", name: "Gerónimo", points: 285, parentId: "parent_1", joinCode: "ABC123", redeemedRewards: [] },
  ])
  const [rewards, setRewards] = useState<Reward[]>([
    { id: "1", name: "Movie", cost: 300, icon: "🎬" },
    { id: "2", name: "Game", cost: 250, icon: "🎮" },
    { id: "3", name: "Toy", cost: 190, icon: "🧸" },
    { id: "4", name: "Gift", cost: 400, icon: "🎁" },
  ])
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", name: "Make Bed", points: 10, completed: false },
    { id: "2", name: "Take Out Garbage", points: 15, completed: false },
    { id: "3", name: "Load Dishwasher", points: 15, completed: false },
    { id: "4", name: "Read a Book", points: 10, completed: false },
  ])
  const [childGGPoints, setChildGGPoints] = useState(285)
  const [activities, setActivities] = useState<Activity[]>([])
  const [childHistory, setChildHistory] = useState<Activity[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)

  const handleRoleSelect = (role: "parent" | "child") => {
    setAuthRole(role)
    if (role === "parent") {
      setCurrentScreen("parent-login")
    } else {
      setCurrentScreen("child-login")
    }
  }

  const handleParentLoginSuccess = (pId: string, name: string, email: string) => {
    setParentId(pId)
    setUserName(name)
    setParentEmail(email)
    setCurrentScreen("parent-dashboard")
  }

  const handleChildLoginSuccess = (cId: string, childName: string, joinCode: string) => {
    setChildId(cId)
    setUserName(childName)

    // Find parent by join code
    const parentFromCode = joinCodes.find(jc => jc.code === joinCode)
    if (parentFromCode) {
      setParentId(parentFromCode.parentId)
    }

    setCurrentScreen("child-dashboard")
  }

  const generateJoinCode = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    if (parentId) {
      setJoinCodes([...joinCodes, { code, parentId, createdAt: new Date().toISOString(), used: false }])
    }

    return code
  }

  const handleLogout = () => {
    setCurrentScreen("role-selection")
    setAuthRole(null)
    setParentId(null)
    setChildId(null)
    setUserName("")
    setParentEmail("")
    setSelectedChildId(null)
  }

  const handleNavigate = (screen: Screen, childId?: string) => {
    if (childId) {
      setSelectedChildId(childId)
    }
    setCurrentScreen(screen)
  }

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t)))
      setChildGGPoints(childGGPoints + task.points)
      setChildHistory([
        ...childHistory,
        {
          id: Date.now().toString(),
          childName: userName,
          type: "task",
          description: task.name,
          points: task.points,
          date: new Date().toLocaleDateString(),
        },
      ])
    }
  }

  const handleRewardRedeemed = (rewardId: string, points: number) => {
    const reward = rewards.find((r) => r.id === rewardId)
    if (reward) {
      setChildGGPoints(childGGPoints - points)
      const selectedChild = children.find((c) => c.id === selectedChildId || c.name === userName)
      if (selectedChild) {
        setChildren(
          children.map((c) =>
            c.id === selectedChild.id
              ? {
                  ...c,
                  points: c.points - points,
                  redeemedRewards: [
                    ...c.redeemedRewards,
                    {
                      id: rewardId,
                      name: reward.name,
                      redeemedDate: new Date().toLocaleDateString(),
                    },
                  ],
                }
              : c
          )
        )
      }
      setChildHistory([
        ...childHistory,
        {
          id: Date.now().toString(),
          childName: userName,
          type: "reward",
          description: reward.name,
          points: points,
          date: new Date().toLocaleDateString(),
        },
      ])
      setCurrentScreen("success")
    }
  }

  const handleTaskCreated = (task: { name: string; points: number; description: string }) => {
    setTasks([
      ...tasks,
      {
        id: Date.now().toString(),
        name: task.name,
        points: task.points,
        completed: false,
      },
    ])
    setCurrentScreen("parent-dashboard")
  }

  const handleAddReward = (reward: Omit<Reward, "id">) => {
    setRewards([...rewards, { ...reward, id: Date.now().toString() }])
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] flex items-center justify-center p-4">
      {currentScreen === "role-selection" && (
        <RoleSelection onSelectRole={handleRoleSelect} />
      )}
      {currentScreen === "parent-login" && (
        <ParentLogin
          onLoginSuccess={handleParentLoginSuccess}
          onBackClick={() => {
            setCurrentScreen("role-selection")
            setAuthRole(null)
          }}
        />
      )}
      {currentScreen === "child-login" && (
        <ChildLogin
          onLoginSuccess={handleChildLoginSuccess}
          onBackClick={() => {
            setCurrentScreen("role-selection")
            setAuthRole(null)
          }}
        />
      )}

      {/* Parent Screens */}
      {currentScreen === "parent-dashboard" && authRole === "parent" && (
        <ParentDashboard
          parentName={userName}
          children={children}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onGenerateCode={generateJoinCode}
        />
      )}
      {currentScreen === "parent-manage-tasks" && authRole === "parent" && (
        <ParentCreateTasks onBack={() => setCurrentScreen("parent-dashboard")} onTaskCreated={handleTaskCreated} />
      )}
      {currentScreen === "parent-manage-rewards" && authRole === "parent" && (
        <ParentManageRewards
          onBack={() => setCurrentScreen("parent-dashboard")}
          rewards={rewards}
          onAddReward={handleAddReward}
        />
      )}
      {currentScreen === "parent-history" && authRole === "parent" && (
        <ParentHistory onBack={() => setCurrentScreen("parent-dashboard")} activities={activities} />
      )}
      {currentScreen === "child-info" && authRole === "parent" && selectedChildId && (
        <ChildInfoPage
          child={children.find((c) => c.id === selectedChildId)!}
          onBack={() => setCurrentScreen("parent-dashboard")}
        />
      )}

      {/* Child Screens */}
      {currentScreen === "child-dashboard" && authRole === "child" && (
        <ChildDashboard
          childName={userName}
          ggPoints={childGGPoints}
          tasks={tasks}
          onNavigate={handleNavigate}
          onCompleteTask={handleCompleteTask}
          onLogout={handleLogout}
        />
      )}
      {currentScreen === "child-rewards" && authRole === "child" && (
        <ChildRewards
          childName={userName}
          ggPoints={childGGPoints}
          rewards={rewards}
          onBack={() => setCurrentScreen("child-dashboard")}
          onRewardRedeemed={handleRewardRedeemed}
        />
      )}
      {currentScreen === "child-history" && authRole === "child" && (
        <ChildHistory childName={userName} onBack={() => setCurrentScreen("child-dashboard")} history={childHistory} />
      )}

      {currentScreen === "rewards" && (
        <RewardsScreen
          onBack={() => setCurrentScreen("child-dashboard")}
          onRewardRedeemed={(points) => {
            setChildGGPoints(childGGPoints - points)
            setCurrentScreen("success")
          }}
        />
      )}
      {currentScreen === "success" && <SuccessScreen onDone={() => setCurrentScreen("child-dashboard")} />}
    </div>
  )
}
