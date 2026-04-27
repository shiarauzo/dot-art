import { useEffect, useRef } from 'react'

interface DotTextProps {
  text: string
  className?: string
}

export function DotText({ text, className = '' }: DotTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // Set up font to measure
    const fontSize = window.innerWidth < 1024 ? 48 : 60
    ctx.font = `bold ${fontSize}px "Science Gothic", sans-serif`

    // Measure text
    const metrics = ctx.measureText(text)
    const textWidth = metrics.width
    const textHeight = fontSize * 1.2

    // Set canvas size with padding
    const padding = 20
    canvas.width = textWidth + padding * 2
    canvas.height = textHeight + padding * 2

    // Draw text to get pixel data
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.font = `bold ${fontSize}px "Science Gothic", sans-serif`
    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'top'
    ctx.fillText(text, padding, padding + fontSize * 0.1)

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Clear and redraw as dots with 3D effect
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const dotSpacing = 2.5

    for (let y = dotSpacing / 2; y < canvas.height; y += dotSpacing) {
      for (let x = dotSpacing / 2; x < canvas.width; x += dotSpacing) {
        const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4
        const brightness = data[i] / 255

        if (brightness > 0.5) {
          const maxRadius = dotSpacing / 2 - 0.4
          const radius = brightness * maxRadius * 0.8

          // 3D effect: lighter at top-left, darker at bottom-right
          const normalizedX = x / canvas.width
          const normalizedY = y / canvas.height
          const depthFactor = 1 - (normalizedX * 0.3 + normalizedY * 0.4)
          const gray = Math.floor(150 + depthFactor * 105)

          ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }, [text])

  return (
    <canvas
      ref={canvasRef}
      className={`max-w-full h-auto ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
