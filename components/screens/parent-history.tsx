"use client";

type Activity = {
  id: string;
  childName?: string;
  type: "task" | "reward";
  description: string;
  points: number;
  date: string;
};

type ParentHistoryProps = {
  onBack: () => void;
  activities: Activity[];
};

export function ParentHistory({ onBack, activities }: ParentHistoryProps) {
  return (
    <div className="flex h-full w-full flex-col rounded-3xl bg-linear-to-b from-[#0F4C7D] to-[#1A5FA0] px-5 py-6 text-white shadow-2xl">
      <button
        onClick={onBack}
        className="self-start text-xs font-bold uppercase tracking-wide text-[#FFD369] transition-colors hover:text-[#FFC93F]"
      >
        ← Back
      </button>

      <div className="mt-4 flex flex-1 flex-col gap-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Family History</h1>
          <p className="text-xs text-gray-200">Track completed missions and redeemed rewards.</p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col space-y-3 rounded-2xl bg-[#0D3A5C] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD369]">Recent Activity</h2>
          {activities.length === 0 ? (
            <p className="text-center text-xs text-gray-300">No activity recorded yet.</p>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {activities.map((activity) => (
                <div key={activity.id} className="rounded-2xl bg-[#0A2A47] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#FFD369]">
                      {activity.type === "task" ? "Task" : "Reward"}
                    </span>
                    <span className="text-[10px] text-gray-300">{activity.date}</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-semibold">{activity.description}</p>
                    {activity.childName && <p className="text-xs text-gray-200">Cadet: {activity.childName}</p>}
                  </div>
                  <p className={`mt-2 text-sm font-bold ${activity.type === "task" ? "text-emerald-300" : "text-[#FFD369]"}`}>
                    {activity.type === "task" ? "+" : "-"}
                    {activity.points} GGPoints
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

