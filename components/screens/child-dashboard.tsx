"use client";

import { Button } from "@/components/ui/button";

type ChildTask = {
  id: string;
  name: string;
  points: number;
  completed: boolean;
};

type ChildDashboardProps = {
  childName: string;
  ggPoints: number;
  tasks: ChildTask[];
  onNavigate: (screen: "child-rewards" | "child-history") => void;
  onCompleteTask: (taskId: string) => void;
  onLogout: () => void;
};

export function ChildDashboard({ childName, ggPoints, tasks, onNavigate, onCompleteTask, onLogout }: ChildDashboardProps) {
  return (
    <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-6 text-white shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">iKidO</h1>
        <button
          onClick={onLogout}
          className="rounded-lg bg-[#0D3A5C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0A2A47]"
        >
          Logout
        </button>
      </div>
      <h2 className="text-2xl font-bold text-[#FFD369] mb-4">Hello, {childName}</h2>

      <div className="mb-6 rounded-2xl bg-[#FFEFC3] px-4 py-6 text-center text-[#0F4C7D]">
        <div className="text-4xl mb-2">😊</div>
        <p className="text-5xl font-bold">{ggPoints}</p>
        <p className="text-sm font-semibold uppercase tracking-[0.3em]">GGPoints</p>
      </div>

      <section className="mb-6 space-y-3">
        <h3 className="text-lg font-bold text-[#FFD369]">Today&apos;s Tasks</h3>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="rounded-2xl bg-[#0D3A5C] px-4 py-4 text-center text-sm text-gray-300">No pending tasks</p>
          ) : (
            tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => onCompleteTask(task.id)}
                disabled={task.completed}
                className="flex w-full items-center justify-between rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-[#0A2A47] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className={task.completed ? "line-through opacity-70" : ""}>{task.name}</span>
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">+{task.points} p</span>
              </button>
            ))
          )}
        </div>
      </section>

      <div className="space-y-3">
        <Button
          onClick={() => onNavigate("child-rewards")}
          className="w-full rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] py-3 text-white transition hover:bg-[#0A2A47]"
        >
          Rewards
        </Button>
        <Button
          onClick={() => onNavigate("child-history")}
          className="w-full rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] py-3 text-white transition hover:bg-[#0A2A47]"
        >
          History
        </Button>
      </div>
    </div>
  );
}

