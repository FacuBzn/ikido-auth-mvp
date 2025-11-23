"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus } from "lucide-react"

interface TaskCreationPageProps {
  onSave: () => void
  onCancel: () => void
}

export function TaskCreationPage({ onSave, onCancel }: TaskCreationPageProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [points, setPoints] = useState(10)
  const [selectedChild, setSelectedChild] = useState("gerónimo")

  const handleSave = () => {
    if (title && points > 0) {
      onSave()
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={onCancel}
          className="flex items-center text-white/70 hover:text-white transition font-semibold mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-[#0F4C7D] mb-6">Create New Task</h1>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
              <Input
                type="text"
                placeholder="e.g., Clean Your Room"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-50 border-gray-200 text-lg"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="Describe the task in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C7D] resize-none"
                rows={4}
              />
            </div>

            {/* Points Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">GGPoints Value</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPoints(Math.max(1, points - 5))}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  −
                </button>
                <div className="text-center flex-1">
                  <p className="text-4xl font-bold text-[#FFD369]">{points}</p>
                </div>
                <button
                  onClick={() => setPoints(Math.min(100, points + 5))}
                  className="px-4 py-2 bg-[#FFD369] text-[#0F4C7D] rounded-lg font-semibold hover:bg-yellow-300 transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Child Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to Child</label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C7D]"
              >
                <option value="gerónimo">👦 Gerónimo</option>
                <option value="sofia">👧 Sofia</option>
                <option value="juan">👦 Juan</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onCancel}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 hover:bg-gray-300 transition"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-[#0F4C7D] to-[#1A5FA0] text-white font-semibold py-3 hover:shadow-lg transition"
              >
                <Plus className="w-4 h-4 mr-2" />
                Save Task
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
