import { useEffect, useRef } from 'react'

// Floyd-Steinberg dithering on a grayscale image data
function floydSteinbergDither(
  pixels: number[][],
  width: number,
  height: number,
  threshold = 128
): boolean[][] {
  const result: boolean[][] = Array.from({ length: height }, () =>
    Array(width).fill(false)
  )
  const errors = pixels.map((row) => [...row])

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const oldPixel = errors[y][x]
      const newPixel = oldPixel > threshold ? 255 : 0
      result[y][x] = newPixel === 255

      const error = oldPixel - newPixel

      if (x + 1 < width) errors[y][x + 1] += (error * 7) / 16
      if (y + 1 < height) {
        if (x - 1 >= 0) errors[y + 1][x - 1] += (error * 3) / 16
        errors[y + 1][x] += (error * 5) / 16
        if (x + 1 < width) errors[y + 1][x + 1] += (error * 1) / 16
      }
    }
  }

  return result
}

// Draw a hand shape
function drawHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  flip: boolean
) {
  ctx.save()
  ctx.translate(x, y)
  if (flip) ctx.scale(-1, 1)
  ctx.scale(scale, scale)

  // Palm
  ctx.beginPath()
  ctx.ellipse(0, 0, 45, 55, 0, 0, Math.PI * 2)
  ctx.fill()

  // Wrist/arm
  ctx.beginPath()
  ctx.ellipse(0, 70, 35, 40, 0, 0, Math.PI)
  ctx.fill()

  // Fingers
  const fingers = [
    { x: -32, y: -45, length: 50, angle: -0.3, width: 9 }, // pinky
    { x: -15, y: -55, length: 65, angle: -0.15, width: 10 }, // ring
    { x: 5, y: -58, length: 70, angle: 0, width: 11 }, // middle
    { x: 25, y: -52, length: 60, angle: 0.15, width: 10 }, // index (pointing)
  ]

  fingers.forEach((f) => {
    ctx.save()
    ctx.translate(f.x, f.y)
    ctx.rotate(f.angle)

    // Finger segments
    for (let i = 0; i < 3; i++) {
      const segLen = f.length / 3
      const segWidth = f.width * (1 - i * 0.15)
      ctx.beginPath()
      ctx.roundRect(-segWidth / 2, -segLen * i, segWidth, segLen - 2, segWidth / 2)
      ctx.fill()
    }
    ctx.restore()
  })

  // Thumb
  ctx.save()
  ctx.translate(42, -15)
  ctx.rotate(0.8)
  ctx.beginPath()
  ctx.roundRect(-7, 0, 14, 45, 7)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(-6, -25, 12, 30, 6)
  ctx.fill()
  ctx.restore()

  ctx.restore()
}

export function HeroArt() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const width = 600
    const height = 300
    canvas.width = width
    canvas.height = height

    // Draw hands to a temporary canvas
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')!

    // White hands on black background
    tempCtx.fillStyle = '#000'
    tempCtx.fillRect(0, 0, width, height)
    tempCtx.fillStyle = '#fff'

    // Left hand (Adam's hand)
    drawHand(tempCtx, 165, 180, 1.1, false)

    // Right hand (God's hand) - flipped
    drawHand(tempCtx, 435, 155, 1.1, true)

    // Get image data for dithering
    const imageData = tempCtx.getImageData(0, 0, width, height)
    const pixels: number[][] = []

    for (let y = 0; y < height; y++) {
      pixels[y] = []
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        // Grayscale from RGB
        pixels[y][x] = imageData.data[i]
      }
    }

    // Apply Floyd-Steinberg dithering
    const dithered = floydSteinbergDither(pixels, width, height, 100)

    // Draw dithered result as dots
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)

    const dotSize = 2.5
    const spacing = 4

    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        // Check if any pixel in this cell is white
        let hasWhite = false
        for (let dy = 0; dy < spacing && y + dy < height; dy++) {
          for (let dx = 0; dx < spacing && x + dx < width; dx++) {
            if (dithered[y + dy]?.[x + dx]) {
              hasWhite = true
              break
            }
          }
          if (hasWhite) break
        }

        if (hasWhite) {
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(x + spacing / 2, y + spacing / 2, dotSize, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="rounded-2xl border border-white/10"
      style={{
        width: '100%',
        maxWidth: 600,
        height: 'auto',
        aspectRatio: '600/300',
      }}
    />
  )
}
