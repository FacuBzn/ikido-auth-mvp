"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/navigation/BackButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateFamilyCode } from "@/lib/generateFamilyCode";
import { useSessionStore } from "@/store/useSessionStore";
import { createBrowserClient } from "@/lib/supabaseClient";

export const ChildJoinForm = () => {
  const [childCode, setChildCode] = useState("");
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
      const familyCodeNormalized = familyCode.trim().toUpperCase();
      const childCodeNormalized = childCode.trim().toUpperCase();

      if (!validateFamilyCode(familyCodeNormalized)) {
        setServerError("Family code must be exactly 6 alphanumeric characters");
        setIsSubmitting(false);
        return;
      }

      if (!childCodeNormalized || childCodeNormalized.length < 3) {
        setServerError("Child code must be at least 3 characters");
        setIsSubmitting(false);
        return;
      }

      // Force logout before child login
      const supabase = createBrowserClient();
      await supabase.auth.signOut();

      // Call API endpoint with child_code + family_code
      const response = await fetch("/api/child/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          child_code: childCodeNormalized,
          family_code: familyCodeNormalized,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.error === "PARENT_LOGGED_IN") {
          setServerError("A parent is logged in. Please log out before entering child mode.");
        } else if (data.error === "INVALID_FAMILY_CODE") {
          setServerError("Invalid family code. Please check with your parent.");
        } else if (data.error === "INVALID_CHILD_CODE") {
          setServerError("Invalid child code. Make sure your parent created your account.");
        } else {
          setServerError(data.message || "We could not process your request. Please try again.");
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
    !childCode.trim() ||
    childCode.trim().length < 3 ||
    familyCode.length !== 6 ||
    !validateFamilyCode(familyCode.toUpperCase());

  return (
    <div className="space-y-5">
      <BackButton href="/" />

      <form onSubmit={handleJoin} className="space-y-5">
        {serverError && (
          <div className="bg-red-500/20 border-2 border-red-500 text-white text-sm p-3 rounded-lg flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <div>
          <Label htmlFor="child-code" className="block text-white text-sm font-semibold mb-2">
            Your Child Code
          </Label>
          <Input
            id="child-code"
            type="text"
            value={childCode.toUpperCase()}
            onChange={(e) => setChildCode(e.target.value.trim())}
            placeholder="YOURNAME#1234"
            required
            minLength={3}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-yellow-400 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/30 transition-all"
          />
          <p className="text-white/60 text-xs mt-2">Ask your parent for your unique child code</p>
        </div>

        <div>
          <Label htmlFor="family-code" className="block text-white text-sm font-semibold mb-2">
            Family Code
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
          <p className="text-white/60 text-xs">Ask your parent for the family code</p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full bg-yellow-400 text-[#0F4C7D] font-bold py-3 rounded-lg hover:bg-yellow-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:hover:bg-yellow-400 disabled:hover:shadow-lg"
        >
          {isSubmitting ? "⏳ Entering..." : "🎮 Enter Game"}
        </Button>
      </form>

      <div className="bg-blue-900/40 border-2 border-yellow-400/40 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-white font-semibold text-sm">Need your codes?</p>
            <p className="text-white/70 text-xs mt-1">
              Ask your parent for your child code and the family code!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
