"use client"

interface HistoryItem {
  id: string
  type: "task" | "reward"
  description: string
  points: number
  date: string
}

interface ChildHistoryProps {
  childName: string
  onBack: () => void
  history: HistoryItem[]
}

export function ChildHistory({ childName, onBack, history }: ChildHistoryProps) {
  const tasks = history.filter((h) => h.type === "task")
  const rewards = history.filter((h) => h.type === "reward")

  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <button onClick={onBack} className="text-[#FFD369] font-bold mb-4 flex items-center gap-2 hover:opacity-80">
        ← Back
      </button>
      <h2 className="text-2xl font-bold text-[#FFD369] mb-6">{childName}'s History</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button className="flex-1 bg-[#FFD369] text-[#0F4C7D] font-bold py-2 rounded-lg">Tasks ({tasks.length})</button>
        <button className="flex-1 bg-[#0D3A5C] text-white font-bold py-2 rounded-lg hover:bg-[#0A2A47]">
          Rewards ({rewards.length})
        </button>
      </div>

      {/* Tasks List */}
      <div className="bg-[#0D3A5C] rounded-2xl p-4 space-y-3 max-h-96 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-gray-300 text-center">No completed tasks yet</p>
        ) : (
          tasks.map((item) => (
            <div key={item.id} className="border-b border-[#1A5FA0] pb-3 last:border-b-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{item.description}</p>
                  <p className="text-xs text-gray-400">{item.date}</p>
                </div>
                <p className="font-bold text-green-400">+{item.points}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
