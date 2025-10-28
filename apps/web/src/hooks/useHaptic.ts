/**
 * Mobile Haptic Feedback Hook
 * Provides tactile feedback for better mobile UX
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'notification';

export function useHaptic() {
  const vibrate = (pattern: number | number[]) => {
    if (typeof window === 'undefined') return;

    // Check if vibration is supported
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const hapticFeedback = (style: HapticStyle = 'light') => {
    // Different vibration patterns for different interaction types
    const patterns: Record<HapticStyle, number | number[]> = {
      light: 10,           // Quick tap - piece selection
      medium: 20,          // Move made
      heavy: 30,           // Game end, error
      selection: [10, 5, 10], // Double tap - special actions
      notification: [20, 10, 20, 10, 20], // Important events
    };

    vibrate(patterns[style]);
  };

  // Specific feedback for common chess interactions
  const pieceSelected = () => hapticFeedback('light');
  const moveMade = () => hapticFeedback('medium');
  const capture = () => hapticFeedback('heavy');
  const check = () => hapticFeedback('selection');
  const gameEnd = () => hapticFeedback('notification');
  const buttonPress = () => hapticFeedback('light');
  const error = () => hapticFeedback('heavy');

  return {
    hapticFeedback,
    pieceSelected,
    moveMade,
    capture,
    check,
    gameEnd,
    buttonPress,
    error,
  };
}
