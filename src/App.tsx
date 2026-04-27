import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Palette } from 'lucide-react'
import { HeroArt } from '@/components/HeroArt'
import { SplashScreen } from '@/components/SplashScreen'
import { DotText } from '@/components/DotText'

function App() {
  const [splashComplete, setSplashComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Store file in sessionStorage as base64 for transfer
    const reader = new FileReader()
    reader.onload = () => {
      sessionStorage.setItem('pendingImage', reader.result as string)
      navigate('/art-generator')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-background relative">
      {!splashComplete && <SplashScreen onComplete={() => setSplashComplete(true)} />}

      <div className="block">
        <nav className="border-b border-border/50">
          <div className="container mx-auto px-4 h-11 flex items-center justify-between">
            <span className="text-sm font-semibold tracking-tight">dotart</span>
          </div>
        </nav>

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
                className="px-8 py-3 text-sm font-medium bg-foreground text-background rounded-none cursor-pointer hover:bg-foreground/90 hover:scale-105 active:scale-95 transition-all duration-150 mb-3"
              >
                Try it
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
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
