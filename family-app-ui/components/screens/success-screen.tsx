"use client"

interface SuccessScreenProps {
  onDone: () => void
}

export function SuccessScreen({ onDone }: SuccessScreenProps) {
  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
      {/* Animated confetti background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ["#FFD369", "#FF6B6B", "#4ECDC4", "#FFD369", "#FF6B6B"][i % 5],
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <span className="text-2xl">←</span>
        <h1 className="text-3xl font-bold text-[#FFD369]">Success!</h1>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Smiley Face */}
        <div className="text-6xl mb-6 animate-bounce">😊</div>

        {/* Points */}
        <div className="bg-[#0D3A5C] rounded-2xl p-8 mb-8">
          <p className="text-5xl font-bold text-[#FFD369]">10</p>
          <p className="text-2xl font-bold text-white">GGPoints</p>
        </div>

        {/* Reward Ticket */}
        <div className="bg-[#FFD369] rounded-2xl p-6 mb-8 transform rotate-2 shadow-lg">
          <p className="text-4xl font-bold text-red-700">🎟️ MOVIE</p>
          <p className="text-sm text-[#0F4C7D] mt-2 font-semibold">★ ★ ★ ★ ★</p>
        </div>

        {/* Coins */}
        <div className="flex justify-around mb-8">
          <span className="text-4xl animate-bounce" style={{ animationDelay: "0s" }}>
            🪙
          </span>
          <span className="text-4xl animate-bounce" style={{ animationDelay: "0.2s" }}>
            🪙
          </span>
          <span className="text-4xl animate-bounce" style={{ animationDelay: "0.4s" }}>
            🪙
          </span>
        </div>

        {/* Message */}
        <p className="text-xl font-bold text-white mb-8">Reward Redeemed</p>

        {/* Done Button */}
        <button
          onClick={onDone}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full transition-colors text-lg"
        >
          Done
        </button>
      </div>
    </div>
  )
}
