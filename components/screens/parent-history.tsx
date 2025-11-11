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
    <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-6 text-white shadow-2xl">
      <button
        onClick={onBack}
        className="mb-6 text-sm font-bold text-[#FFD369] transition-colors hover:text-[#FFC93F]"
      >
        ← Back
      </button>
      <h1 className="mb-2 text-3xl font-bold">Family History</h1>
      <p className="mb-6 text-sm text-gray-200">Track completed missions and redeemed rewards.</p>

      <div className="space-y-4 rounded-2xl bg-[#0D3A5C] p-4">
        {activities.length === 0 ? (
          <p className="text-center text-gray-300">No activity recorded yet.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="rounded-2xl bg-[#0A2A47] p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#FFD369]">
                  {activity.type === "task" ? "Task" : "Reward"}
                </span>
                <span className="text-xs text-gray-300">{activity.date}</span>
              </div>
              <div className="mt-2">
                <p className="font-semibold">{activity.description}</p>
                {activity.childName && <p className="text-sm text-gray-200">Cadet: {activity.childName}</p>}
              </div>
              <p className="mt-2 text-sm font-bold text-emerald-300">
                {activity.type === "task" ? "+" : "-"}
                {activity.points} GGPoints
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

