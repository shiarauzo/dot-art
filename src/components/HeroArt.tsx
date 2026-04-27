import { useEffect, useRef } from 'react'

interface Dot {
  targetX: number
  targetY: number
  targetRadius: number
  distFromLight: number
}

export function HeroArt() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const startTimeRef = useRef(0)
  const dimensionsRef = useRef({ width: 0, height: 0, lightX: 0, lightY: 0, lightRadius: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const viewportWidth = window.innerWidth
      const aspectRatio = img.width / img.height
      const width = viewportWidth
      const height = Math.floor(width / aspectRatio)

      canvas.width = width
      canvas.height = height

      ctx.drawImage(img, 0, 0, width, height)
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data

      // Light point (center between fingers)
      const lightX = width * 0.5
      const lightY = height * 0.48
      const lightRadius = Math.min(width, height) * 0.08

      dimensionsRef.current = { width, height, lightX, lightY, lightRadius }

      const dotSpacing = 3
      const dots: Dot[] = []

      for (let y = dotSpacing / 2; y < height; y += dotSpacing) {
        for (let x = dotSpacing / 2; x < width; x += dotSpacing) {
          const i = (Math.floor(y) * width + Math.floor(x)) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3 / 255

          if (brightness > 0.08) {
            const maxRadius = dotSpacing / 2 - 0.8
            const targetRadius = Math.min(brightness, 1) * maxRadius

            const distFromLight = Math.sqrt(
              Math.pow(x - lightX, 2) + Math.pow(y - lightY, 2)
            )

            dots.push({
              targetX: x,
              targetY: y,
              targetRadius,
              distFromLight,
            })
          }
        }
      }

      dotsRef.current = dots

      let animationId: number
      startTimeRef.current = performance.now()

      const animate = (currentTime: number) => {
        const { width, height, lightX } = dimensionsRef.current

        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = '#fff'

        const time = (currentTime - startTimeRef.current) / 1000

        // Pivot points for wrist animation
        const leftWristX = width * 0.32
        const rightWristX = width * 0.68

        for (const dot of dotsRef.current) {
          // Subtle breathing effect
          const breathe = Math.sin(time * 0.6) * 0.1 + 1

          // Distance from center (light point)
          const distFromCenter = Math.abs(dot.targetX - lightX) / (width * 0.5)

          // Smooth blend: 0 at light, 1 far from light
          const centerBlend = Math.min(1, Math.max(0, (distFromCenter - 0.02) * 4))

          const isLeftHand = dot.targetX < lightX

          const pivotX = isLeftHand ? leftWristX : rightWristX
          const distFromWrist = isLeftHand
            ? dot.targetX - pivotX
            : pivotX - dot.targetX

          const fingerDist = distFromWrist / (width * 0.18)

          let x = dot.targetX
          let y = dot.targetY

          // Slow, smooth wrist rotation - finger points up then down
          const wristAngle = Math.sin(time * 0.4) * 0.15 * (isLeftHand ? 1 : -1)

          if (fingerDist > 0) {
            // Fingers rotate around wrist, pointing towards light
            const movement = fingerDist * wristAngle * (width * 0.35) * centerBlend
            y = dot.targetY + movement
          } else {
            // Arm has subtle movement
            const armMovement = Math.sin(time * 0.3) * 2 * centerBlend
            y = dot.targetY + armMovement
          }

          const radius = dot.targetRadius * breathe

          if (radius > 0.1) {
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        animationId = requestAnimationFrame(animate)
      }

      animationId = requestAnimationFrame(animate)

      return () => cancelAnimationFrame(animationId)
    }

    img.src = '/hands.avif'
  }, [])

  return (
    <canvas
      ref={canvasRef}
      id="hero-art-canvas"
      className="w-full"
      style={{
        height: 'auto',
      }}
    />
  )
}
