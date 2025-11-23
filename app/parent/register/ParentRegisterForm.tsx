"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerParent } from "@/lib/repositories/parentRepository";
import { useSessionStore } from "@/store/useSessionStore";

export const ParentRegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFamilyCode, setShowFamilyCode] = useState(false);
  const [familyCode, setFamilyCode] = useState("");
  const router = useRouter();
  const setParent = useSessionStore((state) => state.setParent);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    try {
      const parent = await registerParent({
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setParent(parent);
      setFamilyCode(parent.family_code);
      setShowFamilyCode(true);
      
      // Redirect after showing family code
      setTimeout(() => {
        router.push("/parent/dashboard");
      }, 3000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not process your request. Please try again.";
      setServerError(message);
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    isSubmitting || !name.trim() || !email.trim() || !password.trim() || password.length < 6;

  if (showFamilyCode) {
    return (
      <div className="w-full max-w-md">
        <div
          className="rounded-3xl bg-white/95 backdrop-blur border border-gray-100 shadow-2xl p-8 space-y-6"
          style={{ background: "linear-gradient(135deg, #0F4C7D 0%, #1A5FA0 100%)" }}
        >
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white">Account Created!</h2>
            <p className="text-yellow-300 font-semibold">Your Family Code</p>
            <div className="bg-white/10 border-2 border-yellow-400 rounded-lg p-6 mt-4">
              <p className="text-4xl font-bold text-yellow-400 tracking-widest">{familyCode}</p>
            </div>
            <p className="text-white/70 text-sm mt-4">
              Share this code with your children so they can join your family!
            </p>
            <p className="text-white/50 text-xs">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Link
        href="/parent/login"
        className="flex items-center text-white mb-4 font-semibold hover:text-yellow-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Login
      </Link>

      <div className="rounded-3xl bg-white/95 backdrop-blur border border-gray-100 shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#0F4C7D]">iKidO</h1>
          <p className="text-gray-600 font-medium">Create Parent Account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {serverError && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          <div>
            <Label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
            />
            <p className="text-gray-500 text-xs mt-1">Minimum 6 characters</p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full bg-yellow-400 text-[#0F4C7D] font-bold py-3 rounded-lg hover:bg-yellow-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? "⏳ Creating..." : "✨ Create Account"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-white/70 text-sm mb-3">Already have an account?</p>
          <Link
            href="/parent/login"
            className="text-yellow-300 font-semibold hover:text-yellow-200 transition-colors underline"
          >
            Sign In instead
          </Link>
        </div>
      </div>
    </div>
  );
};

