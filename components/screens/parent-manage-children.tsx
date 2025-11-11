"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

type ParentManageChildrenProps = {
  crew: Array<{ id: string; name: string; points: number }>;
  onBack: () => void;
  onAddChild: (name: string) => void;
  onRemoveChild: (id: string) => void;
};

export function ParentManageChildren({ crew, onBack, onAddChild, onRemoveChild }: ParentManageChildrenProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a name");
      return;
    }

    onAddChild(trimmed);
    setName("");
    setError(null);
  };

  return (
    <div className="w-full max-w-sm rounded-3xl bg-linear-to-b from-[#0F4C7D] to-[#1A5FA0] px-6 pb-6 pt-16 text-white shadow-2xl">
      <button
        onClick={onBack}
        className="mb-6 text-sm font-bold text-[#FFD369] transition-colors hover:text-[#FFC93F]"
      >
        ← Back
      </button>

      <h1 className="mb-2 text-3xl font-bold">Family Crew</h1>
      <p className="mb-6 text-sm text-gray-200">Add or remove cadets linked to your clan.</p>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-[#0D3A5C] p-4">
        <div>
          <label className="mb-2 block text-sm font-bold text-[#FFD369]" htmlFor="child-name">
            Child Name
          </label>
          <input
            id="child-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Gerónimo"
            className="w-full rounded-xl border-2 border-[#FFD369] bg-[#1A5FA0] px-4 py-3 font-semibold text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
          />
        </div>
        {error && <p className="text-sm font-semibold text-red-300">{error}</p>}
        <Button type="submit" className="w-full rounded-2xl bg-[#FFD369] py-3 font-bold text-[#0F4C7D] hover:bg-[#FFC93F]">
          Add Child
        </Button>
      </form>

      <h2 className="mt-6 mb-3 text-xl font-bold text-[#FFD369]">Current Crew</h2>
      <div className="space-y-3 rounded-2xl bg-[#0D3A5C] p-4">
        {crew.length === 0 ? (
          <p className="text-center text-gray-300">No cadets yet. Add your first one above.</p>
        ) : (
          crew.map((child) => (
            <div key={child.id} className="flex items-center justify-between rounded-xl bg-[#0A2A47] px-4 py-3">
              <div>
                <p className="font-semibold">{child.name}</p>
                <p className="text-sm text-[#FFD369]">{child.points} GGPoints</p>
              </div>
              <button
                onClick={() => onRemoveChild(child.id)}
                className="rounded-lg bg-[#FFD369] px-4 py-2 text-sm font-bold text-[#0F4C7D] transition-colors hover:bg-[#FFC93F]"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

