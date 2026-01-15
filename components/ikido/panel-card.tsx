"use client";

import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PanelCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "light" | "highlight";
}

const variantClasses = {
  default: "ik-panel",
  light:
    "bg-[#5a8ac9] border-[3px] border-[var(--ik-outline-light)] rounded-[var(--ik-radius-panel)] shadow-[var(--ik-shadow-panel)]",
  highlight:
    "bg-gradient-to-br from-[var(--ik-surface-light)] to-[var(--ik-surface-2)] border-[3px] border-[var(--ik-accent-yellow)] rounded-[var(--ik-radius-panel)] shadow-[var(--ik-shadow-panel)]",
};

/**
 * Panel card container - main content wrapper
 * @param variant - "default" | "light" | "highlight"
 */
export function PanelCard({
  children,
  className,
  variant = "default",
  ...props
}: PanelCardProps) {
  return (
    <div className={cn(variantClasses[variant], "p-4", className)} {...props}>
      {children}
    </div>
  );
}
