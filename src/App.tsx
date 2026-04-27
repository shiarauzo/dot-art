import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeroArt } from '@/components/HeroArt'
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {!splashComplete && <SplashScreen onComplete={() => setSplashComplete(true)} />}

      {/* Fullscreen dot-art background */}
      <div className="absolute inset-0 opacity-20">
        <HeroArt />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top title */}
        <header className="pt-8 md:pt-12 px-4">
          <h1 className="text-center text-sm md:text-base tracking-[0.3em] uppercase text-muted-foreground/60">
            Point Art app
          </h1>
        </header>

        {/* Center content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer text-center"
          >
            <span className="block text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground group-hover:opacity-80 transition-opacity">
              Try it free
            </span>
            <span className="block mt-2 text-lg md:text-xl text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors">
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

        {/* Footer */}
        <footer className="pb-6 text-center">
          <span className="text-xs text-muted-foreground/40">
            made by{' '}
            <a
              href="https://shiara.design"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              shiara arauzo
            </a>
          </span>
        </footer>
      </div>
    </div>
  )
}

export default App
