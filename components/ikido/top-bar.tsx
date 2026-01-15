"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Settings, LogOut } from "lucide-react";

export interface TopBarProps {
  showBack?: boolean;
  onBack?: () => void;
  showSettings?: boolean;
  onSettings?: () => void;
  showLogout?: boolean;
  onLogout?: () => void;
  coins?: number;
  rightContent?: ReactNode;
}

/**
 * Top navigation bar with back button, logo, and action buttons
 */
export function TopBar({
  showBack,
  onBack,
  showSettings,
  onSettings,
  showLogout,
  onLogout,
  coins,
  rightContent,
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack}
            className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <IkidoLogo />
      </div>

      <div className="flex items-center gap-2">
        {coins !== undefined && <PointsPill points={coins} />}
        {rightContent}
        {showSettings && (
          <button
            onClick={onSettings}
            className="w-10 h-10 rounded-full bg-[var(--ik-surface-2)] border-2 border-[var(--ik-outline-light)] flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
        {showLogout && (
          <button
            onClick={onLogout}
            className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>LOGOUT</span>
          </button>
        )}
      </div>
    </div>
  );
}

export interface IkidoLogoProps {
  size?: "small" | "default" | "large";
}

const logoSizeClasses = {
  small: "text-xl px-3 py-1",
  default: "text-2xl px-4 py-2",
  large: "text-3xl px-6 py-3",
};

/**
 * iKidO brand logo component
 */
export function IkidoLogo({ size = "default" }: IkidoLogoProps) {
  return (
    <div
      className={`ik-btn-cyan ${logoSizeClasses[size]} flex items-center gap-2`}
    >
      <span className="text-[var(--ik-accent-yellow)]">✦</span>
      <span className="font-black tracking-wide">iKidO</span>
    </div>
  );
}

export interface PointsPillProps {
  points: number;
  size?: "small" | "default";
  loading?: boolean;
}

const pillSizeClasses = {
  small: "text-xs px-2 py-1",
  default: "text-sm px-3 py-1.5",
};

/**
 * GGPoints display pill
 */
export function PointsPill({
  points,
  size = "default",
  loading = false,
}: PointsPillProps) {
  return (
    <div
      className={`ik-btn-primary ${pillSizeClasses[size]} flex items-center gap-1.5`}
    >
      <span className="text-[var(--ik-accent-yellow-dark)]">🪙</span>
      <span>{loading ? "..." : `${points} GG`}</span>
    </div>
  );
}
