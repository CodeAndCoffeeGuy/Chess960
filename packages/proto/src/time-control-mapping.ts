import type { TimeControl } from './messages';
import { Speed } from './speed';

/**
 * Map time control string to database enum value
 * Handles all Chess960 time control formats
 */
export function timeControlToDbEnum(tc: TimeControl): string {
  switch (tc) {
    // Bullet
    case '1+0':
      return 'ONE_PLUS_ZERO';
    case '2+0':
      return 'TWO_PLUS_ZERO';
    case '2+1':
      return 'TWO_PLUS_ONE';

    // Blitz
    case '3+0':
      return 'THREE_PLUS_ZERO';
    case '3+2':
      return 'THREE_PLUS_TWO';
    case '5+0':
      return 'FIVE_PLUS_ZERO';
    case '5+3':
      return 'FIVE_PLUS_THREE';

    // Rapid
    case '10+0':
      return 'TEN_PLUS_ZERO';
    case '10+5':
      return 'TEN_PLUS_FIVE';
    case '15+0':
      return 'FIFTEEN_PLUS_ZERO';
    case '15+10':
      return 'FIFTEEN_PLUS_TEN';

    // Classical
    case '30+0':
      return 'THIRTY_PLUS_ZERO';
    case '30+20':
      return 'THIRTY_PLUS_TWENTY';
    case '60+0':
      return 'SIXTY_PLUS_ZERO';

    default:
      throw new Error(`Unknown time control: ${tc}`);
  }
}

/**
 * Map time control to rating category enum
 * Each speed category has its own separate rating
 */
export function timeControlToRatingCategory(tc: TimeControl): string {
  const speed = getSpeedForTimeControl(tc);

  switch (speed) {
    case Speed.BULLET:
      return 'BULLET';
    case Speed.BLITZ:
      return 'BLITZ';
    case Speed.RAPID:
      return 'RAPID';
    case Speed.CLASSICAL:
      return 'CLASSICAL';
    default:
      throw new Error(`Unknown speed: ${speed}`);
  }
}

/**
 * Get speed category for a specific time control using Chess960 presets
 * Uses preset mapping rather than formula-based classification
 */
function getSpeedForTimeControl(tc: TimeControl): Speed {
  // Bullet: 1+0, 2+0, 2+1
  if (tc === '1+0' || tc === '2+0' || tc === '2+1') {
    return Speed.BULLET;
  }

  // Blitz: 3+0, 3+2, 5+0, 5+3
  if (tc === '3+0' || tc === '3+2' || tc === '5+0' || tc === '5+3') {
    return Speed.BLITZ;
  }

  // Rapid: 10+0, 10+5, 15+0, 15+10
  if (tc === '10+0' || tc === '10+5' || tc === '15+0' || tc === '15+10') {
    return Speed.RAPID;
  }

  // Classical: 30+0, 30+20, 60+0
  if (tc === '30+0' || tc === '30+20' || tc === '60+0') {
    return Speed.CLASSICAL;
  }

  throw new Error(`Unknown time control: ${tc}`);
}
