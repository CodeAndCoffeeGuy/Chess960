import type WebSocket from 'ws';
// Define User type locally since we're not using the database
export interface User {
  id: string;
  handle: string;
  email?: string;
  allowTakebacks?: boolean; // User preference for allowing takeback requests
}
import type { RateLimitInfo } from '@chess960/proto';

export interface ClientConnection {
  ws: WebSocket;
  user: User | null;
  sessionId: string | null;
  currentGameId: string | null;
  rateLimit: RateLimitInfo;
  connectedAt: number;
  lastPing: number;
}

export interface GameState {
  id: string;
  whiteId: string;
  blackId: string;
  whiteConnection: ClientConnection | null;
  blackConnection: ClientConnection | null;
  tc?: string; // Time control (e.g., "1+0", "2+0")
  chess960Position?: number; // Chess960 position (1-960)
  initialFen?: string; // Chess960 initial FEN
  moves: string[]; // UCI moves
  timeLeft: {
    white: number;
    black: number;
  };
  increment: {
    white: number;
    black: number;
  };
  toMove: 'white' | 'black';
  startedAt: number;
  lastMoveAt: number;
  drawOffer: 'white' | 'black' | null;
  takebackOffer: 'white' | 'black' | null;
  result: string | null;
  ended: boolean;
  timeoutId?: NodeJS.Timeout;
  clockStartedFor: {
    white: boolean;
    black: boolean;
  };
}

import type { TimeControl } from '@chess960/proto';

export interface QueueEntry {
  userId: string;
  connection: ClientConnection;
  tc: TimeControl;
  rated: boolean;
  rating: number;
  rd: number;
  joinedAt: number;
}