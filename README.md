# dotart

Transform photos into beautiful dot art (stippling). Free tier with basic controls, Pro tier ($2.99 lifetime) with advanced features.

## Features

### Free
- Upload any image (PNG, JPG, WebP)
- Adjust density and dot size
- Export as SVG or PNG
- Live preview

### Pro ($2.99 lifetime)
- Contrast & brightness controls
- Invert colors
- Custom dot shapes (circle, square, diamond, star, heart)
- Custom colors (dot & background)
- Organic/irregular spacing
- Presets (retro, newspaper, sketch)
- Multi-resolution export (1x, 2x, 3x, 4x)
- Code export (React, HTML)

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** Supabase
- **Payments:** Lemon Squeezy
- **Deploy:** Vercel

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_profiles.sql`
3. Copy your project URL and anon key

### 3. Set up Lemon Squeezy

1. Create an account at [lemonsqueezy.com](https://lemonsqueezy.com)
2. Create a product ($2.99, one-time payment)
3. Get your store ID and variant ID
4. Set up webhook to `https://your-project.supabase.co/functions/v1/lemon-webhook`

### 4. Configure environment

```bash
cp .env.example .env
```

Fill in your values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_LEMONSQUEEZY_STORE_ID=your-store-id
VITE_LEMONSQUEEZY_VARIANT_ID=your-variant-id
```

### 5. Deploy Supabase Edge Function

```bash
supabase functions deploy lemon-webhook
```

### 6. Run locally

```bash
npm run dev
```

### 7. Deploy to Vercel

```bash
vercel
```

## Project Structure

```
dotart/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   └── AuthModal.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── lemonsqueezy.ts
│   │   └── utils.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   │   └── 001_profiles.sql
│   └── functions/
│       └── lemon-webhook/
└── ...
```

## License

MIT
