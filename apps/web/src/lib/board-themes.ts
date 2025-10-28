/**
 * Board Themes and Piece Sets Configuration
 * Custom theming system for Chess960
 */

export interface BoardTheme {
  id: string;
  name: string;
  light: string;
  dark: string;
  highlight?: string;
  lastMove?: string;
  check?: string;
  coordinates?: {
    light: string;
    dark: string;
  };
}

export interface PieceSet {
  id: string;
  name: string;
  path: string;
  description?: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  // Classic Themes
  {
    id: 'brown',
    name: 'Brown',
    light: '#f0d9b5',
    dark: '#b58863',
    highlight: '#ffffcc',
    lastMove: '#cdd26a',
    check: '#ff6b6b',
    coordinates: {
      light: '#8b4513',
      dark: '#f0d9b5'
    }
  },
  {
    id: 'blue',
    name: 'Blue',
    light: '#dee3e6',
    dark: '#8ca2ad',
    highlight: '#b3d9ff',
    lastMove: '#7bb3d3',
    check: '#ff6b6b',
    coordinates: {
      light: '#2c5aa0',
      dark: '#dee3e6'
    }
  },
  {
    id: 'green',
    name: 'Green',
    light: '#eeeed2',
    dark: '#7fa650',
    highlight: '#b3ffb3',
    lastMove: '#9fcc9f',
    check: '#ff6b6b',
    coordinates: {
      light: '#2d5016',
      dark: '#eeeed2'
    }
  },
  {
    id: 'purple',
    name: 'Purple',
    light: '#e8dff5',
    dark: '#9f7ab8',
    highlight: '#e6ccff',
    lastMove: '#c4a3d9',
    check: '#ff6b6b',
    coordinates: {
      light: '#6b2c91',
      dark: '#e8dff5'
    }
  },
  {
    id: 'grey',
    name: 'Grey',
    light: '#e0e0e0',
    dark: '#7d7d7d',
    highlight: '#f0f0f0',
    lastMove: '#b8b8b8',
    check: '#ff6b6b',
    coordinates: {
      light: '#4a4a4a',
      dark: '#e0e0e0'
    }
  },
  {
    id: 'wood',
    name: 'Wood',
    light: '#d4b896',
    dark: '#8b6f47',
    highlight: '#f4e4c1',
    lastMove: '#c4a484',
    check: '#ff6b6b',
    coordinates: {
      light: '#5d4037',
      dark: '#d4b896'
    }
  },
  
  // Modern Themes
  {
    id: 'cream',
    name: 'Cream',
    light: '#f8f8f0',
    dark: '#b8b8a8',
    highlight: '#f0f0e0',
    lastMove: '#d8d8c8',
    check: '#ff6b6b',
    coordinates: {
      light: '#6b6b5b',
      dark: '#f8f8f0'
    }
  },
  {
    id: 'marble',
    name: 'Marble',
    light: '#f0f0f0',
    dark: '#a0a0a0',
    highlight: '#e8e8e8',
    lastMove: '#c8c8c8',
    check: '#ff6b6b',
    coordinates: {
      light: '#505050',
      dark: '#f0f0f0'
    }
  },
  {
    id: 'blue-marble',
    name: 'Blue Marble',
    light: '#e8f4f8',
    dark: '#7db3c8',
    highlight: '#d8e8f0',
    lastMove: '#a8c8d8',
    check: '#ff6b6b',
    coordinates: {
      light: '#2c5aa0',
      dark: '#e8f4f8'
    }
  },
  {
    id: 'green-marble',
    name: 'Green Marble',
    light: '#f0f8e8',
    dark: '#7db37d',
    highlight: '#e8f0d8',
    lastMove: '#a8c8a8',
    check: '#ff6b6b',
    coordinates: {
      light: '#2c5a2c',
      dark: '#f0f8e8'
    }
  },
  {
    id: 'pink-marble',
    name: 'Pink Marble',
    light: '#f8e8f0',
    dark: '#c87db3',
    highlight: '#f0d8e8',
    lastMove: '#d8a8c8',
    check: '#ff6b6b',
    coordinates: {
      light: '#5a2c5a',
      dark: '#f8e8f0'
    }
  },
  
  // Dark Themes
  {
    id: 'dark',
    name: 'Dark',
    light: '#4a4a4a',
    dark: '#2a2a2a',
    highlight: '#6a6a6a',
    lastMove: '#5a5a5a',
    check: '#ff6b6b',
    coordinates: {
      light: '#e0e0e0',
      dark: '#4a4a4a'
    }
  },
  {
    id: 'dark-blue',
    name: 'Dark Blue',
    light: '#4a5a6a',
    dark: '#2a3a4a',
    highlight: '#6a7a8a',
    lastMove: '#5a6a7a',
    check: '#ff6b6b',
    coordinates: {
      light: '#e0f0ff',
      dark: '#4a5a6a'
    }
  },
  {
    id: 'dark-green',
    name: 'Dark Green',
    light: '#4a6a4a',
    dark: '#2a4a2a',
    highlight: '#6a8a6a',
    lastMove: '#5a7a5a',
    check: '#ff6b6b',
    coordinates: {
      light: '#e0ffe0',
      dark: '#4a6a4a'
    }
  },
  
  // Special Themes
  {
    id: 'gold',
    name: 'Gold',
    light: '#ffd700',
    dark: '#b8860b',
    highlight: '#ffff00',
    lastMove: '#daa520',
    check: '#ff6b6b',
    coordinates: {
      light: '#8b4513',
      dark: '#ffd700'
    }
  },
  {
    id: 'silver',
    name: 'Silver',
    light: '#c0c0c0',
    dark: '#808080',
    highlight: '#e0e0e0',
    lastMove: '#a0a0a0',
    check: '#ff6b6b',
    coordinates: {
      light: '#404040',
      dark: '#c0c0c0'
    }
  }
];

export const PIECE_SETS: PieceSet[] = [
  {
    id: 'cburnett',
    name: 'Cburnett',
    path: '/pieces/cburnett',
    description: 'Classic chess pieces'
  }
];

export const DEFAULT_BOARD_THEME = 'brown';
export const DEFAULT_PIECE_SET = 'cburnett';

export function getBoardTheme(themeId: string): BoardTheme {
  return BOARD_THEMES.find(theme => theme.id === themeId) || BOARD_THEMES[0];
}

export function getPieceSet(pieceSetId: string): PieceSet {
  return PIECE_SETS.find(set => set.id === pieceSetId) || PIECE_SETS[0];
}

export function getPieceImagePath(piece: string, pieceSet: string): string {
  const pieceSetData = getPieceSet(pieceSet);
  // Add piece set ID as cache-busting parameter to force reload when piece set changes
  return `${pieceSetData.path}/${piece}.svg?v=${pieceSet}`;
}
