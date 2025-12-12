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
    <Card className="bg-white/10 border-yellow-400/30 backdrop-blur">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          {/* Child Name Section */}
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-sm mb-1">Hello,</p>
            <p className="text-2xl font-bold text-white truncate">{childName}</p>
          </div>

          {/* GGPoints Section */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {loadingPoints ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
                <span className="text-white/70 text-sm">Loading...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Coins className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <p className="text-white/70 text-xs uppercase tracking-wide mb-0.5">
                    GGPoints
                  </p>
                  <p
                    className="text-3xl sm:text-4xl font-bold leading-none"
                    style={{ color: "rgb(249, 165, 17)" }}
                  >
                    {totalPoints}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

