/**
 * Throttle Utility
 *
 * Limits how often a function can be called within a time window.
 * Useful for preventing excessive API calls or WebSocket events.
 */

/**
 * Creates a throttled version of a function that can only be called once per delay period.
 *
 * @param func - The function to throttle
 * @param delay - Minimum time (in milliseconds) between function calls
 * @returns Throttled function that maintains the same signature as the original
 *
 * @example
 * const sendTyping = throttle((userId: string) => {
 *   socket.send({ type: 'typing', userId });
 * }, 3000); // Can only send typing event once every 3 seconds
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    // Clear any pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // If enough time has passed, call immediately
    if (timeSinceLastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      // Otherwise, schedule call for when delay period ends
      const remainingTime = delay - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
        timeoutId = null;
      }, remainingTime);
    }
  };
}

/**
 * Creates a debounced version of a function that delays execution until after
 * a wait period has elapsed since the last call.
 *
 * @param func - The function to debounce
 * @param delay - Time to wait (in milliseconds) after last call before executing
 * @returns Debounced function
 *
 * @example
 * const saveInput = debounce((text: string) => {
 *   localStorage.setItem('draft', text);
 * }, 500); // Saves 500ms after user stops typing
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}
