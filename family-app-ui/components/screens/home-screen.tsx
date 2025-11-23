"use client"

interface HomeScreenProps {
  childName: string
  ggPoints: number
  onNavigate: (screen: string) => void
}

export function HomeScreen({ childName, ggPoints, onNavigate }: HomeScreenProps) {
  const tasks = [
    { name: "Make Bed", points: 10 },
    { name: "Take Out Garbage", points: 15 },
    { name: "Load Dishwasher", points: 15 },
    { name: "Read a Book", points: 10 },
  ]

  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-2">iKidO</h1>
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
      <div className="bg-[#0D3A5C] rounded-2xl p-4 space-y-3">
        {tasks.map((task, index) => (
          <div key={index} className="flex justify-between items-center text-white">
            <span className="font-semibold">{task.name}</span>
            <span className="text-[#FFD369] font-bold">{task.points} p</span>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={() => onNavigate("rewards")}
          className="flex-1 bg-[#0D3A5C] hover:bg-[#0A2A47] text-white font-bold py-3 rounded-full transition-colors"
        >
          Rewards
        </button>
        <button
          onClick={() => onNavigate("assign-tasks")}
          className="flex-1 bg-[#0D3A5C] hover:bg-[#0A2A47] text-white font-bold py-3 rounded-full transition-colors"
        >
          Tasks
        </button>
      </div>
    </div>
  )
}
