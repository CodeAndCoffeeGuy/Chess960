'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  // Navigation
  onFirstMove?: () => void;
  onPreviousMove?: () => void;
  onNextMove?: () => void;
  onLastMove?: () => void;

  // Board controls
  onFlipBoard?: () => void;
  onEscape?: () => void;

  // Game actions
  onOfferDraw?: () => void;
  onResign?: () => void;
  onAbort?: () => void;

  // Analysis
  onToggleAnalysis?: () => void;

  // Misc
  onSpace?: () => void;

  // Conditions to disable shortcuts
  disabled?: boolean;
  isInInput?: boolean;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const {
    onFirstMove,
    onPreviousMove,
    onNextMove,
    onLastMove,
    onFlipBoard,
    onEscape,
    onOfferDraw,
    onResign,
    onAbort,
    onToggleAnalysis,
    onSpace,
    disabled = false,
  } = config;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts if disabled
      if (disabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Prevent default for handled shortcuts
      const preventDefault = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      switch (event.key) {
        // Navigation shortcuts
        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            // Ctrl/Cmd + Left = First move
            preventDefault();
            onFirstMove?.();
          } else {
            // Left = Previous move
            preventDefault();
            onPreviousMove?.();
          }
          break;

        case 'ArrowRight':
          if (event.ctrlKey || event.metaKey) {
            // Ctrl/Cmd + Right = Last move
            preventDefault();
            onLastMove?.();
          } else {
            // Right = Next move
            preventDefault();
            onNextMove?.();
          }
          break;

        case 'Home':
          preventDefault();
          onFirstMove?.();
          break;

        case 'End':
          preventDefault();
          onLastMove?.();
          break;

        // Board control shortcuts
        case 'f':
        case 'F':
          preventDefault();
          onFlipBoard?.();
          break;

        case 'Escape':
          preventDefault();
          onEscape?.();
          break;

        // Game action shortcuts
        case 'd':
        case 'D':
          if (!event.ctrlKey && !event.metaKey) {
            preventDefault();
            onOfferDraw?.();
          }
          break;

        case 'r':
        case 'R':
          if (!event.ctrlKey && !event.metaKey) {
            preventDefault();
            onResign?.();
          }
          break;

        case 'a':
        case 'A':
          if (!event.ctrlKey && !event.metaKey) {
            preventDefault();
            onAbort?.();
          }
          break;

        // Analysis shortcuts
        case 'z':
        case 'Z':
          if (!event.ctrlKey && !event.metaKey) {
            preventDefault();
            onToggleAnalysis?.();
          }
          break;

        // Space for confirming moves/actions
        case ' ':
          preventDefault();
          onSpace?.();
          break;

        default:
          // Don't prevent default for unhandled keys
          break;
      }
    },
    [
      disabled,
      onFirstMove,
      onPreviousMove,
      onNextMove,
      onLastMove,
      onFlipBoard,
      onEscape,
      onOfferDraw,
      onResign,
      onAbort,
      onToggleAnalysis,
      onSpace,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Helper component to display keyboard shortcuts
export function KeyboardShortcutsHelp() {
  return (
    <div className="bg-[#35322e] border border-[#474239] rounded-lg p-4">
      <h3 className="text-sm font-bold text-white mb-3">Keyboard Shortcuts</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="text-[#a0958a]">
          <kbd className="px-2 py-1 bg-[#2a2723] border border-[#474239] rounded text-[#c1b9ad] font-mono">←</kbd>
          <span className="ml-2">Previous move</span>
        </div>
        <div className="text-[#a0958a]">
          <kbd className="px-2 py-1 bg-[#2a2723] border border-[#474239] rounded text-[#c1b9ad] font-mono">→</kbd>
          <span className="ml-2">Next move</span>
        </div>
        <div className="text-[#a0958a]">
          <kbd className="px-2 py-1 bg-[#2a2723] border border-[#474239] rounded text-[#c1b9ad] font-mono">Home</kbd>
          <span className="ml-2">First move</span>
        </div>
        <div className="text-[#a0958a]">
          <kbd className="px-2 py-1 bg-[#2a2723] border border-[#474239] rounded text-[#c1b9ad] font-mono">End</kbd>
          <span className="ml-2">Last move</span>
        </div>
        <div className="text-[#a0958a]">
          <kbd className="px-2 py-1 bg-[#2a2723] border border-[#474239] rounded text-[#c1b9ad] font-mono">F</kbd>
          <span className="ml-2">Flip board</span>
        </div>
        <div className="text-[#a0958a]">
          <kbd className="px-2 py-1 bg-[#2a2723] border border-[#474239] rounded text-[#c1b9ad] font-mono">Esc</kbd>
          <span className="ml-2">Cancel</span>
        </div>
        <div className="text-[#a0958a]">
          <kbd className="px-2 py-1 bg-[#2a2723] border border-[#474239] rounded text-[#c1b9ad] font-mono">D</kbd>
          <span className="ml-2">Offer draw</span>
        </div>
        <div className="text-[#a0958a]">
          <kbd className="px-2 py-1 bg-[#2a2723] border border-[#474239] rounded text-[#c1b9ad] font-mono">R</kbd>
          <span className="ml-2">Resign</span>
        </div>
        <div className="text-[#a0958a]">
          <kbd className="px-2 py-1 bg-[#2a2723] border border-[#474239] rounded text-[#c1b9ad] font-mono">Space</kbd>
          <span className="ml-2">Confirm</span>
        </div>
        <div className="text-[#a0958a]">
          <kbd className="px-2 py-1 bg-[#2a2723] border border-[#474239] rounded text-[#c1b9ad] font-mono">Z</kbd>
          <span className="ml-2">Analysis</span>
        </div>
      </div>
    </div>
  );
}
