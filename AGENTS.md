# dotart

Photo to dot art (stippling) converter with freemium model.

## Purpose

Transform images into stipple/dot art with real-time preview. Export as SVG/PNG. Free tier has basic controls, Pro ($2.99 lifetime) unlocks advanced features.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Auth**: Supabase
- **Payments**: Polar.sh (one-time purchase)
- **Deploy**: Vercel

## Structure

```
src/
├── App.tsx              # Main app - upload, editor, all dot art logic
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── AuthModal.tsx    # Sign in/up modal
│   └── HeroArt.tsx      # Landing page illustration
├── context/
│   └── AuthContext.tsx  # Auth state + isPro check
└── lib/
    ├── supabase.ts      # Supabase client
    └── polar.ts         # Checkout URL builder

supabase/
├── functions/
│   └── polar-webhook/   # Payment verification, sets is_pro=true
└── migrations/
    └── 001_profiles.sql # User profiles with is_pro flag
```

## Contracts

- **Free vs Pro**: Check `isPro` from `useAuth()` before enabling pro features
- **Dot generation**: Lives in `generateDotArt()` in App.tsx - processes image → canvas → SVG
- **Pro features**: Contrast, brightness, colors, shapes, presets, export scale, code export

## Patterns

**Adding a Pro feature:**
1. Add setting to `DotArtSettings` interface
2. Add default in `DEFAULT_SETTINGS`
3. Gate with `isPro` check in `generateDotArt()` or UI
4. Add control in sidebar (disabled when `!isPro`)

**Adding a preset:**
1. Add to `Preset` type
2. Add config in `PRESETS` object
3. Button auto-renders in preset grid

## Environment

Required in `.env`:
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_POLAR_PRODUCT_ID
```
