'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Settings, Palette, Sun, Moon } from 'lucide-react';

export function GuestSettings() {
  const { boardTheme, setBoardTheme, boardThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'light' ? false : true;
    }
    return true;
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Apply dark mode to document
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[#c1b9ad] light:text-[#5a5449] hover:text-white light:hover:text-black transition-colors"
        title="Guest Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#2a2720] light:bg-[#f5f1ea] rounded-lg shadow-xl border border-[#474239] light:border-[#d4caba] z-50">
          <div className="p-4 space-y-4">
            {/* Theme Mode */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-[#c1b9ad] light:text-[#5a5449]">
                <Sun className="w-4 h-4" />
                <h3 className="text-sm font-medium">Theme Mode</h3>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    if (!darkMode) toggleDarkMode();
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-all text-xs ${
                    darkMode
                      ? 'border-orange-300 bg-orange-300/20 text-white'
                      : 'border-[#474239] light:border-[#d4caba] text-[#c1b9ad] light:text-[#5a5449] hover:border-[#5a5449] light:hover:border-[#a0958a]'
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  <span>Dark</span>
                </button>
                
                <button
                  onClick={() => {
                    if (darkMode) toggleDarkMode();
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-all text-xs ${
                    !darkMode
                      ? 'border-orange-300 bg-orange-300/20 text-white'
                      : 'border-[#474239] light:border-[#d4caba] text-[#c1b9ad] light:text-[#5a5449] hover:border-[#5a5449] light:hover:border-[#a0958a]'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span>Light</span>
                </button>
              </div>
            </div>

            {/* Board Themes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-[#c1b9ad] light:text-[#5a5449]">
                <Palette className="w-4 h-4" />
                <h3 className="text-sm font-medium">Board Theme</h3>
              </div>
              
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {boardThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setBoardTheme(theme.id)}
                    className={`group relative p-2 rounded-lg border transition-all duration-200 ${
                      boardTheme.id === theme.id
                        ? 'border-orange-300 bg-orange-300/20'
                        : 'border-[#474239] light:border-[#d4caba] hover:border-[#5a5449] light:hover:border-[#a0958a]'
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
                        <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-[#474239] light:border-[#d4caba]">
              <p className="text-xs text-[#a0958a] light:text-[#8a7f6f] text-center">
                Settings saved locally
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
