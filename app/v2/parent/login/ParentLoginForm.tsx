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
import { loginParent } from "@/lib/repositories/parentRepository";
import { useSessionStore } from "@/store/useSessionStore";

/**
 * V2 Parent Login Form
 * 
 * Auth Pattern: Client-side using parentRepository.loginParent()
 * - Uses createBrowserClient() from @supabase/ssr
 * - Calls supabase.auth.signInWithPassword()
 * - Updates Zustand store with setParent()
 * - Syncs cookies/session same as production flow
 */
export function ParentLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const setParent = useSessionStore((state) => state.setParent);

  const handleBack = () => {
    // Navigate to role selection or home as safe fallback
    // Using "/" as the V2 role selection page doesn't exist yet
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    try {
      // Reuse existing loginParent from parentRepository
      // This handles Supabase auth and creates/repairs parent profile
      const { parent } = await loginParent({
        email: email.trim().toLowerCase(),
        password,
      });

      // Update Zustand store (same pattern as current login)
      setParent(parent);

      // Small delay to ensure Zustand persists and Supabase cookies sync
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Navigate to V2 dashboard
      router.push("/v2/parent/dashboard");
      router.refresh();
    } catch (error) {
      let message = "We could not process your request. Please try again.";

      // Extract error information
      let errorMessage = "";
      let errorStatus: number | undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object") {
        const err = error as { message?: string; status?: number };
        errorMessage = err.message || String(error);
        errorStatus = err.status;
      } else {
        errorMessage = String(error);
      }

      console.error("[V2 ParentLoginForm] Login error:", {
        error: errorMessage,
        status: errorStatus,
        email: email.trim().toLowerCase(),
      });

      // Use the error message if available
      if (errorMessage) {
        message = errorMessage;
      }

      // Provide more helpful messages for common errors
      if (
        message.includes("Invalid login credentials") ||
        message.includes("Invalid")
      ) {
        message =
          "Invalid email or password. Please check your credentials and try again.";
      }

      if (message.includes("Email not confirmed")) {
        message =
          "Please confirm your email address before signing in. Check your inbox for a confirmation link.";
      }

      if (message.includes("temporarily unavailable") || errorStatus === 500) {
        message =
          "The authentication service is temporarily unavailable. Please try again in a few moments.";
      }

      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || !email.trim() || !password.trim();

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
            Parent Login
          </h1>

          {/* Login Panel */}
          <PanelCard className="space-y-5">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Error Message */}
              {serverError && (
                <div className="bg-[var(--ik-danger)]/20 border-2 border-[var(--ik-danger)] text-white text-sm p-3 rounded-xl flex items-start gap-2">
                  <span className="text-lg shrink-0">⚠️</span>
                  <span>{serverError}</span>
                </div>
              )}

              {/* Email Input */}
              <TextInput
                label="Email Address"
                type="email"
                placeholder="test001@test.com"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                disabled={isSubmitting}
              />

              {/* Password Input */}
              <TextInput
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                disabled={isSubmitting}
              />

              {/* Submit Button */}
              <PrimaryButton
                type="submit"
                disabled={isSubmitDisabled}
                loading={isSubmitting}
                fullWidth
                size="lg"
              >
                Login
              </PrimaryButton>
            </form>

            {/* Register Link */}
            <div className="text-center pt-2">
              <p className="text-[var(--ik-text-muted)] text-sm mb-2">
                Don&apos;t have an account?
              </p>
              <Link
                href="/v2/parent/register"
                className="text-[var(--ik-accent-yellow)] font-bold underline underline-offset-2 hover:text-[var(--ik-accent-yellow-dark)] transition-colors"
              >
                Create one now
              </Link>
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
