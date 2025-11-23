"use client"

import type React from "react"
import { useState } from "react"

interface LoginScreenProps {
  onLogin: (role: "parent" | "child", name: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [step, setStep] = useState<"role" | "name">("role")
  const [selectedRole, setSelectedRole] = useState<"parent" | "child" | null>(null)
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleRoleSelect = (role: "parent" | "child") => {
    setSelectedRole(role)
    setStep("name")
    setError("")
  }

  const handleNameSubmit = () => {
    if (name.trim()) {
      setError("")
      onLogin(selectedRole!, name)
    } else {
      setError("Please enter a name")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit()
    }
  }

  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-2">iKidO</h1>
      <h2 className="text-2xl font-bold text-[#FFD369] mb-8">Welcome!</h2>

      {step === "role" ? (
        <>
          {/* Role Selection */}
          <p className="text-center text-lg font-semibold mb-6">Are you a parent or a child?</p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleRoleSelect("parent")}
              className="bg-[#0D3A5C] hover:bg-[#0A2A47] border-2 border-[#FFD369] text-white font-bold py-4 rounded-2xl transition-colors text-lg"
            >
              Parent
            </button>
            <button
              onClick={() => handleRoleSelect("child")}
              className="bg-[#0D3A5C] hover:bg-[#0A2A47] border-2 border-[#FFD369] text-white font-bold py-4 rounded-2xl transition-colors text-lg"
            >
              Child
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Name Input */}
          <p className="text-center text-lg font-semibold mb-6">
            {selectedRole === "parent" ? "What's your name?" : "What's your name?"}
          </p>
          <div className="bg-[#0D3A5C] rounded-2xl p-6 mb-8">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              className="w-full bg-[#1A5FA0] text-white placeholder-gray-400 border-2 border-[#FFD369] rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
            />
          </div>

          {error && <p className="text-red-400 text-center mb-4 font-semibold">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep("role")
                setName("")
              }}
              className="flex-1 bg-[#0D3A5C] hover:bg-[#0A2A47] text-white font-bold py-3 rounded-2xl transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNameSubmit}
              className="flex-1 bg-[#FFD369] hover:bg-[#FFC93F] text-[#0F4C7D] font-bold py-3 rounded-2xl transition-colors"
            >
              Let's Play!
            </button>
          </div>
        </>
      )}

      <p className="text-center text-gray-300 text-sm mt-8">Complete tasks and earn GGPoints!</p>
    </div>
  )
}
