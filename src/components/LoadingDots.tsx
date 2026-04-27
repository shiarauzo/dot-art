export function LoadingDots() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative w-8 h-8 flex items-center justify-center">
        <span className="text-2xl text-white/80 animate-pulse-scale">✳</span>
      </div>
      <p className="text-[11px] text-muted-foreground/40">Loading...</p>
      <style>{`
        @keyframes pulse-scale {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        .animate-pulse-scale {
          animation: pulse-scale 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
