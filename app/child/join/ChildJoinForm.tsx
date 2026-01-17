"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PrimaryButton,
  PanelCard,
  TextInput,
  IkidoLogo,
} from "@/components/ikido";
import { ArrowLeft } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";
import { createBrowserClient } from "@/lib/supabaseClient";

/**
 * V2 Child Join Form
 * 
 * Auth Pattern: Client-side using Zustand + API route
 * - POST /api/child/login with child_code only
 * - Updates Zustand store with setChild()
 * - No Supabase Auth for children (uses custom session)
 */
export function ChildJoinForm() {
  const [childCode, setChildCode] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const setChild = useSessionStore((state) => state.setChild);

  const handleBack = () => {
    // Navigate back or fallback to parent login
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/parent/login");
    }
  };

  const handleJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    try {
      const childCodeNormalized = childCode.trim().toUpperCase();

      // Client-side validation
      if (!childCodeNormalized || childCodeNormalized.length < 3) {
        setServerError("Child code must be at least 3 characters");
        setIsSubmitting(false);
        return;
      }

      // Force logout any parent session before child login
      // (same pattern as current implementation)
      const supabase = createBrowserClient();
      await supabase.auth.signOut();

      // Call existing API endpoint
      const response = await fetch("/api/child/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          child_code: childCodeNormalized,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes from API
        if (data.error === "PARENT_LOGGED_IN") {
          setServerError(
            "A parent is logged in. Please log out before entering child mode."
          );
        } else if (data.error === "INVALID_CHILD_CODE") {
          setServerError(
            "Invalid child code. Make sure your parent created your account."
          );
        } else if (data.error === "DATABASE_ERROR") {
          setServerError(
            data.message || "Something went wrong. Please try again."
          );
        } else {
          setServerError(
            data.message || "We could not process your request. Please try again."
          );
        }
        return;
      }

      // Success - set child in Zustand store
      setChild({
        id: data.child.id,
        parent_id: data.child.parent_id,
        name: data.child.name,
        family_code: data.child.family_code,
        child_code: data.child.child_code,
        points_balance: data.child.points_balance,
        created_at: data.child.created_at,
      });

      // Small delay to ensure Zustand persists (same as current flow)
      await new Promise((resolve) => setTimeout(resolve, 120));

      // Navigate to V2 child dashboard
      router.push("/child/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not process your request. Please try again.";

      console.error("[V2 ChildJoinForm] Join error:", error);
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    isSubmitting || !childCode.trim() || childCode.trim().length < 3;

  // Format input to uppercase as user types
  const handleCodeChange = (value: string) => {
    setChildCode(value.toUpperCase());
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>

        {/* Logo */}
        <IkidoLogo />

        {/* Empty space for alignment */}
        <div className="w-[88px]" />
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm">
          {/* Title */}
          <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)] text-center mb-6">
            Welcome, Player!
          </h1>

          {/* Join Panel */}
          <PanelCard className="space-y-5">
            <form onSubmit={handleJoin} className="space-y-5">
              {/* Error Message */}
              {serverError && (
                <div className="bg-[var(--ik-danger)]/20 border-2 border-[var(--ik-danger)] text-white text-sm p-3 rounded-xl flex items-start gap-2">
                  <span className="text-lg shrink-0">⚠️</span>
                  <span>{serverError}</span>
                </div>
              )}

              {/* Child Code Input */}
              <TextInput
                label="Your Child Code"
                type="text"
                placeholder="YOURNAME#1234"
                value={childCode}
                onChange={handleCodeChange}
                helper="Ask your parent for your unique child code"
                disabled={isSubmitting}
                autoComplete="off"
                autoCapitalize="characters"
              />

              {/* Submit Button */}
              <PrimaryButton
                type="submit"
                disabled={isSubmitDisabled}
                loading={isSubmitting}
                fullWidth
                size="lg"
              >
                Enter Game
              </PrimaryButton>
            </form>

            {/* Help Box */}
            <div className="bg-[var(--ik-surface-1)] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-white font-semibold text-sm">
                    Need your code?
                  </p>
                  <p className="text-[var(--ik-text-muted)] text-xs mt-1">
                    Ask your parent for your unique child code!
                  </p>
                </div>
              </div>
            </div>

            {/* Parent Login Link */}
            <div className="text-center pt-2">
              <p className="text-[var(--ik-text-muted)] text-sm mb-2">
                Are you a parent?
              </p>
              <Link
                href="/parent/login"
                className="text-[var(--ik-accent-cyan)] font-bold underline underline-offset-2 hover:text-[var(--ik-accent-cyan-dark)] transition-colors"
              >
                Go to Parent Login
              </Link>
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
