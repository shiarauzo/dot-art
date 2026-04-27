import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AsciiHero } from '@/components/AsciiHero'
import { SplashScreen } from '@/components/SplashScreen'

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
    <div className="min-h-screen bg-[#F5F3EE] relative overflow-hidden">
      {!splashComplete && <SplashScreen onComplete={() => setSplashComplete(true)} />}

      {/* ASCII art background */}
      <AsciiHero />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top title */}
        <header className="pt-6 md:pt-8 px-6">
          <h1 className="text-center text-sm md:text-base tracking-[0.4em] lowercase font-mono text-neutral-800">
            point art app
          </h1>
        </header>

        {/* Center content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer text-center"
          >
            <span className="block text-5xl md:text-7xl lg:text-[6rem] font-serif font-normal tracking-tight text-neutral-900 group-hover:opacity-70 transition-opacity lowercase">
              try it free
            </span>
            <span className="block mt-1 text-lg md:text-xl font-mono text-neutral-500 group-hover:text-neutral-700 transition-colors lowercase tracking-wider">
              click to upload
            </span>
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
        <footer className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-xs font-mono text-neutral-600 lowercase tracking-wide">svg export</p>
              <p className="text-xs font-mono text-neutral-600 lowercase tracking-wide">png export</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-mono text-neutral-400 lowercase">
                made by{' '}
                <a
                  href="https://shiara.design"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-600 transition-colors"
                >
                  shiara arauzo
                </a>
              </span>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs font-mono text-neutral-600 lowercase tracking-wide">custom colors</p>
              <p className="text-xs font-mono text-neutral-600 lowercase tracking-wide">ai background removal</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
