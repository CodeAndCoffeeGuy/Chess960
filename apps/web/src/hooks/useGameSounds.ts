'use client';

import { useEffect, useRef, useCallback } from 'react';

type SoundType = 'move' | 'capture' | 'castle' | 'check' | 'gameStart' | 'gameEnd' | 'lowTime' | 'premove';

export function useGameSounds(enabled: boolean = true) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundsEnabledRef = useRef(enabled);

  useEffect(() => {
    soundsEnabledRef.current = enabled;
  }, [enabled]);

  // Initialize AudioContext on first interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Generate simple tones for different game events
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (!soundsEnabledRef.current) return;

    initAudio();
    if (!audioContextRef.current) return;

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    const now = context.currentTime;
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }, [initAudio]);

  const playSound = useCallback((soundType: SoundType) => {
    switch (soundType) {
      case 'move':
        // Simple click sound
        playTone(800, 0.05, 'sine', 0.2);
        break;

      case 'capture':
        // Higher pitch for captures
        playTone(1000, 0.08, 'square', 0.25);
        setTimeout(() => playTone(600, 0.08, 'square', 0.15), 50);
        break;

      case 'castle':
        // Two tones for castling
        playTone(600, 0.08, 'sine', 0.2);
        setTimeout(() => playTone(800, 0.08, 'sine', 0.2), 80);
        break;

      case 'check':
        // Alert sound for check
        playTone(1200, 0.15, 'triangle', 0.3);
        break;

      case 'gameStart':
        // Ascending tones
        playTone(400, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(600, 0.1, 'sine', 0.2), 100);
        setTimeout(() => playTone(800, 0.15, 'sine', 0.25), 200);
        break;

      case 'gameEnd':
        // Descending tones
        playTone(800, 0.15, 'sine', 0.25);
        setTimeout(() => playTone(600, 0.15, 'sine', 0.2), 150);
        setTimeout(() => playTone(400, 0.2, 'sine', 0.2), 300);
        break;

      case 'lowTime':
        // Urgent beep
        playTone(1400, 0.1, 'square', 0.35);
        break;

      case 'premove':
        // Soft confirmation
        playTone(700, 0.06, 'sine', 0.15);
        break;

      default:
        break;
    }
  }, [playTone]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playSound,
    initAudio, // Call this on first user interaction
  };
}
