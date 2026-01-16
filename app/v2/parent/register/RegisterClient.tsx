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

/**
 * V2 Parent Register Form
 * 
 * Auth Pattern: Server-side API endpoint
 * - POST /api/parent/register
 * - Uses admin client for secure user creation
 * - Redirects to login on success
 */
export function RegisterClient() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      // Client-side validation
      if (!fullName.trim()) {
        setServerError("Full name is required");
        setIsSubmitting(false);
        return;
      }

      if (!email.trim()) {
        setServerError("Email is required");
        setIsSubmitting(false);
        return;
      }

      if (password.length < 6) {
        setServerError("Password must be at least 6 characters long");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/parent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        let message = data.message || "We could not process your request. Please try again.";

        if (data.error === "EMAIL_ALREADY_EXISTS") {
          message = "This email is already registered. Please sign in instead.";
        } else if (data.error === "INVALID_INPUT") {
          message = data.message || "Please check your input and try again.";
        } else if (data.error === "DATABASE_ERROR") {
          message = "A database error occurred. Please try again in a few moments.";
        }

        setServerError(message);
        setIsSubmitting(false);
        return;
      }

      // Success
      setSuccessMessage("Account created successfully!");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/v2/parent/login");
      }, 1500);
    } catch (error) {
      console.error("[V2 RegisterClient] Registration error:", error);
      setServerError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || !fullName.trim() || !email.trim() || password.length < 6;

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        {/* Back Button */}
        <Link
          href="/v2/parent/login"
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </Link>

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
            Create Parent Account
          </h1>

          {/* Register Panel */}
          <PanelCard className="space-y-5">
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-500/20 border-2 border-green-500 text-green-400 text-sm p-3 rounded-xl flex items-start gap-2">
                  <span className="text-lg shrink-0">✓</span>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Error Message */}
              {serverError && (
                <div className="bg-[var(--ik-danger)]/20 border-2 border-[var(--ik-danger)] text-white text-sm p-3 rounded-xl flex items-start gap-2">
                  <span className="text-lg shrink-0">⚠️</span>
                  <span>{serverError}</span>
                </div>
              )}

              {/* Full Name Input */}
              <TextInput
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={setFullName}
                autoComplete="name"
                disabled={isSubmitting}
              />

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
                autoComplete="new-password"
                disabled={isSubmitting}
              />

              {/* Password Helper */}
              <p className="text-[var(--ik-text-muted)] text-xs -mt-3">
                Minimum 6 characters
              </p>

              {/* Submit Button */}
              <PrimaryButton
                type="submit"
                disabled={isSubmitDisabled}
                loading={isSubmitting}
                fullWidth
                size="lg"
              >
                Create Account
              </PrimaryButton>
            </form>

            {/* Login Link */}
            <div className="text-center pt-2">
              <p className="text-[var(--ik-text-muted)] text-sm mb-2">
                Already have an account?
              </p>
              <Link
                href="/v2/parent/login"
                className="text-[var(--ik-accent-yellow)] font-bold underline underline-offset-2 hover:text-[var(--ik-accent-yellow-dark)] transition-colors"
              >
                Sign in instead
              </Link>
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
