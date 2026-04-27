import { useEffect, useRef } from 'react'

// Character set ordered by density (light to dark)
const ASCII_CHARS = ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'

export function AsciiHero() {
  const containerRef = useRef<HTMLPreElement>(null)
  const contentRef = useRef<string>('')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Calculate dimensions to cover viewport
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const imgAspect = img.width / img.height
      const viewportAspect = viewportWidth / viewportHeight

      let drawWidth, drawHeight, offsetX = 0, offsetY = 0
      if (imgAspect > viewportAspect) {
        drawHeight = viewportHeight
        drawWidth = drawHeight * imgAspect
        offsetX = (drawWidth - viewportWidth) / 2
      } else {
        drawWidth = viewportWidth
        drawHeight = drawWidth / imgAspect
        offsetY = (drawHeight - viewportHeight) / 2
      }

      // Character dimensions (monospace)
      const charWidth = 6
      const charHeight = 10
      const cols = Math.ceil(viewportWidth / charWidth)
      const rows = Math.ceil(viewportHeight / charHeight)

      canvas.width = cols
      canvas.height = rows

      // Scale image to match character grid
      const scaleX = drawWidth / cols
      const scaleY = drawHeight / rows
      ctx.drawImage(img, -offsetX / scaleX, -offsetY / scaleY, drawWidth / scaleX, drawHeight / scaleY)

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

          // Map brightness to character (inverted - bright = dense char for light bg)
          const charIndex = Math.floor((1 - brightness) * (ASCII_CHARS.length - 1))
          ascii += ASCII_CHARS[charIndex]
        }
        ascii += '\n'
      }

      contentRef.current = ascii
      container.textContent = ascii
    }

    img.src = '/hands.avif'

    const handleResize = () => {
      img.onload?.(new Event('load'))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <pre
      ref={containerRef}
      className="absolute inset-0 text-[6px] leading-[10px] font-mono text-neutral-400 overflow-hidden select-none pointer-events-none"
      style={{
        fontFamily: 'monospace',
        whiteSpace: 'pre',
        letterSpacing: '0px',
      }}
    />
  )
}
