"use client";

import { useMemo } from "react";

type SuccessScreenProps = {
  onDone: () => void;
};

const CONFETTI_COLORS = ["#FFD369", "#FF6B6B", "#4ECDC4", "#6CE2FF", "#FF9F68"];

export function SuccessScreen({ onDone }: SuccessScreenProps) {
  type ConfettiPiece = {
    id: number;
    left: number;
    delay: number;
    duration: number;
    color: string;
    size: number;
  };

  // Pure, deterministic pseudo-random generator based on seed and index
  const pseudoRandom = (seed: number, index: number): number => {
    // Simple LCG-inspired hash, deterministic and side-effect free
    const a = 1664525;
    const c = 1013904223;
    let x = (seed ^ (index + 1)) >>> 0;
    x = (Math.imul(a, x) + c) >>> 0;
    return (x >>> 8) / 16777216; // [0,1)
  };

  const SEED = 123456789;

  const confettiPieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 20 }).map((_, index) => {
      const r1 = pseudoRandom(SEED, index * 4 + 0);
      const r2 = pseudoRandom(SEED, index * 4 + 1);
      const r3 = pseudoRandom(SEED, index * 4 + 2);
      const r4 = pseudoRandom(SEED, index * 4 + 3);

      return {
        id: index,
        left: r1 * 100,
        delay: r2 * 2.5,
        duration: 2.4 + r3 * 2,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        size: 0.4 + r4 * 0.6,
      };
    });
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl bg-linear-to-b from-[#0F4C7D] to-[#1A5FA0] px-5 py-8 text-white shadow-2xl">
      <div className="pointer-events-none absolute inset-0">
        {confettiPieces.map((piece) => (
          <span
            key={piece.id}
            style={{
              left: `${piece.left}%`,
              width: `${piece.size}rem`,
              height: `${piece.size}rem`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            }}
            className="absolute -top-10 rounded-sm opacity-80 animate-confetti"
          />
        ))}
      </div>
      <div className="relative z-10 flex h-full flex-col gap-6">
        <button
          onClick={onDone}
          className="flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#FFD369] transition-colors hover:text-[#FFE7A3]"
        >
          <span className="text-lg">←</span>
          Success!
        </button>

        <div className="flex flex-1 flex-col items-center gap-5 rounded-[32px] bg-[#0D3A5C]/90 px-5 pb-6 pt-8 text-center shadow-[0_25px_50px_-25px_rgba(0,0,0,0.65)]">
          <div className="text-4xl animate-emoji-bob">😊</div>

          <div className="w-full rounded-[28px] bg-[#062B4A] px-5 py-4 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FFD369]/90">GGPoints</p>
            <p className="mt-2 text-3xl font-black text-white">10</p>
          </div>

          <div className="w-full rounded-[24px] border-2 border-[#FBBF24]/40 bg-[#FFD369] px-5 py-5 text-left text-[#C0262D] shadow-[0_18px_32px_-20px_rgba(255,175,0,0.8)]">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎟️</span>
              <h2 className="text-xl font-black uppercase tracking-[0.2em]">Movie</h2>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#C0262D]">
              {"★★★★★".split("").map((star, index) => (
                <span key={star + index} className="text-base text-[#1F2937]">
                  {star}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            {[0, 1, 2].map((coin) => (
              <div
                key={coin}
                style={{ animationDelay: `${coin * 0.2}s` }}
                className="flex size-10 items-center justify-center rounded-full bg-linear-to-b from-[#FFE7A3] to-[#FFB800] shadow-[0_12px_22px_-12px_rgba(0,0,0,0.45)] animate-coin-bounce"
              >
                <span className="text-xl font-bold text-[#91430A]">GG</span>
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-[#FFE7A3]">Reward Redeemed</p>

          <button
            onClick={onDone}
            className="w-full rounded-full bg-[#FF2E3A] py-3 text-sm font-bold text-white shadow-[0_18px_40px_-20px_rgba(255,46,58,0.9)] transition-colors hover:bg-[#ff4a54]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

