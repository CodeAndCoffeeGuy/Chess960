import WebSocket from 'ws';
import { Readable } from 'stream';

export interface StreamEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface GameStreamEvent extends StreamEvent {
  gameId: string;
  moveNumber?: number;
  fen?: string;
  timeLeft?: {
    white: number;
    black: number;
  };
}

/**
 * ND-JSON (Newline Delimited JSON) streaming utilities
 * Inspired by Chess960 API streaming patterns
 */
export class NDJsonStream {
  private buffer: string = '';

  /**
   * Parse ND-JSON data from a stream
   */
  parseChunk(chunk: string): any[] {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    
    // Keep the last incomplete line in buffer
    this.buffer = lines.pop() || '';
    
    const events: any[] = [];
    for (const line of lines) {
      if (line.trim()) {
        try {
          events.push(JSON.parse(line));
        } catch (error) {
          console.error('Failed to parse ND-JSON line:', line, error);
        }
      }
    }
    
    return events;
  }

  /**
   * Create ND-JSON formatted string from events
   */
  static serialize(events: any[]): string {
    return events.map(event => JSON.stringify(event)).join('\n') + '\n';
  }

  /**
   * Create a single ND-JSON line
   */
  static serializeSingle(event: any): string {
    return JSON.stringify(event) + '\n';
  }

  /**
   * Reset the buffer
   */
  reset(): void {
    this.buffer = '';
  }
}

/**
 * WebSocket wrapper that supports ND-JSON streaming
 */
export class StreamingWebSocket {
  private ws: WebSocket;
  private ndJsonParser: NDJsonStream;
  private eventHandlers: Map<string, ((event: any) => void)[]> = new Map();

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.ndJsonParser = new NDJsonStream();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.ws.on('message', (data: WebSocket.Data) => {
      const chunk = data.toString();
      const events = this.ndJsonParser.parseChunk(chunk);
      
      for (const event of events) {
        this.handleEvent(event);
      }
    });

    this.ws.on('close', () => {
      this.ndJsonParser.reset();
    });
  }

  private handleEvent(event: any): void {
    if (event.type) {
      const handlers = this.eventHandlers.get(event.type) || [];
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error handling event ${event.type}:`, error);
        }
      }
    }
  }

  /**
   * Subscribe to specific event types
   */
  on(eventType: string, handler: (event: any) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Unsubscribe from event types
   */
  off(eventType: string, handler?: (event: any) => void): void {
    if (handler) {
      const handlers = this.eventHandlers.get(eventType) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.delete(eventType);
    }
  }

  /**
   * Send ND-JSON formatted event
   */
  sendEvent(event: any): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      const ndJson = NDJsonStream.serializeSingle(event);
      this.ws.send(ndJson);
    }
  }

  /**
   * Send multiple events as ND-JSON batch
   */
  sendEvents(events: any[]): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      const ndJson = NDJsonStream.serialize(events);
      this.ws.send(ndJson);
    }
  }

  /**
   * Get underlying WebSocket
   */
  getWebSocket(): WebSocket {
    return this.ws;
  }
}

/**
 * Game state streaming class for real-time chess games
 */
export class GameStream {
  private gameId: string;
  private connections: Set<StreamingWebSocket> = new Set();
  private gameState: any = {};
  private moveHistory: any[] = [];

  constructor(gameId: string) {
    this.gameId = gameId;
  }

  /**
   * Add a connection to this game stream
   */
  addConnection(connection: StreamingWebSocket): void {
    this.connections.add(connection);
    
    // Send initial game state
    connection.sendEvent({
      type: 'game_full',
      gameId: this.gameId,
      state: this.gameState,
      moves: this.moveHistory,
      timestamp: Date.now()
    });

    // Handle disconnection cleanup
    connection.getWebSocket().on('close', () => {
      this.connections.delete(connection);
    });
  }

  /**
   * Remove connection
   */
  removeConnection(connection: StreamingWebSocket): void {
    this.connections.delete(connection);
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: any): void {
    const streamEvent = {
      ...event,
      gameId: this.gameId,
      timestamp: Date.now()
    };

    for (const connection of this.connections) {
      connection.sendEvent(streamEvent);
    }
  }

  /**
   * Handle move made
   */
  onMove(move: any): void {
    this.moveHistory.push(move);
    this.broadcast({
      type: 'move',
      move: move,
      moveNumber: this.moveHistory.length
    });
  }

  /**
   * Handle time update
   */
  onTimeUpdate(timeLeft: { white: number; black: number }): void {
    this.gameState.timeLeft = timeLeft;
    this.broadcast({
      type: 'time_update',
      timeLeft: timeLeft
    });
  }

  /**
   * Handle game end
   */
  onGameEnd(result: any): void {
    this.broadcast({
      type: 'game_end',
      result: result
    });
  }

  /**
   * Update game state
   */
  updateState(newState: any): void {
    this.gameState = { ...this.gameState, ...newState };
    this.broadcast({
      type: 'state_change',
      state: this.gameState
    });
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Check if game has any active connections
   */
  hasConnections(): boolean {
    return this.connections.size > 0;
  }
}

/**
 * Stream manager for handling multiple game streams
 */
export class StreamManager {
  private gameStreams: Map<string, GameStream> = new Map();
  
  /**
   * Get or create a game stream
   */
  getGameStream(gameId: string): GameStream {
    if (!this.gameStreams.has(gameId)) {
      this.gameStreams.set(gameId, new GameStream(gameId));
    }
    return this.gameStreams.get(gameId)!;
  }

  /**
   * Remove game stream
   */
  removeGameStream(gameId: string): void {
    this.gameStreams.delete(gameId);
  }

  /**
   * Cleanup inactive streams
   */
  cleanup(): void {
    for (const [gameId, stream] of this.gameStreams.entries()) {
      if (!stream.hasConnections()) {
        this.gameStreams.delete(gameId);
      }
    }
  }

  /**
   * Get stats
   */
  getStats(): { activeStreams: number; totalConnections: number } {
    let totalConnections = 0;
    for (const stream of this.gameStreams.values()) {
      totalConnections += stream.getConnectionCount();
    }

    return {
      activeStreams: this.gameStreams.size,
      totalConnections
    };
  }
}

export { NDJsonStream as default };