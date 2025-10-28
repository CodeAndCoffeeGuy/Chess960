# Chess960 Theme System

## Overview

The Chess960 platform now features a comprehensive theming system with multiple board themes and piece sets to customize your playing experience.

## Board Themes

### Classic Themes
- **Brown** - Traditional wooden chess board colors
- **Blue** - Cool blue tones for a modern look
- **Green** - Natural green colors like grass
- **Purple** - Elegant purple tones
- **Grey** - Neutral grey theme
- **Wood** - Warm wooden appearance

### Modern Themes
- **Cream** - Soft cream tones
- **Marble** - Clean white and grey marble
- **Blue Marble** - Blue-tinted marble
- **Green Marble** - Green-tinted marble
- **Pink Marble** - Pink-tinted marble

### Dark Themes
- **Dark** - Classic dark theme
- **Dark Blue** - Dark blue variant
- **Dark Green** - Dark green variant

### Special Themes
- **Neon** - Cyberpunk neon colors
- **Cyber** - Futuristic cyber theme
- **Gold** - Luxurious gold theme
- **Silver** - Elegant silver theme

## Piece Sets

### Classic Sets
- **Cburnett** - Traditional chess pieces (default)
- **Merida** - Modern chess pieces
- **Staunton** - Classic Staunton pieces

### Artistic Sets
- **Reilly Craig** - Artistic chess pieces
- **Companion** - Friendly, approachable pieces
- **Cardinal** - Elegant, refined pieces

### Geometric Sets
- **Alpha** - Simple geometric shapes
- **Shapes** - Pure geometric forms
- **Kosal** - Minimalist design

### Cultural Sets
- **Leipzig** - German-style pieces
- **Gioco** - Italian-style pieces
- **Tatiana** - Russian-style pieces
- **Riohacha** - Traditional pieces

### Special Sets
- **Spatial** - 3D-style pieces
- **Fantasy** - Fantasy-themed pieces

## Implementation

### Theme Context
The theme system uses React Context to manage theme state across the application:

```typescript
const { boardTheme, pieceSet, setBoardTheme, setPieceSet } = useTheme();
```

### Board Themes
Each board theme includes:
- Light square color
- Dark square color
- Highlight color (for selected squares)
- Last move color
- Check color
- Coordinate colors

### Piece Sets
Each piece set includes:
- Unique SVG files for all 12 pieces
- Consistent styling across the set
- Optimized for web display

## Usage

### In Components
```typescript
import { useTheme } from '@/contexts/ThemeContext';

function ChessBoard() {
  const { boardTheme, pieceSet } = useTheme();
  
  return (
    <div style={{ backgroundColor: boardTheme.light }}>
      {/* Board implementation */}
    </div>
  );
}
```

### Theme Settings
The theme settings are available in the user settings page with:
- Visual preview of all themes
- Live preview of current selection
- Easy switching between themes
- Persistent storage of preferences

## Customization

### Adding New Board Themes
1. Add theme to `BOARD_THEMES` array in `board-themes.ts`
2. Include all required color properties
3. Test with different piece sets

### Adding New Piece Sets
1. Create SVG files for all 12 pieces
2. Add set to `PIECE_SETS` array in `board-themes.ts`
3. Place SVG files in `/public/pieces/{set-id}/`

## File Structure

```
src/
├── lib/
│   └── board-themes.ts          # Theme definitions
├── contexts/
│   └── ThemeContext.tsx         # Theme context provider
├── components/
│   ├── settings/
│   │   └── ThemeSettings.tsx    # Theme settings UI
│   └── theme/
│       └── ThemePreview.tsx     # Theme preview component
└── app/
    └── settings/
        └── page.tsx             # Settings page with themes

public/
└── pieces/
    ├── cburnett/               # Default piece set
    ├── merida/                 # Modern pieces
    ├── alpha/                  # Geometric pieces
    └── ...                     # Other piece sets
```

## Features

### Live Preview
- Real-time preview of theme changes
- Sample chess position display
- Color palette visualization

### Persistent Storage
- Themes saved to localStorage
- Automatic loading on app start
- Cross-session persistence

### Responsive Design
- Mobile-friendly theme selection
- Touch-optimized interface
- Adaptive layout for different screen sizes

### Accessibility
- High contrast themes available
- Color-blind friendly options
- Keyboard navigation support

## Performance

### Optimized Loading
- SVG pieces for crisp display at any size
- Minimal file sizes for fast loading
- Cached theme preferences

### Memory Efficient
- Context-based state management
- Minimal re-renders
- Efficient theme switching

## Future Enhancements

### Planned Features
- Custom theme creation
- Theme sharing between users
- Seasonal themes
- Tournament-specific themes
- Animated piece sets
- Sound theme integration

### Advanced Customization
- Custom color picker
- Piece set mixing
- Board texture options
- 3D piece rendering
- VR/AR theme support

## Browser Support

### Supported Features
- CSS custom properties
- SVG rendering
- Local storage
- Context API
- Modern JavaScript

### Fallbacks
- Default themes for older browsers
- Graceful degradation
- Progressive enhancement

## Contributing

### Adding Themes
1. Follow the existing theme structure
2. Test with all piece sets
3. Ensure accessibility compliance
4. Add documentation

### Adding Piece Sets
1. Create high-quality SVG files
2. Maintain consistent styling
3. Optimize file sizes
4. Test across different themes

## License

All themes and piece sets are available under the same license as the Chess960 platform.
