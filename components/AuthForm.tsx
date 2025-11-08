"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/supabase";

export type AuthFormValues = {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
};

type AuthFormVariant = "login" | "register";

type AuthFormProps = {
  variant: AuthFormVariant;
  onSubmit: (values: AuthFormValues) => Promise<void>;
  serverError?: string | null;
  initialEmail?: string;
  initialRole?: UserRole;
};

const ROLE_OPTIONS: UserRole[] = ["Parent", "Child"];

const CTA_LABEL: Record<AuthFormVariant, string> = {
  login: "Sign in",
  register: "Create account",
};

const TITLE_LABEL: Record<AuthFormVariant, string> = {
  login: "Welcome back",
  register: "Get started with iKidO",
};

const SUBTITLE_LABEL: Record<AuthFormVariant, string> = {
  login: "Access your tasks and rewards dashboard.",
  register: "Create an account to manage family tasks and rewards.",
};

const FOOTER_MESSAGE: Record<AuthFormVariant, { label: string; href: string; linkLabel: string }> =
  {
    login: {
      label: "Don't have an account?",
      href: "/register",
      linkLabel: "Register",
    },
    register: {
      label: "Already have an account?",
      href: "/login",
      linkLabel: "Login",
    },
  };

export const AuthForm = ({
  variant,
  onSubmit,
  serverError,
  initialEmail = "",
  initialRole = "Parent",
}: AuthFormProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>(initialRole);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = variant === "register";

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) {
      return true;
    }

    if (!email.trim() || !password.trim()) {
      return true;
    }

    if (isRegister && !name.trim()) {
      return true;
    }

    return false;
  }, [email, password, isRegister, name, isSubmitting]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim() || undefined,
        role,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not process your request, please try again.";
      setLocalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = FOOTER_MESSAGE[variant];

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold text-white">{TITLE_LABEL[variant]}</h1>
        <p className="text-sm text-slate-300">{SUBTITLE_LABEL[variant]}</p>
      </div>

      {serverError && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {serverError}
        </p>
      )}

      {localError && !serverError && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {localError}
        </p>
      )}

      <div className="space-y-5">
        {isRegister && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Jane Doe"
              className="h-12 rounded-2xl border border-slate-700 bg-slate-900/50 px-4 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12 rounded-2xl border border-slate-700 bg-slate-900/50 px-4 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={variant === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            minLength={6}
            className="h-12 rounded-2xl border border-slate-700 bg-slate-900/50 px-4 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {isRegister && (
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-slate-200">Role</span>
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-900/50 p-1">
              {ROLE_OPTIONS.map((option) => {
                const isActive = role === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      "h-12 rounded-2xl border border-transparent text-sm font-semibold text-white transition",
                      isActive
                        ? "bg-sky-500 shadow-lg shadow-sky-500/40"
                        : "bg-transparent hover:border-slate-700 hover:bg-slate-800/60"
                    )}
                    onClick={() => setRole(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className={cn(
          "h-12 rounded-2xl bg-sky-500 text-sm font-semibold text-white transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-70",
          isSubmitting && "animate-pulse"
        )}
      >
        {isSubmitting ? "Please wait..." : CTA_LABEL[variant]}
      </button>

      <p className="text-center text-sm text-slate-300">
        {footer.label}{" "}
        <Link className="font-semibold text-sky-400 hover:text-sky-300" href={footer.href}>
          {footer.linkLabel}
        </Link>
      </p>
    </form>
  );
};

