"use client";

type ParentDashboardScreen = "parent-manage-children" | "parent-manage-rewards" | "parent-manage-tasks" | "parent-history" | "child-stats";

type ParentDashboardProps = {
  parentName: string;
  crew: Array<{ id: string; name: string; points: number }>;
  onNavigate: (screen: ParentDashboardScreen, childId?: string) => void;
  onLogout: () => void;
};

export function ParentDashboard({ parentName, crew, onNavigate, onLogout }: ParentDashboardProps) {
  return (
    <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-6 text-white shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">iKidO</h1>
        <button
          onClick={onLogout}
          className="rounded-lg bg-[#0D3A5C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0A2A47]"
        >
          Logout
        </button>
      </div>

      <h2 className="mb-8 text-2xl font-bold text-[#FFD369]">Hello, {parentName}</h2>

      <div className="space-y-4">
        <button
          onClick={() => onNavigate("parent-manage-children")}
          className="w-full rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] py-4 text-white transition-colors hover:bg-[#0A2A47]"
        >
          Manage Children
        </button>
        <button
          onClick={() => onNavigate("parent-manage-rewards")}
          className="w-full rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] py-4 text-white transition-colors hover:bg-[#0A2A47]"
        >
          Manage Rewards
        </button>
        <button
          onClick={() => onNavigate("parent-manage-tasks")}
          className="w-full rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] py-4 text-white transition-colors hover:bg-[#0A2A47]"
        >
          Create Tasks
        </button>
        <button
          onClick={() => onNavigate("parent-history")}
          className="w-full rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] py-4 text-white transition-colors hover:bg-[#0A2A47]"
        >
          History
        </button>
      </div>

      <h3 className="mt-8 mb-4 text-xl font-bold text-[#FFD369]">Your Children</h3>
      <div className="space-y-3 rounded-2xl bg-[#0D3A5C] p-4">
        {crew.length === 0 ? (
          <p className="text-center text-gray-300">No children added yet</p>
        ) : (
          crew.map((child) => (
            <div key={child.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{child.name}</p>
                <p className="text-sm text-[#FFD369]">{child.points} GGPoints</p>
              </div>
              <button
                onClick={() => onNavigate("child-stats", child.id)}
                className="rounded-lg bg-[#FFD369] px-4 py-2 text-sm font-bold text-[#0F4C7D] transition-colors hover:bg-[#FFC93F]"
              >
                View
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

