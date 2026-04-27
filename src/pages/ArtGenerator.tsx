import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Slider } from '@/components/ui/slider'
import { Download, X, Upload, Palette, SlidersHorizontal, Image } from 'lucide-react'
import { removeBackground } from '@imgly/background-removal'
import { DotText } from '@/components/DotText'

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
  const [originalFileName, setOriginalFileName] = useState<string>('image')
  const [settings, setSettings] = useState<DotArtSettings>(DEFAULT_SETTINGS)
  const [svgContent, setSvgContent] = useState<string>('')
  const [svgExport, setSvgExport] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasCheckedPendingImage = useRef(false)

  const isPro = true // Free launch - all features unlocked

  // Process image with optional background removal
  const processImage = useCallback(async (dataUrl: string, shouldRemoveBackground: boolean) => {
    setIsProcessing(true)
    setProcessingStep(shouldRemoveBackground ? 'Removing background...' : 'Processing image...')

    if (shouldRemoveBackground) {
      try {
        setProcessingStep('AI analyzing image...')
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        setProcessingStep('Isolating subject...')
        const processedBlob = await removeBackground(blob)
        const url = URL.createObjectURL(processedBlob)
        const img = new Image()
        img.onload = () => {
          setImage(img)
          setIsProcessing(false)
          setProcessingStep('')
        }
        img.src = url
      } catch (error) {
        console.error('Background removal failed:', error)
        const img = new Image()
        img.onload = () => {
          setImage(img)
          setIsProcessing(false)
          setProcessingStep('')
        }
        img.src = dataUrl
      }
    } else {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setIsProcessing(false)
        setProcessingStep('')
      }
      img.src = dataUrl
    }
  }, [])

  // Check for pending image on mount only
  useEffect(() => {
    if (hasCheckedPendingImage.current) return
    hasCheckedPendingImage.current = true

    const pendingImage = sessionStorage.getItem('pendingImage')
    const pendingFileName = sessionStorage.getItem('pendingFileName')
    if (pendingImage) {
      sessionStorage.removeItem('pendingImage')
      sessionStorage.removeItem('pendingFileName')
      setOriginalDataUrl(pendingImage)
      if (pendingFileName) {
        const nameWithoutExt = pendingFileName.replace(/\.[^/.]+$/, '')
        setOriginalFileName(nameWithoutExt)
      }
      processImage(pendingImage, settings.removeBackground)
    }
  }, [processImage, settings.removeBackground])

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
    const sampleRadius = baseStep * 1.5

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

        if (a < 30) continue

        const edgeFactor = Math.max(0.3, getEdgeFactor(x, y, sampleRadius))

        let brightness = (r + g + b) / 3
        brightness = ((brightness / 255 - 0.5) * contrastFactor + 0.5) * 255 * brightnessFactor
        brightness = Math.max(0, Math.min(255, brightness))

        let normalizedBrightness = brightness / 255
        if (isPro && settings.inverted) normalizedBrightness = 1 - normalizedBrightness

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
      const alphaIntensity = Math.pow(alphaFactor, 2)
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

    if (dots.length === 0) {
      setSvgContent('')
      setSvgExport('')
      return
    }

    const padding = settings.maxDotSize
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const d of dots) {
      minX = Math.min(minX, d.x - d.r)
      minY = Math.min(minY, d.y - d.r)
      maxX = Math.max(maxX, d.x + d.r)
      maxY = Math.max(maxY, d.y + d.r)
    }

    minX = Math.max(0, minX - padding)
    minY = Math.max(0, minY - padding)
    maxX = Math.min(width, maxX + padding)
    maxY = Math.min(height, maxY + padding)

    const croppedWidth = maxX - minX
    const croppedHeight = maxY - minY

    const dotsContent = dots.map(d => getShapePath(d.x, d.y, d.r, d.edgeFactor, d.alphaFactor)).join('\n  ')

    setSvgContent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${croppedWidth} ${croppedHeight}" style="width:100%;height:auto;display:block">
  ${dotsContent}
</svg>`)

    const scaleRatio = naturalWidth / width
    const exportW = Math.floor(croppedWidth * scaleRatio * (isPro ? settings.exportScale : 1))
    const exportH = Math.floor(croppedHeight * scaleRatio * (isPro ? settings.exportScale : 1))
    const exportBg = `<rect x="${minX}" y="${minY}" width="${croppedWidth}" height="${croppedHeight}" fill="${bgColor}"/>`

    setSvgExport(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${croppedWidth} ${croppedHeight}" width="${exportW}" height="${exportH}">
  ${exportBg}
  ${dotsContent}
</svg>`)
  }, [image, settings, isPro])

  useEffect(() => {
    if (!image) return

    const timeout = setTimeout(() => {
      generateDotArt()
    }, 50)

    return () => clearTimeout(timeout)
  }, [image, settings, generateDotArt])

  const downloadSVG = () => {
    if (!svgExport) return
    const blob = new Blob([svgExport], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${originalFileName}_dotart.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPNG = () => {
    if (!svgExport) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${originalFileName}_dotart.png`
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgExport)))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
    setOriginalFileName(nameWithoutExt)

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setOriginalDataUrl(dataUrl)
      processImage(dataUrl, settings.removeBackground)
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImage(null)
    setOriginalDataUrl(null)
    setSvgContent('')
    setSvgExport('')
    setOriginalFileName('image')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="border-b border-neutral-800">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <DotText text="dotart" size={0.8} dotDensity={2} color="#a0d8e8" shadowColor="#2a4a52" />
          </Link>
          <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
            generator
          </span>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="grid lg:grid-cols-[1fr_300px] border border-neutral-800 overflow-hidden min-h-[600px]">
          {/* Preview Area */}
          <div className="bg-neutral-950 p-8 relative">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
                {/* Animated loading indicator */}
                <div className="relative">
                  <div className="w-16 h-16 border border-neutral-700 animate-pulse" />
                  <div className="absolute inset-2 border border-[#a0d8e8]/50 animate-ping" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-mono text-neutral-400">{processingStep}</p>
                  <p className="text-[10px] font-mono text-neutral-600 mt-1">This may take a moment</p>
                </div>
              </div>
            ) : svgContent ? (
              <>
                <button
                  onClick={clearImage}
                  className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center bg-black/80 hover:bg-neutral-800 border border-neutral-700 transition-colors z-10 group"
                >
                  <X className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                </button>
                <div
                  className="flex items-start justify-center [&>svg]:max-w-full [&>svg]:max-h-[80vh] [&>svg]:w-auto [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative flex flex-col items-center justify-center min-h-[400px] w-full cursor-pointer group"
              >
                {/* Decorative corners */}
                <div className="absolute inset-8 border border-dashed border-neutral-800 group-hover:border-neutral-600 transition-colors">
                  <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-[#a0d8e8]/40" />
                  <div className="absolute -top-px -right-px w-4 h-4 border-t border-r border-[#a0d8e8]/40" />
                  <div className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-[#a0d8e8]/40" />
                  <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-[#a0d8e8]/40" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 border border-neutral-700 flex items-center justify-center mb-4 group-hover:border-[#a0d8e8]/50 transition-colors">
                    <Upload className="w-6 h-6 text-neutral-600 group-hover:text-[#a0d8e8] transition-colors" />
                  </div>
                  <span className="text-sm font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors">
                    Drop image or click to upload
                  </span>
                  <span className="text-[10px] font-mono text-neutral-700 mt-2">
                    PNG, JPG, WEBP supported
                  </span>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls Sidebar */}
          <div className="border-l border-neutral-800 flex flex-col bg-neutral-950/50">
            {/* Image info */}
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image className="w-3.5 h-3.5 text-neutral-600" />
                <span className="text-[11px] font-mono text-neutral-500">
                  {image ? `${image.naturalWidth} × ${image.naturalHeight}` : 'No image'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* AI Section */}
              <div className="p-4 border-b border-neutral-800">
                <div className="mb-3">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">AI Features</span>
                </div>

                <div className={`flex items-center justify-between ${!image ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div>
                    <label className="text-xs text-neutral-300 block">Remove background</label>
                    <span className="text-[10px] text-neutral-600">Isolate subject automatically</span>
                  </div>
                  <button
                    onClick={() => setSettings(s => ({ ...s, removeBackground: !s.removeBackground }))}
                    disabled={isProcessing || !image}
                    className={`relative w-11 h-6 transition-all disabled:opacity-50 border ${
                      settings.removeBackground
                        ? 'bg-[#a0d8e8]/20 border-[#a0d8e8]/50'
                        : 'bg-neutral-900 border-neutral-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 transition-all ${
                        settings.removeBackground
                          ? 'translate-x-5 bg-[#a0d8e8]'
                          : 'translate-x-0 bg-neutral-600'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Shape Section */}
              <div className={`p-4 border-b border-neutral-800 ${isProcessing || !image ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">◆</span>
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Shape</span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {(['circle', 'square', 'diamond', 'star', 'heart'] as DotShape[]).map(shape => (
                    <button
                      key={shape}
                      onClick={() => setSettings(s => ({ ...s, dotShape: shape }))}
                      disabled={isProcessing || !image}
                      title={shape}
                      className={`py-2.5 text-lg transition-all border ${
                        settings.dotShape === shape
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600 hover:text-neutral-300'
                      }`}
                    >
                      {shape === 'circle' ? '●' : shape === 'square' ? '■' : shape === 'diamond' ? '◆' : shape === 'star' ? '★' : '♥'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size & Density */}
              <div className={`p-4 border-b border-neutral-800 space-y-4 ${isProcessing || !image ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Controls</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs text-neutral-400">Density</label>
                    <span className="text-[10px] font-mono text-[#a0d8e8]">{settings.density}</span>
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
                    <label className="text-xs text-neutral-400">Dot size</label>
                    <span className="text-[10px] font-mono text-[#a0d8e8]">{settings.maxDotSize}px</span>
                  </div>
                  <Slider
                    value={[settings.maxDotSize]}
                    onValueChange={(v) => setSettings(s => ({ ...s, maxDotSize: Array.isArray(v) ? v[0] : v }))}
                    min={2} max={20} step={1}
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs text-neutral-400">Contrast</label>
                    <span className="text-[10px] font-mono text-neutral-600">{settings.contrast}%</span>
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
                    <label className="text-xs text-neutral-400">Brightness</label>
                    <span className="text-[10px] font-mono text-neutral-600">{settings.brightness}%</span>
                  </div>
                  <Slider
                    value={[settings.brightness]}
                    onValueChange={(v) => setSettings(s => ({ ...s, brightness: Array.isArray(v) ? v[0] : v }))}
                    min={50} max={150} step={5}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Colors */}
              <div className={`p-4 border-b border-neutral-800 ${isProcessing || !image ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Colors</span>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={settings.dotColor}
                        onChange={(e) => setSettings(s => ({ ...s, dotColor: e.target.value }))}
                        disabled={isProcessing || !image}
                        className="w-10 h-10 cursor-pointer bg-transparent border-2 border-neutral-700 p-0 appearance-none [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:border-none"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">Dots</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={settings.bgColor}
                        onChange={(e) => setSettings(s => ({ ...s, bgColor: e.target.value }))}
                        disabled={isProcessing || !image}
                        className="w-10 h-10 cursor-pointer bg-transparent border-2 border-neutral-700 p-0 appearance-none [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:border-none"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">Background</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Section */}
            {svgContent && (
              <div className="border-t border-neutral-800 p-4 space-y-4 bg-neutral-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">Export scale</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(scale => (
                      <button
                        key={scale}
                        onClick={() => setSettings(s => ({ ...s, exportScale: scale }))}
                        className={`w-8 h-7 text-[11px] font-mono transition-all border ${
                          settings.exportScale === scale
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-neutral-500 border-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {scale}×
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={downloadSVG}
                    className="py-3 text-xs font-mono font-medium text-neutral-400 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" /> SVG
                  </button>
                  <button
                    onClick={downloadPNG}
                    className="py-3 text-xs font-mono font-medium bg-[#a0d8e8] text-black hover:bg-[#b8e4f0] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" /> PNG
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <span className="text-[10px] font-mono text-neutral-700">
            crafted by{' '}
            <a
              href="https://shiara.design"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-[#a0d8e8] transition-colors"
            >
              shiara arauzo
            </a>
          </span>
        </div>
      </main>
    </div>
  )
}
