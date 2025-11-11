"use client";

import { useState } from "react";

type LoginScreenProps = {
  onLogin: (role: "parent" | "child", name: string) => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [step, setStep] = useState<"role" | "name">("role");
  const [selectedRole, setSelectedRole] = useState<"parent" | "child" | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleRoleSelect = (role: "parent" | "child") => {
    setSelectedRole(role);
    setStep("name");
    setError("");
  };

  const handleNameSubmit = () => {
    if (!selectedRole) {
      setError("Please choose a role first");
      return;
    }

    if (name.trim()) {
      setError("");
      onLogin(selectedRole, name.trim());
    } else {
      setError("Please enter a name");
    }
  };

  return (
    <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-6 text-white shadow-2xl">
      <h1 className="mb-2 text-3xl font-bold">iKidO</h1>
      <h2 className="mb-8 text-2xl font-bold text-[#FFD369]">Welcome!</h2>

      {step === "role" ? (
        <>
          <p className="mb-6 text-center text-lg font-semibold">Are you a parent or a child?</p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleRoleSelect("parent")}
              className="rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] py-4 text-lg font-bold text-white transition-colors hover:bg-[#0A2A47]"
            >
              Parent
            </button>
            <button
              onClick={() => handleRoleSelect("child")}
              className="rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] py-4 text-lg font-bold text-white transition-colors hover:bg-[#0A2A47]"
            >
              Child
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-6 text-center text-lg font-semibold">
            {selectedRole === "parent" ? "What's your name?" : "What's your name?"}
          </p>
          <div className="mb-8 rounded-2xl bg-[#0D3A5C] p-6">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl border-2 border-[#FFD369] bg-[#1A5FA0] px-4 py-3 font-semibold text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
            />
          </div>
          {error && <p className="mb-4 text-center font-semibold text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep("role");
                setName("");
              }}
              className="flex-1 rounded-2xl bg-[#0D3A5C] py-3 font-bold text-white transition-colors hover:bg-[#0A2A47]"
            >
              Back
            </button>
            <button
              onClick={handleNameSubmit}
              className="flex-1 rounded-2xl bg-[#FFD369] py-3 font-bold text-[#0F4C7D] transition-colors hover:bg-[#FFC93F]"
            >
              Let&apos;s Play!
            </button>
          </div>
        </>
      )}

      <p className="mt-8 text-center text-sm text-gray-300">Complete tasks and earn GGPoints!</p>
    </div>
  );
}

