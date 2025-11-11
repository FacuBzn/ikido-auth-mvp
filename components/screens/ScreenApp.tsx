"use client";

import { useState } from "react";
import { LoginScreen } from "@/components/screens/login-screen";
import { ParentDashboard } from "@/components/screens/parent-dashboard";
import { ParentCreateTasks } from "@/components/screens/parent-create-tasks";
import { ParentManageRewards } from "@/components/screens/parent-manage-rewards";
import { ParentHistory } from "@/components/screens/parent-history";
import { ParentManageChildren } from "@/components/screens/parent-manage-children";
import { ChildDashboard } from "@/components/screens/child-dashboard";
import { ChildRewards } from "@/components/screens/child-rewards";
import { ChildHistory } from "@/components/screens/child-history";
import { RewardsScreen } from "@/components/screens/rewards-screen";
import { SuccessScreen } from "@/components/screens/success-screen";

type Screen =
  | "login"
  | "parent-dashboard"
  | "parent-manage-children"
  | "parent-manage-tasks"
  | "parent-manage-rewards"
  | "parent-history"
  | "child-stats"
  | "child-dashboard"
  | "child-rewards"
  | "child-history"
  | "rewards"
  | "success";

type Role = "parent" | "child" | null;

type Child = {
  id: string;
  name: string;
  points: number;
};

type Reward = {
  id: string;
  name: string;
  cost: number;
  icon: string;
};

type Task = {
  id: string;
  name: string;
  points: number;
  completed: boolean;
};

type Activity = {
  id: string;
  childName?: string;
  type: "task" | "reward";
  description: string;
  points: number;
  date: string;
};

const INITIAL_REWARDS: Reward[] = [
  { id: "1", name: "Movie", cost: 300, icon: "🎬" },
  { id: "2", name: "Game", cost: 250, icon: "🎮" },
  { id: "3", name: "Toy", cost: 190, icon: "🧸" },
  { id: "4", name: "Gift", cost: 400, icon: "🎁" },
];

const INITIAL_TASKS: Task[] = [
  { id: "1", name: "Make Bed", points: 10, completed: false },
  { id: "2", name: "Take Out Garbage", points: 15, completed: false },
  { id: "3", name: "Load Dishwasher", points: 15, completed: false },
  { id: "4", name: "Read a Book", points: 10, completed: false },
];

const formatDate = (date = new Date()) =>
  date.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const ScreenApp = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [role, setRole] = useState<Role>(null);
  const [userName, setUserName] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [rewards, setRewards] = useState<Reward[]>(INITIAL_REWARDS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [childGGPoints, setChildGGPoints] = useState(285);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [childHistory, setChildHistory] = useState<Activity[]>([]);

  const handleLogin = (selectedRole: Exclude<Role, null>, name: string) => {
    setRole(selectedRole);
    setUserName(name);
    setCurrentScreen(selectedRole === "parent" ? "parent-dashboard" : "child-dashboard");
  };

  const handleLogout = () => {
    setCurrentScreen("login");
    setRole(null);
    setUserName("");
  };

  const handleNavigate = (screen: Screen, childId?: string) => {
    if (screen === "child-stats" && childId) {
      const selected = children.find((child) => child.id === childId);
      if (selected) {
        setChildGGPoints(selected.points);
      }
      setCurrentScreen("child-dashboard");
      return;
    }
    setCurrentScreen(screen);
  };

  const handleAddChild = (name: string) => {
    setChildren((prev) => [...prev, { id: createId(), name, points: 0 }]);
  };

  const handleRemoveChild = (childId: string) => {
    setChildren((prev) => prev.filter((child) => child.id !== childId));
  };

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.completed) {
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)));
    setChildGGPoints((prev) => prev + task.points);
    setChildHistory((prev) => [
      ...prev,
      {
        id: createId(),
        type: "task",
        description: task.name,
        points: task.points,
        date: formatDate(),
      },
    ]);
  };

  const handleRewardRedeemed = (rewardId: string, points: number) => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) {
      return;
    }

    setChildGGPoints((prev) => prev - points);
    setChildHistory((prev) => [
      ...prev,
      {
        id: createId(),
        type: "reward",
        description: reward.name,
        points,
        date: formatDate(),
      },
    ]);
    setCurrentScreen("success");
  };

  const handleTaskCreated = (task: { name: string; points: number; description: string }) => {
    setTasks((prev) => [
      ...prev,
      {
        id: createId(),
        name: task.name,
        points: task.points,
        completed: false,
      },
    ]);
    setActivities((prev) => [
      ...prev,
      {
        id: createId(),
        childName: task.description,
        type: "task",
        description: task.name,
        points: task.points,
        date: formatDate(),
      },
    ]);
    setCurrentScreen("parent-dashboard");
  };

  const handleAddReward = (reward: Omit<Reward, "id">) => {
    setRewards((prev) => [...prev, { ...reward, id: createId() }]);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-4">
      {currentScreen === "login" && <LoginScreen onLogin={handleLogin} />}

      {currentScreen === "parent-dashboard" && role === "parent" && (
        <ParentDashboard parentName={userName} crew={children} onNavigate={handleNavigate} onLogout={handleLogout} />
      )}

      {currentScreen === "parent-manage-tasks" && role === "parent" && (
        <ParentCreateTasks onBack={() => setCurrentScreen("parent-dashboard")} onTaskCreated={handleTaskCreated} />
      )}

      {currentScreen === "parent-manage-children" && role === "parent" && (
        <ParentManageChildren
          crew={children}
          onBack={() => setCurrentScreen("parent-dashboard")}
          onAddChild={handleAddChild}
          onRemoveChild={handleRemoveChild}
        />
      )}

      {currentScreen === "parent-manage-rewards" && role === "parent" && (
        <ParentManageRewards
          onBack={() => setCurrentScreen("parent-dashboard")}
          rewards={rewards}
          onAddReward={handleAddReward}
        />
      )}

      {currentScreen === "parent-history" && role === "parent" && (
        <ParentHistory onBack={() => setCurrentScreen("parent-dashboard")} activities={activities} />
      )}

      {currentScreen === "child-dashboard" && role === "child" && (
        <ChildDashboard
          childName={userName}
          ggPoints={childGGPoints}
          tasks={tasks}
          onNavigate={handleNavigate}
          onCompleteTask={handleCompleteTask}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === "child-rewards" && role === "child" && (
        <ChildRewards
          childName={userName}
          ggPoints={childGGPoints}
          rewards={rewards}
          onBack={() => setCurrentScreen("child-dashboard")}
          onRewardRedeemed={handleRewardRedeemed}
        />
      )}

      {currentScreen === "child-history" && role === "child" && (
        <ChildHistory childName={userName} onBack={() => setCurrentScreen("child-dashboard")} history={childHistory} />
      )}

      {currentScreen === "rewards" && (
        <RewardsScreen
          onBack={() => setCurrentScreen("child-dashboard")}
          onRewardRedeemed={(points) => {
            setChildGGPoints((prev) => prev - points);
            setCurrentScreen("success");
          }}
        />
      )}

      {currentScreen === "success" && <SuccessScreen onDone={() => setCurrentScreen("child-dashboard")} />}
    </div>
  );
};

