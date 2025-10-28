'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BOARD_THEMES, PIECE_SETS, DEFAULT_BOARD_THEME, DEFAULT_PIECE_SET, getBoardTheme, getPieceSet, type BoardTheme, type PieceSet } from '@/lib/board-themes';

interface ThemeContextType {
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
  setBoardTheme: (themeId: string) => void;
  setPieceSet: (pieceSetId: string) => void;
  boardThemes: typeof BOARD_THEMES;
  pieceSets: typeof PIECE_SETS;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [boardThemeId, setBoardThemeId] = useState<string>(DEFAULT_BOARD_THEME);
  const [pieceSetId, setPieceSetId] = useState<string>(DEFAULT_PIECE_SET);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'light' ? 'light' : 'dark';
    }
    return 'dark';
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedBoardTheme = localStorage.getItem('chess960-board-theme');
    const savedPieceSet = localStorage.getItem('chess960-piece-set');
    
    if (savedBoardTheme && BOARD_THEMES.find(t => t.id === savedBoardTheme)) {
      setBoardThemeId(savedBoardTheme);
    }
    
    if (savedPieceSet && PIECE_SETS.find(s => s.id === savedPieceSet)) {
      setPieceSetId(savedPieceSet);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('chess960-board-theme', boardThemeId);
  }, [boardThemeId]);

  useEffect(() => {
    localStorage.setItem('chess960-piece-set', pieceSetId);
  }, [pieceSetId]);

  const setBoardTheme = (themeId: string) => {
    if (BOARD_THEMES.find(t => t.id === themeId)) {
      setBoardThemeId(themeId);
    }
  };

  const setPieceSet = (pieceSetId: string) => {
    if (PIECE_SETS.find(s => s.id === pieceSetId)) {
      setPieceSetId(pieceSetId);
    }
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  const boardTheme = getBoardTheme(boardThemeId);
  const pieceSet = getPieceSet(pieceSetId);

  const value: ThemeContextType = {
    boardTheme,
    pieceSet,
    setBoardTheme,
    setPieceSet,
    boardThemes: BOARD_THEMES,
    pieceSets: PIECE_SETS,
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}