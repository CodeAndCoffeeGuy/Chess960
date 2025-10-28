import type { ClientMessage, TimeControl, WSMessage } from './messages';
import { ErrorCodes } from './errors';

// Validation result
export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

// Valid time controls
const VALID_TIME_CONTROLS = [
  '1+0', '2+0', '2+1',  // Bullet
  '3+0', '3+2', '5+0', '5+3',  // Blitz
  '10+0', '10+5', '15+0', '15+10',  // Rapid
  '30+0', '30+20', '60+0',  // Classical
] as const;

// Validate time control
export function isValidTimeControl(tc: any): tc is TimeControl {
  return typeof tc === 'string' && (VALID_TIME_CONTROLS as readonly string[]).includes(tc);
}

// Validate UCI move format
export function isValidUciMove(uci: string): boolean {
  // Basic UCI move validation (e2e4, a7a8q, etc.)
  const uciRegex = /^[a-h][1-8][a-h][1-8][qrbn]?$/;
  return typeof uci === 'string' && uci.length >= 4 && uci.length <= 5 && uciRegex.test(uci);
}

// Validate UUID format
export function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof id === 'string' && uuidRegex.test(id);
}

// Validate handle format
export function isValidHandle(handle: string): boolean {
  // 3-20 characters, alphanumeric and underscore/dash
  const handleRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return typeof handle === 'string' && handleRegex.test(handle);
}

// Validate timestamp
export function isValidTimestamp(ts: any): ts is number {
  return typeof ts === 'number' && ts > 0 && ts <= Date.now() + 60000; // Allow 1 minute in future
}

// Validate sequence number
export function isValidSequence(seq: any): seq is number {
  return typeof seq === 'number' && Number.isInteger(seq) && seq >= 0;
}

// Message size limits
export const MESSAGE_LIMITS = {
  MAX_MESSAGE_SIZE: 4096, // 4KB
  MAX_UCI_LENGTH: 5,
  MAX_HANDLE_LENGTH: 20,
  MAX_SESSION_ID_LENGTH: 512, // Increased to support JWT tokens
  MAX_CLIENT_VERSION_LENGTH: 32,
  MAX_GAME_ID_LENGTH: 36, // UUID length
} as const;

// Validate message size
export function validateMessageSize(message: string): ValidationResult {
  if (message.length > MESSAGE_LIMITS.MAX_MESSAGE_SIZE) {
    return {
      valid: false,
      error: 'Message too large',
      code: ErrorCodes.MESSAGE_TOO_LARGE,
    };
  }
  return { valid: true };
}

// Validate base message structure
export function validateBaseMessage(msg: any): ValidationResult {
  if (typeof msg !== 'object' || msg === null) {
    return {
      valid: false,
      error: 'Message must be an object',
      code: ErrorCodes.INVALID_MESSAGE,
    };
  }

  if (typeof msg.t !== 'string' || msg.t.length === 0) {
    return {
      valid: false,
      error: 'Message must have a valid type',
      code: ErrorCodes.INVALID_MESSAGE,
    };
  }

  return { valid: true };
}

// Validate specific client messages
export function validateClientMessage(msg: any): ValidationResult {
  const baseResult = validateBaseMessage(msg);
  if (!baseResult.valid) {
    return baseResult;
  }

  switch (msg.t) {
    case 'hello':
      if (typeof msg.sessionId !== 'string' || msg.sessionId.length > MESSAGE_LIMITS.MAX_SESSION_ID_LENGTH) {
        return { valid: false, error: 'Invalid sessionId', code: ErrorCodes.INVALID_MESSAGE };
      }
      if (typeof msg.clientVersion !== 'string' || msg.clientVersion.length > MESSAGE_LIMITS.MAX_CLIENT_VERSION_LENGTH) {
        return { valid: false, error: 'Invalid clientVersion', code: ErrorCodes.INVALID_MESSAGE };
      }
      break;

    case 'ping':
      if (!isValidTimestamp(msg.now)) {
        return { valid: false, error: 'Invalid timestamp', code: ErrorCodes.INVALID_MESSAGE };
      }
      break;

    case 'queue.join':
      if (!isValidTimeControl(msg.tc)) {
        return { valid: false, error: 'Invalid time control', code: ErrorCodes.INVALID_MESSAGE };
      }
      if (typeof msg.rated !== 'boolean') {
        return { valid: false, error: 'Invalid rated flag', code: ErrorCodes.INVALID_MESSAGE };
      }
      break;

    case 'move.make':
      if (!isValidUuid(msg.gameId)) {
        return { valid: false, error: 'Invalid gameId', code: ErrorCodes.INVALID_MESSAGE };
      }
      if (!isValidUciMove(msg.uci)) {
        return { valid: false, error: 'Invalid UCI move', code: ErrorCodes.INVALID_MOVE };
      }
      if (!isValidTimestamp(msg.clientTs)) {
        return { valid: false, error: 'Invalid client timestamp', code: ErrorCodes.INVALID_MESSAGE };
      }
      if (!isValidSequence(msg.seq)) {
        return { valid: false, error: 'Invalid sequence number', code: ErrorCodes.INVALID_MESSAGE };
      }
      break;

    case 'draw.offer':
    case 'draw.accept':
    case 'draw.decline':
    case 'takeback.offer':
    case 'takeback.accept':
    case 'takeback.decline':
    case 'resign':
    case 'abort':
    case 'reconnect':
      if (!isValidUuid(msg.gameId)) {
        return { valid: false, error: 'Invalid gameId', code: ErrorCodes.INVALID_MESSAGE };
      }
      break;

    case 'queue.leave':
      // No additional validation needed
      break;

    default:
      return {
        valid: false,
        error: `Unknown message type: ${msg.t}`,
        code: ErrorCodes.INVALID_MESSAGE,
      };
  }

  return { valid: true };
}

// Rate limiting helpers
export interface RateLimitInfo {
  messages: number;
  windowStart: number;
  blocked: boolean;
}

export function createRateLimitInfo(): RateLimitInfo {
  return {
    messages: 0,
    windowStart: Date.now(),
    blocked: false,
  };
}

export function checkRateLimit(
  info: RateLimitInfo,
  limit: number = 20,
  windowMs: number = 1000
): boolean {
  const now = Date.now();
  
  // Reset window if expired
  if (now - info.windowStart >= windowMs) {
    info.messages = 0;
    info.windowStart = now;
    info.blocked = false;
  }
  
  // Check if already blocked
  if (info.blocked) {
    return false;
  }
  
  // Increment and check limit
  info.messages++;
  if (info.messages > limit) {
    info.blocked = true;
    return false;
  }
  
  return true;
}