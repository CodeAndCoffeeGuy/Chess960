// Base message structure
export interface BaseMessage {
  t: string; // message type
}

// Time control types
export type TimeControl =
  | '1+0' | '2+0' | '2+1'  // Bullet
  | '3+0' | '3+2' | '5+0' | '5+3'  // Blitz
  | '10+0' | '10+5' | '15+0' | '15+10'  // Rapid
  | '30+0' | '30+20' | '60+0';  // Classical

// Game result types
export type GameResult = '1-0' | '0-1' | '1/2-1/2' | 'abort' | 'flag-white' | 'flag-black' | 'resign-white' | 'resign-black';

// Color types
export type Color = 'white' | 'black';

// Player info
export interface PlayerInfo {
  handle: string;
  rating: number;
  rd: number;
  allowTakebacks?: boolean; // Whether opponent allows takeback requests
}

// === CLIENT TO SERVER MESSAGES ===

export interface HelloMessage extends BaseMessage {
  t: 'hello';
  sessionId: string;
  clientVersion: string;
}

export interface PingMessage extends BaseMessage {
  t: 'ping';
  now: number; // timestamp
}

export interface QueueJoinMessage extends BaseMessage {
  t: 'queue.join';
  tc: TimeControl;
  rated: boolean;
}

export interface QueueLeaveMessage extends BaseMessage {
  t: 'queue.leave';
}

export interface MoveMakeMessage extends BaseMessage {
  t: 'move.make';
  gameId: string;
  uci: string;
  clientTs: number;
  seq: number;
}

export interface DrawOfferMessage extends BaseMessage {
  t: 'draw.offer';
  gameId: string;
}

export interface DrawAcceptMessage extends BaseMessage {
  t: 'draw.accept';
  gameId: string;
}

export interface DrawDeclineMessage extends BaseMessage {
  t: 'draw.decline';
  gameId: string;
}

export interface ResignMessage extends BaseMessage {
  t: 'resign';
  gameId: string;
}

export interface AbortMessage extends BaseMessage {
  t: 'abort';
  gameId: string;
}

export interface ReconnectMessage extends BaseMessage {
  t: 'reconnect';
  gameId: string;
}

export interface RematchOfferMessage extends BaseMessage {
  t: 'rematch.offer';
  gameId: string;
}

export interface RematchAcceptMessage extends BaseMessage {
  t: 'rematch.accept';
  gameId: string;
}

export interface RematchDeclineMessage extends BaseMessage {
  t: 'rematch.decline';
  gameId: string;
}

export interface TakebackOfferMessage extends BaseMessage {
  t: 'takeback.offer';
  gameId: string;
}

export interface TakebackAcceptMessage extends BaseMessage {
  t: 'takeback.accept';
  gameId: string;
}

export interface TakebackDeclineMessage extends BaseMessage {
  t: 'takeback.decline';
  gameId: string;
}

export interface ChatMessage extends BaseMessage {
  t: 'chat.message';
  gameId: string;
  message: string;
}

export type ClientMessage =
  | HelloMessage
  | PingMessage
  | QueueJoinMessage
  | QueueLeaveMessage
  | MoveMakeMessage
  | DrawOfferMessage
  | DrawAcceptMessage
  | DrawDeclineMessage
  | TakebackOfferMessage
  | TakebackAcceptMessage
  | TakebackDeclineMessage
  | ResignMessage
  | AbortMessage
  | ReconnectMessage
  | RematchOfferMessage
  | RematchAcceptMessage
  | RematchDeclineMessage
  | ChatMessage;

// === SERVER TO CLIENT MESSAGES ===

export interface WelcomeMessage extends BaseMessage {
  t: 'welcome';
  userId: string;
  handle: string;
}

export interface PongMessage extends BaseMessage {
  t: 'pong';
  now: number; // server timestamp
  clientTs: number; // echoed client timestamp for RTT calculation
}

export interface QueueJoinedMessage extends BaseMessage {
  t: 'queue.joined';
  tc: TimeControl;
  rated: boolean;
  estimatedWait: number; // seconds
}

export interface QueueLeftMessage extends BaseMessage {
  t: 'queue.left';
}

export interface MatchFoundMessage extends BaseMessage {
  t: 'match.found';
  gameId: string;
  color: Color;
  opponent: PlayerInfo;
  initial: {
    w: number; // white time in ms
    b: number; // black time in ms
    inc: number; // increment in ms
  };
  serverStartAt: number; // server timestamp when game starts
  initialFen: string; // Chess960 starting position FEN
  chess960Position: number; // Position number (1-960)
}

export interface MoveMadeMessage extends BaseMessage {
  t: 'move.made';
  gameId: string;
  uci: string;
  by: Color;
  serverTs: number;
  seq: number;
  timeLeft: {
    w: number; // white time left in ms
    b: number; // black time left in ms
  };
}

export interface DrawOfferedMessage extends BaseMessage {
  t: 'draw.offered';
  gameId: string;
  by: Color;
}

export interface DrawAcceptedMessage extends BaseMessage {
  t: 'draw.accepted';
  gameId: string;
  by: Color;
}

export interface DrawDeclinedMessage extends BaseMessage {
  t: 'draw.declined';
  gameId: string;
  by: Color;
}

export interface GameEndMessage extends BaseMessage {
  t: 'game.end';
  gameId: string;
  result: GameResult;
  reason?: string;
  ratingChanges?: {
    white: { old: number; new: number; change: number };
    black: { old: number; new: number; change: number };
  };
}

export interface GameStateMessage extends BaseMessage {
  t: 'game.state';
  gameId: string;
  moves: string[]; // array of UCI moves
  timeLeft: {
    w: number;
    b: number;
  };
  toMove: Color;
  drawOffer?: Color;
  takebackOffer?: Color;
  initialFen: string; // Chess960 starting position FEN
  chess960Position: number; // Position number (1-960)
}

export interface ErrorMessage extends BaseMessage {
  t: 'error';
  code: string;
  message: string;
  gameId?: string;
}

export interface RateLimitMessage extends BaseMessage {
  t: 'ratelimit';
  retryAfter: number; // seconds
}

export interface RematchOfferedMessage extends BaseMessage {
  t: 'rematch.offered';
  gameId: string;
  by: Color;
}

export interface RematchAcceptedMessage extends BaseMessage {
  t: 'rematch.accepted';
  gameId: string;
  newGameId: string;
  color: Color;
  opponent: PlayerInfo;
  initial: {
    w: number;
    b: number;
    inc: number;
  };
  serverStartAt: number;
  initialFen: string; // Chess960 starting position FEN
  chess960Position: number; // Position number (1-960)
}

export interface RematchDeclinedMessage extends BaseMessage {
  t: 'rematch.declined';
  gameId: string;
  by: Color;
}

export interface TakebackOfferedMessage extends BaseMessage {
  t: 'takeback.offered';
  gameId: string;
  by: Color;
}

export interface TakebackAcceptedMessage extends BaseMessage {
  t: 'takeback.accepted';
  gameId: string;
  by: Color;
}

export interface TakebackDeclinedMessage extends BaseMessage {
  t: 'takeback.declined';
  gameId: string;
  by: Color;
}

export interface ChatReceivedMessage extends BaseMessage {
  t: 'chat.received';
  gameId: string;
  from: Color;
  message: string;
  timestamp: number;
}

export type ServerMessage =
  | WelcomeMessage
  | PongMessage
  | QueueJoinedMessage
  | QueueLeftMessage
  | MatchFoundMessage
  | MoveMadeMessage
  | DrawOfferedMessage
  | DrawAcceptedMessage
  | DrawDeclinedMessage
  | TakebackOfferedMessage
  | TakebackAcceptedMessage
  | TakebackDeclinedMessage
  | GameEndMessage
  | GameStateMessage
  | ErrorMessage
  | RateLimitMessage
  | RematchOfferedMessage
  | RematchAcceptedMessage
  | RematchDeclinedMessage
  | ChatReceivedMessage;

// === MESSAGE UNIONS ===

export type WSMessage = ClientMessage | ServerMessage;