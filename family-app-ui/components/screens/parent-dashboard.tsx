"use client"

import { useState } from "react"

interface ParentDashboardProps {
  parentName: string
  children: Array<{ id: string; name: string; points: number }>
  onNavigate: (screen: string, childId?: string) => void
  onLogout: () => void
  onGenerateCode: () => string
}

export function ParentDashboard({ parentName, children, onNavigate, onLogout, onGenerateCode }: ParentDashboardProps) {
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleGenerateCode = () => {
    const newCode = onGenerateCode()
    setGeneratedCodes([...generatedCodes, newCode])
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">iKidO</h1>
        <button
          onClick={onLogout}
          className="bg-[#0D3A5C] hover:bg-[#0A2A47] text-white font-bold py-2 px-4 rounded-lg text-sm"
        >
          Logout
        </button>
      </div>
      <h2 className="text-2xl font-bold text-[#FFD369] mb-8">Hello, {parentName}</h2>

      {/* Management Options */}
      <div className="space-y-4">
        <button
          onClick={() => onNavigate("manage-children")}
          className="w-full bg-[#0D3A5C] hover:bg-[#0A2A47] border-2 border-[#FFD369] text-white font-bold py-4 rounded-2xl transition-colors"
        >
          Manage Children
        </button>
        <button
          onClick={() => onNavigate("manage-rewards")}
          className="w-full bg-[#0D3A5C] hover:bg-[#0A2A47] border-2 border-[#FFD369] text-white font-bold py-4 rounded-2xl transition-colors"
        >
          Manage Rewards
        </button>
        <button
          onClick={() => onNavigate("manage-tasks")}
          className="w-full bg-[#0D3A5C] hover:bg-[#0A2A47] border-2 border-[#FFD369] text-white font-bold py-4 rounded-2xl transition-colors"
        >
          Create Tasks
        </button>
        <button
          onClick={() => onNavigate("parent-history")}
          className="w-full bg-[#0D3A5C] hover:bg-[#0A2A47] border-2 border-[#FFD369] text-white font-bold py-4 rounded-2xl transition-colors"
        >
          History
        </button>
      </div>

      {/* Children Overview */}
      <h3 className="text-xl font-bold text-[#FFD369] mt-8 mb-4">Your Children</h3>
      <div className="bg-[#0D3A5C] rounded-2xl p-4 space-y-3">
        {children.length === 0 ? (
          <p className="text-gray-300 text-center">No children added yet</p>
        ) : (
          children.map((child) => (
            <div key={child.id} className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{child.name}</p>
                <p className="text-sm text-[#FFD369]">{child.points} GGPoints</p>
              </div>
              <button
                onClick={() => onNavigate("child-info", child.id)}
                className="bg-[#FFD369] hover:bg-[#FFC93F] text-[#0F4C7D] font-bold py-2 px-4 rounded-lg text-sm"
              >
                View
              </button>
            </div>
          ))
        )}
      </div>

      {/* Join Codes for Children */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-[#FFD369] mb-4">Join Codes for Children</h3>
        
        <button
          onClick={handleGenerateCode}
          className="w-full bg-[#FFD369] hover:bg-[#FFC93F] text-[#0F4C7D] font-bold py-3 rounded-lg mb-4 transition-colors"
        >
          + Generate New Code
        </button>

        {generatedCodes.length > 0 ? (
          <div className="bg-[#0D3A5C] rounded-2xl p-4 space-y-2">
            {generatedCodes.map((code, index) => (
              <div key={index} className="flex justify-between items-center bg-[#1A5FA0] p-3 rounded-lg">
                <div>
                  <p className="text-sm text-[#FFD369]">Code {index + 1}</p>
                  <p className="font-mono font-bold text-lg tracking-widest">{code}</p>
                </div>
                <button
                  onClick={() => handleCopyCode(code)}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    copiedCode === code
                      ? "bg-green-500 text-white"
                      : "bg-[#FFD369] text-[#0F4C7D] hover:bg-[#FFC93F]"
                  }`}
                >
                  {copiedCode === code ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0D3A5C] rounded-2xl p-4 text-center text-gray-300">
            <p className="text-sm">No codes generated yet. Create one to let your children join!</p>
          </div>
        )}
      </div>
    </div>
  )
}
