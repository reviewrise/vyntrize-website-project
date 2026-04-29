# /public — Static Assets

All files here are served at the root URL (e.g. `/og-image.png` → `https://vyntrise.com/og-image.png`).

## Required files

### Root
| File | Size | Purpose |
|---|---|---|
| `favicon.ico` | 32×32 | Browser tab icon |
| `favicon-16x16.png` | 16×16 | Small favicon |
| `apple-touch-icon.png` | 180×180 | iOS home screen icon |
| `og-image.png` | 1200×630 | Open Graph / Twitter card image |
| `site.webmanifest` | — | PWA manifest (name, icons, theme color) |

### /images
General site images — hero visuals, service illustrations, etc.

| File | Purpose |
|---|---|
| `logo-dark.png` | Logo on dark backgrounds (PNG fallback) |
| `logo-light.png` | Logo on light backgrounds (PNG fallback) |
| `logo-icon.png` | Icon-only mark (square, for favicons/avatars) |

### /team
Team member profile photos. Name them to match the `team` array in `app/about/page.tsx`.

| File | Person |
|---|---|
| `abdisa-bati.jpg` | Abdisa Bati — Founder & CEO |
| `abenezer-seyoum.jpg` | Abenezer Seyoum — CTO |
| `biniyam-lombe.jpg` | Biniyam Lombe — AI Systems Architect |
| `mesay-alemayehu.jpg` | Mesay Alemayehu — Digital Marketing Strategist |
| `gedion-bula.jpg` | Gedion Bula — Business Intelligence Manager |
| `abel-legesse.jpg` | Abel Legesse — Software Engineer |

Recommended: 400×400px, square crop, JPG at 80% quality.

## OG Image spec
- Size: 1200×630px
- Content: VyntRise logo + tagline "Your business, running itself." on dark background (#0F1117)
- Brand blue: #4B6CF7
