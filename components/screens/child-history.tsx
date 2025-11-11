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
    <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-6 text-white shadow-2xl">
      <button
        onClick={onBack}
        className="mb-6 text-sm font-bold text-[#FFD369] transition-colors hover:text-[#FFC93F]"
      >
        ← Back
      </button>
      <h1 className="text-2xl font-bold text-[#FFD369] mb-2">{childName}&apos;s History</h1>
      <p className="mb-4 text-sm text-gray-200">Keep track of your missions and redeemed treats.</p>

      <div className="mb-4 flex gap-2 rounded-2xl bg-[#0D3A5C] p-2">
        <Button
          onClick={() => setTab("tasks")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === "tasks" ? "bg-[#FFD369] text-[#0F4C7D]" : "bg-transparent text-white"
          }`}
        >
          Tasks ({history.filter((item) => item.type === "task").length})
        </Button>
        <Button
          onClick={() => setTab("rewards")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === "rewards" ? "bg-[#FFD369] text-[#0F4C7D]" : "bg-transparent text-white"
          }`}
        >
          Rewards ({history.filter((item) => item.type === "reward").length})
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl bg-[#0D3A5C] p-4">
        {filteredHistory.length === 0 ? (
          <p className="text-center text-gray-300">
            {tab === "tasks" ? "No completed tasks yet" : "No rewards redeemed yet"}
          </p>
        ) : (
          filteredHistory.map((item) => (
            <div key={item.id} className="rounded-xl bg-[#0A2A47] px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{item.description}</span>
                <span className={item.type === "task" ? "text-emerald-300" : "text-[#FFD369]"}>
                  {item.type === "task" ? "+" : "-"}
                  {item.points}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1">{item.date}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

