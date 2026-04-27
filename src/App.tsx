import { useState, useRef, useCallback, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { Download, RotateCcw, Palette } from 'lucide-react'
import { removeBackground } from '@imgly/background-removal'
// import { useAuth } from '@/context/AuthContext'
// import { AuthModal } from '@/components/AuthModal'
// import { getCheckoutUrl } from '@/lib/polar'
import { HeroArt } from '@/components/HeroArt'
import { SplashScreen } from '@/components/SplashScreen'
import { DotText } from '@/components/DotText'
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
}

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [settings, setSettings] = useState<DotArtSettings>(DEFAULT_SETTINGS)
  const [svgContent, setSvgContent] = useState<string>('')
  const [svgExport, setSvgExport] = useState<string>('')
  // const [authModalOpen, setAuthModalOpen] = useState(false)
  const [splashComplete, setSplashComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // const { user, signOut } = useAuth()
  const isPro = true // Free launch - all features unlocked

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    try {
      const blob = await removeBackground(file)
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setIsProcessing(false)
      }
      img.src = url
    } catch (error) {
      console.error('Background removal failed:', error)
      // Fallback: use original image
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setIsProcessing(false)
      }
      img.src = URL.createObjectURL(file)
    }
  }, [])

  // const handleDrop = useCallback((e: React.DragEvent) => {
  //   e.preventDefault()
  //   const file = e.dataTransfer.files[0]
  //   if (!file || !file.type.startsWith('image/')) return
  //   const img = new Image()
  //   img.onload = () => setImage(img)
  //   img.src = URL.createObjectURL(file)
  // }, [])


  const generateDotArt = useCallback(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // naturalWidth/naturalHeight give the actual image dimensions regardless of DOM layout
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

    // Helper: get alpha at position with bounds checking
    const getAlpha = (px: number, py: number): number => {
      if (px < 0 || px >= width || py < 0 || py >= height) return 0
      const idx = (Math.floor(py) * width + Math.floor(px)) * 4
      return data[idx + 3]
    }

    // Helper: calculate edge factor by sampling neighbors (0 = edge, 1 = solid interior)
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

      // Also sample at half radius for better gradient
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

    const dots: { x: number; y: number; r: number; edgeFactor: number }[] = []
    const baseStep = Math.max(2, Math.floor(100 / settings.density))
    const sampleRadius = baseStep * 2 // How far to look for edge detection

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

        // Skip transparent pixels
        if (a < 100) continue

        // Calculate edge factor for smooth transitions
        const edgeFactor = getEdgeFactor(x, y, sampleRadius)

        // Skip if too close to edge (creates smooth fade)
        if (edgeFactor < 0.3) continue

        let brightness = (r + g + b) / 3
        brightness = ((brightness / 255 - 0.5) * contrastFactor + 0.5) * 255 * brightnessFactor
        brightness = Math.max(0, Math.min(255, brightness))

        let normalizedBrightness = brightness / 255
        if (isPro && settings.inverted) normalizedBrightness = 1 - normalizedBrightness

        // Apply edge factor to dot radius - dots get smaller near edges
        const edgeScale = Math.pow(edgeFactor, 0.5) // Smooth curve
        const dotRadius = normalizedBrightness * settings.maxDotSize * edgeScale

        if (dotRadius > 0.2) {
          dots.push({ x: finalX, y: finalY, r: dotRadius, edgeFactor })
        }
      }
    }

    const baseDotColor = isPro ? settings.dotColor : '#fff'
    const bgColor = isPro ? settings.bgColor : '#000'

    // Parse base color to RGB for gradient calculations
    const parseColor = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 255, b: 255 }
    }

    const baseRGB = parseColor(baseDotColor)

    const getShapePath = (x: number, y: number, r: number, edgeFactor: number): string => {
      // Calculate color based on edge factor - grayer near edges
      const colorIntensity = 0.4 + edgeFactor * 0.6 // Range: 0.4 to 1.0
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

    const dotsContent = dots.map(d => getShapePath(d.x, d.y, d.r, d.edgeFactor)).join('\n  ')
    const innerWithBg = `<rect width="100%" height="100%" fill="${bgColor}"/>
  ${dotsContent}`

    // Display: transparent background for preview
    setSvgContent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;display:block">
  ${dotsContent}
</svg>`)

    // Export: original image dimensions × exportScale (with background)
    const exportW = Math.floor(naturalWidth * (isPro ? settings.exportScale : 1))
    const exportH = Math.floor(naturalHeight * (isPro ? settings.exportScale : 1))
    setSvgExport(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${exportW}" height="${exportH}">
  ${innerWithBg}
</svg>`)
  }, [image, settings, isPro])

  useEffect(() => {
    if (image) generateDotArt()
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
    setImage(null); setSvgContent(''); setSvgExport('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-background relative">
      {!splashComplete && <SplashScreen onComplete={() => setSplashComplete(true)} />}
      {/* <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} /> */}

      <div className="block">
      {/* Nav */}
      <nav className="border-b border-border/50">
        <div className="container mx-auto px-4 h-11 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">dotart</span>
          {/* Sign in commented out for free launch
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {isPro && (
                  <span className="text-[10px] font-semibold bg-foreground text-background px-1.5 py-0.5 rounded">PRO</span>
                )}
                <span className="text-xs text-muted-foreground hidden sm:block">{user.email}</span>
                <button onClick={signOut} aria-label="Sign out" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button onClick={() => setAuthModalOpen(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded px-2.5 py-1 transition-colors">
                <User className="w-3.5 h-3.5" /> Sign in
              </button>
            )}
          </div>
          */}
        </div>
      </nav>

      {!image && !isProcessing ? (
        /* ─── Upload State ─── */
        <div className="h-[calc(100vh-44px)] flex flex-col overflow-hidden">
          <header className="flex-1 flex flex-col">
            <div className="container mx-auto px-4 pt-8 text-center relative z-10">
              <div className="flex justify-center mb-3">
                <DotText text="Point by point" />
              </div>
              <p className="text-muted-foreground text-lg mb-4 max-w-xl mx-auto">
                Transform photos into pointillist art. Ready for print or web.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-8 py-3 text-sm font-medium bg-foreground text-background rounded-none cursor-pointer hover:bg-foreground/90 hover:scale-105 active:scale-95 transition-all duration-150 mb-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                Try it
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/50 mb-2">
                <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> SVG & PNG</span>
                <span>·</span>
                <span className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Customizable</span>
              </div>
            </div>
            <div className="flex-1 w-full overflow-hidden -mt-8 md:-mt-20 lg:-mt-32 relative z-0">
              <HeroArt />
            </div>
          </header>
        </div>
      ) : (
        /* ─── Editor State ─── */
        <main className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-[1fr_272px] border border-border/40 rounded-xl overflow-hidden min-h-[600px]">

            {/* Preview */}
            <div className="flex items-start justify-center p-4 pt-2">
              {isProcessing ? (
                <div className="flex items-center justify-center min-h-[400px] w-full">
                  <LoadingDots />
                </div>
              ) : svgContent ? (
                <div
                  className="flex items-start justify-center w-full [&>svg]:max-w-full [&>svg]:max-h-[85vh] [&>svg]:w-auto [&>svg]:h-auto [&>svg]:min-w-[60%]"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              ) : (
                <span className="text-xs text-muted-foreground/30">Generating…</span>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls sidebar */}
            <div className="border-l border-border/40 flex flex-col">

              {/* Image meta + reset */}
              <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
                <span className="text-[11px] tabular-nums text-muted-foreground/40">
                  {image ? `${image.naturalWidth}×${image.naturalHeight}` : 'Loading...'}
                </span>
                <button
                  onClick={resetImage}
                  disabled={isProcessing}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors disabled:opacity-30"
                >
                  <RotateCcw className="w-3 h-3" /> New image
                </button>
              </div>

              {/* Scrollable settings */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">

                  {/* Density */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs text-muted-foreground">Density</label>
                      <span className="text-xs tabular-nums text-muted-foreground/40">{settings.density}</span>
                    </div>
                    <Slider
                      value={[settings.density]}
                      onValueChange={(v) => setSettings(s => ({ ...s, density: Array.isArray(v) ? v[0] : v }))}
                      min={10} max={100} step={1}
                    />
                  </div>

                  {/* Dot Size */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs text-muted-foreground">Dot size</label>
                      <span className="text-xs tabular-nums text-muted-foreground/40">{settings.maxDotSize}px</span>
                    </div>
                    <Slider
                      value={[settings.maxDotSize]}
                      onValueChange={(v) => setSettings(s => ({ ...s, maxDotSize: Array.isArray(v) ? v[0] : v }))}
                      min={2} max={20} step={1}
                    />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/40 pt-1">
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/30">Advanced</span>
                    </div>

                    {/* Contrast */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <label className={`text-xs ${!isPro ? 'text-muted-foreground/30' : 'text-muted-foreground/60'}`}>Contrast</label>
                        <span className="text-xs tabular-nums text-muted-foreground/30">{settings.contrast}%</span>
                      </div>
                      <Slider
                        value={[settings.contrast]}
                        onValueChange={(v) => { if (!isPro) return; setSettings(s => ({ ...s, contrast: Array.isArray(v) ? v[0] : v })) }}
                        min={50} max={200} step={5} disabled={!isPro}
                      />
                    </div>

                    {/* Brightness */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <label className={`text-xs ${!isPro ? 'text-muted-foreground/30' : 'text-muted-foreground/60'}`}>Brightness</label>
                        <span className="text-xs tabular-nums text-muted-foreground/30">{settings.brightness}%</span>
                      </div>
                      <Slider
                        value={[settings.brightness]}
                        onValueChange={(v) => { if (!isPro) return; setSettings(s => ({ ...s, brightness: Array.isArray(v) ? v[0] : v })) }}
                        min={50} max={150} step={5} disabled={!isPro}
                      />
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="space-y-1.5">
                        <label className={`text-xs ${!isPro ? 'text-muted-foreground/30' : 'text-muted-foreground/60'}`}>Dot</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color" value={settings.dotColor}
                            onChange={(e) => isPro && setSettings(s => ({ ...s, dotColor: e.target.value }))}
                            disabled={!isPro}
                            className="w-6 h-6 rounded cursor-pointer disabled:opacity-25 bg-transparent border-0 p-0 outline-none"
                          />
                          <span className="text-[10px] font-mono text-muted-foreground/40">{settings.dotColor}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className={`text-xs ${!isPro ? 'text-muted-foreground/30' : 'text-muted-foreground/60'}`}>Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color" value={settings.bgColor}
                            onChange={(e) => isPro && setSettings(s => ({ ...s, bgColor: e.target.value }))}
                            disabled={!isPro}
                            className="w-6 h-6 rounded cursor-pointer disabled:opacity-25 bg-transparent border-0 p-0 outline-none"
                          />
                          <span className="text-[10px] font-mono text-muted-foreground/40">{settings.bgColor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shape */}
                    <div className="space-y-1.5 mb-4">
                      <label className={`text-xs ${!isPro ? 'text-muted-foreground/30' : 'text-muted-foreground/60'}`}>Shape</label>
                      <div className="flex gap-1">
                        {(['circle', 'square', 'diamond', 'star', 'heart'] as DotShape[]).map(shape => (
                          <button
                            key={shape}
                            disabled={!isPro}
                            onClick={() => setSettings(s => ({ ...s, dotShape: shape }))}
                            aria-label={shape}
                            className={`flex-1 py-1.5 rounded text-sm transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${
                              settings.dotShape === shape
                                ? 'bg-foreground text-background'
                                : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'
                            }`}
                          >
                            {shape === 'circle' ? '●' : shape === 'square' ? '■' : shape === 'diamond' ? '◆' : shape === 'star' ? '★' : '♥'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Export Scale */}
                    <div className="space-y-1.5">
                      <label className={`text-xs ${!isPro ? 'text-muted-foreground/30' : 'text-muted-foreground/60'}`}>Export scale</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(scale => (
                          <button
                            key={scale}
                            disabled={!isPro && scale !== 1}
                            onClick={() => setSettings(s => ({ ...s, exportScale: scale }))}
                            className={`flex-1 py-1.5 rounded text-xs transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${
                              settings.exportScale === scale
                                ? 'bg-foreground text-background'
                                : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'
                            }`}
                          >
                            {scale}×
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pro upsell - commented out for free launch
                  {!isPro && (
                    <div className="border-t border-border/40 pt-4 space-y-2">
                      <p className="text-[11px] text-muted-foreground/40 leading-relaxed">
                        Unlock contrast, colors, shapes, presets, and more.
                      </p>
                      <button
                        onClick={() => !user ? setAuthModalOpen(true) : window.open(getCheckoutUrl(user.email || ''), '_blank')}
                        className="w-full py-2 text-xs font-medium bg-foreground text-background rounded hover:bg-foreground/90 transition-colors"
                      >
                        {user ? 'Get Pro — $2.99' : 'Sign in to get Pro'}
                      </button>
                    </div>
                  )}
                  */}
                </div>
              </div>

              {/* Export footer */}
              {svgContent && (
                <div className="border-t border-border/40 p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={downloadSVG}
                      className="py-2 text-xs text-muted-foreground bg-foreground/5 hover:bg-foreground/10 rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3 h-3" /> SVG
                    </button>
                    <button
                      onClick={downloadPNG}
                      className="py-2 text-xs text-muted-foreground bg-foreground/5 hover:bg-foreground/10 rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3 h-3" /> PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
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

export default App
