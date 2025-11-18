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
    <div className="flex h-full w-full flex-col rounded-3xl bg-linear-to-b from-[#0F4C7D] to-[#1A5FA0] px-5 py-6 text-white shadow-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">iKidO</h1>
        <button
          onClick={onLogout}
          className="rounded-full bg-[#0D3A5C] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#0A2A47]"
        >
          Logout
        </button>
      </div>

      <div className="mt-5 flex flex-1 flex-col gap-5">
        <div className="rounded-2xl bg-[#FFEFC3] px-4 py-5 text-center text-[#0F4C7D] shadow-inner">
          <p className="text-sm font-semibold text-[#FFD369]">Hello, {childName}</p>
          <div className="mt-3 text-4xl">😊</div>
          <p className="mt-2 text-4xl font-bold">{ggPoints}</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em]">GGPoints</p>
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#FFD369]">Today&apos;s Tasks</h3>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="rounded-2xl bg-[#0D3A5C] px-4 py-4 text-center text-xs text-gray-300">No pending tasks</p>
            ) : (
              tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onCompleteTask(task.id)}
                  disabled={task.completed}
                  className="flex w-full items-center justify-between rounded-2xl border border-[#FFD369] bg-[#0D3A5C] px-4 py-3 text-left text-xs font-semibold text-white transition hover:bg-[#0A2A47] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className={task.completed ? "line-through opacity-70" : ""}>{task.name}</span>
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    +{task.points} p
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <div className="mt-auto space-y-3">        
        </div>
      </div>
    </div>
  );
}

