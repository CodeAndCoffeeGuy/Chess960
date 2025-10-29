'use client';

import { useEffect, useRef } from 'react';

interface ProfileUpdate {
  type: 'game_ended' | 'rating_updated' | 'stats_updated';
  data: any;
}

export function useProfileWebSocket(
  userId: string,
  onUpdate: (update: ProfileUpdate) => void
) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!userId) return;

    const connect = () => {
      if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
        return;
      }

      // Clean up existing connection
      if (ws.current) {
        ws.current.close();
      }

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
      console.log('[PROFILE-WS] Connecting to:', wsUrl);
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('[PROFILE-WS] Connected to WebSocket server');
        reconnectAttempts.current = 0;
        
        // Send profile subscription message
        const subscribeMessage = {
          t: 'profile_subscribe',
          userId: userId,
        };
        ws.current?.send(JSON.stringify(subscribeMessage));
        console.log('[PROFILE-WS] Subscribed to profile updates for user:', userId);
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle profile-specific updates
          if (message.t === 'profile_update') {
            console.log('[PROFILE-WS] Received profile update:', message);
            onUpdate(message.data);
          }
        } catch (error) {
          console.error('[PROFILE-WS] Error parsing message:', error);
        }
      };
      
      ws.current.onclose = (event) => {
        console.log('[PROFILE-WS] WebSocket connection closed:', event.code, event.reason);
        
        // Auto-reconnect with exponential backoff
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          console.log(`[PROFILE-WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('[PROFILE-WS] WebSocket error:', error);
      };
    };

    connect();

    return () => {
      console.log('[PROFILE-WS] Cleaning up WebSocket connection');
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [userId, onUpdate]);
}
