"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import type { Database } from "@/types/supabase";

type ChildrenRow = Database["public"]["Tables"]["children"]["Row"];
type TasksRow = Database["public"]["Tables"]["tasks"]["Row"];
type RewardsRow = Database["public"]["Tables"]["rewards"]["Row"];

type ChildSummary = {
  id: string;
  name: string;
  earned: number;
  spent: number;
  balance: number;
  completedTasks: number;
  claimedRewards: number;
};

type ChildrenSummaryModalProps = {
  parentId: string;
};

export const ChildrenSummaryModal = ({ parentId }: ChildrenSummaryModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ChildSummary[]>([]);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: childrenData, error: childrenError } = await supabase
          .from("children")
          .select("id, name")
          .eq("parent_id", parentId);

        if (childrenError) {
          throw childrenError;
        }

        const typedChildren = (childrenData ?? []) as ChildrenRow[];

        if (typedChildren.length === 0) {
          if (!cancelled) {
            setSummary([]);
          }
          return;
        }

        const childIds = typedChildren.map((child) => child.id);

        const [tasksResult, rewardsResult] = await Promise.all([
          childIds.length > 0
            ? supabase
                .from("tasks")
                .select("child_id, points, completed")
                .in("child_id", childIds)
            : Promise.resolve({ data: [] as TasksRow[], error: null }),
          childIds.length > 0
            ? supabase
                .from("rewards")
                .select("child_id, cost, claimed")
                .in("child_id", childIds)
            : Promise.resolve({ data: [] as RewardsRow[], error: null }),
        ]);

        if (tasksResult.error) {
          throw tasksResult.error;
        }

        if (rewardsResult.error) {
          throw rewardsResult.error;
        }

        const tasks = (tasksResult.data ?? []) as TasksRow[];
        const rewards = (rewardsResult.data ?? []) as RewardsRow[];

        const computedSummary = typedChildren.map<ChildSummary>((child) => {
          const childTasks = tasks.filter((task) => task.child_id === child.id);
          const childRewards = rewards.filter((reward) => reward.child_id === child.id);

          const completedTasks = childTasks.filter((task) => task.completed).length;
          const earned = childTasks
            .filter((task) => task.completed)
            .reduce((acc, task) => acc + (task.points ?? 0), 0);

          const claimedRewards = childRewards.filter((reward) => reward.claimed).length;
          const spent = childRewards
            .filter((reward) => reward.claimed)
            .reduce((acc, reward) => acc + (reward.cost ?? 0), 0);

          return {
            id: child.id,
            name: child.name ?? "Unnamed child",
            earned,
            spent,
            balance: earned - spent,
            completedTasks,
            claimedRewards,
          };
        });

        if (!cancelled) {
          setSummary(computedSummary);
        }
      } catch (cause) {
        if (!cancelled) {
          const message =
            cause instanceof Error
              ? cause.message
              : "We could not load the children summary. Please try again.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [open, parentId, supabase]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full bg-white/20 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30">
          View children summary
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-950 text-white sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Users className="size-5" />
            Children overview
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Review the GGPoints earned and spent by each child. Keep an eye on their balance to plan the next rewards.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-10 text-slate-200">
            <Loader2 className="size-5 animate-spin" />
            <span>Loading children summary…</span>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="border-red-500/40 bg-red-500/10 text-red-50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : summary.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-slate-200">
            No children are linked to this parent account yet. Add a child to start tracking GGPoints.
          </div>
        ) : (
          <div className="space-y-4">
            {summary.map((child) => (
              <div
                key={child.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 transition hover:border-white/20"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{child.name}</p>
                    <p className="text-sm text-slate-300">
                      {child.completedTasks} completed tasks · {child.claimedRewards} rewards claimed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-300">Balance</p>
                    <p className="text-2xl font-bold text-white">{child.balance} GGPoints</p>
                    <p className="text-xs text-slate-400">
                      Earned {child.earned} · Spent {child.spent}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" className="rounded-full bg-white/20 text-white hover:bg-white/30">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


