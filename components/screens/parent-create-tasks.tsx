"use client";

import { useState } from "react";

type ParentCreateTasksProps = {
  onBack: () => void;
  onTaskCreated: (task: { name: string; points: number; description: string }) => void;
};

export function ParentCreateTasks({ onBack, onTaskCreated }: ParentCreateTasksProps) {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(10);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!taskName.trim()) {
      setError("Task name is required");
      return;
    }

    onTaskCreated({
      name: taskName.trim(),
      description: description.trim() || taskName.trim(),
      points,
    });
    setTaskName("");
    setDescription("");
    setPoints(10);
    setError("");
  };

  return (
    <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-6 text-white shadow-2xl">
      <button
        onClick={onBack}
        className="mb-6 text-sm font-bold text-[#FFD369] transition-colors hover:text-[#FFC93F]"
      >
        ← Back
      </button>
      <h1 className="mb-2 text-3xl font-bold">Create Task</h1>
      <p className="mb-6 text-sm text-gray-200">Add new missions for your cadets.</p>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-bold text-[#FFD369]">Task Name</label>
          <input
            value={taskName}
            onChange={(event) => setTaskName(event.target.value)}
            placeholder="Clean your room"
            className="w-full rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#FFD369]">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Make sure the bed is made and toys are organized."
            rows={3}
            className="w-full rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#FFD369]">Points</label>
          <input
            type="number"
            value={points}
            min={5}
            max={500}
            onChange={(event) => setPoints(Number(event.target.value))}
            className="w-full rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
          />
        </div>

        {error && <p className="text-sm font-semibold text-red-300">{error}</p>}

        <button
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-[#FFD369] py-3 font-bold text-[#0F4C7D] transition-colors hover:bg-[#FFC93F]"
        >
          Save Task
        </button>
      </div>
    </div>
  );
}

