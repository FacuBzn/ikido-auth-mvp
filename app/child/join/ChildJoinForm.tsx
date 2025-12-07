"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinChild } from "@/lib/repositories/childRepository";
import { validateFamilyCode } from "@/lib/generateFamilyCode";
import { useSessionStore } from "@/store/useSessionStore";

export const ChildJoinForm = () => {
  const [childName, setChildName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const setChild = useSessionStore((state) => state.setChild);

  const handleJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    try {
      const trimmedCode = familyCode.trim().toUpperCase();
      const trimmedName = childName.trim();

      if (!validateFamilyCode(trimmedCode)) {
        setServerError("Family code must be exactly 6 alphanumeric characters");
        return;
      }

      if (trimmedName.length < 2) {
        setServerError("Name must be at least 2 characters");
        return;
      }

      const { child } = await joinChild({
        familyCode: trimmedCode,
        childName: trimmedName,
      });

      setChild(child);
      // Small delay to ensure Zustand persists
      await new Promise(resolve => setTimeout(resolve, 120));
      router.push("/child/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not process your request. Please try again.";
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    !childName.trim() ||
    familyCode.length !== 6 ||
    !validateFamilyCode(familyCode.toUpperCase());

  return (
    <div className="space-y-5">
      <Link
        href="/"
        className="inline-flex items-center text-white font-semibold hover:text-yellow-300 transition-colors"
      >
        ← Back
      </Link>

      <form onSubmit={handleJoin} className="space-y-5">
        {serverError && (
          <div className="bg-red-500/20 border-2 border-red-500 text-white text-sm p-3 rounded-lg flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <div>
          <Label htmlFor="child-name" className="block text-white text-sm font-semibold mb-2">
            Your Name
          </Label>
          <Input
            id="child-name"
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Enter your name"
            required
            minLength={2}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-yellow-400 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/30 transition-all"
          />
          <p className="text-white/60 text-xs mt-2">This is how parents will see you</p>
        </div>

        <div>
          <Label htmlFor="family-code" className="block text-white text-sm font-semibold mb-2">
            Parent&apos;s Code
          </Label>
          <div className="bg-white/5 p-4 rounded-lg border-2 border-yellow-400/30 mb-3">
            <Input
              id="family-code"
              type="text"
              value={familyCode.toUpperCase()}
              onChange={(e) =>
                setFamilyCode(e.target.value.replace(/[^A-Z0-9]/g, "").slice(0, 6))
              }
              placeholder="XXXXXX"
              maxLength={6}
              required
              className="w-full bg-transparent text-white placeholder-white/50 focus:outline-none text-center tracking-widest text-3xl font-bold border-0"
            />
          </div>
          <p className="text-white/60 text-xs">Ask your parent for this 6-character code</p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full bg-yellow-400 text-[#0F4C7D] font-bold py-3 rounded-lg hover:bg-yellow-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? "⏳ Entering..." : "🎮 Enter Game"}
        </Button>
      </form>

      <div className="bg-blue-900/40 border-2 border-yellow-400/40 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-white font-semibold text-sm">Need a code?</p>
            <p className="text-white/70 text-xs mt-1">
              Ask your parent to go to their dashboard and generate one for you!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

