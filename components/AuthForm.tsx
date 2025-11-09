"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    <Card className="w-full max-w-lg border-0 bg-white/95 p-8 shadow-2xl backdrop-blur dark:bg-slate-900/90">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-3xl font-bold text-[#0F4C7D] dark:text-white">
          {TITLE_LABEL[variant]}
        </CardTitle>
        <CardDescription className="text-base text-gray-600 dark:text-slate-300">
          {SUBTITLE_LABEL[variant]}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {(serverError || localError) && (
          <Alert variant="destructive">
            <AlertDescription>{serverError ?? localError}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {isRegister && (
              <div className="space-y-2 text-left">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Full name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-12 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus-visible:ring-[#0F4C7D] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            )}

            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus-visible:ring-[#0F4C7D] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={variant === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus-visible:ring-[#0F4C7D] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            {isRegister && (
              <div className="space-y-3 text-left">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Choose account type
                </span>
                <ToggleGroup
                  type="single"
                  value={role}
                  onValueChange={(value) => {
                    if (value === "Parent" || value === "Child") {
                      setRole(value);
                    }
                  }}
                  className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <ToggleGroupItem
                      key={option}
                      value={option}
                      className={cn(
                        "h-12 rounded-none text-sm font-semibold tracking-wide transition",
                        "data-[state=on]:bg-gradient-to-r data-[state=on]:from-[#0F4C7D] data-[state=on]:to-[#1A5FA0] data-[state=on]:text-white",
                        "data-[state=off]:text-slate-600 data-[state=off]:backdrop-blur hover:bg-white/70 dark:data-[state=off]:text-slate-300"
                      )}
                    >
                      {option === "Parent" ? "👨‍👩‍👧 Parent" : "👧 Child"}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="h-12 w-full bg-gradient-to-r from-[#0F4C7D] to-[#1A5FA0] text-base font-semibold text-white shadow-lg shadow-[#0F4C7D]/30 transition hover:shadow-xl disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : CTA_LABEL[variant]}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-slate-300">
          {footer.label}{" "}
          <Link className="font-semibold text-[#0F4C7D] hover:underline dark:text-sky-300" href={footer.href}>
            {footer.linkLabel}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};

