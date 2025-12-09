"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createBrowserClient } from "@/lib/supabaseClient";
import type { Database } from "@/types/supabase";
import { useToast } from "@/hooks/use-toast";

type ChildRecord = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "name" | "child_code" | "email"
>;

type ChildrenManagementProps = {
  parentId: string;
  initialChildren: ChildRecord[];
};

type CreateChildResponse = {
  id: string;
  name: string;
  child_code: string;
  login_hint: string;
};

export const ChildrenManagement = ({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentId: _parentId,
  initialChildren 
}: ChildrenManagementProps) => {
  const supabase = useMemo(() => createBrowserClient(), []);
  const { toast } = useToast();
  const [children, setChildren] = useState<ChildRecord[]>(initialChildren);
  const [newChildName, setNewChildName] = useState("");
  const [newChildPassword, setNewChildPassword] = useState("");
  const [loadingChildId, setLoadingChildId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdChildInfo, setCreatedChildInfo] = useState<CreateChildResponse | null>(null);

  const handleAddChild = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newChildName.trim();
    const password = newChildPassword.trim();

    if (!name) {
      setError("Please provide a name for the child.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Please provide a password with at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setCreatedChildInfo(null);

    try {
      const response = await fetch("/api/children/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to create child");
      }

      const data: CreateChildResponse = await response.json();

      setChildren((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          child_code: data.child_code,
          email: data.login_hint.split(" (email: ")[1]?.replace(")", "") || "",
        },
      ]);
      setNewChildName("");
      setNewChildPassword("");
      setCreatedChildInfo(data);

      toast({
        title: "Child added",
        description: `${data.name} is now part of your crew.`,
      });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "We could not add the child right now. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveChild = async (childId: string) => {
    setLoadingChildId(childId);
    setError(null);
    try {
      // TODO: Implement proper deletion via API route or Edge Function
      // For now, we'll just remove from the list (soft delete approach)
      // In production, this should call an API that handles auth user deletion
      const { error: deleteError } = await supabase.from("users").delete().eq("id", childId);
      if (deleteError) {
        throw deleteError;
      }

      setChildren((prev) => prev.filter((child) => child.id !== childId));
      toast({
        title: "Child removed",
        description: "The child was removed from your crew.",
      });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "We could not remove the child right now. Please try again.";
      setError(message);
    } finally {
      setLoadingChildId(null);
    }
  };

  return (
    <main className="screen-shell text-white">
      <div className="screen-card w-full max-w-md space-y-8 px-8 py-10">
        <Button
          variant="ghost"
          asChild
          className="w-fit self-start rounded-full bg-[#0d3a5c]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-[0_12px_24px_-18px_rgba(0,0,0,0.6)] backdrop-blur"
        >
          <Link href="/parent/dashboard">← Back</Link>
        </Button>

        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Family crew</h1>
          <p className="text-sm text-white/75">
            Add or remove cadets linked to your parent account and keep their missions in sync.
          </p>
        </header>

        <section className="space-y-3 rounded-3xl bg-[#0d3a5c]/80 p-6 text-sm">
          <form onSubmit={handleAddChild} className="space-y-3">
            <div className="space-y-2 text-left">
              <label className="ikido-section-title text-[var(--brand-gold-200)]" htmlFor="child-name">
                Child name
              </label>
              <Input
                id="child-name"
                name="child-name"
                value={newChildName}
                onChange={(event) => setNewChildName(event.target.value)}
                placeholder="Gerónimo"
                required
                maxLength={80}
                className="h-12 rounded-3xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white placeholder:text-white/60 focus-visible:ring-[var(--brand-gold-400)]"
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="ikido-section-title text-[var(--brand-gold-200)]" htmlFor="child-password">
                Password
              </label>
              <Input
                id="child-password"
                name="child-password"
                type="password"
                value={newChildPassword}
                onChange={(event) => setNewChildPassword(event.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-12 rounded-3xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white placeholder:text-white/60 focus-visible:ring-[var(--brand-gold-400)]"
              />
              <p className="text-xs text-white/60">Minimum 6 characters</p>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="ghost"
              className="ikido-button ikido-button--gold ikido-button--pill text-sm uppercase tracking-[0.25em]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  Add child
                </>
              )}
            </Button>
          </form>
          {createdChildInfo && (
            <div className="rounded-2xl border-2 border-[var(--brand-gold-400)] bg-[#0b2f4c] p-4 space-y-2">
              <p className="text-sm font-semibold text-[var(--brand-gold-400)]">
                Child created successfully!
              </p>
              <p className="text-xs text-white/80">
                <span className="font-semibold">Child Code:</span> {createdChildInfo.child_code}
              </p>
              <p className="text-xs text-white/80">
                <span className="font-semibold">Login hint:</span> {createdChildInfo.login_hint}
              </p>
              <p className="text-xs text-white/60 mt-2">
                Share this code with your child so they can log in.
              </p>
            </div>
          )}
          <p className="text-center text-xs text-white/70">
            Tip: Encourage each cadet to choose a fun avatar name for extra motivation.
          </p>
        </section>

        {error && (
          <Alert variant="destructive" className="border-red-400/40 bg-red-500/20 text-red-50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section className="space-y-3 rounded-3xl bg-[#0d3a5c]/80 p-6 text-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-gold-200)]">
            <span>Your crew</span>
            <span>{children.length}</span>
          </div>

          {children.length === 0 ? (
            <p className="rounded-3xl bg-[#0b2f4c] px-4 py-6 text-center text-white/70">
              No children added yet. Use the form above to add your first cadet.
            </p>
          ) : (
            <ul className="space-y-3">
              {children.map((child) => (
                <li
                  key={child.id}
                  className="flex flex-col gap-3 rounded-3xl border-2 border-[var(--brand-gold-400)] bg-[#0b2f4c] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-base font-semibold">{child.name ?? "Unnamed child"}</p>
                    {child.child_code && (
                      <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold-400)]">
                        Code: <span className="font-mono text-white/90">{child.child_code}</span>
                      </p>
                    )}
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">
                      ID: <span className="font-mono text-white/80">{child.id}</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="ikido-button ikido-button--pill border-white/30 bg-transparent text-xs uppercase tracking-[0.2em]"
                    onClick={() => handleRemoveChild(child.id)}
                    disabled={loadingChildId === child.id}
                  >
                    {loadingChildId === child.id ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Removing…
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 size-4" />
                        Remove
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

