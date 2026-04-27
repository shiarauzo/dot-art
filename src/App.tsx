import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {!splashComplete && <SplashScreen onComplete={() => setSplashComplete(true)} />}

      {/* Dot art background - fullscreen */}
      <DotHero />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top title */}
        <header className="pt-6 md:pt-10 px-6 md:px-12">
          <div className="flex flex-col items-center -space-y-2">
            <DotText text="HALFTONE ART APP" size={2.2} dotDensity={2} shadowOffset={1.5} />
            <p className="text-[11px] md:text-xs font-mono text-neutral-400 lowercase tracking-widest">
              transform images into stunning dot art
            </p>
          </div>
        </header>

        {/* Center content - right aligned */}
        <main className="flex-1 flex flex-col items-end justify-center px-6 md:px-12">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer group border border-neutral-600 px-4 py-2 transition-all duration-300 ease-out hover:border-[#ff6b9d]/50 hover:bg-[#ff6b9d]/10"
          >
            <DotText
              text="try it free →"
              size={1}
              font="serif"
              color="#ffffff"
            />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </main>

        {/* Corner labels */}
        <footer className="px-6 md:px-12 pb-6">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <p className="text-[10px] font-mono text-neutral-300 lowercase tracking-wide">svg export</p>
              <p className="text-[10px] font-mono text-neutral-300 lowercase tracking-wide">png export</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-mono text-neutral-400 lowercase">
                made by{' '}
                <a
                  href="https://shiara.design"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ff6b9d] transition-colors duration-300"
                >
                  shiara arauzo
                </a>
              </span>
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-[10px] font-mono text-neutral-300 lowercase tracking-wide">custom colors</p>
              <p className="text-[10px] font-mono text-neutral-300 lowercase tracking-wide">ai background removal</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
