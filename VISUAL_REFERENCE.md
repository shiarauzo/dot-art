# Visual Style Reference: Technology Exposition 2022 Poster

---

## 1. Core Aesthetic

**Style Name:** **ASCII-Brutalist Tech Poster**

**Design Philosophy:** Merging raw computational aesthetics with traditional typographic hierarchy to create a poster that embodies the intersection of human and machine communication.

**Key Influences:**
- ASCII art / text-based graphics from early computing
- Brutalist typography
- Monospace terminal aesthetics
- Swiss poster design (grid structure)
- Halftone printing techniques (translated to character density)

---

## 2. Color Palette

| Color Name | Hex Code | Usage Context |
|------------|----------|---------------|
| Paper White | `#F5F5F5` | Background, negative space |
| Charcoal Black | `#1A1A1A` | ASCII characters, primary text |
| Mid Gray | `#666666` | ASCII art mid-tones, text shadows |
| Light Gray | `#AAAAAA` | ASCII art highlights, sparse areas |

**Total Colors:** 4 (monochromatic grayscale)

**Note:** The "color" in this design comes entirely from character density and spacing.

---

## 3. Typography System

### Headline Typography (Event Date) — KEY REFERENCE
- **Font Family:** Serif, **Times New Roman** or similar traditional serif
- **Weight:** Bold/Black
- **Case:** Lowercase
- **Size:** Large (~48-60pt equivalent)
- **Treatment:** Solid black fill with **subtle drop shadow**
- **Shadow:** Offset approximately 2-3px down-right, lighter gray tone

**Example Text:** "september 10th" / "10am-4pm"

### Title Typography (Event Name)
- **Font Family:** Monospace terminal font (Courier-style)
- **Weight:** Regular
- **Case:** Lowercase

### Hierarchy Structure
1. **Primary:** Event date/time (serif, bold, largest)
2. **Secondary:** Event title (monospace, top)
3. **Tertiary:** Category labels (monospace, small, scattered)
4. **Background:** ASCII art illustration

---

## 4. Key Design Elements

### Text Shadow Effect (KEY FEATURE for "september 10th")
- **Application:** "september 10th" and "10am-4pm" text
- **Offset:** ~3-4 pixels down and right
- **Color:** Mid gray (~40% opacity of main text)
- **Style:** Hard-edged shadow, NOT blurred
- **Dot Size:** Shadow dots are **smaller** than main text dots (~50-60%)
- **Purpose:** Creates depth, separates text from busy background

### ASCII Art Illustration
- **Subject:** Human figure (astronaut/person)
- **Technique:** Variable character density creates grayscale
- **Characters Used:** `8`, `0`, `@`, `#`, `:`, `.`, space
- **Density Mapping:**
  - Dark areas: `8`, `@`, `#`, `%`
  - Mid-tones: `o`, `0`, `c`, `v`
  - Light areas: `.`, `:`, space

### Layout Structure
```
┌─────────────────────────────────────┐
│ [Title: technology exposition 2022] │
├─────────────────────────────────────┤
│         [ASCII ART FIGURE]          │
│                                     │
│              "september 10th"       │  ← SERIF + SHADOW
│                "10am-4pm"           │
├─────────────────────────────────────┤
│ [labels at bottom corners]          │
└─────────────────────────────────────┘
```

### Unique Stylistic Choices
1. **Serif vs Monospace Contrast:** Elegant serif date against raw ASCII
2. **Text Shadow Integration:** Shadow made with same dot technique as background
3. **Lowercase Only:** All text in lowercase for modern cohesion

---

## 5. Visual Concept

### Conceptual Bridge
The design bridges **human artistry** and **machine language** by using ASCII characters to render a human figure—a visual metaphor for technology serving humanity.

### Ideal Use Cases
- Tech conference/exposition posters
- Developer/hacker meetups
- Creative coding project landing pages
- AI/ML themed events

---

## 6. Implementation Notes for "try it free" Text

### To Recreate the "september 10th" Style:

**1. Font Selection:**
- Use a **serif font**: `Times New Roman`, `Georgia`, or `Playfair Display`
- Weight: **Bold** (700+)
- Style: **Lowercase only**

**2. Shadow Implementation (CRITICAL):**
- Offset: **4-6 pixels** down-right diagonal
- Shadow rendered with **smaller dots** (~50-60% size of main)
- Shadow opacity: **30-40%** (`rgba(255,255,255,0.35)`)
- Shadow renders **BEFORE** main text (painter's algorithm)

**3. Dot Art Conversion:**
- Main text: Full white dots (`#FFFFFF`), full size
- Shadow: Smaller gray dots, offset position
- Dot spacing: 2.5-3px

**4. Current Problem:**
- "try it free" uses **sans-serif** font (Science Gothic)
- Shadow not visible or not implemented correctly
- Need to switch to **serif** font family

### Code Changes Required:
```javascript
// Font: Change from sans-serif to serif
ctx.font = `bold ${fontSize}px "Times New Roman", Georgia, serif`

// Shadow offset: Increase for visibility
const shadowOffset = 5 * size  // was 3

// Shadow opacity: Make more visible
ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'  // was 0.25

// Shadow dot size: Slightly larger
const radius = shadowBrightness * maxRadius * 0.6  // was 0.55
```

---

## Quick Reference

| Aspect | Value |
|--------|-------|
| Font Family | Times New Roman, Georgia, serif |
| Font Weight | Bold (700) |
| Text Case | lowercase |
| Shadow Offset | 4-6px down-right |
| Shadow Opacity | 35-40% |
| Shadow Dot Size | 50-60% of main |
| Main Dot Color | `#FFFFFF` |
| Style | ASCII-Brutalist |
