'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { 
  ClientMessage, 
  TimeControl,
  WelcomeMessage,
  ErrorMessage,
  HelloMessage
} from '@chess960/proto';
import { trackQueueJoin, trackQueueLeave } from '@/lib/posthog';
import { QueueJoinMessage, QueueLeaveMessage } from '@chess960/proto';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// Helper function to get auth token from cookies
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const name = 'auth-token';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  const token = parts.length === 2 ? parts.pop()?.split(';').shift() || null : null;
  return token;
}

// Helper function to decode JWT and get sessionId
function getSessionIdFromToken(token: string): string | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    return decoded.sessionId || null;
  } catch {
    return null;
  }
}

interface WebSocketState {
  connectionState: ConnectionState;
  userId?: string;
  userHandle?: string;
}

interface EventHandlers {
  [key: string]: ((message: any) => void)[];
}

// Global event handlers that persist across re-renders
const globalEventHandlers: EventHandlers = {};

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const heartbeatInterval = useRef<NodeJS.Timeout>();
  
  const [state, setState] = useState<WebSocketState>({
    connectionState: 'connecting',
  });

  const { connectionState, userId, userHandle } = state;
  const isConnected = connectionState === 'connected';

  // Send message function
  const send = useCallback((message: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  // Event handling
  const on = useCallback((event: string, handler: (message: any) => void) => {
    if (!globalEventHandlers[event]) {
      globalEventHandlers[event] = [];
    }
    globalEventHandlers[event].push(handler);
    
    return () => {
      const handlers = globalEventHandlers[event];
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }, []);

  const emit = useCallback((event: string, message: any) => {
    const handlers = globalEventHandlers[event];
    if (handlers && handlers.length > 0) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch {
          // Silent error handling
        }
      });
    }
  }, []);

  // Heartbeat functions
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) return;
    
    heartbeatInterval.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        send({
          t: 'ping',
          now: Date.now(),
        });
      }
    }, 30000);
  }, [send]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = undefined;
    }
  }, []);

  // Message handler
  const handleMessage = useCallback((message: any) => {
    switch (message.t) {
      case 'welcome': {
        // Extract user info from welcome message
        const welcomeMsg = message as WelcomeMessage;
        setState(prev => ({
          ...prev,
          userId: welcomeMsg.userId,
          userHandle: welcomeMsg.handle,
        }));
        break;
      }

      case 'auth.success':
        setState(prev => ({
          ...prev,
          userId: (message as any).user?.id,
          userHandle: (message as any).user?.handle,
        }));
        break;
        
      case 'error': {
        const errorMsg = message as ErrorMessage;
        // If we get an UNAUTHORIZED error, the token might be invalid or expired
        if (errorMsg.code === 'UNAUTHORIZED') {
          // Disconnect and try to reconnect after a delay
          if (ws.current) {
            ws.current.close(1000);
          }
        }
        break;
      }
      case 'pong':
        // Handle pong for heartbeat
        break;
        
      default:
        // Emit to event handlers
        emit(message.t, message);
    }
  }, [emit]);

  // Connection function
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Check if we have authentication token before connecting
    const token = getAuthToken();
    if (!token || token === 'undefined' || token.length < 10) {
      setState(prev => ({ ...prev, connectionState: 'disconnected' }));
      return;
    }

    // Clean up existing connection
    if (ws.current) {
      ws.current.close();
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://chess960-ws.fly.dev';
    setState(prev => ({ ...prev, connectionState: 'connecting' }));
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      setState(prev => ({ ...prev, connectionState: 'connected' }));

      // Send hello handshake with sessionId (JWT token)
      const token = getAuthToken();
      if (token) {
        const sessionId = getSessionIdFromToken(token);
        if (sessionId) {
          const helloMessage: HelloMessage = {
            t: 'hello',
            sessionId: sessionId,
            clientVersion: '1.0.0',
          };

          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(helloMessage));
          }
        }
      }

      startHeartbeat();
    };
    
    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch {
        // Silent error handling
      }
    };
    
    ws.current.onclose = (event) => {
      setState(prev => ({ ...prev, connectionState: 'disconnected' }));
      stopHeartbeat();
      
      // Auto-reconnect after delay (only if not manually closed)
      if (event.code !== 1000) {
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };
    
    ws.current.onerror = () => {
      setState(prev => ({ ...prev, connectionState: 'error' }));
    };
  }, [handleMessage, startHeartbeat, stopHeartbeat]);

  // Auto-connect on mount with delay
  useEffect(() => {
    // Only connect once - check if already connecting or connected
    if (ws.current?.readyState === WebSocket.CONNECTING || ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Listen for auth completion event
    const handleAuthComplete = () => {
      if (ws.current?.readyState !== WebSocket.OPEN && ws.current?.readyState !== WebSocket.CONNECTING) {
        connect();
      }
    };

    window.addEventListener('auth-complete', handleAuthComplete);

    // Also try to connect after a delay in case auth event doesn't fire
    const timer = setTimeout(() => {
      if (ws.current?.readyState !== WebSocket.OPEN && ws.current?.readyState !== WebSocket.CONNECTING) {
        connect();
      }
    }, 2000);

    return () => {
      window.removeEventListener('auth-complete', handleAuthComplete);
      clearTimeout(timer);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  // Game functions
  const joinQueue = useCallback((timeControl: TimeControl) => {
    if (!isConnected) return;
    
    const queueMessage: QueueJoinMessage = {
      t: 'queue.join',
      tc: timeControl,
      rated: true, // Default to rated games
    };
    
    send(queueMessage);
    trackQueueJoin(timeControl, true); // Default to rated games
  }, [send, isConnected]);

  const leaveQueue = useCallback(() => {
    if (!isConnected) return;
    
    const queueMessage: QueueLeaveMessage = {
      t: 'queue.leave',
    };
    
    send(queueMessage);
    trackQueueLeave('unknown', 0);
  }, [send, isConnected]);

  const makeMove = useCallback((gameId: string, move: string, moveTime?: number) => {
    const message: any = {
      t: 'game.move',
      gameId,
      move,
      moveTime,
      seq: 1, // TODO: implement proper sequence numbering
    };
    send(message as any);
  }, [send]);

  const resign = useCallback((gameId: string) => {
    const message = {
      t: 'resign',
      gameId,
    };
    send(message as any);
  }, [send]);

  const abort = useCallback((gameId: string) => {
    const message = {
      t: 'abort',
      gameId,
    };
    send(message as any);
  }, [send]);

  const offerRematch = useCallback((gameId: string) => {
    const message = {
      t: 'rematch.offer',
      gameId,
    };
    send(message as any);
  }, [send]);

  const acceptRematch = useCallback((gameId: string) => {
    const message = {
      t: 'rematch.accept',
      gameId,
    };
    send(message as any);
  }, [send]);

  const declineRematch = useCallback((gameId: string) => {
    const message = {
      t: 'rematch.decline',
      gameId,
    };
    send(message as any);
  }, [send]);

  const sendChatMessage = useCallback((gameId: string, message: string) => {
    const chatMessage = {
      t: 'chat.message',
      gameId,
      message,
    };
    send(chatMessage as any);
  }, [send]);

  const offerDraw = useCallback((gameId: string) => {
    const message = {
      t: 'draw.offer',
      gameId,
    };
    send(message as any);
  }, [send]);

  const acceptDraw = useCallback((gameId: string) => {
    const message = {
      t: 'draw.accept',
      gameId,
    };
    send(message as any);
  }, [send]);

  const declineDraw = useCallback((gameId: string) => {
    const message = {
      t: 'draw.decline',
      gameId,
    };
    send(message as any);
  }, [send]);

  const offerTakeback = useCallback((gameId: string) => {
    const message = {
      t: 'takeback.offer',
      gameId,
    };
    send(message as any);
  }, [send]);

  const acceptTakeback = useCallback((gameId: string) => {
    const message = {
      t: 'takeback.accept',
      gameId,
    };
    send(message as any);
  }, [send]);

  const declineTakeback = useCallback((gameId: string) => {
    const message = {
      t: 'takeback.decline',
      gameId,
    };
    send(message as any);
  }, [send]);

  return {
    connectionState,
    isConnected,
    userId,
    userHandle,
    on,
    connect,
    joinQueue,
    leaveQueue,
    makeMove,
    offerDraw,
    acceptDraw,
    declineDraw,
    offerTakeback,
    acceptTakeback,
    declineTakeback,
    resign,
    abort,
    offerRematch,
    acceptRematch,
    declineRematch,
    sendChatMessage,
  };
}