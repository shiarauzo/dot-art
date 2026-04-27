import { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Slider } from '@/components/ui/slider'
import { Download, RotateCcw } from 'lucide-react'
import { removeBackground } from '@imgly/background-removal'
import { LoadingDots } from '@/components/LoadingDots'

type DotShape = 'circle' | 'square' | 'diamond' | 'star' | 'heart'
interface DotArtSettings {
  density: number
  maxDotSize: number
  contrast: number
  brightness: number
  inverted: boolean
  dotShape: DotShape
  dotColor: string
  bgColor: string
  irregularSpacing: boolean
  exportScale: number
  removeBackground: boolean
}

const DEFAULT_SETTINGS: DotArtSettings = {
  density: 35,
  maxDotSize: 2,
  contrast: 110,
  brightness: 100,
  inverted: false,
  dotShape: 'diamond',
  dotColor: '#ffffff',
  bgColor: '#000000',
  irregularSpacing: true,
  exportScale: 1,
  removeBackground: true,
}

export function ArtGenerator() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null)
  const [settings, setSettings] = useState<DotArtSettings>(DEFAULT_SETTINGS)
  const [svgContent, setSvgContent] = useState<string>('')
  const [svgExport, setSvgExport] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hasCheckedPendingImage = useRef(false)
  const navigate = useNavigate()

  const isPro = true // Free launch - all features unlocked

  // Process image with optional background removal
  const processImage = useCallback(async (dataUrl: string, shouldRemoveBackground: boolean) => {
    setIsProcessing(true)

    if (shouldRemoveBackground) {
      try {
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        const processedBlob = await removeBackground(blob)
        const url = URL.createObjectURL(processedBlob)
        const img = new Image()
        img.onload = () => {
          setImage(img)
          setIsProcessing(false)
        }
        img.src = url
      } catch (error) {
        console.error('Background removal failed:', error)
        const img = new Image()
        img.onload = () => {
          setImage(img)
          setIsProcessing(false)
        }
        img.src = dataUrl
      }
    } else {
      // No background removal - use original image
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setIsProcessing(false)
      }
      img.src = dataUrl
    }
  }, [])

  // Check for pending image on mount only
  useEffect(() => {
    if (hasCheckedPendingImage.current) return
    hasCheckedPendingImage.current = true

    const pendingImage = sessionStorage.getItem('pendingImage')
    if (pendingImage) {
      sessionStorage.removeItem('pendingImage')
      setOriginalDataUrl(pendingImage)
      processImage(pendingImage, settings.removeBackground)
    } else {
      navigate('/')
    }
  }, [processImage, navigate, settings.removeBackground])

  // Reprocess when removeBackground toggle changes
  useEffect(() => {
    if (originalDataUrl && hasCheckedPendingImage.current) {
      processImage(originalDataUrl, settings.removeBackground)
    }
  }, [settings.removeBackground, originalDataUrl, processImage])


  const generateDotArt = useCallback(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight
    if (!naturalWidth || !naturalHeight) return

    const maxSize = 800
    const scale = Math.min(maxSize / naturalWidth, maxSize / naturalHeight, 1)
    const width = Math.floor(naturalWidth * scale)
    const height = Math.floor(naturalHeight * scale)

    canvas.width = width
    canvas.height = height
    ctx.drawImage(image, 0, 0, width, height)

    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    const contrastFactor = isPro ? settings.contrast / 100 : 1
    const brightnessFactor = isPro ? settings.brightness / 100 : 1

    const getAlpha = (px: number, py: number): number => {
      if (px < 0 || px >= width || py < 0 || py >= height) return 0
      const idx = (Math.floor(py) * width + Math.floor(px)) * 4
      return data[idx + 3]
    }

    const getEdgeFactor = (px: number, py: number, sampleRadius: number): number => {
      const samples = 8
      let totalAlpha = 0
      let validSamples = 0

      for (let i = 0; i < samples; i++) {
        const angle = (i / samples) * Math.PI * 2
        const sx = px + Math.cos(angle) * sampleRadius
        const sy = py + Math.sin(angle) * sampleRadius
        totalAlpha += getAlpha(sx, sy)
        validSamples++
      }

      for (let i = 0; i < samples; i++) {
        const angle = (i / samples) * Math.PI * 2 + Math.PI / samples
        const sx = px + Math.cos(angle) * (sampleRadius * 0.5)
        const sy = py + Math.sin(angle) * (sampleRadius * 0.5)
        totalAlpha += getAlpha(sx, sy)
        validSamples++
      }

      const avgAlpha = totalAlpha / validSamples
      return avgAlpha / 255
    }

    const dots: { x: number; y: number; r: number; edgeFactor: number; alphaFactor: number }[] = []
    const baseStep = Math.max(2, Math.floor(100 / settings.density))
    const sampleRadius = baseStep * 1.5 // Reduced for less aggressive edge detection

    for (let y = 0; y < height; y += baseStep) {
      for (let x = 0; x < width; x += baseStep) {
        let finalX = x
        let finalY = y
        if (isPro && settings.irregularSpacing) {
          finalX += (Math.random() - 0.5) * baseStep * 0.5
          finalY += (Math.random() - 0.5) * baseStep * 0.5
        }

        const i = (Math.floor(y) * width + Math.floor(x)) * 4
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]

        // Skip very transparent pixels
        if (a < 30) continue

        // Calculate edge factor but don't skip - just use for smooth transitions
        const edgeFactor = Math.max(0.3, getEdgeFactor(x, y, sampleRadius))

        let brightness = (r + g + b) / 3
        brightness = ((brightness / 255 - 0.5) * contrastFactor + 0.5) * 255 * brightnessFactor
        brightness = Math.max(0, Math.min(255, brightness))

        let normalizedBrightness = brightness / 255
        if (isPro && settings.inverted) normalizedBrightness = 1 - normalizedBrightness

        // Use alpha to fade out background remnants
        const alphaFactor = a / 255
        const edgeScale = Math.pow(edgeFactor, 0.5)
        const dotRadius = normalizedBrightness * settings.maxDotSize * edgeScale

        if (dotRadius > 0.2) {
          dots.push({ x: finalX, y: finalY, r: dotRadius, edgeFactor, alphaFactor })
        }
      }
    }

    const baseDotColor = isPro ? settings.dotColor : '#fff'
    const bgColor = isPro ? settings.bgColor : '#000'

    const parseColor = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 255, b: 255 }
    }

    const baseRGB = parseColor(baseDotColor)

    const getShapePath = (x: number, y: number, r: number, edgeFactor: number, alphaFactor: number): string => {
      // Low alpha = very faint (background remnants), high alpha = full color
      const alphaIntensity = Math.pow(alphaFactor, 2) // Quadratic curve makes low alpha very faint
      const colorIntensity = 0.1 + alphaIntensity * 0.9 * (0.4 + edgeFactor * 0.6)
      const finalR = Math.round(baseRGB.r * colorIntensity)
      const finalG = Math.round(baseRGB.g * colorIntensity)
      const finalB = Math.round(baseRGB.b * colorIntensity)
      const dotColor = `rgb(${finalR},${finalG},${finalB})`

      const shape = isPro ? settings.dotShape : 'circle'
      switch (shape) {
        case 'square':
          return `<rect x="${(x - r).toFixed(2)}" y="${(y - r).toFixed(2)}" width="${(r * 2).toFixed(2)}" height="${(r * 2).toFixed(2)}" fill="${dotColor}"/>`
        case 'diamond':
          return `<polygon points="${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}" fill="${dotColor}"/>`
        case 'star': {
          const pts = []
          for (let i = 0; i < 5; i++) {
            const oa = (i * 72 - 90) * Math.PI / 180
            const ia = ((i * 72) + 36 - 90) * Math.PI / 180
            pts.push(`${x + r * Math.cos(oa)},${y + r * Math.sin(oa)}`)
            pts.push(`${x + r * 0.5 * Math.cos(ia)},${y + r * 0.5 * Math.sin(ia)}`)
          }
          return `<polygon points="${pts.join(' ')}" fill="${dotColor}"/>`
        }
        case 'heart': {
          const p = `M ${x} ${y + r * 0.3} C ${x - r} ${y - r * 0.5} ${x - r * 0.5} ${y - r} ${x} ${y - r * 0.3} C ${x + r * 0.5} ${y - r} ${x + r} ${y - r * 0.5} ${x} ${y + r * 0.3}`
          return `<path d="${p}" fill="${dotColor}"/>`
        }
        default:
          return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="${dotColor}"/>`
      }
    }

    // Calculate bounding box of dots to crop transparent areas
    if (dots.length === 0) {
      setSvgContent('')
      setSvgExport('')
      return
    }

    const padding = settings.maxDotSize // Add small padding around content
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const d of dots) {
      minX = Math.min(minX, d.x - d.r)
      minY = Math.min(minY, d.y - d.r)
      maxX = Math.max(maxX, d.x + d.r)
      maxY = Math.max(maxY, d.y + d.r)
    }

    // Apply padding and clamp to image bounds
    minX = Math.max(0, minX - padding)
    minY = Math.max(0, minY - padding)
    maxX = Math.min(width, maxX + padding)
    maxY = Math.min(height, maxY + padding)

    const croppedWidth = maxX - minX
    const croppedHeight = maxY - minY

    const dotsContent = dots.map(d => getShapePath(d.x, d.y, d.r, d.edgeFactor, d.alphaFactor)).join('\n  ')

    // Preview: cropped viewBox (no background, transparent)
    setSvgContent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${croppedWidth} ${croppedHeight}" style="width:100%;height:auto;display:block">
  ${dotsContent}
</svg>`)

    // Export: cropped with background
    const scaleRatio = naturalWidth / width
    const exportW = Math.floor(croppedWidth * scaleRatio * (isPro ? settings.exportScale : 1))
    const exportH = Math.floor(croppedHeight * scaleRatio * (isPro ? settings.exportScale : 1))
    const exportBg = `<rect x="${minX}" y="${minY}" width="${croppedWidth}" height="${croppedHeight}" fill="${bgColor}"/>`

    setSvgExport(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${croppedWidth} ${croppedHeight}" width="${exportW}" height="${exportH}">
  ${exportBg}
  ${dotsContent}
</svg>`)
  }, [image, settings, isPro])

  // Debounced generation for smooth slider interaction
  useEffect(() => {
    if (!image) return

    const timeout = setTimeout(() => {
      generateDotArt()
    }, 50) // Small delay for smooth feel

    return () => clearTimeout(timeout)
  }, [image, settings, generateDotArt])

  const downloadSVG = () => {
    if (!svgExport) return
    const blob = new Blob([svgExport], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'dotart.svg'; a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPNG = () => {
    if (!svgExport) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'dotart.png'; a.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgExport)))
  }

  const resetImage = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50">
        <div className="container mx-auto px-4 h-11 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity">
            dotart
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_272px] border border-border/40 rounded-xl overflow-hidden min-h-[600px]">
            <div className="overflow-hidden p-4">
              {isProcessing ? (
                <div className="flex items-center justify-center min-h-[400px] w-full">
                  <LoadingDots />
                </div>
              ) : svgContent ? (
                <div
                  className="flex items-start justify-center [&>svg]:max-w-full [&>svg]:max-h-[80vh] [&>svg]:w-auto [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              ) : (
                <span className="text-xs text-muted-foreground/30">Generating...</span>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="border-l border-border/40 flex flex-col">
              <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
                <span className="text-[11px] tabular-nums text-muted-foreground/40">
                  {image ? `${image.naturalWidth}×${image.naturalHeight}` : ''}
                </span>
                <button
                  onClick={resetImage}
                  disabled={isProcessing}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors disabled:opacity-30"
                >
                  <RotateCcw className="w-3 h-3" /> New image
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-5">

                  {/* Background removal - primary toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs text-muted-foreground block">Remove background</label>
                      <span className="text-[10px] text-muted-foreground/40">AI-powered isolation</span>
                    </div>
                    <button
                      onClick={() => setSettings(s => ({ ...s, removeBackground: !s.removeBackground }))}
                      disabled={isProcessing}
                      className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-50 ${
                        settings.removeBackground ? 'bg-foreground' : 'bg-foreground/20'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-background transition-transform ${
                          settings.removeBackground ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Shape selector - visual first */}
                  <div className={`space-y-2 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="text-xs text-muted-foreground">Shape</label>
                    <div className="flex gap-1.5">
                      {(['circle', 'square', 'diamond', 'star', 'heart'] as DotShape[]).map(shape => (
                        <button
                          key={shape}
                          onClick={() => setSettings(s => ({ ...s, dotShape: shape }))}
                          disabled={isProcessing}
                          title={shape}
                          className={`flex-1 py-2 rounded-lg text-base transition-all ${
                            settings.dotShape === shape
                              ? 'bg-foreground text-background scale-105'
                              : 'bg-foreground/5 text-muted-foreground/60 hover:bg-foreground/10 hover:text-muted-foreground'
                          }`}
                        >
                          {shape === 'circle' ? '●' : shape === 'square' ? '■' : shape === 'diamond' ? '◆' : shape === 'star' ? '★' : '♥'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Density & Size - core controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs text-muted-foreground">Density</label>
                        <span className="text-[10px] tabular-nums text-muted-foreground/40">{settings.density}</span>
                      </div>
                      <Slider
                        value={[settings.density]}
                        onValueChange={(v) => setSettings(s => ({ ...s, density: Array.isArray(v) ? v[0] : v }))}
                        min={10} max={100} step={1}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs text-muted-foreground">Size</label>
                        <span className="text-[10px] tabular-nums text-muted-foreground/40">{settings.maxDotSize}px</span>
                      </div>
                      <Slider
                        value={[settings.maxDotSize]}
                        onValueChange={(v) => setSettings(s => ({ ...s, maxDotSize: Array.isArray(v) ? v[0] : v }))}
                        min={2} max={20} step={1}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  {/* Dot color */}
                  <div className={`flex items-center gap-2 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input
                      type="color" value={settings.dotColor}
                      onChange={(e) => setSettings(s => ({ ...s, dotColor: e.target.value }))}
                      disabled={isProcessing}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-border/40 p-0.5 outline-none"
                    />
                    <span className="text-xs text-muted-foreground/60">Color</span>
                  </div>

                  {/* Adjustments - collapsed feel */}
                  <div className="border-t border-border/40 pt-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[11px] text-muted-foreground/50">Contrast</label>
                        <span className="text-[10px] tabular-nums text-muted-foreground/30">{settings.contrast}%</span>
                      </div>
                      <Slider
                        value={[settings.contrast]}
                        onValueChange={(v) => setSettings(s => ({ ...s, contrast: Array.isArray(v) ? v[0] : v }))}
                        min={50} max={200} step={5}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[11px] text-muted-foreground/50">Brightness</label>
                        <span className="text-[10px] tabular-nums text-muted-foreground/30">{settings.brightness}%</span>
                      </div>
                      <Slider
                        value={[settings.brightness]}
                        onValueChange={(v) => setSettings(s => ({ ...s, brightness: Array.isArray(v) ? v[0] : v }))}
                        min={50} max={150} step={5}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {svgContent && (
                <div className="border-t border-border/40 p-4 space-y-3">
                  {/* Export scale */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground/50">Scale</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(scale => (
                        <button
                          key={scale}
                          onClick={() => setSettings(s => ({ ...s, exportScale: scale }))}
                          className={`w-8 h-7 rounded text-[11px] transition-colors ${
                            settings.exportScale === scale
                              ? 'bg-foreground text-background'
                              : 'bg-foreground/5 text-muted-foreground/60 hover:bg-foreground/10'
                          }`}
                        >
                          {scale}×
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Export buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={downloadSVG}
                      className="py-2.5 text-xs font-medium text-muted-foreground bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> SVG
                    </button>
                    <button
                      onClick={downloadPNG}
                      className="py-2.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
      </main>

      <footer className="fixed bottom-4 left-0 right-0 text-center pointer-events-none">
        <span className="text-xs text-muted-foreground/40">
          made by{' '}
          <a
            href="https://shiara.design"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors pointer-events-auto"
          >
            shiara arauzo
          </a>
        </span>
      </footer>
    </div>
  )
}
