import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DotHero } from '@/components/DotHero'
import { SplashScreen } from '@/components/SplashScreen'
import { DotText } from '@/components/DotText'

function App() {
  const [splashComplete, setSplashComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      sessionStorage.setItem('pendingImage', reader.result as string)
      sessionStorage.setItem('pendingFileName', file.name)
      navigate('/art-generator')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden scanlines">
      {!splashComplete && <SplashScreen onComplete={() => setSplashComplete(true)} />}

      {/* Grid background overlay */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-[1]" />

      {/* Dot art background - fullscreen */}
      <DotHero />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top title */}
        <header className="pt-8 md:pt-12 px-6 md:px-12">
          <div className="flex flex-col items-center -space-y-2">
            {/* Main title with subtle glow - clickable */}
            <Link to="/" className="glitch cursor-pointer hover:opacity-90 transition-opacity" style={{ filter: 'drop-shadow(0 0 8px rgba(120, 200, 220, 0.4))' }}>
              <DotText
                text="HALFTONE ART"
                size={3}
                dotDensity={2.5}
                shadowOffset={1.5}
                color="#a0d8e8"
                shadowColor="#2a4a52"
              />
            </Link>

            {/* Subtitle */}
            <p className="text-xs md:text-sm font-mono text-neutral-400 uppercase tracking-[0.25em]">
              transform images into stunning dot art
            </p>
          </div>
        </header>

        {/* Center content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-12">
          {/* CTA Button */}
          <div className="float">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer relative px-8 py-4 border border-neutral-600 hover:border-neutral-400 hover:bg-white/5 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg md:text-xl font-mono font-medium text-neutral-300 tracking-wider uppercase group-hover:text-white transition-colors">
                  Try it free
                </span>
                <svg
                  className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform group-hover:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-neutral-500 group-hover:border-neutral-300 transition-colors" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-neutral-500 group-hover:border-neutral-300 transition-colors" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-neutral-500 group-hover:border-neutral-300 transition-colors" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-neutral-500 group-hover:border-neutral-300 transition-colors" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </main>

        {/* Features bar */}
        <footer className="px-6 md:px-12 pb-8">
          {/* Decorative line */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent mb-6" />

          <div className="flex justify-between items-end">
            {/* Left features */}
            <div className="space-y-1.5 corner-brackets p-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-pulse" />
                <p className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider">svg export</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#ff6b9d] rounded-full animate-pulse" />
                <p className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider">png export</p>
              </div>
            </div>

            {/* Center - author */}
            <div className="text-center">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                crafted by{' '}
                <a
                  href="https://shiara.design"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00f0ff] hover:text-[#ff6b9d] transition-colors duration-300"
                >
                  shiara arauzo
                </a>
              </span>
            </div>

            {/* Right features */}
            <div className="space-y-1.5 corner-brackets p-3">
              <div className="flex items-center gap-2 justify-end">
                <p className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider">custom colors</p>
                <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <p className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider">ai background removal</p>
                <span className="w-1.5 h-1.5 bg-[#ff6b9d] rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Vignette effect */}
      <div className="fixed inset-0 pointer-events-none z-20 bg-radial-gradient"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)'
        }}
      />
    </div>
  )
}

export default App
