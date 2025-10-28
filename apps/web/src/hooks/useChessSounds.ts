'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

export type ChessSoundType = 'move' | 'capture' | 'check' | 'checkmate' | 'castle' | 'promote' | 'lowtime' | 'gameStart' | 'gameEnd' | 'notify';

interface ChessSoundOptions {
  enabled?: boolean;
  volume?: number;
}

/**
 * Hook for playing chess sounds using Web Audio API
 * Generates sounds programmatically - no audio files needed!
 */
export function useChessSounds(options: ChessSoundOptions = {}) {
  const { enabled = true, volume = 0.5 } = options;

  const audioContext = useRef<AudioContext | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Initialize Web Audio API
  useEffect(() => {
    if (typeof window === 'undefined' || !window.AudioContext) {
      setIsSupported(false);
      console.warn('Web Audio API not supported');
      return;
    }

    audioContext.current = new AudioContext();

    return () => {
      audioContext.current?.close();
    };
  }, []);

  /**
   * Generate and play a tone using Web Audio API
   */
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', envelope: { attack: number; decay: number } = { attack: 0.01, decay: 0.1 }) => {
    if (!audioContext.current || !isSupported || !enabled) return;

    const ctx = audioContext.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Envelope for more natural sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + envelope.attack);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration - envelope.decay);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [isSupported, enabled, volume]);

  /**
   * Play a chess sound
   */
  const playSound = useCallback((soundType: ChessSoundType) => {
    if (!audioContext.current || !isSupported || !enabled) return;

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }

      switch (soundType) {
        case 'move':
          // Soft, pleasant click sound
          playTone(440, 0.05, 'sine', { attack: 0.001, decay: 0.04 });
          break;

        case 'capture':
          // Sharper, more pronounced sound
          playTone(330, 0.08, 'triangle', { attack: 0.001, decay: 0.07 });
          setTimeout(() => playTone(220, 0.06, 'triangle', { attack: 0.001, decay: 0.05 }), 30);
          break;

        case 'castle':
          // Double sound for castle
          playTone(523, 0.06, 'sine', { attack: 0.001, decay: 0.05 });
          setTimeout(() => playTone(659, 0.06, 'sine', { attack: 0.001, decay: 0.05 }), 60);
          break;

        case 'promote':
          // Ascending tone for promotion
          playTone(440, 0.08, 'sine', { attack: 0.01, decay: 0.07 });
          setTimeout(() => playTone(554, 0.08, 'sine', { attack: 0.01, decay: 0.07 }), 50);
          setTimeout(() => playTone(659, 0.1, 'sine', { attack: 0.01, decay: 0.09 }), 100);
          break;

        case 'check':
          // Warning sound - higher pitch with slight vibrato
          playTone(880, 0.15, 'square', { attack: 0.01, decay: 0.12 });
          break;

        case 'checkmate':
          // Dramatic descending sound
          playTone(880, 0.2, 'sawtooth', { attack: 0.02, decay: 0.18 });
          setTimeout(() => playTone(659, 0.2, 'sawtooth', { attack: 0.02, decay: 0.18 }), 100);
          setTimeout(() => playTone(440, 0.3, 'sawtooth', { attack: 0.02, decay: 0.28 }), 200);
          break;

        case 'lowtime':
          // Urgent beep
          playTone(1000, 0.1, 'square', { attack: 0.005, decay: 0.09 });
          break;

        case 'gameStart':
          // Pleasant ascending chime
          playTone(523, 0.1, 'sine', { attack: 0.01, decay: 0.09 });
          setTimeout(() => playTone(659, 0.15, 'sine', { attack: 0.01, decay: 0.14 }), 100);
          break;

        case 'gameEnd':
          // Conclusive sound
          playTone(440, 0.2, 'sine', { attack: 0.02, decay: 0.18 });
          setTimeout(() => playTone(330, 0.3, 'sine', { attack: 0.02, decay: 0.28 }), 150);
          break;

        case 'notify':
          // Gentle notification
          playTone(660, 0.08, 'sine', { attack: 0.01, decay: 0.07 });
          break;

        default:
          console.warn(`Unknown sound type: ${soundType}`);
      }
    } catch (error) {
      console.error(`Error playing sound: ${soundType}`, error);
    }
  }, [isSupported, enabled, playTone]);

  /**
   * Play move sound based on move type
   */
  const playMoveSound = useCallback((moveData: {
    captured?: boolean;
    castle?: boolean;
    promotion?: boolean;
    check?: boolean;
    checkmate?: boolean;
  }) => {
    if (moveData.checkmate) {
      playSound('checkmate');
    } else if (moveData.check) {
      playSound('check');
    } else if (moveData.castle) {
      playSound('castle');
    } else if (moveData.promotion) {
      playSound('promote');
    } else if (moveData.captured) {
      playSound('capture');
    } else {
      playSound('move');
    }
  }, [playSound]);

  return {
    playSound,
    playMoveSound,
    isSupported,
  };
}
