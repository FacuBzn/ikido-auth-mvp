"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { LogIn } from "lucide-react"

interface LoginPageProps {
  onLoginSuccess: (role: "parent" | "child") => void
  onSwitchToRegister: () => void
}

export function LoginPage({ onLoginSuccess, onSwitchToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<"parent" | "child">("child")

  const handleLogin = () => {
    if (email && password) {
      onLoginSuccess(selectedRole)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur border-0 shadow-2xl">
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-[#0F4C7D]">iKidO</h1>
            <p className="text-gray-600 font-medium">Welcome back to GGPoints</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-50 border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Login as</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedRole("parent")}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                    selectedRole === "parent"
                      ? "bg-[#0F4C7D] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👨‍👩‍👧 Parent
                </button>
                <button
                  onClick={() => setSelectedRole("child")}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                    selectedRole === "child"
                      ? "bg-[#FFD369] text-[#0F4C7D]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👧 Child
                </button>
              </div>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-[#0F4C7D] to-[#1A5FA0] text-white font-semibold py-3 rounded-lg hover:shadow-lg transition"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login
          </Button>

          <div className="text-center">
            <p className="text-gray-600 text-sm">
              {"Don't"} have an account?{" "}
              <button onClick={onSwitchToRegister} className="text-[#0F4C7D] font-semibold hover:underline">
                Create new account
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
