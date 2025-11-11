"use client";

type SuccessScreenProps = {
  onDone: () => void;
};

export function SuccessScreen({ onDone }: SuccessScreenProps) {
  return (
    <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-6 text-white shadow-2xl">
      <button
        onClick={onDone}
        className="mb-6 text-sm font-bold text-[#FFD369] transition-colors hover:text-[#FFC93F]"
      >
        ← Success!
      </button>
      <div className="space-y-6 rounded-3xl bg-[#0D3A5C] p-6 text-center">
        <div className="text-4xl">😊</div>
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-[#FFD369]">Reward Redeemed</p>
          <p className="text-3xl font-bold text-white">GGPoints well spent!</p>
        </div>
        <p className="text-sm text-gray-200">
          Enjoy your reward and keep the habit streak roaring. More missions await!
        </p>
        <button
          onClick={onDone}
          className="w-full rounded-2xl bg-[#FF4949] py-3 text-sm font-bold text-white transition hover:bg-[#ff6b6b]"
        >
          Done
        </button>
      </div>
    </div>
  );
}

