import { useEffect, useRef, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

interface Dot {
  x: number
  y: number
  maxRadius: number
  delay: number
}

const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2)
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    canvas.width = screenWidth
    canvas.height = screenHeight

    // Fixed center - approximate light position
    const centerX = screenWidth / 2
    const centerY = screenHeight * 0.55

    const dotSpacing = 3
    const dots: Dot[] = []
    const maxDist = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight)

    for (let y = dotSpacing / 2; y < screenHeight; y += dotSpacing) {
      for (let x = dotSpacing / 2; x < screenWidth; x += dotSpacing) {
        const distFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        )

        const normalizedDist = distFromCenter / maxDist
        const randomOffset = (Math.random() - 0.5) * 0.15

        dots.push({
          x,
          y,
          maxRadius: dotSpacing / 2 - 0.8,
          delay: normalizedDist * 0.6 + randomOffset,
        })
      }
    }

    const WAVE_DURATION = 0.4
    const HOLD_DURATION = 0.08
    const FADE_DURATION = 0.35
    const FADE_OUT_START = 0.7
    const TOTAL_DURATION = 1.2

    let animationId: number
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000

      if (elapsed >= FADE_OUT_START && !fading) {
        setFading(true)
      }

      if (elapsed >= TOTAL_DURATION) {
        onComplete()
        return
      }

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, screenWidth, screenHeight)
      ctx.fillStyle = '#ffffff'

      for (const dot of dots) {
        const dotElapsed = elapsed - dot.delay

        if (dotElapsed < 0) continue

        let radius: number
        let opacity = 1

        if (dotElapsed < WAVE_DURATION) {
          const t = dotElapsed / WAVE_DURATION
          radius = dot.maxRadius * easeOutSine(t)
        } else if (dotElapsed < WAVE_DURATION + HOLD_DURATION) {
          radius = dot.maxRadius
        } else {
          const fadeElapsed = dotElapsed - WAVE_DURATION - HOLD_DURATION
          const t = Math.min(1, fadeElapsed / FADE_DURATION)
          radius = dot.maxRadius * (1 - easeInOutSine(t))
          opacity = 1 - easeInOutSine(t)
        }

        if (radius > 0.1) {
          ctx.globalAlpha = opacity
          ctx.beginPath()
          ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [onComplete, fading])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 z-50 bg-black transition-opacity duration-500 ease-out ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    />
  )
}
