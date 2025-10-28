'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Eye, Check } from 'lucide-react';
import { ThemePreview } from '@/components/theme/ThemePreview';

interface ThemeSettingsProps {
  className?: string;
}

export function ThemeSettings({ className = '' }: ThemeSettingsProps) {
  const { boardTheme, setBoardTheme, boardThemes } = useTheme();

  return (
    <div className={`space-y-6 ${className}`}>

      {/* Board Themes */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-[#c1b9ad] light:text-[#5a5449]">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Board Themes</span>
          </div>
          
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {boardThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setBoardTheme(theme.id)}
              className={`group relative p-2 rounded-lg border-2 transition-all duration-200 ${
                boardTheme.id === theme.id
                  ? 'border-orange-300 bg-orange-300/20 shadow-lg'
                  : 'border-[#474239] light:border-[#d4caba] hover:border-[#5a5449] light:hover:border-[#a0958a] hover:shadow-md'
              }`}
            >
              {/* Theme Preview */}
              <div className="grid grid-cols-2 gap-0.5 w-8 h-8 mb-1 rounded overflow-hidden mx-auto">
                <div style={{ backgroundColor: theme.light }}></div>
                <div style={{ backgroundColor: theme.dark }}></div>
                <div style={{ backgroundColor: theme.dark }}></div>
                <div style={{ backgroundColor: theme.light }}></div>
              </div>
              
              {/* Theme Name */}
              <div className="text-center">
                <span className="text-xs font-medium text-[#c1b9ad] light:text-[#5a5449] group-hover:text-white light:group-hover:text-black transition-colors">
                  {theme.name}
                </span>
              </div>

              {/* Selection Indicator */}
              {boardTheme.id === theme.id && (
                <div className="absolute top-1 right-1">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-300 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
        </div>

      {/* Theme Preview */}
      <ThemePreview />
    </div>
  );
}