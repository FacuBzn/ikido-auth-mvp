"use client"

import { useState } from "react"
import { MobileScreenShell } from "@/components/ikido/mobile-screen-shell"
import { TopBar, IkidoLogo, PointsPill } from "@/components/ikido/top-bar"
import { PanelCard } from "@/components/ikido/panel-card"
import { PrimaryButton, SecondaryButton, CyanButton } from "@/components/ikido/buttons"
import { TextInput } from "@/components/ikido/text-input"
import { FilterChipsRow } from "@/components/ikido/chip-toggle"
import { StatCard } from "@/components/ikido/stat-card"
import { ListRow } from "@/components/ikido/list-row"
import { RewardCard } from "@/components/ikido/reward-card"
import { Avatar } from "@/components/ikido/avatar"
import { ChildSelector } from "@/components/ikido/child-selector"
import {
  Users,
  Baby,
  Rocket,
  Copy,
  Plus,
  Bed,
  Trash2,
  UtensilsCrossed,
  BookOpen,
  PenTool,
  Check,
  Clock,
  Calendar,
  Filter,
  Download,
  User,
  Flame,
  Gift,
  RefreshCw,
  X,
  ChevronDown,
  Tv,
  Film,
  IceCreamCone,
  Pencil,
  Gamepad2,
  Star,
} from "lucide-react"

type Screen =
  | "welcome"
  | "parent-login"
  | "child-login"
  | "parent-dashboard"
  | "assign-tasks"
  | "child-dashboard"
  | "rewards"
  | "activity-history"
  | "child-insights"
  | "approvals"
  | "rewards-management"

// Mock Data
const mockChildren = [
  { id: "1", name: "Maria", code: "MARIA#6890", points: 112, variant: "girl" as const, joinedDate: "12/12/2025" },
  { id: "2", name: "Ramiro", code: "RAMIRO#2616", points: 285, variant: "boy" as const, joinedDate: "12/12/2025" },
]

const mockTasks = [
  { id: "1", title: "Make Bed", icon: <Bed className="w-5 h-5 text-white" />, points: 10 },
  { id: "2", title: "Take Out Garbage", icon: <Trash2 className="w-5 h-5 text-white" />, points: 15 },
  { id: "3", title: "Load Dishwasher", icon: <UtensilsCrossed className="w-5 h-5 text-white" />, points: 15 },
  { id: "4", title: "Read a Book", icon: <BookOpen className="w-5 h-5 text-white" />, points: 10 },
  { id: "5", title: "Write Short Story", icon: <PenTool className="w-5 h-5 text-white" />, points: 20 },
]

const mockChildTasks = [
  { id: "1", title: "clean testing 01", description: "01", points: 27, status: "completed" as const },
  {
    id: "2",
    title: "limpiar la cocina",
    description: "asdasda limpiar cocina - 01",
    points: 20,
    status: "completed" as const,
  },
  {
    id: "3",
    title: "Brush your teeth",
    description: "Brush la youth in the morning and before going to sleep.",
    points: 5,
    status: "pending" as const,
  },
]

const mockRewards = [
  { id: "1", icon: "🎟️", title: "Movie", cost: 300 },
  { id: "2", icon: "🎮", title: "Game", cost: 250 },
  { id: "3", icon: "🤖", title: "Toy", cost: 190 },
  { id: "4", icon: "🎁", title: "Gift", cost: 400 },
]

const mockActivities = [
  {
    id: "1",
    title: "Clean testing 01",
    subtitle: "Today • 10:15",
    points: 27,
    type: "earned" as const,
    status: "completed" as const,
  },
  {
    id: "2",
    title: "Limpiar la cocina",
    subtitle: "Yesterday • 19:40",
    points: 20,
    type: "earned" as const,
    status: "completed" as const,
  },
  {
    id: "3",
    title: "Limpiar la cocina",
    subtitle: "Yesterday • 18:05",
    points: 65,
    type: "earned" as const,
    status: "completed" as const,
  },
  {
    id: "4",
    title: "Brush your teeth",
    subtitle: "Today, due by 21:00",
    points: 5,
    type: "earned" as const,
    status: "remind" as const,
  },
  {
    id: "5",
    title: "Reward Redeemed: Movie",
    subtitle: "Last Week • 20:10",
    points: 300,
    type: "spent" as const,
    status: "redeemed" as const,
  },
]

const mockPendingApprovals = [
  {
    id: "1",
    title: "Do homework",
    description: "Finished before dinner.",
    completedAt: "Today 18:40",
    points: 15,
    status: "approved" as const,
  },
  {
    id: "2",
    title: "Clean bedroom",
    description: "Everything is tidy now",
    completedAt: "Today 18:40",
    points: 20,
    status: "waiting" as const,
  },
  {
    id: "3",
    title: "Take out trash",
    description: "Done before the truck came.",
    completedAt: "Today 18:40",
    points: 10,
    status: "waiting" as const,
  },
]

const mockParentRewards = [
  { id: "1", name: "Extra Screen Time", icon: "tv", cost: 50, status: "active" as const, assignedTo: "Maria" },
  { id: "2", name: "Movie Night", icon: "film", cost: 300, status: "active" as const, assignedTo: "Maria" },
  { id: "3", name: "Ice Cream Treat", icon: "icecream", cost: 100, status: "active" as const, assignedTo: "Maria" },
  { id: "4", name: "200 GG Bonus", icon: "star", cost: 200, status: "active" as const, assignedTo: "Maria" },
  { id: "5", name: "New Toy", icon: "gift", cost: 500, status: "active" as const, assignedTo: "Maria" },
  { id: "6", name: "New Toy", icon: "gift", cost: 400, status: "paused" as const, assignedTo: "Maria" },
  { id: "7", name: "Game Night", icon: "gamepad", cost: 250, status: "active" as const, assignedTo: "Maria" },
]

const mockRewardClaims = [
  {
    id: "1",
    rewardName: "Movie Night",
    childName: "Maria",
    claimedAt: "Today 15:30",
    cost: 300,
    status: "pending" as const,
  },
  {
    id: "2",
    rewardName: "Ice Cream",
    childName: "Ramiro",
    claimedAt: "Yesterday 18:00",
    cost: 100,
    status: "approved" as const,
  },
]

const mockRewardHistory = [
  { id: "1", rewardName: "Extra Screen Time", childName: "Maria", redeemedAt: "Jan 10, 2025", cost: 50 },
  { id: "2", rewardName: "Movie Night", childName: "Ramiro", redeemedAt: "Jan 8, 2025", cost: 300 },
  { id: "3", rewardName: "New Toy", childName: "Maria", redeemedAt: "Jan 5, 2025", cost: 500 },
]

export default function IKidOApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome")
  const [selectedChildId, setSelectedChildId] = useState("1")
  const [email, setEmail] = useState("test001@test.com")
  const [password, setPassword] = useState("")
  const [childCode, setChildCode] = useState("")
  const [selectedReward, setSelectedReward] = useState<string | null>(null)
  const [activityFilter, setActivityFilter] = useState("All")

  const selectedChild = mockChildren.find((c) => c.id === selectedChildId) || mockChildren[0]
  const familyCode = "RZHNEV"

  const renderScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return <WelcomeScreen onNavigate={setCurrentScreen} />
      case "parent-login":
        return (
          <ParentLoginScreen
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onNavigate={setCurrentScreen}
          />
        )
      case "child-login":
        return <ChildLoginScreen code={childCode} setCode={setChildCode} onNavigate={setCurrentScreen} />
      case "parent-dashboard":
        return <ParentDashboardScreen familyCode={familyCode} children={mockChildren} onNavigate={setCurrentScreen} />
      case "assign-tasks":
        return <AssignTasksScreen child={selectedChild} tasks={mockTasks} onNavigate={setCurrentScreen} />
      case "child-dashboard":
        return <ChildDashboardScreen child={selectedChild} tasks={mockChildTasks} onNavigate={setCurrentScreen} />
      case "rewards":
        return (
          <RewardsScreen
            userPoints={112}
            rewards={mockRewards}
            selectedReward={selectedReward}
            setSelectedReward={setSelectedReward}
            onNavigate={setCurrentScreen}
          />
        )
      case "activity-history":
        return (
          <ActivityHistoryScreen
            children={mockChildren}
            selectedChildId={selectedChildId}
            setSelectedChildId={setSelectedChildId}
            activities={mockActivities}
            filter={activityFilter}
            setFilter={setActivityFilter}
            onNavigate={setCurrentScreen}
          />
        )
      case "child-insights":
        return (
          <ChildInsightsScreen
            children={mockChildren}
            selectedChildId={selectedChildId}
            setSelectedChildId={setSelectedChildId}
            activities={mockActivities}
            filter={activityFilter}
            setFilter={setActivityFilter}
            onNavigate={setCurrentScreen}
          />
        )
      case "approvals":
        return (
          <ApprovalsScreen
            children={mockChildren}
            selectedChildId={selectedChildId}
            setSelectedChildId={setSelectedChildId}
            pendingTasks={mockPendingApprovals}
            onNavigate={setCurrentScreen}
          />
        )
      case "rewards-management":
        return (
          <RewardsManagementScreen
            children={mockChildren}
            selectedChildId={selectedChildId}
            setSelectedChildId={setSelectedChildId}
            rewards={mockParentRewards}
            claims={mockRewardClaims}
            history={mockRewardHistory}
            onNavigate={setCurrentScreen}
          />
        )
      default:
        return <WelcomeScreen onNavigate={setCurrentScreen} />
    }
  }

  return renderScreen()
}

// A) Welcome / Role Selection Screen
function WelcomeScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <MobileScreenShell>
      <div className="flex flex-col items-center justify-center min-h-[700px] text-center px-4">
        <div className="mb-8">
          <IkidoLogo size="large" />
        </div>

        <h1 className="text-4xl font-black text-white mb-2">Welcome to</h1>
        <h2 className="text-5xl font-black text-[var(--ik-accent-yellow)] mb-12">iKidO!</h2>

        <div className="w-full max-w-[300px] space-y-4">
          <PrimaryButton
            fullWidth
            size="lg"
            icon={<Users className="w-6 h-6" />}
            onClick={() => onNavigate("parent-login")}
          >
            {"I'm a Parent"}
          </PrimaryButton>

          <PrimaryButton
            fullWidth
            size="lg"
            icon={<Baby className="w-6 h-6" />}
            onClick={() => onNavigate("child-login")}
          >
            {"I'm a Child"}
          </PrimaryButton>
        </div>

        <p className="text-[var(--ik-text-muted)] mt-6 text-sm">Select your profile to continue</p>

        <div className="absolute bottom-6 left-6">
          <div className="w-10 h-10 rounded-full bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] flex items-center justify-center text-white font-bold">
            N
          </div>
        </div>
      </div>
    </MobileScreenShell>
  )
}

// B) Parent Login Screen
function ParentLoginScreen({
  email,
  setEmail,
  password,
  setPassword,
  onNavigate,
}: {
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  onNavigate: (screen: Screen) => void
}) {
  return (
    <MobileScreenShell>
      <div className="flex flex-col min-h-[700px] px-4 py-6">
        <div className="flex justify-center mb-6">
          <IkidoLogo />
        </div>

        <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)] text-center mb-6">Parent Login</h1>

        <SecondaryButton
          size="sm"
          icon={<span>←</span>}
          onClick={() => onNavigate("welcome")}
          className="self-start mb-6"
        >
          BACK
        </SecondaryButton>

        <div className="space-y-4 mb-6">
          <TextInput
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={setEmail}
          />

          <TextInput label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} />
        </div>

        <PrimaryButton fullWidth icon={<Rocket className="w-5 h-5" />} onClick={() => onNavigate("parent-dashboard")}>
          Login
        </PrimaryButton>

        <div className="text-center mt-6">
          <p className="text-[var(--ik-text-muted)] text-sm mb-2">{"Don't have an account?"}</p>
          <button className="text-[var(--ik-accent-cyan)] font-bold underline">Create one now</button>
        </div>

        <div className="absolute bottom-6 left-6">
          <div className="w-10 h-10 rounded-full bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] flex items-center justify-center text-white font-bold">
            N
          </div>
        </div>
      </div>
    </MobileScreenShell>
  )
}

// C) Child Login Screen
function ChildLoginScreen({
  code,
  setCode,
  onNavigate,
}: {
  code: string
  setCode: (v: string) => void
  onNavigate: (screen: Screen) => void
}) {
  return (
    <MobileScreenShell>
      <div className="flex flex-col min-h-[700px] px-4 py-6">
        <div className="flex justify-center mb-6">
          <IkidoLogo />
        </div>

        <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)] text-center mb-6">Child Login</h1>

        <SecondaryButton
          size="sm"
          icon={<span>←</span>}
          onClick={() => onNavigate("welcome")}
          className="self-start mb-6"
        >
          BACK
        </SecondaryButton>

        <div className="space-y-4 mb-6">
          <TextInput placeholder="Enter your Child Code (e.g., CODE#1234)" value={code} onChange={setCode} />
        </div>

        <PrimaryButton fullWidth icon={<Baby className="w-5 h-5" />} onClick={() => onNavigate("child-dashboard")}>
          Enter Game
        </PrimaryButton>

        <p className="text-[var(--ik-text-muted)] text-sm text-center mt-4">
          Ask your parent for your unique child code
        </p>

        <div className="absolute bottom-6 left-6">
          <div className="w-10 h-10 rounded-full bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] flex items-center justify-center text-white font-bold">
            N
          </div>
        </div>
      </div>
    </MobileScreenShell>
  )
}

// D) Parent Dashboard Screen
function ParentDashboardScreen({
  familyCode,
  children,
  onNavigate,
}: {
  familyCode: string
  children: typeof mockChildren
  onNavigate: (screen: Screen) => void
}) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <MobileScreenShell>
      <div className="flex flex-col min-h-[700px] px-2 py-4">
        <TopBar showBack onBack={() => onNavigate("welcome")} showLogout onLogout={() => onNavigate("welcome")} />

        <div className="text-center mb-4">
          <h1 className="text-xl font-black text-[var(--ik-accent-yellow)]">Welcome, Facundo Bazan</h1>
          <p className="text-[var(--ik-text-muted)] text-sm">Manage chores and rewards together</p>
        </div>

        {/* Family Code Panel */}
        <PanelCard className="mb-4">
          <h2 className="text-lg font-bold text-white mb-2">Assign Tasks</h2>
          <div className="text-3xl font-black text-[var(--ik-accent-yellow)] mb-2">{familyCode}</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[var(--ik-text-muted)] text-sm">
              <Check className="w-4 h-4 text-[var(--ik-success)]" />
              Share this code with your children
            </div>
            <SecondaryButton size="sm" icon={<Copy className="w-4 h-4" />} onClick={() => copyToClipboard(familyCode)}>
              Copy
            </SecondaryButton>
          </div>
        </PanelCard>

        {/* Children List */}
        <PanelCard className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Your Children</h2>
            <SecondaryButton size="sm" icon={<Plus className="w-4 h-4" />}>
              Add Child
            </SecondaryButton>
          </div>

          <div className="space-y-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-3 p-3 bg-[var(--ik-surface-1)] rounded-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)]"
              >
                <Avatar name={child.name} variant={child.variant} />
                <div className="flex-1">
                  <div className="font-bold text-white">{child.name}</div>
                  <div className="text-[var(--ik-text-muted)] text-xs">Joined: {child.joinedDate}</div>
                </div>
                <div className="text-right">
                  <div className="text-[var(--ik-text-muted)] text-xs">Child Code</div>
                  <div className="text-[var(--ik-accent-yellow)] font-bold text-sm">{child.code}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(child.code)}
                  className="text-[var(--ik-accent-cyan)] hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-[var(--ik-text-muted)] text-xs mt-3">
            Share this code + Family Code ({familyCode}) with Maria
          </p>
        </PanelCard>

        <PrimaryButton fullWidth onClick={() => onNavigate("assign-tasks")}>
          Preview for Child
        </PrimaryButton>

        {/* Quick navigation for demo */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <SecondaryButton size="sm" onClick={() => onNavigate("approvals")}>
            Approvals
          </SecondaryButton>
          <SecondaryButton size="sm" onClick={() => onNavigate("rewards-management")}>
            Rewards
          </SecondaryButton>
          <SecondaryButton size="sm" onClick={() => onNavigate("activity-history")}>
            History
          </SecondaryButton>
          <SecondaryButton size="sm" onClick={() => onNavigate("child-insights")}>
            Insights
          </SecondaryButton>
        </div>
      </div>
    </MobileScreenShell>
  )
}

// D2) Assign Tasks Screen
function AssignTasksScreen({
  child,
  tasks,
  onNavigate,
}: {
  child: (typeof mockChildren)[0]
  tasks: typeof mockTasks
  onNavigate: (screen: Screen) => void
}) {
  const [assignedTasks, setAssignedTasks] = useState<string[]>(tasks.map((t) => t.id))

  return (
    <MobileScreenShell>
      <div className="flex flex-col min-h-[700px] px-2 py-4">
        <TopBar showSettings />

        <div className="text-center mb-4">
          <h1 className="text-2xl font-black text-white">Assign Tasks</h1>
          <p className="text-[var(--ik-text-muted)] text-sm">Select a child and assign children</p>
        </div>

        {/* Child Card */}
        <PanelCard className="mb-4">
          <div className="flex items-center gap-4">
            <Avatar name={child.name} variant={child.variant} size="lg" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{child.name}</h2>
              <p className="text-[var(--ik-text-muted)] text-sm">
                Assign tasks to your children and track their progress
              </p>
            </div>
            <div className="text-right">
              <PointsPill points={child.points} />
              <button className="mt-2 text-[var(--ik-accent-cyan)] text-xs font-bold underline">Go to Tasks</button>
            </div>
          </div>
        </PanelCard>

        {/* New Task Button */}
        <SecondaryButton className="mb-4 self-start" icon={<Plus className="w-5 h-5 text-[var(--ik-danger)]" />}>
          New Task
        </SecondaryButton>

        {/* Tasks List */}
        <PanelCard className="mb-4 flex-1">
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-[var(--ik-surface-1)] rounded-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)]"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--ik-surface-2)] flex items-center justify-center">
                  {task.icon}
                </div>
                <span className="flex-1 font-bold text-white">{task.title}</span>
                <span className="bg-[var(--ik-accent-yellow)] text-[var(--ik-text-dark)] text-xs font-bold px-3 py-1 rounded-full">
                  {task.points} P
                </span>
              </div>
            ))}
          </div>
        </PanelCard>

        <PrimaryButton fullWidth onClick={() => onNavigate("parent-dashboard")}>
          Save Assignments
        </PrimaryButton>
      </div>
    </MobileScreenShell>
  )
}

// E) Child Dashboard Screen
function ChildDashboardScreen({
  child,
  tasks,
  onNavigate,
}: {
  child: (typeof mockChildren)[0]
  tasks: typeof mockChildTasks
  onNavigate: (screen: Screen) => void
}) {
  return (
    <MobileScreenShell>
      <div className="flex flex-col min-h-[700px] px-2 py-4">
        <TopBar showLogout onLogout={() => onNavigate("welcome")} />

        {/* Profile Card */}
        <PanelCard className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[var(--ik-text-muted)] text-sm">Hello,</p>
              <h1 className="text-2xl font-black text-white">{child.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[var(--ik-accent-yellow)] text-xs font-bold">🪙 GGPOINTS</span>
              </div>
              <div className="text-4xl font-black text-[var(--ik-accent-yellow)]">{child.points}</div>
            </div>
            <Avatar name={child.name} variant={child.variant} size="lg" />
          </div>
        </PanelCard>

        {/* Tasks Section */}
        <h2 className="text-xl font-black text-white text-center mb-4">Your Tasks</h2>

        <PanelCard className="flex-1">
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-[var(--ik-radius-card)] ${
                  task.status === "completed" ? "bg-[#5a8ac9]" : "bg-[#7ab8e8]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      task.status === "completed" ? "bg-[var(--ik-success)]" : "bg-[var(--ik-surface-1)]"
                    }`}
                  >
                    {task.status === "completed" ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Clock className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[var(--ik-text-dark)]">{task.title}</h3>
                    <p className="text-[var(--ik-text-dark)]/70 text-sm">{task.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[var(--ik-accent-yellow-dark)] font-bold">{task.points} GGPoints</span>
                      {task.status === "completed" ? (
                        <span className="text-[var(--ik-success)] font-bold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Completed
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--ik-warning)] font-bold">• Pending</span>
                          <button className="ik-btn-primary px-3 py-1.5 text-xs flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Complete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>

        {/* Quick navigation for demo */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <SecondaryButton size="sm" onClick={() => onNavigate("rewards")}>
            Rewards
          </SecondaryButton>
        </div>
      </div>
    </MobileScreenShell>
  )
}

// F) Rewards Screen
function RewardsScreen({
  userPoints,
  rewards,
  selectedReward,
  setSelectedReward,
  onNavigate,
}: {
  userPoints: number
  rewards: typeof mockRewards
  selectedReward: string | null
  setSelectedReward: (id: string | null) => void
  onNavigate: (screen: Screen) => void
}) {
  return (
    <MobileScreenShell>
      <div className="flex flex-col min-h-[700px] px-2 py-4">
        <TopBar showBack onBack={() => onNavigate("child-dashboard")} coins={userPoints} />

        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-white">Rewards</h1>
          <p className="text-[var(--ik-text-muted)]">Redeem your GGPoints for rewards</p>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              icon={reward.icon}
              title={reward.title}
              cost={reward.cost}
              userPoints={userPoints}
              selected={selectedReward === reward.id}
              onSelect={() => setSelectedReward(reward.id)}
            />
          ))}
        </div>

        <p className="text-[var(--ik-text-muted)] text-center text-sm mb-6">Complete tasks to earn more GGPoints!</p>

        <SecondaryButton fullWidth size="lg">
          Redeem
        </SecondaryButton>
      </div>
    </MobileScreenShell>
  )
}

// G) Activity History Screen
function ActivityHistoryScreen({
  children,
  selectedChildId,
  setSelectedChildId,
  activities,
  filter,
  setFilter,
  onNavigate,
}: {
  children: typeof mockChildren
  selectedChildId: string
  setSelectedChildId: (id: string) => void
  activities: typeof mockActivities
  filter: string
  setFilter: (f: string) => void
  onNavigate: (screen: Screen) => void
}) {
  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0]

  const filters = [
    { id: "All", label: "All", icon: <Check className="w-3 h-3" /> },
    { id: "Completed", label: "Completed", icon: <Clock className="w-3 h-3" /> },
    { id: "Pending", label: "Pending", icon: <Calendar className="w-3 h-3" /> },
    { id: "This Week", label: "This Week", icon: <Calendar className="w-3 h-3" /> },
  ]

  return (
    <MobileScreenShell>
      <div className="flex flex-col min-h-[700px] px-2 py-4">
        <TopBar showBack onBack={() => onNavigate("parent-dashboard")} showSettings />

        <div className="text-center mb-4">
          <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)]">Activity History</h1>
          <p className="text-[var(--ik-text-muted)] text-sm">Track what each child completed and earned</p>
        </div>

        {/* Child Selector */}
        <PanelCard className="mb-4">
          <div className="text-center mb-2 text-[var(--ik-text-muted)] text-sm font-bold">Parent Selector</div>
          <ChildSelector children={children} selectedId={selectedChildId} onSelect={setSelectedChildId} />
        </PanelCard>

        {/* Filters */}
        <div className="mb-4">
          <div className="text-white font-bold text-sm mb-2">Filter</div>
          <div className="flex items-center gap-2">
            <FilterChipsRow filters={filters} activeFilter={filter} onFilterChange={setFilter} />
            <button className="p-2 rounded-full bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)]">
              <Filter className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Activity List */}
        <div className="mb-4">
          <h2 className="text-white font-bold mb-3">Activity List</h2>
          <div className="space-y-2">
            {activities.map((activity) => (
              <ListRow
                key={activity.id}
                icon={
                  activity.status === "completed" ? (
                    <Check className="w-5 h-5 text-[var(--ik-success)]" />
                  ) : activity.status === "redeemed" ? (
                    <Gift className="w-5 h-5 text-[var(--ik-accent-yellow)]" />
                  ) : (
                    <Clock className="w-5 h-5 text-[var(--ik-warning)]" />
                  )
                }
                title={activity.title}
                subtitle={activity.subtitle}
                points={activity.points}
                pointsType={activity.type}
                status={activity.status}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-auto">
          <PrimaryButton fullWidth icon={<Download className="w-5 h-5" />}>
            Export
          </PrimaryButton>
          <CyanButton fullWidth icon={<User className="w-5 h-5" />}>
            View Child Profile
          </CyanButton>
        </div>
      </div>
    </MobileScreenShell>
  )
}

// H) Child Insights Screen
function ChildInsightsScreen({
  children,
  selectedChildId,
  setSelectedChildId,
  activities,
  filter,
  setFilter,
  onNavigate,
}: {
  children: typeof mockChildren
  selectedChildId: string
  setSelectedChildId: (id: string) => void
  activities: typeof mockActivities
  filter: string
  setFilter: (f: string) => void
  onNavigate: (screen: Screen) => void
}) {
  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0]

  const filters = [
    { id: "All", label: "All", icon: null },
    { id: "Completed", label: "Completed", icon: null },
    { id: "Pending", label: "Pending", icon: null },
    { id: "Rewards", label: "Rewards", icon: null },
    { id: "This Week", label: "This Week", icon: <Calendar className="w-3 h-3" /> },
  ]

  return (
    <MobileScreenShell>
      <div className="flex flex-col min-h-[700px] px-2 py-4">
        <TopBar showBack onBack={() => onNavigate("parent-dashboard")} showSettings />

        <div className="text-center mb-4">
          <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)]">Child Insights</h1>
          <p className="text-[var(--ik-text-muted)] text-sm">Progress, streeks and recent activity</p>
        </div>

        {/* Child Header + Insights */}
        <PanelCard className="mb-4">
          {/* Child Tabs */}
          <div className="flex items-center justify-between mb-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  selectedChildId === child.id ? "bg-[var(--ik-surface-1)]" : ""
                }`}
              >
                <Avatar name={child.name} variant={child.variant} size="sm" />
                <span className="font-bold text-white text-sm mt-1">{child.name}</span>
                {selectedChildId === child.id && (
                  <span className="text-[var(--ik-accent-yellow)] text-xs">{child.points} GGPoints</span>
                )}
              </button>
            ))}
            <div className="text-center">
              <div className="text-[var(--ik-text-muted)] text-xs">Insights</div>
              <div className="bg-[var(--ik-surface-1)] px-3 py-1 rounded-full">
                <span className="text-[var(--ik-success)] text-sm font-bold">{selectedChild.points} GGPoints</span>
              </div>
            </div>
          </div>

          {/* Weekly Progress Stats */}
          <div className="text-[var(--ik-text-muted)] text-xs mb-2">Weekly Progress</div>
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={<Flame className="w-5 h-5" />} value="4 days" label="Weekly Streek" />
            <StatCard icon={<Check className="w-5 h-5" />} value="3" label="Completed (7d)" />
            <StatCard icon="🪙" value="112" label="GG Earned (7d)" />
          </div>
        </PanelCard>

        {/* Top Tasks Indicator */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-bold text-sm">Top Tasks</span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-[var(--ik-success)]" />
            ))}
            {[5, 6, 7].map((i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-[var(--ik-surface-1)]" />
            ))}
          </div>
          <div className="text-[var(--ik-text-muted)] text-xs mb-2">This Week</div>
          <FilterChipsRow filters={filters} activeFilter={filter} onFilterChange={setFilter} />
        </div>

        {/* Recent Activity */}
        <div className="mb-4 flex-1">
          <h2 className="text-white font-bold mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {activities.slice(0, 3).map((activity) => (
              <ListRow
                key={activity.id}
                icon={
                  activity.status === "completed" ? (
                    <Check className="w-5 h-5 text-[var(--ik-success)]" />
                  ) : activity.status === "redeemed" ? (
                    <Gift className="w-5 h-5 text-[var(--ik-accent-yellow)]" />
                  ) : (
                    <Clock className="w-5 h-5 text-[var(--ik-warning)]" />
                  )
                }
                title={activity.title}
                subtitle={activity.subtitle}
                points={activity.points}
                pointsType={activity.type}
                status={activity.status}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <SecondaryButton fullWidth onClick={() => onNavigate("activity-history")}>
            View Full History
          </SecondaryButton>
          <PrimaryButton fullWidth icon={<Download className="w-5 h-5" />}>
            Export Report
          </PrimaryButton>
        </div>
      </div>
    </MobileScreenShell>
  )
}

// I) Approvals Screen
function ApprovalsScreen({
  children,
  selectedChildId,
  setSelectedChildId,
  pendingTasks,
  onNavigate,
}: {
  children: typeof mockChildren
  selectedChildId: string
  setSelectedChildId: (id: string) => void
  pendingTasks: typeof mockPendingApprovals
  onNavigate: (screen: Screen) => void
}) {
  const [taskStatuses, setTaskStatuses] = useState<Record<string, "approved" | "waiting">>(
    Object.fromEntries(pendingTasks.map((t) => [t.id, t.status])),
  )

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0]
  const pendingCount = Object.values(taskStatuses).filter((s) => s === "waiting").length

  const handleApproveTask = (taskId: string) => {
    setTaskStatuses((prev) => ({ ...prev, [taskId]: "approved" }))
  }

  const handleApproveAll = () => {
    const allApproved = Object.fromEntries(pendingTasks.map((t) => [t.id, "approved" as const]))
    setTaskStatuses(allApproved)
  }

  return (
    <MobileScreenShell>
      <div className="flex flex-col min-h-[700px] px-2 py-4">
        <TopBar
          showBack
          onBack={() => onNavigate("parent-dashboard")}
          showLogout
          onLogout={() => onNavigate("welcome")}
        />

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-[var(--ik-accent-yellow)]">Approvals</h1>
          <p className="text-[var(--ik-text-muted)] text-sm">Review and approve completed tasks</p>
        </div>

        {/* Main Panel */}
        <PanelCard className="flex-1 flex flex-col">
          {/* Select Child Header */}
          <h2 className="text-lg font-bold text-white mb-4">Select child</h2>

          {/* Child Selection Row */}
          <div
            className="flex items-center gap-3 p-3 bg-[var(--ik-surface-1)] rounded-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)] mb-4 cursor-pointer"
            onClick={() => {
              // Cycle through children for demo
              const currentIndex = children.findIndex((c) => c.id === selectedChildId)
              const nextIndex = (currentIndex + 1) % children.length
              setSelectedChildId(children[nextIndex].id)
            }}
          >
            <Avatar name={selectedChild.name} variant={selectedChild.variant} />
            <div className="flex-1">
              <h3 className="font-bold text-white">{selectedChild.name}</h3>
              <p className="text-[var(--ik-text-muted)] text-xs">
                Tasks completed by this child, pending your approval
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--ik-surface-2)] border-2 border-[var(--ik-outline-light)] flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 px-4 py-2 bg-[var(--ik-surface-1)] rounded-full border-2 border-[var(--ik-outline-light)] text-center">
              <span className="text-white text-sm font-semibold">Pending approvals: {pendingCount}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--ik-surface-1)] rounded-full border-2 border-[var(--ik-outline-light)]">
              <span className="text-[var(--ik-accent-yellow)]">🪙</span>
              <span className="text-white text-sm font-semibold">Child balance: {selectedChild.points} GG</span>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3 flex-1">
            {pendingTasks.map((task) => {
              const currentStatus = taskStatuses[task.id]
              const isApproved = currentStatus === "approved"

              return (
                <div
                  key={task.id}
                  className="p-4 bg-[var(--ik-surface-1)] rounded-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{task.title}</h3>
                      <p className="text-[var(--ik-text-muted)] text-sm">{task.description}</p>
                      <p className="text-[var(--ik-text-muted)] text-xs mt-1">Completed: {task.completedAt}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {isApproved ? (
                        <span className="px-3 py-1 bg-[var(--ik-surface-2)] rounded-full text-[var(--ik-accent-yellow)] text-sm font-bold border-2 border-[var(--ik-outline-light)]">
                          {task.points} GG
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApproveTask(task.id)}
                          className="px-3 py-1.5 bg-[var(--ik-accent-yellow)] text-[var(--ik-text-dark)] text-xs font-bold rounded-lg border-2 border-[var(--ik-accent-yellow-dark)] hover:opacity-90 transition-opacity"
                        >
                          Waiting
                          <br />
                          approval
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer Text */}
          <p className="text-[var(--ik-text-muted)] text-sm text-center mt-4">Complete tasks to earn more GGPoints!</p>
        </PanelCard>

        {/* Approve All Button */}
        <PrimaryButton
          fullWidth
          className="mt-4"
          icon={<Check className="w-5 h-5" />}
          onClick={handleApproveAll}
          disabled={pendingCount === 0}
        >
          Approve All
        </PrimaryButton>
      </div>
    </MobileScreenShell>
  )
}

function RewardsManagementScreen({
  children,
  selectedChildId,
  setSelectedChildId,
  rewards: initialRewards,
  claims,
  history,
  onNavigate,
}: {
  children: typeof mockChildren
  selectedChildId: string
  setSelectedChildId: (id: string) => void
  rewards: typeof mockParentRewards
  claims: typeof mockRewardClaims
  history: typeof mockRewardHistory
  onNavigate: (screen: Screen) => void
}) {
  const [activeTab, setActiveTab] = useState<"rewards" | "claims" | "history">("rewards")
  const [rewards, setRewards] = useState(initialRewards)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingReward, setEditingReward] = useState<(typeof initialRewards)[0] | null>(null)
  const [childDropdownOpen, setChildDropdownOpen] = useState(false)

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0]

  // Form state for create/edit modal
  const [formName, setFormName] = useState("")
  const [formCost, setFormCost] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formIcon, setFormIcon] = useState("gift")

  const iconOptions = [
    { id: "gift", icon: <Gift className="w-4 h-4" /> },
    { id: "tv", icon: <Tv className="w-4 h-4" /> },
    { id: "film", icon: <Film className="w-4 h-4" /> },
    { id: "icecream", icon: <IceCreamCone className="w-4 h-4" /> },
    { id: "gamepad", icon: <Gamepad2 className="w-4 h-4" /> },
    { id: "star", icon: <Star className="w-4 h-4" /> },
  ]

  const getRewardIcon = (iconId: string) => {
    switch (iconId) {
      case "tv":
        return <Tv className="w-5 h-5 text-white" />
      case "film":
        return <Film className="w-5 h-5 text-white" />
      case "icecream":
        return <IceCreamCone className="w-5 h-5 text-white" />
      case "gamepad":
        return <Gamepad2 className="w-5 h-5 text-white" />
      case "star":
        return <Star className="w-5 h-5 text-white" />
      case "pencil":
        return <Pencil className="w-5 h-5 text-white" />
      default:
        return <Gift className="w-5 h-5 text-white" />
    }
  }

  const handleCreateReward = () => {
    if (!formName || !formCost) return

    const newReward = {
      id: Date.now().toString(),
      name: formName,
      icon: formIcon,
      cost: Number.parseInt(formCost),
      status: "active" as const,
      assignedTo: selectedChild.name,
    }
    setRewards([...rewards, newReward])
    resetForm()
    setShowCreateModal(false)
  }

  const handleUpdateReward = () => {
    if (!editingReward || !formName || !formCost) return

    setRewards(
      rewards.map((r) =>
        r.id === editingReward.id ? { ...r, name: formName, cost: Number.parseInt(formCost), icon: formIcon } : r,
      ),
    )
    resetForm()
    setEditingReward(null)
  }

  const handleDeleteReward = (id: string) => {
    setRewards(rewards.filter((r) => r.id !== id))
  }

  const handleToggleStatus = (id: string) => {
    setRewards(
      rewards.map((r) =>
        r.id === id ? { ...r, status: r.status === "active" ? ("paused" as const) : ("active" as const) } : r,
      ),
    )
  }

  const resetForm = () => {
    setFormName("")
    setFormCost("")
    setFormDescription("")
    setFormIcon("gift")
  }

  const openEditModal = (reward: (typeof initialRewards)[0]) => {
    setEditingReward(reward)
    setFormName(reward.name)
    setFormCost(reward.cost.toString())
    setFormIcon(reward.icon)
  }

  const filteredRewards = rewards.filter((r) => r.assignedTo === selectedChild.name)

  return (
    <MobileScreenShell>
      <div className="flex flex-col min-h-[700px] px-2 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <SecondaryButton size="sm" icon={<span>←</span>} onClick={() => onNavigate("parent-dashboard")}>
            BACK
          </SecondaryButton>
          <IkidoLogo />
          <SecondaryButton size="sm" icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </SecondaryButton>
        </div>

        {/* Main Content: Two-column layout on larger screens, stacked on mobile */}
        <div className="flex flex-col lg:flex-row gap-4 flex-1">
          {/* Left Panel: Child Selector */}
          <div className="lg:w-1/3">
            <PanelCard className="h-full">
              <h2 className="text-lg font-bold text-white mb-4">Select Child</h2>

              {/* Child Dropdown */}
              <div className="relative mb-4">
                <button
                  onClick={() => setChildDropdownOpen(!childDropdownOpen)}
                  className="w-full flex items-center gap-3 p-3 bg-[var(--ik-surface-1)] rounded-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)]"
                >
                  <Avatar name={selectedChild.name} variant={selectedChild.variant} size="sm" />
                  <span className="flex-1 text-left font-bold text-white">{selectedChild.name}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white transition-transform ${childDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {childDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--ik-surface-2)] rounded-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)] overflow-hidden z-10">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          setSelectedChildId(child.id)
                          setChildDropdownOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-[var(--ik-surface-1)] transition-colors ${
                          child.id === selectedChildId ? "bg-[var(--ik-surface-1)]" : ""
                        }`}
                      >
                        <Avatar name={child.name} variant={child.variant} size="sm" />
                        <span className="font-bold text-white">{child.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Child Balance */}
              <div className="p-3 bg-[var(--ik-surface-1)] rounded-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)] mb-4">
                <p className="text-[var(--ik-text-muted)] text-sm">{selectedChild.name} Balance:</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[var(--ik-accent-yellow)] text-2xl">🪙</span>
                  <span className="text-2xl font-black text-[var(--ik-accent-yellow)]">{selectedChild.points} GG</span>
                </div>
              </div>

              {/* Preview Card (shows first reward) */}
              {filteredRewards[0] && (
                <div className="p-3 bg-[var(--ik-surface-1)] rounded-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--ik-surface-2)] flex items-center justify-center">
                      {getRewardIcon(filteredRewards[0].icon)}
                    </div>
                    <span className="font-bold text-white">{filteredRewards[0].name}</span>
                    <button onClick={() => handleDeleteReward(filteredRewards[0].id)} className="ml-auto">
                      <Trash2 className="w-4 h-4 text-[var(--ik-text-muted)] hover:text-[var(--ik-danger)]" />
                    </button>
                  </div>
                  <p className="text-[var(--ik-text-muted)] text-sm mb-2">Cost (GGPoints)</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[var(--ik-surface-2)] rounded-full">
                      <div
                        className="h-full bg-[var(--ik-accent-cyan)] rounded-full"
                        style={{ width: `${Math.min((filteredRewards[0].cost / 500) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-white font-bold text-sm">{filteredRewards[0].cost}</span>
                  </div>
                  <div className="mt-3">
                    <CyanButton fullWidth size="sm">
                      Assigned to {selectedChild.name}
                    </CyanButton>
                  </div>
                </div>
              )}
            </PanelCard>
          </div>

          {/* Right Panel: Rewards/Claims/History */}
          <div className="lg:w-2/3 flex flex-col">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("rewards")}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all border-2 ${
                  activeTab === "rewards"
                    ? "bg-[var(--ik-accent-yellow)] border-[var(--ik-accent-yellow-dark)] text-[var(--ik-text-dark)]"
                    : "bg-[var(--ik-surface-1)] border-[var(--ik-outline-light)] text-white"
                }`}
              >
                Rewards
              </button>
              <button
                onClick={() => setActiveTab("claims")}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all border-2 ${
                  activeTab === "claims"
                    ? "bg-[var(--ik-accent-cyan)] border-[var(--ik-accent-cyan)] text-[var(--ik-text-dark)]"
                    : "bg-[var(--ik-surface-1)] border-[var(--ik-outline-light)] text-white"
                }`}
              >
                Claims
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all border-2 ${
                  activeTab === "history"
                    ? "bg-[var(--ik-surface-2)] border-[var(--ik-outline-light)] text-white"
                    : "bg-[var(--ik-surface-1)] border-[var(--ik-outline-light)] text-white"
                }`}
              >
                History
              </button>
            </div>

            {/* Rewards Tab */}
            {activeTab === "rewards" && (
              <PanelCard className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Rewards for {selectedChild.name}</h2>
                  <SecondaryButton
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowCreateModal(true)}
                  >
                    New
                  </SecondaryButton>
                </div>

                {/* Rewards Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {filteredRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="p-3 bg-[var(--ik-surface-1)] rounded-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)] relative"
                    >
                      {/* Status Badge */}
                      {reward.status === "paused" && (
                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-[var(--ik-danger)] text-white text-xs font-bold rounded-full">
                          Paused
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--ik-surface-2)] flex items-center justify-center">
                          {getRewardIcon(reward.icon)}
                        </div>
                        <span className="flex-1 font-bold text-white text-sm truncate">{reward.name}</span>
                        <button onClick={() => handleDeleteReward(reward.id)}>
                          <Trash2 className="w-4 h-4 text-[var(--ik-text-muted)] hover:text-[var(--ik-danger)]" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--ik-text-muted)] text-xs truncate">
                          Assigned to {reward.assignedTo}
                        </span>
                        <button
                          onClick={() => handleToggleStatus(reward.id)}
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            reward.status === "active"
                              ? "bg-[var(--ik-accent-cyan)] text-[var(--ik-text-dark)]"
                              : "bg-[var(--ik-surface-2)] text-[var(--ik-text-muted)]"
                          }`}
                        >
                          {reward.status === "active" ? "Active" : "Paused"}
                        </button>
                      </div>

                      {/* Edit button */}
                      <button
                        onClick={() => openEditModal(reward)}
                        className="mt-2 w-full text-center text-[var(--ik-accent-cyan)] text-xs font-bold hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </PanelCard>
            )}

            {/* Claims Tab */}
            {activeTab === "claims" && (
              <PanelCard className="flex-1">
                <h2 className="text-lg font-bold text-white mb-4">Pending Claims</h2>
                <div className="space-y-3">
                  {claims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-3 bg-[var(--ik-surface-1)] rounded-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)] flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[var(--ik-surface-2)] flex items-center justify-center">
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{claim.rewardName}</h3>
                        <p className="text-[var(--ik-text-muted)] text-xs">
                          Claimed by {claim.childName} • {claim.claimedAt}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-[var(--ik-accent-yellow)] font-bold">{claim.cost} GG</div>
                        {claim.status === "pending" ? (
                          <div className="flex gap-1 mt-1">
                            <button className="px-2 py-1 bg-[var(--ik-success)] text-white text-xs font-bold rounded">
                              Approve
                            </button>
                            <button className="px-2 py-1 bg-[var(--ik-danger)] text-white text-xs font-bold rounded">
                              Deny
                            </button>
                          </div>
                        ) : (
                          <span className="text-[var(--ik-success)] text-xs font-bold">Approved</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </PanelCard>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <PanelCard className="flex-1">
                <h2 className="text-lg font-bold text-white mb-4">Reward History</h2>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[var(--ik-surface-1)] rounded-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)] flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[var(--ik-surface-2)] flex items-center justify-center">
                        <Gift className="w-5 h-5 text-[var(--ik-accent-yellow)]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{item.rewardName}</h3>
                        <p className="text-[var(--ik-text-muted)] text-xs">
                          Redeemed by {item.childName} • {item.redeemedAt}
                        </p>
                      </div>
                      <div className="text-[var(--ik-danger)] font-bold">-{item.cost} GG</div>
                    </div>
                  ))}
                </div>
              </PanelCard>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Reward Modal */}
      {(showCreateModal || editingReward) && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[var(--ik-surface-2)] rounded-t-[var(--ik-radius-card)] border-2 border-[var(--ik-outline-light)] p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{editingReward ? "Edit Reward" : "Create Reward"}</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingReward(null)
                  resetForm()
                }}
                className="w-8 h-8 rounded-full bg-[var(--ik-surface-1)] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <TextInput label="Reward Name" placeholder="e.g., Movie Night" value={formName} onChange={setFormName} />

              <TextInput
                label="Cost (GGPoints)"
                placeholder="e.g., 300"
                value={formCost}
                onChange={setFormCost}
                type="text"
              />

              <TextInput
                label="Description (optional)"
                placeholder="A brief description..."
                value={formDescription}
                onChange={setFormDescription}
              />

              <div>
                <label className="block text-white font-bold text-sm mb-2">Icon (optional)</label>
                <div className="flex gap-2">
                  {iconOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFormIcon(opt.id)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        formIcon === opt.id
                          ? "bg-[var(--ik-accent-yellow)] text-[var(--ik-text-dark)]"
                          : "bg-[var(--ik-surface-1)] text-white border-2 border-[var(--ik-outline-light)]"
                      }`}
                    >
                      {opt.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <SecondaryButton
                fullWidth
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingReward(null)
                  resetForm()
                }}
              >
                Cancel
              </SecondaryButton>
              <CyanButton fullWidth onClick={editingReward ? handleUpdateReward : handleCreateReward}>
                Save
              </CyanButton>
            </div>
          </div>
        </div>
      )}
    </MobileScreenShell>
  )
}
