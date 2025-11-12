"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type HistoryItem = {
  id: string;
  type: "task" | "reward";
  description: string;
  points: number;
  date: string;
};

type ChildHistoryProps = {
  childName: string;
  history: HistoryItem[];
  onBack: () => void;
};

export function ChildHistory({ childName, history, onBack }: ChildHistoryProps) {
  const [tab, setTab] = useState<"tasks" | "rewards">("tasks");

  const filteredHistory = useMemo(
    () => history.filter((item) => (tab === "tasks" ? item.type === "task" : item.type === "reward")),
    [history, tab]
  );

  return (
    <div className="flex h-full w-full flex-col rounded-3xl bg-linear-to-b from-[#0F4C7D] to-[#1A5FA0] px-5 py-6 text-white shadow-2xl">
      <button onClick={onBack} className="self-start text-xs font-bold uppercase tracking-wide text-[#FFD369] transition-colors hover:text-[#FFC93F]">
        ← Back
      </button>

      <div className="mt-4 flex flex-1 flex-col gap-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[#FFD369]">{childName}&apos;s History</h1>
          <p className="text-xs text-gray-200">Keep track of your missions and redeemed treats.</p>
        </div>

        <div className="flex gap-2 rounded-2xl bg-[#0D3A5C] p-2">
          <Button
            onClick={() => setTab("tasks")}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold ${
              tab === "tasks" ? "bg-[#FFD369] text-[#0F4C7D]" : "bg-transparent text-white"
            }`}
          >
            Tasks ({history.filter((item) => item.type === "task").length})
          </Button>
          <Button
            onClick={() => setTab("rewards")}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold ${
              tab === "rewards" ? "bg-[#FFD369] text-[#0F4C7D]" : "bg-transparent text-white"
            }`}
          >
            Rewards ({history.filter((item) => item.type === "reward").length})
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col space-y-3 rounded-2xl bg-[#0D3A5C] p-4">
          {filteredHistory.length === 0 ? (
            <p className="text-center text-xs text-gray-300">
              {tab === "tasks" ? "No completed tasks yet" : "No rewards redeemed yet"}
            </p>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {filteredHistory.map((item) => (
                <div key={item.id} className="rounded-xl bg-[#0A2A47] px-4 py-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{item.description}</span>
                    <span className={item.type === "task" ? "text-emerald-300" : "text-[#FFD369]"}>
                      {item.type === "task" ? "+" : "-"}
                      {item.points}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-gray-300">{item.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

