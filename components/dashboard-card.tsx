'use client';

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

interface DashboardCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
  href?: string;
}

export function DashboardCard({ icon, title, description, color, onClick, href }: DashboardCardProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (href) {
      router.push(href);
      return;
    }

    onClick?.();
  }, [href, onClick, router]);

  return (
    <button
      onClick={handleClick}
      className="group relative w-full text-left transition duration-300 hover:-translate-y-1 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue-600)] focus-visible:ring-offset-4 focus-visible:ring-offset-white"
    >
      <Card className="glass-panel relative flex h-full flex-col gap-4 overflow-hidden border-0 px-6 py-6 text-[var(--brand-blue-900)] transition duration-300 group-hover:shadow-[0_28px_40px_-28px_rgba(11,38,71,0.45)]">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${color} opacity-30 transition duration-300 group-hover:opacity-60`}
        />
        <span className="pointer-events-none absolute -top-10 right-[-60px] size-32 rounded-full bg-white/60 blur-3xl" />

        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-[0_10px_18px_-12px_rgba(11,38,71,0.4)]">
            {icon}
          </span>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[var(--brand-blue-900)]">{title}</h3>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue-600)]/80">
              Open section
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-[var(--brand-blue-900)]/80">{description}</p>
      </Card>
    </button>
  );
}
