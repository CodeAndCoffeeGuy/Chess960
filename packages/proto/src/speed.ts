import type { TimeControl } from './messages';

/**
 * Speed categories for Chess960 games
 */
export enum Speed {
  BULLET = 'bullet',
  BLITZ = 'blitz',
  RAPID = 'rapid',
  CLASSICAL = 'classical',
}

/**
 * Parse time control string for speed calculation (e.g., "3+2" -> {initialSeconds: 180, incrementSeconds: 2})
 */
export function parseTimeControlForSpeed(tc: string): { initialSeconds: number; incrementSeconds: number } {
  const [initial, increment] = tc.split('+').map(Number);
  return {
    initialSeconds: initial * 60,
    incrementSeconds: increment,
  };
}

/**
 * Calculate estimated total game time using formula:
 * initialTime + (increment × 80 moves) + 10 seconds buffer
 *
 * Assumes an average game length of 40 moves per side (80 half-moves total)
 */
export function estimateTotalSeconds(initialSeconds: number, incrementSeconds: number): number {
  return initialSeconds + incrementSeconds * 80 + 10;
}

/**
 * Determine speed category from time control using Chess960 thresholds:
 * - Bullet: < 120 seconds (2 minutes)
 * - Blitz: 120-479 seconds (2-8 minutes)
 * - Rapid: 480-1499 seconds (8-25 minutes)
 * - Classical: >= 1500 seconds (25 minutes)
 */
export function getSpeedCategory(tc: string): Speed {
  const { initialSeconds, incrementSeconds } = parseTimeControlForSpeed(tc);
  const totalSeconds = estimateTotalSeconds(initialSeconds, incrementSeconds);

  if (totalSeconds < 120) return Speed.BULLET;
  if (totalSeconds < 480) return Speed.BLITZ;
  if (totalSeconds < 1500) return Speed.RAPID;
  return Speed.CLASSICAL;
}

/**
 * Get display name for speed category
 */
export function getSpeedDisplayName(speed: Speed): string {
  switch (speed) {
    case Speed.BULLET:
      return 'Bullet';
    case Speed.BLITZ:
      return 'Blitz';
    case Speed.RAPID:
      return 'Rapid';
    case Speed.CLASSICAL:
      return 'Classical';
  }
}

/**
 * Get speed category for a specific time control
 */
export function getTimeControlSpeed(tc: TimeControl): Speed {
  return getSpeedCategory(tc);
}

/**
 * Get estimated game duration in minutes for display
 */
export function getEstimatedDuration(tc: string): number {
  const { initialSeconds, incrementSeconds } = parseTimeControlForSpeed(tc);
  const totalSeconds = estimateTotalSeconds(initialSeconds, incrementSeconds);
  return Math.round(totalSeconds / 60);
}
