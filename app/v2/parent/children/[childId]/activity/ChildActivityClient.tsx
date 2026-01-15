"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PanelCard,
  IkidoLogo,
  SecondaryButton,
} from "@/components/ikido";
import {
  ArrowLeft,
  LogOut,
  CheckCircle2,
  Clock,
  Gift,
  Award,
  Calendar,
  Activity,
} from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";
import type { ActivityEvent } from "./page";

interface ChildActivityClientProps {
  child: {
    id: string;
    name: string;
    points_balance: number;
    child_code?: string;
  };
  events: ActivityEvent[];
}

type FilterType = "all" | "completed" | "pending" | "rewards";

/**
 * V2 Child Activity Client
 * Displays activity history with client-side filtering
 */
export function ChildActivityClient({
  child,
  events,
}: ChildActivityClientProps) {
  const router = useRouter();
  const logout = useSessionStore((state) => state.logout);

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const handleLogout = async () => {
    await logout();
    router.push("/v2/parent/login");
    router.refresh();
  };

  // Filter events based on active filter
  const filteredEvents = useMemo(() => {
    switch (activeFilter) {
      case "completed":
        return events.filter(
          (e) => e.type === "task_completed" || e.type === "task_approved"
        );
      case "pending":
        return events.filter((e) => e.type === "task_pending");
      case "rewards":
        return events.filter((e) => e.type === "reward_claimed");
      default:
        return events;
    }
  }, [events, activeFilter]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Get icon for event type
  const getEventIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "task_approved":
        return <Award className="w-5 h-5 text-green-400" />;
      case "task_completed":
        return <CheckCircle2 className="w-5 h-5 text-[var(--ik-accent-cyan)]" />;
      case "task_pending":
        return <Clock className="w-5 h-5 text-[var(--ik-accent-yellow)]" />;
      case "reward_claimed":
        return <Gift className="w-5 h-5 text-purple-400" />;
      default:
        return <Activity className="w-5 h-5 text-white" />;
    }
  };

  // Get status badge
  const getStatusBadge = (event: ActivityEvent) => {
    const baseClasses = "text-xs font-bold px-2 py-0.5 rounded-full";

    switch (event.status) {
      case "approved":
        return (
          <span className={`${baseClasses} bg-green-500/20 text-green-400`}>
            Approved
          </span>
        );
      case "completed":
        return (
          <span className={`${baseClasses} bg-[var(--ik-accent-cyan)]/20 text-[var(--ik-accent-cyan)]`}>
            Completed
          </span>
        );
      case "pending":
        return (
          <span className={`${baseClasses} bg-[var(--ik-accent-yellow)]/20 text-[var(--ik-accent-yellow)]`}>
            Pending
          </span>
        );
      case "claimed":
        return (
          <span className={`${baseClasses} bg-purple-500/20 text-purple-400`}>
            Redeemed
          </span>
        );
      default:
        return null;
    }
  };

  // Filter buttons config
  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: events.length },
    {
      key: "completed",
      label: "Tasks",
      count: events.filter(
        (e) => e.type === "task_completed" || e.type === "task_approved"
      ).length,
    },
    {
      key: "pending",
      label: "Pending",
      count: events.filter((e) => e.type === "task_pending").length,
    },
    {
      key: "rewards",
      label: "Rewards",
      count: events.filter((e) => e.type === "reward_claimed").length,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/v2/parent/dashboard"
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </Link>

        <IkidoLogo />

        <button
          onClick={handleLogout}
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6">
        {/* Child Summary Card */}
        <PanelCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--ik-accent-cyan)]/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-[var(--ik-accent-cyan)]" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[var(--ik-accent-yellow)]">
                  {child.name}
                </h1>
                <p className="text-[var(--ik-text-muted)] text-xs">
                  Activity History
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[var(--ik-text-muted)] text-xs">Balance</p>
              <div className="flex items-center gap-1">
                <span className="text-xl font-black text-[var(--ik-accent-yellow)]">
                  {child.points_balance}
                </span>
                <span className="text-[var(--ik-accent-cyan)] text-xs">🪙</span>
              </div>
            </div>
          </div>
        </PanelCard>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeFilter === filter.key
                  ? "bg-[var(--ik-accent-yellow)] text-black"
                  : "bg-[var(--ik-surface-1)] text-white border-2 border-[var(--ik-outline-light)] hover:border-[var(--ik-accent-yellow)]"
              }`}
            >
              <span>{filter.label}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeFilter === filter.key
                    ? "bg-black/20 text-black"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Time Range Indicator */}
        <div className="flex items-center gap-2 text-[var(--ik-text-muted)] text-sm">
          <Calendar className="w-4 h-4" />
          <span>Recent activity (last 50 events)</span>
        </div>

        {/* Activity List */}
        <PanelCard className="space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-[var(--ik-text-muted)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--ik-text-muted)]">
                {activeFilter === "all"
                  ? "No activity yet"
                  : `No ${activeFilter} activity`}
              </p>
              <p className="text-[var(--ik-text-muted)] text-sm mt-1">
                {activeFilter === "all"
                  ? "Assign tasks to get started!"
                  : "Try a different filter"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-[var(--ik-surface-1)] border border-[var(--ik-outline-light)] rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-[var(--ik-surface-2)] flex items-center justify-center shrink-0">
                      {getEventIcon(event.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">
                            {event.title}
                          </p>
                          {event.subtitle && (
                            <p className="text-[var(--ik-text-muted)] text-xs truncate mt-0.5">
                              {event.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Points Delta */}
                        <div
                          className={`shrink-0 font-bold text-sm ${
                            event.pointsDelta >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {event.pointsDelta >= 0 ? "+" : ""}
                          {event.pointsDelta} GG
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(event)}
                        <span className="text-[var(--ik-text-muted)] text-xs">
                          {formatDate(event.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        {/* Link to Dashboard */}
        <div className="text-center">
          <Link href="/v2/parent/dashboard">
            <SecondaryButton>Back to Dashboard</SecondaryButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
