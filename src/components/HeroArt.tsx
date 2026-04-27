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
      const viewportHeight = window.innerHeight
      const imgAspect = img.width / img.height
      const viewportAspect = viewportWidth / viewportHeight

      // Cover the viewport (like background-size: cover)
      let width, height, offsetX = 0, offsetY = 0
      if (imgAspect > viewportAspect) {
        // Image is wider - fit to height
        height = viewportHeight
        width = height * imgAspect
        offsetX = (width - viewportWidth) / 2
      } else {
        // Image is taller - fit to width
        width = viewportWidth
        height = width / imgAspect
        offsetY = (height - viewportHeight) / 2
      }

      canvas.width = viewportWidth
      canvas.height = viewportHeight

      // Draw image centered/cropped to cover viewport
      ctx.drawImage(img, -offsetX, -offsetY, width, height)
      const imageData = ctx.getImageData(0, 0, viewportWidth, viewportHeight)
      const data = imageData.data

      // Light point (center between fingers)
      const lightX = viewportWidth * 0.5
      const lightY = viewportHeight * 0.48
      const lightRadius = Math.min(viewportWidth, viewportHeight) * 0.08

      dimensionsRef.current = { width: viewportWidth, height: viewportHeight, lightX, lightY, lightRadius }

      // Responsive dot spacing - smaller dots on larger viewports
      const baseSpacing = 4
      const dotSpacing = Math.max(3, baseSpacing * (1000 / viewportWidth))
      const dots: Dot[] = []

      for (let y = dotSpacing / 2; y < viewportHeight; y += dotSpacing) {
        for (let x = dotSpacing / 2; x < viewportWidth; x += dotSpacing) {
          const i = (Math.floor(y) * viewportWidth + Math.floor(x)) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3 / 255

          if (brightness > 0.08) {
            const maxRadius = dotSpacing / 2 - 0.5
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
          const wristAngle = Math.sin(time * 0.4) * 0.12 * (isLeftHand ? 1 : -1)

          // Smooth blend between arm and finger movement (no hard cutoff)
          const fingerBlend = Math.max(0, Math.min(1, fingerDist * 2))
          const armBlend = 1 - fingerBlend

          // Finger movement (stronger near fingertips)
          const fingerMovement = fingerDist * wristAngle * (width * 0.3) * centerBlend * fingerBlend

          // Arm movement (subtle, affects whole arm smoothly)
          const armMovement = Math.sin(time * 0.3) * 1.5 * centerBlend * armBlend

          y = dot.targetY + fingerMovement + armMovement

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
      className="w-full h-full"
    />
  )
}
