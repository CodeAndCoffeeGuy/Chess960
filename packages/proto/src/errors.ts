// Error codes for WebSocket communication
export const ErrorCodes = {
  // Authentication errors
  INVALID_SESSION: 'INVALID_SESSION',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Queue errors
  ALREADY_IN_QUEUE: 'ALREADY_IN_QUEUE',
  NOT_IN_QUEUE: 'NOT_IN_QUEUE',
  QUEUE_COOLDOWN: 'QUEUE_COOLDOWN',
  
  // Game errors
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  INVALID_MOVE: 'INVALID_MOVE',
  GAME_ALREADY_ENDED: 'GAME_ALREADY_ENDED',
  NOT_IN_GAME: 'NOT_IN_GAME',
  
  // Draw offer errors
  NO_DRAW_OFFER: 'NO_DRAW_OFFER',
  ALREADY_OFFERED_DRAW: 'ALREADY_OFFERED_DRAW',
  CANNOT_DRAW: 'CANNOT_DRAW',
  
  // Protocol errors
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  MESSAGE_TOO_LARGE: 'MESSAGE_TOO_LARGE',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Error messages for each code
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.INVALID_SESSION]: 'Invalid session token',
  [ErrorCodes.SESSION_EXPIRED]: 'Session has expired',
  [ErrorCodes.UNAUTHORIZED]: 'Unauthorized action',
  
  [ErrorCodes.ALREADY_IN_QUEUE]: 'Already in matchmaking queue',
  [ErrorCodes.NOT_IN_QUEUE]: 'Not currently in queue',
  [ErrorCodes.QUEUE_COOLDOWN]: 'Queue cooldown active due to recent abort',
  
  [ErrorCodes.GAME_NOT_FOUND]: 'Game not found',
  [ErrorCodes.NOT_YOUR_TURN]: 'Not your turn to move',
  [ErrorCodes.INVALID_MOVE]: 'Invalid move',
  [ErrorCodes.GAME_ALREADY_ENDED]: 'Game has already ended',
  [ErrorCodes.NOT_IN_GAME]: 'Not currently in a game',
  
  [ErrorCodes.NO_DRAW_OFFER]: 'No draw offer to accept',
  [ErrorCodes.ALREADY_OFFERED_DRAW]: 'Draw offer already pending',
  [ErrorCodes.CANNOT_DRAW]: 'Cannot offer draw at this time',
  
  [ErrorCodes.INVALID_MESSAGE]: 'Invalid message format',
  [ErrorCodes.MESSAGE_TOO_LARGE]: 'Message exceeds size limit',
  [ErrorCodes.RATE_LIMITED]: 'Rate limit exceeded',
  
  [ErrorCodes.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
};