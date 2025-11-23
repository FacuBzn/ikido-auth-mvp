"use client"

interface AssignTasksScreenProps {
  childName: string
  ggPoints: number
  onBack: () => void
}

export function AssignTasksScreen({ childName, ggPoints, onBack }: AssignTasksScreenProps) {
  const tasks = [
    { name: "Make Bed", points: 10 },
    { name: "Take Out Garbage", points: 15 },
    { name: "Load Dishwasher", points: 15 },
    { name: "Read a Book", points: 10 },
    { name: "Write Short Story", points: 20 },
  ]

  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-2xl hover:opacity-80">
          ←
        </button>
        <h1 className="text-3xl font-bold text-[#FFD369]">Assign Tasks</h1>
      </div>

      {/* Child Info */}
      <div className="bg-[#0D3A5C] rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="text-3xl">👤</div>
        <div>
          <p className="font-bold text-white">{childName}</p>
          <p className="text-[#FFD369] font-bold">🪙 {ggPoints} GG</p>
        </div>
      </div>

      {/* New Task Button */}
      <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg mb-6 transition-colors flex items-center justify-center gap-2">
        <span className="text-xl">+</span> New Task
      </button>

      {/* Tasks List */}
      <div className="bg-[#0D3A5C] rounded-2xl p-4 space-y-3">
        {tasks.map((task, index) => (
          <div key={index} className="flex justify-between items-center text-white">
            <span className="font-semibold">{task.name}</span>
            <span className="text-[#FFD369] font-bold">{task.points} +</span>
          </div>
        ))}
      </div>

      {/* Footer Button */}
      <button className="w-full bg-[#0D3A5C] hover:bg-[#0A2A47] text-white font-bold py-3 rounded-full mt-6 transition-colors">
        Setegn
      </button>
    </div>
  )
}
