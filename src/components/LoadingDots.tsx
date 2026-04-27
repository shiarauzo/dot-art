export function LoadingDots() {
  // Many small dots forming a circle
  const dotCount = 24
  const dots = Array.from({ length: dotCount }, (_, i) => ({
    angle: (i / dotCount) * 360,
    delay: i * 0.05,
  }))

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-10 h-10">
        {dots.map((dot, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-dot-fade"
            style={{
              left: '50%',
              top: '50%',
              transform: `rotate(${dot.angle}deg) translateX(18px) translateY(-50%)`,
              animationDelay: `${dot.delay}s`,
            }}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground/40">Processing...</p>
      <style>{`
        @keyframes dot-fade {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 1; }
        }
        .animate-dot-fade {
          animation: dot-fade 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
