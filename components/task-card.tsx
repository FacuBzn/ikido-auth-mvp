"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  points: number;
  completed: boolean;
  onComplete: () => void;
}

export function TaskCard({ title, points, completed, onComplete }: TaskCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 px-5 py-4 transition duration-300",
        completed ? "glass-panel-dark text-white" : "glass-panel text-[var(--brand-blue-900)]"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-12 top-1/2 size-40 -translate-y-1/2 rounded-full blur-3xl",
          completed ? "bg-emerald-400/50" : "bg-[var(--brand-yellow-400)]/45"
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition",
              completed
                ? "border-emerald-300 bg-emerald-400 text-[var(--brand-blue-900)]"
                : "border-[var(--brand-blue-500)] bg-white text-[var(--brand-blue-900)]"
            )}
          >
            {completed ? <Check className="size-4" /> : <Star className="size-4" />}
          </span>
          <div className="flex flex-col">
            <span
              className={cn(
                "text-sm font-semibold md:text-base",
                completed ? "line-through text-white/70" : "text-current"
              )}
            >
              {title}
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--brand-blue-600)]/70">
              Daily mission
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="badge-points bg-transparent text-xs text-[var(--brand-blue-900)] shadow-none">
            +{points} GGPoints
          </span>
          {completed ? (
            <span className="rounded-full bg-emerald-400/20 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-emerald-100">
              Completed
            </span>
          ) : (
            <Button
              onClick={onComplete}
              className="rounded-full bg-[var(--brand-blue-600)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[var(--brand-blue-500)]"
            >
              Mark done
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
