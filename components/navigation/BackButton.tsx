"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  label?: string;
  href?: string;
  className?: string;
  variant?: "pill";
};

export function BackButton({
  label = "Back",
  href,
  className,
  variant = "pill",
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (href) {
      return; // Let Link handle navigation
    }
    e.preventDefault();
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const baseStyles =
    "w-fit rounded-full bg-[rgb(0,39,96)]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-[0_12px_24px_-18px_rgba(0,0,0,0.6)] backdrop-blur hover:bg-[rgb(0,39,96)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(249,165,17)] transition-all duration-200 inline-flex items-center gap-2 min-h-[44px]";

  if (href) {
    return (
      <Button variant="ghost" asChild className={cn(baseStyles, className)}>
        <Link href={href} onClick={handleClick}>
          <ArrowLeft className="w-4 h-4" />
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={cn(baseStyles, className)}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}

