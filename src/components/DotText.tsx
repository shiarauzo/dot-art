import { useEffect, useRef } from 'react'

interface DotTextProps {
  text: string
  className?: string
  size?: number // Multiplier for size (1 = default, 2 = 2x, etc.)
  dotDensity?: number // Higher = more dots, smaller (1 = default, 2 = 2x denser)
  color?: string // Main dot color (default: #ffffff)
  shadowColor?: string // Shadow dot color (default: #555555)
  font?: 'serif' | 'mono' // Font family (default: serif)
  shadowOffset?: number // Shadow offset multiplier (default: 1)
}

export function DotText({
  text,
  className = '',
  size = 1,
  dotDensity = 1,
  color = '#ffffff',
  shadowColor = '#555555',
  font = 'serif',
  shadowOffset = 1
}: DotTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // Set up font
    const baseFontSize = window.innerWidth < 768 ? 32 : window.innerWidth < 1024 ? 44 : 56
    const fontSize = baseFontSize * size
    const fontFamily = font === 'mono'
      ? '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace'
      : '"Times New Roman", Georgia, "Playfair Display", serif'
    const fontWeight = font === 'mono' ? '500' : 'bold'
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`

    // Measure text
    const metrics = ctx.measureText(text)
    const textWidth = metrics.width
    const textHeight = fontSize * 1.3

    // Set canvas size with padding (extra for shadow on left)
    const padding = 24 * size
    const shadowOffsetX = 4 * size * shadowOffset  // Shadow goes LEFT
    const shadowOffsetY = 3 * size * shadowOffset  // Shadow goes DOWN slightly
    canvas.width = textWidth + padding * 2 + shadowOffsetX
    canvas.height = textHeight + padding * 2 + shadowOffsetY

    // Create temporary canvas for text rendering
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    // Draw shadow text (to the LEFT and below main text)
    // Shadow position: starts at padding (left side)
    tempCtx.fillStyle = '#000'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    tempCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    tempCtx.fillStyle = '#fff'
    tempCtx.textBaseline = 'top'
    tempCtx.fillText(text, padding, padding + fontSize * 0.15 + shadowOffsetY)

    const shadowData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)

    // Draw main text (to the RIGHT of shadow)
    // Main position: offset to the right by shadowOffsetX
    tempCtx.fillStyle = '#000'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    tempCtx.fillStyle = '#fff'
    tempCtx.fillText(text, padding + shadowOffsetX, padding + fontSize * 0.15)

    const mainData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)

    // Clear canvas (transparent background)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const dotSpacing = (2.5 * size) / dotDensity

    // First pass: draw shadow dots (gray, slightly smaller)
    for (let y = dotSpacing / 2; y < canvas.height; y += dotSpacing) {
      for (let x = dotSpacing / 2; x < canvas.width; x += dotSpacing) {
        const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4
        const shadowBrightness = shadowData.data[i] / 255
        const mainBrightness = mainData.data[i] / 255

        // Only draw shadow where there's no main text (shadow behind)
        if (shadowBrightness > 0.5 && mainBrightness < 0.5) {
          const maxRadius = Math.max(0.1, dotSpacing / 2 - 0.5)
          const radius = shadowBrightness * maxRadius * 0.7

          // Shadow dots
          if (radius > 0) {
            ctx.fillStyle = shadowColor
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }

    // Second pass: draw main text dots
    for (let y = dotSpacing / 2; y < canvas.height; y += dotSpacing) {
      for (let x = dotSpacing / 2; x < canvas.width; x += dotSpacing) {
        const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4
        const brightness = mainData.data[i] / 255

        if (brightness > 0.5) {
          const maxRadius = Math.max(0.1, dotSpacing / 2 - 0.4)
          const radius = brightness * maxRadius * 0.8

          if (radius > 0) {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }
  }, [text, size, dotDensity, color, shadowColor, font, shadowOffset])

  return (
    <canvas
      ref={canvasRef}
      className={`max-w-full h-auto ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
