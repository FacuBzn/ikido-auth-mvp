"use client"

import { useState } from "react"

interface ParentCreateTasksProps {
  onBack: () => void
  onTaskCreated: (task: { name: string; points: number; description: string }) => void
}

export function ParentCreateTasks({ onBack, onTaskCreated }: ParentCreateTasksProps) {
  const [taskName, setTaskName] = useState("")
  const [taskPoints, setTaskPoints] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [error, setError] = useState("")

  const handleCreateTask = () => {
    if (!taskName.trim() || !taskPoints.trim()) {
      setError("Please fill in all fields")
      return
    }

    const points = Number.parseInt(taskPoints)
    if (isNaN(points) || points <= 0) {
      setError("Points must be a positive number")
      return
    }

    onTaskCreated({
      name: taskName,
      points,
      description: taskDescription,
    })

    setTaskName("")
    setTaskPoints("")
    setTaskDescription("")
    setError("")
  }

  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <button onClick={onBack} className="text-[#FFD369] font-bold mb-4 flex items-center gap-2 hover:opacity-80">
        ← Back
      </button>
      <h2 className="text-2xl font-bold text-[#FFD369] mb-6">Create New Task</h2>

      {/* Form */}
      <div className="space-y-4">
        <div className="bg-[#0D3A5C] rounded-2xl p-4">
          <label className="block text-sm font-bold text-[#FFD369] mb-2">Task Name</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="e.g., Clean Room"
            className="w-full bg-[#1A5FA0] text-white placeholder-gray-400 border-2 border-[#FFD369] rounded-xl px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
          />
        </div>

        <div className="bg-[#0D3A5C] rounded-2xl p-4">
          <label className="block text-sm font-bold text-[#FFD369] mb-2">GGPoints Value</label>
          <input
            type="number"
            value={taskPoints}
            onChange={(e) => setTaskPoints(e.target.value)}
            placeholder="e.g., 25"
            className="w-full bg-[#1A5FA0] text-white placeholder-gray-400 border-2 border-[#FFD369] rounded-xl px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
          />
        </div>

        <div className="bg-[#0D3A5C] rounded-2xl p-4">
          <label className="block text-sm font-bold text-[#FFD369] mb-2">Description (Optional)</label>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Task details..."
            className="w-full bg-[#1A5FA0] text-white placeholder-gray-400 border-2 border-[#FFD369] rounded-xl px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFD369] h-20 resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-center font-semibold">{error}</p>}

        <button
          onClick={handleCreateTask}
          className="w-full bg-[#FFD369] hover:bg-[#FFC93F] text-[#0F4C7D] font-bold py-4 rounded-2xl transition-colors"
        >
          Create Task
        </button>
      </div>
    </div>
  )
}
