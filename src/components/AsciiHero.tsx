import { useEffect, useRef } from 'react'

// Character set ordered by density (light to dark)
const ASCII_CHARS = ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'

export function AsciiHero() {
  const containerRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const img = new Image()
    img.crossOrigin = 'anonymous'

    const render = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Character dimensions (monospace)
      const charWidth = 6
      const charHeight = 10
      const cols = Math.ceil(viewportWidth / charWidth)
      const rows = Math.ceil(viewportHeight / charHeight)

      canvas.width = cols
      canvas.height = rows

      // Calculate scaling to COVER the canvas (background-size: cover)
      const imgAspect = img.width / img.height
      const canvasAspect = cols / rows

      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height

      if (imgAspect > canvasAspect) {
        // Image is wider - crop sides
        sWidth = img.height * canvasAspect
        sx = (img.width - sWidth) / 2
      } else {
        // Image is taller - crop top/bottom
        sHeight = img.width / canvasAspect
        sy = (img.height - sHeight) / 2
      }

      // Draw cropped image to fill entire canvas
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cols, rows)

      const imageData = ctx.getImageData(0, 0, cols, rows)
      const data = imageData.data

      let ascii = ''
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3 / 255

          // Map brightness to character (bright areas = dense char for dark bg)
          const charIndex = Math.floor(brightness * (ASCII_CHARS.length - 1))
          ascii += ASCII_CHARS[charIndex]
        }
        ascii += '\n'
      }

      container.textContent = ascii
    }

    img.onload = render

    img.src = '/astronaut.jpg'

    const handleResize = () => {
      if (img.complete) render()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <pre
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen text-[6px] leading-[10px] font-mono text-neutral-600 overflow-hidden select-none pointer-events-none"
      style={{
        fontFamily: 'monospace',
        whiteSpace: 'pre',
        letterSpacing: '0px',
      }}
    />
  )
}
