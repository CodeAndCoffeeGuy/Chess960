# Open Graph Image Guide

This file explains how to create the OG (Open Graph) image for social media sharing.

## Required Image

**File:** `og-image.png`
**Size:** 1200x630 pixels (Facebook/Twitter recommended)
**Location:** `/public/og-image.png`

## Quick Creation Methods

### Option 1: Using Canva (Easiest)
1. Go to Canva.com
2. Create a custom size: 1200 x 630 px
3. Use this template:
   - Background: Dark gradient (#1f1d1a to #262421)
   - Logo: Center the Bullet Chess logo
   - Text: "Bullet Chess" in large orange gradient text
   - Subtext: "Ultra-Fast Online Chess Platform"
4. Download as PNG
5. Save as `og-image.png` in `/public/`

### Option 2: Using Figma
1. Create 1200x630px frame
2. Add dark background matching site theme
3. Center your logo
4. Add text overlays
5. Export as PNG at 2x resolution
6. Save in `/public/`

### Option 3: Using Existing Logo
```bash
# If you have ImageMagick installed
convert logo.png -resize 1200x630 -gravity center -extent 1200x630 -background "#1f1d1a" og-image.png
```

## Design Guidelines

- **Brand Colors:**
  - Primary: #f97316 (orange)
  - Dark: #1f1d1a
  - Light text: #ffffff

- **Typography:**
  - Headline: 72px, Bold
  - Subheadline: 36px, Regular

- **Layout:**
  - Keep important content in the "safe zone" (center 1000x450px)
  - Avoid text near edges
  - High contrast for readability

## Testing Your OG Image

After creating the image:

1. Visit: https://www.opengraph.xyz/
2. Enter your site URL
3. Preview how it looks on different platforms
4. Adjust if needed

## Current Status

⚠️ **TODO:** Create and add og-image.png to /public/

The site is currently configured to use `/og-image.png` in the metadata.
Until you add this file, social media previews will show a fallback or nothing.
