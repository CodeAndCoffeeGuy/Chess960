/**
 * Event schemas and message types
 * Based on the Chess960 API specification
 */

// Base event interface
export interface Chess960Event {
  type: string;
}

// User status information
export interface UserStatus {
  id: string;
  name: string;
  online?: boolean;
  playing?: boolean;
  streaming?: boolean;
  signal?: number; // 1-4, connection quality
  playingId?: string; // Current game ID if playing
  title?: string;
  flair?: string;
}

// Clock information
export interface ClockInfo {
  initial: number; // Initial time in seconds
  increment: number; // Increment in seconds  
  totalTime: number; // Total game time
}

// Game player information
export interface GamePlayer {
  user?: {
    name: string;
    id: string;
    title?: string;
    flair?: string;
  };
  rating?: number;
  ratingDiff?: number;
  provisional?: boolean;
}

// Game information
export interface GameInfo {
  id: string;
  rated: boolean;
  variant: {
    key: string;
    name: string;
    short: string;
  };
  speed: string; // bullet, blitz, rapid, classical
  perf: string;
  createdAt: number;
  status: number; // Game status code
  statusName: string;
  clock?: ClockInfo;
  players?: {
    white: GamePlayer;
    black: GamePlayer;
  };
  daysPerTurn?: number; // For correspondence
  source?: string;
  compat?: {
    bot: boolean;
    board: boolean;
  };
}

// Game state information
export interface GameState {
  type: string;
  moves: string; // Space-separated UCI moves
  wtime: number; // White time in milliseconds
  btime: number; // Black time in milliseconds
  winc: number; // White increment
  binc: number; // Black increment
  status: string; // started, mate, resign, etc.
  winner?: string; // white, black
  wdraw?: boolean; // White offered draw
  bdraw?: boolean; // Black offered draw
  takeback?: boolean; // Takeback available
  clock?: {
    white: number;
    black: number;
  };
  rematch?: string; // Rematch game ID
}

// ============= EVENT TYPES =============

// Game start event (for event stream)
export interface GameStartEvent extends Chess960Event {
  type: 'gameStart';
  game: GameInfo;
}

// Game finish event (for event stream)
export interface GameFinishEvent extends Chess960Event {
  type: 'gameFinish';
  game: GameInfo;
}

// Game full event (first message in game stream)
export interface GameFullEvent extends Chess960Event {
  type: 'gameFull';
  id: string;
  rated: boolean;
  variant: {
    key: string;
    name: string;
    short: string;
  };
  clock: {
    initial: number;
    increment: number;
  };
  speed: string;
  perf: string;
  createdAt: number;
  white: GamePlayer;
  black: GamePlayer;
  initialFen: string;
  state: GameState;
  tournamentId?: string;
}

// Game state event (moves, time updates)
export interface GameStateEvent extends Chess960Event {
  type: 'gameState';
  moves: string;
  wtime: number;
  btime: number;
  winc: number;
  binc: number;
  status: string;
  winner?: string;
  wdraw?: boolean;
  bdraw?: boolean;
  takeback?: boolean;
  clock?: {
    white: number;
    black: number;
  };
  rematch?: string;
}

// Chat line event
export interface ChatLineEvent extends Chess960Event {
  type: 'chatLine';
  room: 'player' | 'spectator';
  username: string;
  text: string;
}

// Opponent gone event
export interface OpponentGoneEvent extends Chess960Event {
  type: 'opponentGone';
  gone: boolean;
  claimWinInSeconds?: number;
}

// Challenge events
export interface ChallengeEvent extends Chess960Event {
  type: 'challenge';
  challenge: {
    id: string;
    challenger: GamePlayer;
    destUser?: GamePlayer;
    variant: {
      key: string;
      name: string;
      short: string;
    };
    rated: boolean;
    speed: string;
    timeControl: {
      type: string;
      limit?: number;
      increment?: number;
      show?: string;
      daysPerTurn?: number;
    };
    color: 'white' | 'black' | 'random';
    finalColor?: 'white' | 'black';
    perf: {
      icon: string;
      name: string;
    };
    status: string;
    open?: boolean;
  };
  compat: {
    bot: boolean;
    board: boolean;
  };
}

export interface ChallengeCanceledEvent extends Chess960Event {
  type: 'challengeCanceled';
  challenge: {
    id: string;
  };
}

export interface ChallengeDeclinedEvent extends Chess960Event {
  type: 'challengeDeclined';
  challenge: {
    id: string;
    challenger: GamePlayer;
    destUser: GamePlayer;
    variant: {
      key: string;
      name: string;
      short: string;
    };
    rated: boolean;
    speed: string;
    timeControl: {
      type: string;
      limit?: number;
      increment?: number;
      show?: string;
    };
    color: 'white' | 'black' | 'random';
    perf: {
      icon: string;
      name: string;
    };
    declineReason?: string;
  };
}

// ============= UTILITY TYPES =============

// Union of all event types
export type Chess960StreamEvent = 
  | GameStartEvent 
  | GameFinishEvent 
  | ChallengeEvent 
  | ChallengeCanceledEvent 
  | ChallengeDeclinedEvent;

export type Chess960GameStreamEvent = 
  | GameFullEvent 
  | GameStateEvent 
  | ChatLineEvent 
  | OpponentGoneEvent;

// ============= UTILITY FUNCTIONS =============

/**
 * Convert time control string (e.g., "1+0", "3+2") to Chess960 clock format
 */
export function parseTimeControl(tc: string): ClockInfo {
  const [minutes, increment] = tc.split('+').map(Number);
  const initial = minutes * 60; // Convert to seconds
  return {
    initial,
    increment,
    totalTime: initial
  };
}

/**
 * Convert UCI moves array to Chess960 moves string
 */
export function formatMoves(moves: string[]): string {
  return moves.join(' ');
}

/**
 * Get game speed from time control
 */
export function getGameSpeed(initial: number, increment: number): string {
  const totalTime = initial + (40 * increment); // Rough estimate
  
  if (totalTime < 180) return 'bullet';
  if (totalTime < 480) return 'blitz';
  if (totalTime < 1500) return 'rapid';
  return 'classical';
}

/**
 * Create a GameFullEvent from internal game state
 */
export function createGameFullEvent(
  gameId: string,
  whitePlayer: GamePlayer,
  blackPlayer: GamePlayer,
  timeControl: ClockInfo,
  rated: boolean = true,
  variant: string = 'standard'
): GameFullEvent {
  const speed = getGameSpeed(timeControl.initial, timeControl.increment);
  
  return {
    type: 'gameFull',
    id: gameId,
    rated,
    variant: {
      key: variant,
      name: variant.charAt(0).toUpperCase() + variant.slice(1),
      short: variant === 'standard' ? 'Std' : variant.substring(0, 3)
    },
    clock: {
      initial: timeControl.initial,
      increment: timeControl.increment
    },
    speed,
    perf: speed,
    createdAt: Date.now(),
    white: whitePlayer,
    black: blackPlayer,
    initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    state: {
      type: 'gameState',
      moves: '',
      wtime: timeControl.initial * 1000, // Convert to ms
      btime: timeControl.initial * 1000,
      winc: timeControl.increment * 1000,
      binc: timeControl.increment * 1000,
      status: 'started'
    }
  };
}

/**
 * Create a GameStateEvent from game update
 */
export function createGameStateEvent(
  moves: string[],
  whiteTime: number,
  blackTime: number,
  increment: number,
  status: string = 'started',
  winner?: string,
  drawOffer?: 'white' | 'black' | null
): GameStateEvent {
  return {
    type: 'gameState',
    moves: formatMoves(moves),
    wtime: whiteTime,
    btime: blackTime,
    winc: increment,
    binc: increment,
    status,
    winner,
    wdraw: drawOffer === 'white',
    bdraw: drawOffer === 'black'
  };
}