/**
 * Advanced WebSocket patterns inspired by Chess960 socket implementation
 * Includes backoff, reconnection, message queuing, and round-robin distribution
 */

export interface SocketMessage {
  t: string; // message type
  d?: any; // data payload
  id?: string; // message id for tracking
}

export interface SocketConfig {
  url: string;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  backoffFactor?: number;
  maxRetries?: number;
  pingInterval?: number;
  pongTimeout?: number;
  messageTimeout?: number;
}

export interface SocketStats {
  connected: boolean;
  reconnectCount: number;
  messagesSent: number;
  messagesReceived: number;
  averageLatency: number;
  connectionUptime: number;
  lastError?: string;
}

type MessageHandler = (data: any) => void;
type MessageCallback = (success: boolean, error?: string) => void;

interface QueuedMessage {
  message: SocketMessage;
  callback?: MessageCallback;
  timestamp: number;
  retries: number;
}

/**
 * Advanced WebSocket patterns
 */
export class Chess960Socket {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private pongTimer: number | null = null;
  
  private handlers = new Map<string, MessageHandler[]>();
  private messageQueue: QueuedMessage[] = [];
  private pendingMessages = new Map<string, { callback: MessageCallback; timestamp: number }>();
  
  private currentDelay: number;
  private reconnectCount = 0;
  private messagesSent = 0;
  private messagesReceived = 0;
  private latencyMeasurements: number[] = [];
  private connectTime = 0;
  private lastError?: string;
  
  private messageId = 0;

  constructor(private config: SocketConfig) {
    this.currentDelay = config.reconnectDelay || 1000;
  }

  /**
   * Connect to WebSocket with automatic reconnection
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected');
          this.connectTime = Date.now();
          this.currentDelay = this.config.reconnectDelay || 1000;
          this.startPingInterval();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          this.handleDisconnection(event);
        };

        this.ws.onerror = (error) => {
          this.lastError = `WebSocket error: ${error}`;
          console.error(this.lastError);
          reject(new Error(this.lastError));
        };

      } catch (error) {
        this.lastError = `Connection failed: ${error}`;
        reject(new Error(this.lastError));
      }
    });
  }

  /**
   * Handle incoming messages with backoff and retry logic
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: SocketMessage = JSON.parse(event.data);
      this.messagesReceived++;

      // Handle ping/pong for latency measurement
      if (message.t === 'pong') {
        this.handlePong(message.id);
        return;
      }

      // Handle message acknowledgments
      if (message.id && this.pendingMessages.has(message.id)) {
        const pending = this.pendingMessages.get(message.id)!;
        pending.callback(true);
        this.pendingMessages.delete(message.id);
        return;
      }

      // Route message to handlers
      const handlers = this.handlers.get(message.t) || [];
      for (const handler of handlers) {
        try {
          handler(message.d);
        } catch (error) {
          console.error(`Error in message handler for ${message.t}:`, error);
        }
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle disconnection with exponential backoff
   */
  private handleDisconnection(event: CloseEvent): void {
    console.log('🔌 WebSocket disconnected:', event.code, event.reason);
    
    this.stopPingInterval();
    this.ws = null;

    // Don't reconnect if it was intentional
    if (event.code === 1000) return;

    // Implement exponential backoff
    const maxRetries = this.config.maxRetries || Infinity;
    if (this.reconnectCount < maxRetries) {
      console.log(`Reconnecting in ${this.currentDelay}ms (attempt ${this.reconnectCount + 1})`);
      
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectCount++;
        this.currentDelay = Math.min(
          this.currentDelay * (this.config.backoffFactor || 1.5),
          this.config.maxReconnectDelay || 30000
        );
        
        this.connect().catch(() => {
          // Will be handled by the next disconnection
        });
      }, this.currentDelay);
    }
  }

  /**
   * Send message with optional callback
   */
  send(message: SocketMessage, callback?: MessageCallback): void {
    // Add message ID for tracking if callback provided
    if (callback) {
      message.id = (++this.messageId).toString();
      this.pendingMessages.set(message.id, {
        callback,
        timestamp: Date.now()
      });

      // Timeout the callback if no response
      setTimeout(() => {
        if (this.pendingMessages.has(message.id!)) {
          const pending = this.pendingMessages.get(message.id!)!;
          pending.callback(false, 'Message timeout');
          this.pendingMessages.delete(message.id!);
        }
      }, this.config.messageTimeout || 10000);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.messagesSent++;
      } catch (error) {
        console.error('Failed to send message:', error);
        if (callback) {
          callback(false, 'Send failed');
        }
      }
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push({
        message,
        callback,
        timestamp: Date.now(),
        retries: 0
      });
    }
  }

  /**
   * Subscribe to message type
   */
  on(messageType: string, handler: MessageHandler): void {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, []);
    }
    this.handlers.get(messageType)!.push(handler);
  }

  /**
   * Unsubscribe from message type
   */
  off(messageType: string, handler?: MessageHandler): void {
    if (handler) {
      const handlers = this.handlers.get(messageType) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.handlers.delete(messageType);
    }
  }

  /**
   * Flush queued messages when connection is restored
   */
  private flushMessageQueue(): void {
    const now = Date.now();
    const maxAge = 60000; // 1 minute
    
    this.messageQueue = this.messageQueue.filter(item => {
      // Remove old messages
      if (now - item.timestamp > maxAge) {
        if (item.callback) {
          item.callback(false, 'Message expired');
        }
        return false;
      }

      // Try to send message
      this.send(item.message, item.callback);
      return false; // Remove from queue
    });
  }

  /**
   * Start ping interval for latency measurement
   */
  private startPingInterval(): void {
    const interval = this.config.pingInterval || 25000; // 25 seconds like Chess960
    
    this.pingTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const pingId = Date.now().toString();
        this.send({ t: 'ping', id: pingId });
        
        // Set pong timeout
        this.pongTimer = window.setTimeout(() => {
          console.warn('⚠️  Pong timeout - connection may be unstable');
        }, this.config.pongTimeout || 5000);
      }
    }, interval);
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  /**
   * Handle pong response for latency measurement
   */
  private handlePong(pingId?: string): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }

    if (pingId) {
      const latency = Date.now() - parseInt(pingId);
      this.latencyMeasurements.push(latency);
      
      // Keep only recent measurements
      if (this.latencyMeasurements.length > 50) {
        this.latencyMeasurements.shift();
      }
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): SocketStats {
    const connected = this.ws?.readyState === WebSocket.OPEN;
    const averageLatency = this.latencyMeasurements.length > 0
      ? this.latencyMeasurements.reduce((sum, lat) => sum + lat, 0) / this.latencyMeasurements.length
      : 0;
    
    return {
      connected,
      reconnectCount: this.reconnectCount,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      averageLatency: Math.round(averageLatency),
      connectionUptime: connected ? Date.now() - this.connectTime : 0,
      lastError: this.lastError
    };
  }

  /**
   * Disconnect gracefully
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Round-robin WebSocket manager for load balancing
 */
export class RoundRobinSocketManager {
  private sockets: Chess960Socket[] = [];
  private currentIndex = 0;

  constructor(private urls: string[], private config: Omit<SocketConfig, 'url'>) {
    this.urls.forEach(url => {
      const socket = new Chess960Socket({ ...config, url });
      this.sockets.push(socket);
    });
  }

  /**
   * Connect all sockets
   */
  async connectAll(): Promise<void> {
    const promises = this.sockets.map(socket => 
      socket.connect().catch(error => 
        console.error('Socket connection failed:', error)
      )
    );
    await Promise.allSettled(promises);
  }

  /**
   * Get next socket in round-robin fashion
   */
  getNextSocket(): Chess960Socket {
    const socket = this.sockets[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.sockets.length;
    return socket;
  }

  /**
   * Send message using round-robin selection
   */
  send(message: SocketMessage, callback?: MessageCallback): void {
    const socket = this.getNextSocket();
    socket.send(message, callback);
  }

  /**
   * Subscribe to message on all sockets
   */
  onAll(messageType: string, handler: MessageHandler): void {
    this.sockets.forEach(socket => socket.on(messageType, handler));
  }

  /**
   * Get combined statistics
   */
  getStats(): { individual: SocketStats[]; combined: SocketStats } {
    const individual = this.sockets.map(socket => socket.getStats());
    
    const combined: SocketStats = {
      connected: individual.some(stats => stats.connected),
      reconnectCount: individual.reduce((sum, stats) => sum + stats.reconnectCount, 0),
      messagesSent: individual.reduce((sum, stats) => sum + stats.messagesSent, 0),
      messagesReceived: individual.reduce((sum, stats) => sum + stats.messagesReceived, 0),
      averageLatency: Math.round(
        individual.reduce((sum, stats) => sum + stats.averageLatency, 0) / individual.length
      ),
      connectionUptime: Math.max(...individual.map(stats => stats.connectionUptime))
    };

    return { individual, combined };
  }

  /**
   * Disconnect all sockets
   */
  disconnectAll(): void {
    this.sockets.forEach(socket => socket.disconnect());
  }
}