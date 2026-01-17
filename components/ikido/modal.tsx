"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  variant?: "solid" | "glassy";
}

/**
 * IKIDO Modal Component
 * 
 * Reusable modal with:
 * - Dark backdrop with blur (bg-black/60 backdrop-blur-sm)
 * - Body scroll lock when open
 * - Proper z-index (z-50)
 * - IKIDO styling (solid or glassy variant)
 * - Click outside to close (optional)
 * 
 * Variants:
 * - "solid" (default): More opaque background for better readability
 * - "glassy": Semi-transparent glassy effect
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
  closeOnBackdropClick = true,
  variant = "solid",
}: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current overflow
      const originalOverflow = document.body.style.overflow;
      // Lock scroll
      document.body.style.overflow = "hidden";

      // Cleanup: restore scroll on unmount or close
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the content
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative z-50 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-200",
          // Variant styles
          variant === "solid"
            ? "bg-[#0D1B2A] border-2 border-[#1B263B] rounded-3xl p-6 shadow-2xl"
            : "bg-[var(--ik-bg-dark)] border-2 border-[var(--ik-accent-yellow)] rounded-2xl p-6",
          className
        )}
        style={variant === "solid" ? { backgroundColor: "#0D1B2A" } : undefined}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking content
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between">
            {title && (
              <h3 id="modal-title" className="text-lg font-bold text-white">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  "rounded-full p-2 transition-colors",
                  variant === "solid"
                    ? "text-white/70 hover:text-white bg-white/5 hover:bg-white/10"
                    : "text-[var(--ik-text-muted)] hover:text-white"
                )}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
