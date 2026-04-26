import { useEffect, useRef } from 'react'

export function HeroArt() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 500
    const height = 400
    canvas.width = width
    canvas.height = height

    // Create a flowing wave pattern that demonstrates the dot art effect
    const dots: {
      x: number
      y: number
      baseSize: number
      phase: number
      speed: number
    }[] = []

    const spacing = 8

    for (let y = spacing / 2; y < height; y += spacing) {
      for (let x = spacing / 2; x < width; x += spacing) {
        dots.push({
          x,
          y,
          baseSize: 1 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.7,
        })
      }
    }

    let animationId: number
    let time = 0

    const animate = () => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      dots.forEach((dot) => {
        // Create flowing wave pattern
        const wave1 = Math.sin((dot.x * 0.02) + (dot.y * 0.01) + time * 0.5)
        const wave2 = Math.sin((dot.x * 0.015) - (dot.y * 0.02) + time * 0.3)
        const wave3 = Math.sin((dot.x * 0.01) + (dot.y * 0.025) - time * 0.4)

        // Combine waves for organic movement
        const combinedWave = (wave1 + wave2 + wave3) / 3

        // Map wave to size (0.5 to 3.5)
        const size = dot.baseSize + (combinedWave + 1) * 1.5

        // Brightness based on wave
        const brightness = 0.4 + (combinedWave + 1) * 0.3

        // Twinkle effect
        const twinkle = Math.sin(time * dot.speed * 2 + dot.phase) * 0.1 + 0.9
        const opacity = brightness * twinkle

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2)
        ctx.fill()
      })

      time += 0.02
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="rounded-2xl border border-white/10"
      style={{
        width: '100%',
        maxWidth: 500,
        height: 'auto',
        aspectRatio: '500/400',
      }}
    />
  )
}
