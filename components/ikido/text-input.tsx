"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  helper?: string;
  error?: string;
  onChange?: (value: string) => void;
}

/**
 * Text input with iKidO styling
 * Yellow cream background with gold border
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    { label, placeholder, value, onChange, type = "text", helper, className, error, ...props },
    ref
  ) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label className="block text-white font-bold text-sm">{label}</label>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="ik-input w-full px-4 py-3 text-base"
          {...props}
        />
        {helper && !error && (
          <p className="text-[var(--ik-text-muted)] text-xs">{helper}</p>
        )}
        {error && <p className="text-[var(--ik-danger)] text-xs">{error}</p>}
      </div>
    );
  }
);
