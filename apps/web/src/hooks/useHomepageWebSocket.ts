'use client';

import { useEffect, useRef } from 'react';

export function useHomepageWebSocket() {
  console.log('[HOMEPAGE-WS] Hook called');
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    console.log('[HOMEPAGE-WS] Hook initialized');
    
    const connect = () => {
      console.log('[HOMEPAGE-WS] Attempting to connect...');
      
      if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
        console.log('[HOMEPAGE-WS] Already connected or connecting, skipping');
        return;
      }

      // Clean up existing connection
      if (ws.current) {
        console.log('[HOMEPAGE-WS] Closing existing connection');
        ws.current.close();
      }

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
      console.log('[HOMEPAGE-WS] Connecting to:', wsUrl);
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('[HOMEPAGE-WS] Connected to WebSocket server');
        
        // Send guest authentication
        const guestId = `Guest${Math.random().toString(36).substr(2, 6)}`;
        const authMessage = {
          t: 'auth',
          handle: guestId,
          email: undefined
        };

        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify(authMessage));
          console.log('[HOMEPAGE-WS] Sent guest auth:', guestId);
        }
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.t === 'auth.success') {
            console.log('[HOMEPAGE-WS] Guest authenticated:', message.user.handle);
          }
        } catch {
          // Silent error handling
        }
      };
      
      ws.current.onclose = (event) => {
        console.log('[HOMEPAGE-WS] WebSocket connection closed');
        
        // Auto-reconnect after delay (only if not manually closed)
        if (event.code !== 1000) {
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('[HOMEPAGE-WS] WebSocket error:', error);
      };
    };

    // Connect after a short delay to avoid overwhelming the server
    const connectTimeout = setTimeout(connect, 1000);

    return () => {
      clearTimeout(connectTimeout);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return null; // This hook doesn't return anything, it just manages the connection
}
