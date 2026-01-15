"use client";

import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: "px-4 py-2 text-sm min-h-[40px]",
  md: "px-6 py-3 text-base min-h-[48px]",
  lg: "px-8 py-4 text-lg min-h-[56px]",
};

/**
 * Primary yellow button - main CTA
 * Uses gradient from --ik-accent-yellow to --ik-accent-yellow-dark
 */
export function PrimaryButton({
  children,
  loading,
  className,
  icon,
  size = "md",
  fullWidth,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "ik-btn-primary flex items-center justify-center gap-2",
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}

/**
 * Secondary button - secondary actions
 * Uses surface gradient with light outline
 */
export function SecondaryButton({
  children,
  loading,
  className,
  icon,
  size = "md",
  fullWidth,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "ik-btn-secondary flex items-center justify-center gap-2",
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}

/**
 * Cyan button - accent/highlight actions
 * Uses gradient from --ik-accent-cyan to --ik-accent-cyan-dark
 */
export function CyanButton({
  children,
  loading,
  className,
  icon,
  size = "md",
  fullWidth,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "ik-btn-cyan flex items-center justify-center gap-2",
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
