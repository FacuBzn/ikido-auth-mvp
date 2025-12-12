"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/navigation/BackButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginParent } from "@/lib/repositories/parentRepository";
import { useSessionStore } from "@/store/useSessionStore";

export const ParentLoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const setParent = useSessionStore((state) => state.setParent);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    try {
      const { parent } = await loginParent({
        email: email.trim().toLowerCase(),
        password,
      });

      setParent(parent);
      // Small delay to ensure Zustand persists and Supabase cookies sync
      await new Promise(resolve => setTimeout(resolve, 150));
      router.push("/parent/dashboard");
      router.refresh();
    } catch (error) {
      let message = "We could not process your request. Please try again.";
      
      // Extract error information more robustly
      let errorMessage = "";
      let errorStatus: number | undefined;
      let errorName = "";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorName = error.name;
      } else if (error && typeof error === "object") {
        // Handle Supabase AuthApiError or other error objects
        const err = error as { message?: string; status?: number; name?: string };
        errorMessage = err.message || String(error);
        errorStatus = err.status;
        errorName = err.name || "UnknownError";
      } else {
        errorMessage = String(error);
      }
      
      // Log full error details for debugging
      console.error("[ParentLoginForm] Login error:", {
        error: errorMessage,
        status: errorStatus,
        name: errorName,
        email: email.trim().toLowerCase(),
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error, // Include full error object for inspection
      });
      
      // Use the error message if available
      if (errorMessage) {
        message = errorMessage;
      }
      
      // Provide more helpful messages for common errors
      if (message.includes("Invalid login credentials") || message.includes("Invalid")) {
        message = "Invalid email or password. Please check your credentials and try again.";
      }
      
      if (message.includes("Email not confirmed")) {
        message = "Please confirm your email address before signing in. Check your inbox for a confirmation link.";
      }
      
      if (message.includes("temporarily unavailable") || errorStatus === 500) {
        message = "The authentication service is temporarily unavailable. Please try again in a few moments.";
      }
      
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || !email.trim() || !password.trim();

  return (
    <div className="space-y-4">
      <BackButton href="/" />
      <form onSubmit={handleLogin} className="space-y-4">
        {serverError && (
          <div className="bg-red-500/20 border-2 border-red-500 text-white text-sm p-3 rounded-lg flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <div>
          <Label htmlFor="email" className="block text-white text-sm font-semibold mb-2">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-yellow-400 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/30 transition-all"
          />
        </div>

        <div>
          <Label htmlFor="password" className="block text-white text-sm font-semibold mb-2">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-yellow-400 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/30 transition-all"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full bg-yellow-400 text-[#0F4C7D] font-bold py-3 rounded-lg hover:bg-yellow-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? "⏳ Loading..." : "🚀 Login"}
        </Button>

        <div className="text-center mt-6">
          <p className="text-white/70 text-sm mb-2">Don&apos;t have an account?</p>
          <Link
            href="/parent/register"
            className="text-yellow-300/90 text-sm font-medium hover:text-yellow-200 transition-colors underline underline-offset-2"
          >
            Create one now
          </Link>
        </div>
      </form>
    </div>
  );
};

