"use client"

interface Activity {
  id: string
  childName: string
  type: "task" | "reward"
  description: string
  points: number
  date: string
}

interface ParentHistoryProps {
  onBack: () => void
  activities: Activity[]
}

export function ParentHistory({ onBack, activities }: ParentHistoryProps) {
  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <button onClick={onBack} className="text-[#FFD369] font-bold mb-4 flex items-center gap-2 hover:opacity-80">
        ← Back
      </button>
      <h2 className="text-2xl font-bold text-[#FFD369] mb-6">Family Activity History</h2>

      {/* Activities List */}
      <div className="bg-[#0D3A5C] rounded-2xl p-4 space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-gray-300 text-center">No activities yet</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="border-b border-[#1A5FA0] pb-3 last:border-b-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{activity.childName}</p>
                  <p className="text-sm text-gray-300">{activity.description}</p>
                  <p className="text-xs text-gray-400">{activity.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${activity.type === "task" ? "text-green-400" : "text-orange-400"}`}>
                    {activity.type === "task" ? "+" : "-"} {activity.points}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
