"use client"

interface Task {
  id: string
  name: string
  points: number
  completed: boolean
}

interface ChildDashboardProps {
  childName: string
  ggPoints: number
  tasks: Task[]
  onNavigate: (screen: string) => void
  onCompleteTask: (taskId: string) => void
  onLogout: () => void
}

export function ChildDashboard({
  childName,
  ggPoints,
  tasks,
  onNavigate,
  onCompleteTask,
  onLogout,
}: ChildDashboardProps) {
  const pendingTasks = tasks.filter((t) => !t.completed)

  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">iKidO</h1>
        <button
          onClick={onLogout}
          className="bg-[#0D3A5C] hover:bg-[#0A2A47] text-white font-bold py-2 px-4 rounded-lg text-sm"
        >
          Logout
        </button>
      </div>
      <h2 className="text-2xl font-bold text-[#FFD369] mb-6">Hello, {childName}</h2>

      {/* Points Card */}
      <div className="bg-[#FFF8DC] rounded-2xl p-5 mb-8 text-center">
        <div className="flex justify-center mb-3">
          <div className="text-5xl">😊</div>
        </div>
        <p className="text-2xl font-bold text-[#0F4C7D]">{ggPoints}</p>
        <p className="text-lg font-bold text-[#0F4C7D]">GGPoints</p>
      </div>

      {/* Today's Tasks */}
      <h3 className="text-xl font-bold mb-4">Today's Tasks</h3>
      <div className="bg-[#0D3A5C] rounded-2xl p-4 space-y-3 mb-6">
        {pendingTasks.length === 0 ? (
          <p className="text-gray-300 text-center">No pending tasks</p>
        ) : (
          pendingTasks.map((task) => (
            <div key={task.id} className="flex justify-between items-center">
              <span className="font-semibold">{task.name}</span>
              <button
                onClick={() => onCompleteTask(task.id)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-sm"
              >
                {task.points} p
              </button>
            </div>
          ))
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => onNavigate("rewards")}
          className="w-full bg-[#0D3A5C] hover:bg-[#0A2A47] text-white font-bold py-3 rounded-full transition-colors"
        >
          Rewards
        </button>
        <button
          onClick={() => onNavigate("child-history")}
          className="w-full bg-[#0D3A5C] hover:bg-[#0A2A47] text-white font-bold py-3 rounded-full transition-colors"
        >
          History
        </button>
      </div>
    </div>
  )
}
