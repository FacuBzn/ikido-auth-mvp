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
    <div className="flex h-full w-full flex-col rounded-3xl bg-linear-to-b from-[#0F4C7D] to-[#1A5FA0] px-5 py-6 text-white shadow-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">iKidO</h1>
        <button
          onClick={onLogout}
          className="rounded-full bg-[#0D3A5C] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#0A2A47]"
        >
          Logout
        </button>
      </div>

      <div className="mt-5 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#FFD369]">Hello, {parentName}</h2>
          <p className="text-xs text-white/80">Manage your crew and their GGPoints without leaving this screen.</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onNavigate("parent-manage-children")}
            className="w-full rounded-2xl border border-[#FFD369] bg-[#0D3A5C] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A2A47]"
          >
            Manage Children
          </button>
          <button
            onClick={() => onNavigate("parent-manage-rewards")}
            className="w-full rounded-2xl border border-[#FFD369] bg-[#0D3A5C] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A2A47]"
          >
            Manage Rewards
          </button>
          <button
            onClick={() => onNavigate("parent-manage-tasks")}
            className="w-full rounded-2xl border border-[#FFD369] bg-[#0D3A5C] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A2A47]"
          >
            Create Tasks
          </button>
          <button
            onClick={() => onNavigate("parent-history")}
            className="w-full rounded-2xl border border-[#FFD369] bg-[#0D3A5C] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A2A47]"
          >
            History
          </button>
        </div>

        <div className="space-y-3 rounded-2xl bg-[#0D3A5C] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FFD369]">Your Children</h3>
          {crew.length === 0 ? (
            <p className="text-center text-xs text-gray-300">No children added yet</p>
          ) : (
            <div className="space-y-3">
              {crew.map((child) => (
                <div key={child.id} className="flex items-center justify-between rounded-xl bg-[#0A2A47] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{child.name}</p>
                    <p className="text-xs text-[#FFD369]">{child.points} GGPoints</p>
                  </div>
                  <button
                    onClick={() => onNavigate("child-stats", child.id)}
                    className="rounded-full bg-[#FFD369] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#0F4C7D] transition-colors hover:bg-[#FFC93F]"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

