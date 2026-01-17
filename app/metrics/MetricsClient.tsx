"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/ikido/top-bar";
import { PanelCard } from "@/components/ikido/panel-card";
import { PrimaryButton } from "@/components/ikido/buttons";
import { Users, Calendar, TrendingUp, Loader2, AlertCircle } from "lucide-react";

interface MetricsData {
  range: {
    from: string;
    to: string;
  };
  unique_users_total: number;
  unique_users_by_day: Array<{
    date: string;
    unique_users: number;
  }>;
  unique_users_by_role: Array<{
    role: string;
    unique_users: number;
  }>;
}

/**
 * Metrics Client Component
 * 
 * Fetches and displays login metrics with date range filtering.
 * Mobile-first IKIDO UI.
 * 
 * Accessible only via direct URL: /metrics
 */
export function MetricsClient() {
  const router = useRouter();

  // Date range state (default: last 30 days)
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Metrics data
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize default dates (last 30 days)
  useEffect(() => {
    if (!isInitialized) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      setToDate(today.toISOString().split("T")[0]);
      setFromDate(thirtyDaysAgo.toISOString().split("T")[0]);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const response = await fetch(`/api/metrics/logins?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch metrics: ${response.status}`
        );
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error("[MetricsClient] Failed to fetch metrics:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load metrics"
      );
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  // Fetch metrics when dates change
  useEffect(() => {
    if (isInitialized && fromDate && toDate) {
      fetchMetrics();
    }
  }, [fromDate, toDate, isInitialized, fetchMetrics]);

  const handleApply = () => {
    if (fromDate && toDate) {
      fetchMetrics();
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 ik-bg-gradient">
      {/* Top Bar */}
      <TopBar
        showBack
        onBack={() => router.push("/parent/dashboard")}
      />

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-black text-[var(--ik-accent-yellow)] mb-1">
            Login Metrics
          </h1>
          <p className="text-[var(--ik-text-muted)] text-sm">
            Unique user login statistics
          </p>
        </div>

        {/* Date Range Filters */}
        <PanelCard>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-[var(--ik-accent-cyan)]" />
              <h2 className="text-lg font-bold text-white">Date Range</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[var(--ik-text-muted)] mb-2">
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] rounded-xl text-white text-sm focus:outline-none focus:border-[var(--ik-accent-cyan)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--ik-text-muted)] mb-2">
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] rounded-xl text-white text-sm focus:outline-none focus:border-[var(--ik-accent-cyan)] transition-colors"
                />
              </div>
            </div>

            <PrimaryButton onClick={handleApply} fullWidth icon={<TrendingUp className="w-4 h-4" />}>
              Apply Filter
            </PrimaryButton>
          </div>
        </PanelCard>

        {/* Error Banner */}
        {error && (
          <div className="bg-[var(--ik-danger)]/20 border-2 border-[var(--ik-danger)] text-white p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">Error</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <PanelCard>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-[var(--ik-accent-cyan)] animate-spin" />
            </div>
          </PanelCard>
        )}

        {/* Metrics Data */}
        {!isLoading && !error && metrics && (
          <>
            {/* Total Unique Users Card */}
            <PanelCard variant="highlight">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Users className="w-6 h-6 text-[var(--ik-accent-yellow)]" />
                  <h2 className="text-lg font-bold text-white">
                    Unique Logins
                  </h2>
                </div>
                <div className="text-5xl font-black text-[var(--ik-accent-yellow)] mb-2">
                  {metrics.unique_users_total}
                </div>
                <p className="text-[var(--ik-text-muted)] text-sm">
                  {formatDate(metrics.range.from)} - {formatDate(metrics.range.to)}
                </p>
              </div>
            </PanelCard>

            {/* By Role */}
            {metrics.unique_users_by_role.length > 0 && (
              <PanelCard>
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-white mb-4">
                    By Role
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {metrics.unique_users_by_role.map((item) => (
                      <div
                        key={item.role}
                        className="flex-1 min-w-[120px] bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] rounded-xl p-4"
                      >
                        <div className="text-xs font-semibold text-[var(--ik-text-muted)] mb-1 uppercase">
                          {item.role}
                        </div>
                        <div className="text-2xl font-black text-[var(--ik-accent-cyan)]">
                          {item.unique_users}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PanelCard>
            )}

            {/* By Day */}
            {metrics.unique_users_by_day.length > 0 && (
              <PanelCard>
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-white mb-4">
                    By Day
                  </h2>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {metrics.unique_users_by_day.map((item) => (
                      <div
                        key={item.date}
                        className="flex items-center justify-between bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] rounded-xl p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-[var(--ik-accent-cyan)]" />
                          <span className="text-sm font-semibold text-white">
                            {formatDate(item.date)}
                          </span>
                        </div>
                        <div className="text-lg font-black text-[var(--ik-accent-yellow)]">
                          {item.unique_users}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PanelCard>
            )}

            {/* Empty State */}
            {metrics.unique_users_total === 0 && (
              <PanelCard>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-[var(--ik-text-muted)] mx-auto mb-3 opacity-50" />
                  <p className="text-[var(--ik-text-muted)]">
                    No login data for this period.
                  </p>
                </div>
              </PanelCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
