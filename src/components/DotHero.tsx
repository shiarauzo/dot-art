import { useEffect, useRef } from 'react'

interface Dot {
  x: number
  y: number
  baseRadius: number
  brightness: number
  normX: number
  normY: number
}

export function DotHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const dimensionsRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'

    const setupDots = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      canvas.width = viewportWidth
      canvas.height = viewportHeight

      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return

      const imgAspect = img.width / img.height
      const canvasAspect = viewportWidth / viewportHeight

      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height

      if (imgAspect > canvasAspect) {
        sWidth = img.height * canvasAspect
        sx = (img.width - sWidth) / 2
      } else {
        sHeight = img.width / canvasAspect
        sy = (img.height - sHeight) / 2
      }

      const dotSpacing = 4
      const sampleWidth = Math.ceil(viewportWidth / dotSpacing)
      const sampleHeight = Math.ceil(viewportHeight / dotSpacing)

      tempCanvas.width = sampleWidth
      tempCanvas.height = sampleHeight
      tempCtx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sampleWidth, sampleHeight)

      const imageData = tempCtx.getImageData(0, 0, sampleWidth, sampleHeight)
      const data = imageData.data

      const dots: Dot[] = []

      for (let y = 0; y < sampleHeight; y++) {
        for (let x = 0; x < sampleWidth; x++) {
          const i = (y * sampleWidth + x) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3 / 255

          if (brightness > 0.05) {
            const maxRadius = dotSpacing / 2 - 0.5
            const baseRadius = brightness * maxRadius

            if (baseRadius > 0.3) {
              dots.push({
                x: x * dotSpacing + dotSpacing / 2,
                y: y * dotSpacing + dotSpacing / 2,
                baseRadius,
                brightness,
                normX: x / sampleWidth,
                normY: y / sampleHeight,
              })
            }
          }
        }
      }

      dotsRef.current = dots
      dimensionsRef.current = { width: viewportWidth, height: viewportHeight }
    }

    let animationId: number
    const startTime = performance.now()

    // Smooth gaussian-like falloff
    const smoothFalloff = (distance: number, radius: number): number => {
      if (distance > radius) return 0
      const t = distance / radius
      return Math.pow(1 - t * t, 2) // Smooth quadratic falloff
    }

    const animate = (currentTime: number) => {
      const { width, height } = dimensionsRef.current
      const time = (currentTime - startTime) / 1000

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      // Animation parameters - slow, subtle movements
      const headLookX = Math.sin(time * 0.25) * 8
      const headLookY = Math.sin(time * 0.2) * 4
      const bodySway = Math.sin(time * 0.12) * 3
      const breathe = Math.sin(time * 0.35) * 2

      // Head center (normalized coordinates)
      const headCenterX = 0.5
      const headCenterY = 0.15

      for (const dot of dotsRef.current) {
        const { normX, normY } = dot

        // Distance from head center
        const dxHead = normX - headCenterX
        const dyHead = normY - headCenterY
        const distFromHead = Math.sqrt(dxHead * dxHead + dyHead * dyHead)

        // Smooth influence zones
        const headInfluence = smoothFalloff(distFromHead, 0.25)
        const bodyInfluence = smoothFalloff(Math.abs(normY - 0.5), 0.45) * (1 - headInfluence * 0.5)

        // Overall movement decreases towards edges
        const centerInfluence = 1 - Math.abs(normX - 0.5) * 0.6

        // Calculate movement
        let moveX = 0
        let moveY = 0

        // Head movement
        moveX += headLookX * headInfluence
        moveY += headLookY * headInfluence * 0.3

        // Body sway
        moveX += bodySway * bodyInfluence * centerInfluence

        // Breathing
        const chestFactor = smoothFalloff(Math.abs(normY - 0.4), 0.35)
        moveY += breathe * chestFactor * (normY - 0.25)

        // Apply movement
        const finalX = dot.x + moveX
        const finalY = dot.y + moveY

        // Scale variation
        const scale = 1 + headInfluence * 0.03 * Math.sin(time * 0.2)
        const radius = dot.baseRadius * scale

        // Color based on brightness
        const gray = Math.floor(40 + dot.brightness * 60)
        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`

        ctx.beginPath()
        ctx.arc(finalX, finalY, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animationId = requestAnimationFrame(animate)
    }

    img.onload = () => {
      setupDots()
      animationId = requestAnimationFrame(animate)
    }

    img.src = '/astronaut2.jpg'

    const handleResize = () => {
      if (img.complete) {
        setupDots()
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen"
    />
  )
}
