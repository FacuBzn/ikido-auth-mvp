"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionStore } from "@/store/useSessionStore";
import { useRequireChildAuth } from "@/hooks/useRequireChildAuth";
import { LogOut, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChildSummaryCard } from "@/components/child/ChildSummaryCard";
type TaskFromAPI = {
  child_task_id: string;
  task_id: string;
  title: string;
  description: string | null;
  points: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export function ChildDashboardClient() {
  const router = useRouter();
  const child = useSessionStore((state) => state.child);
  const hydrated = useSessionStore((state) => state._hasHydrated);
  const logout = useSessionStore((state) => state.logout);
  const [tasks, setTasks] = useState<TaskFromAPI[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [ggpoints, setGgpoints] = useState<number>(0);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const { toast } = useToast();

  // Hooks must be called unconditionally
  useRequireChildAuth();


  // Load tasks for the child
  useEffect(() => {
    if (!child?.child_code || !child?.family_code) {
      return;
    }

    const loadTasks = async () => {
      setLoadingTasks(true);
      try {
        const response = await fetch("/api/child/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            child_code: child.child_code,
            family_code: child.family_code,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to load tasks");
        }

        const data = await response.json();
        setTasks(data.tasks || []);
        
        // Update GGPoints if provided
        if (data.ggpoints !== undefined) {
          setGgpoints(data.ggpoints);
        }
      } catch (error) {
        console.error("[child:dashboard] Failed to load tasks:", error);
        toast({
          variant: "destructive",
          title: "Error loading tasks",
          description: error instanceof Error ? error.message : "Could not load tasks. Please try again.",
        });
      } finally {
        setLoadingTasks(false);
      }
    };

    void loadTasks();
    
    // Load GGPoints separately
    const loadPoints = async () => {
      if (!child?.child_code || !child?.family_code) {
        return;
      }
      
      setLoadingPoints(true);
      try {
        const response = await fetch("/api/child/points", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            child_code: child.child_code,
            family_code: child.family_code,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setGgpoints(data.ggpoints || 0);
        }
      } catch (error) {
        console.error("[child:dashboard] Failed to load points:", error);
      } finally {
        setLoadingPoints(false);
      }
    };

    void loadPoints();
  }, [child?.child_code, child?.family_code, toast]);

  const handleCompleteTask = async (taskId: string) => {
    if (!child?.child_code || !child?.family_code) {
      return;
    }

    setCompletingTaskId(taskId);
    try {
      const response = await fetch(`/api/child/tasks/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          child_task_id: taskId,
          child_code: child.child_code,
          family_code: child.family_code,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete task");
      }

      // Reload tasks after completion
      const reloadResponse = await fetch("/api/child/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          child_code: child.child_code,
          family_code: child.family_code,
        }),
      });

      if (reloadResponse.ok) {
        const reloadData = await reloadResponse.json();
        setTasks(reloadData.tasks || []);
        if (reloadData.ggpoints !== undefined) {
          setGgpoints(reloadData.ggpoints);
        }
      }
      
      // Also reload points separately
      if (child?.child_code && child?.family_code) {
        const pointsResponse = await fetch("/api/child/points", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            child_code: child.child_code,
            family_code: child.family_code,
          }),
        });
        
        if (pointsResponse.ok) {
          const pointsData = await pointsResponse.json();
          setGgpoints(pointsData.ggpoints || 0);
        }
      }

      toast({
        title: "Task completed!",
        description: "Great job! Your parent will review it soon.",
      });

      // Refresh child data to update points_balance
      // Note: This would require updating the session store
    } catch (error) {
      console.error("[child:dashboard] Failed to complete task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not complete task. Please try again.",
      });
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Show loader while Zustand hydrates from localStorage
  if (!hydrated) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </main>
    );
  }

  if (!child) {
    return null; // useRequireChildAuth will redirect
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">iKidO</h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-white border-white/30 hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Child Summary Card (Name + GGPoints) */}
        <ChildSummaryCard
          childName={child.name}
          totalPoints={ggpoints}
          loadingPoints={loadingPoints}
        />

        {/* Tasks */}
        <Card className="bg-white/10 border-yellow-400/30 backdrop-blur">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Your Tasks</h2>
            
            {loadingTasks ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                <span className="text-white/70">Loading tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-white/70">No tasks assigned yet</p>
                <p className="text-white/50 text-sm mt-1">
                  Your parent will assign tasks soon!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.child_task_id}
                    className="bg-white/5 border border-yellow-400/20 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {task.title || "Task"}
                        </h3>
                        {task.description && (
                          <p className="text-white/70 text-sm mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-yellow-400 font-semibold">
                            {task.points || 0} GGPoints
                          </span>
                          <span
                            className={
                              task.completed
                                ? "text-green-400"
                                : "text-yellow-400"
                            }
                          >
                            {task.completed
                              ? "✓ Completed"
                              : "○ Pending"}
                          </span>
                        </div>
                      </div>
                      {!task.completed ? (
                        <Button
                          onClick={() => handleCompleteTask(task.child_task_id)}
                          disabled={completingTaskId === task.child_task_id}
                          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                        >
                          {completingTaskId === task.child_task_id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Completing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Complete
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center text-green-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

