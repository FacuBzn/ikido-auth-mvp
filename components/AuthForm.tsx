"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  login: "Welcome back, captain!",
  register: "Assemble your crew",
};

const SUBTITLE_LABEL: Record<AuthFormVariant, string> = {
  login: "Jump back into your family missions and rewards.",
  register: "Invite parents and cadets to start earning GGPoints together.",
};

const FOOTER_MESSAGE: Record<AuthFormVariant, { label: string; href: string; linkLabel: string }> =
  {
    login: {
      label: "No account yet?",
      href: "/register",
      linkLabel: "Create one",
    },
    register: {
      label: "Already part of the crew?",
      href: "/login",
      linkLabel: "Sign in",
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
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 text-center text-white">
        <span className="ikido-badge gap-2">
          <Sparkles className="size-4 text-[var(--brand-gold-400)]" />
          GGPoints portal
        </span>
        <h2 className="text-2xl font-semibold tracking-tight">{TITLE_LABEL[variant]}</h2>
        <p className="text-sm text-white/75">{SUBTITLE_LABEL[variant]}</p>
      </div>

      {(serverError || localError) && (
        <Alert variant="destructive" className="border-red-400/40 bg-red-500/15 text-red-50">
          <AlertDescription>{serverError ?? localError}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {isRegister && (
          <div className="space-y-2 text-left">
            <Label htmlFor="name" className="ikido-section-title text-[var(--brand-gold-200)]">
              Explorer name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Jane Doe"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 rounded-3xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white placeholder:text-white/60 focus-visible:ring-[var(--brand-gold-400)]"
            />
          </div>
        )}

        <div className="space-y-2 text-left">
          <Label htmlFor="email" className="ikido-section-title text-[var(--brand-gold-200)]">
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
            className="h-12 rounded-3xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white placeholder:text-white/60 focus-visible:ring-[var(--brand-gold-400)]"
          />
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="password" className="ikido-section-title text-[var(--brand-gold-200)]">
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
            className="h-12 rounded-3xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white placeholder:text-white/60 focus-visible:ring-[var(--brand-gold-400)]"
          />
        </div>

        {isRegister && (
          <div className="space-y-3 text-left">
            <span className="ikido-section-title text-[var(--brand-gold-200)]">Choose account type</span>
            <ToggleGroup
              type="single"
              value={role}
              onValueChange={(value) => {
                if (value === "Parent" || value === "Child") {
                  setRole(value);
                }
              }}
              className="grid grid-cols-2 gap-3"
            >
              {ROLE_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option}
                  value={option}
                  className={cn(
                    "rounded-3xl border-2 border-[var(--brand-gold-400)] bg-[#0d3a5c] px-4 py-3 text-sm font-semibold text-white transition",
                    "data-[state=on]:bg-[var(--brand-gold-400)] data-[state=on]:text-[var(--brand-blue-900)]"
                  )}
                >
                  {option === "Parent" ? "👨‍👩‍👧 Parent" : "👧 Child"}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitDisabled}
          className="ikido-button ikido-button--gold ikido-button--pill text-sm uppercase tracking-[0.28em]"
        >
          {isSubmitting ? "Please wait…" : CTA_LABEL[variant]}
        </Button>
      </form>

      <p className="text-center text-xs text-white/70">
        {footer.label}{" "}
        <Link className="font-semibold text-[var(--brand-gold-400)] underline-offset-4 hover:underline" href={footer.href}>
          {footer.linkLabel}
        </Link>
      </p>
    </div>
  );
};

