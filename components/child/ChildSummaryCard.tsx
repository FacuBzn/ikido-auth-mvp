"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Coins } from "lucide-react";

type ChildSummaryCardProps = {
  childName: string;
  totalPoints: number;
  loadingPoints?: boolean;
};

export function ChildSummaryCard({
  childName,
  totalPoints,
  loadingPoints = false,
}: ChildSummaryCardProps) {
  return (
    <Card className="bg-[rgb(0,39,96)] border-[rgb(7,81,170)]/40 backdrop-blur shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          {/* Child Name Section */}
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-sm mb-1">Hello,</p>
            <p className="text-2xl font-bold text-white break-words">{childName}</p>
          </div>

          {/* GGPoints Section - Finance Card Style */}
          <div className="flex flex-col gap-2">
            {loadingPoints ? (
              <div className="flex items-center gap-3 py-2">
                <Loader2 className="w-5 h-5 text-[rgb(249,165,17)] animate-spin" />
                <span className="text-white/70 text-sm">Loading balance...</span>
              </div>
            ) : (
              <>
                {/* Label with coin icon */}
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-[rgb(249,165,17)] flex-shrink-0" />
                  <p className="text-white/50 text-[10px] uppercase tracking-[0.15em] font-medium">
                    GGPOINTS
                  </p>
                </div>
                {/* Large number */}
                <p
                  className="text-5xl sm:text-6xl font-extrabold leading-none tracking-tight"
                  style={{ color: "rgb(249, 165, 17)" }}
                >
                  {totalPoints.toLocaleString()}
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

