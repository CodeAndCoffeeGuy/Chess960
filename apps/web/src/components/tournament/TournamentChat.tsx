'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { renderMessageContent } from '@/lib/message-render';

export interface TournamentChatMessage {
  id?: string;
  userId: string;
  handle: string;
  message: string;
  timestamp: number;
}

interface TournamentChatProps {
  tournamentId: string;
  currentUserId: string;
  messages: TournamentChatMessage[];
  onSendMessage: (message: string) => void;
}

export function TournamentChat({ tournamentId, currentUserId, messages, onSendMessage }: TournamentChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [historicalMessages, setHistoricalMessages] = useState<TournamentChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch historical messages on mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}/messages`);
        if (response.ok) {
          const data = await response.json();
          setHistoricalMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to fetch tournament messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [tournamentId]);

  // Combine historical and live messages
  const allMessages = useMemo(() => [...historicalMessages, ...messages], [historicalMessages, messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      onSendMessage(trimmed);
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#2a2825]/90 backdrop-blur-sm border-2 border-[#3a3632] rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      <div className="px-3 py-2 border-b border-[#3a3632] bg-[#35322e]/50">
        <h3 className="text-xs font-semibold text-white">Tournament Chat</h3>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 scrollbar-thin scrollbar-thumb-[#474239] scrollbar-track-transparent">
        {loading ? (
          <div className="text-xs text-gray-500 text-center py-4">Loading messages...</div>
        ) : allMessages.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">No messages yet</div>
        ) : (
          allMessages.map((msg, idx) => {
            const isMe = msg.userId === currentUserId;
            const rendered = renderMessageContent(msg.message);
            return (
              <div key={msg.id || `msg-${idx}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`text-[10px] text-gray-500 mb-0.5 px-1 flex gap-2 ${isMe ? 'text-right flex-row-reverse' : 'text-left'}`}>
                    <span className="font-semibold">{msg.handle}</span>
                    <span>{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-sm ${
                    isMe
                      ? 'bg-orange-600/30 text-orange-100 border border-orange-500/30'
                      : 'bg-[#35322e] text-gray-200 border border-[#474239]'
                  }`}>
                    <div className="break-words">{rendered.nodes}</div>
                    {rendered.embeds.length > 0 && (
                      <div className="mt-2 space-y-1">{rendered.embeds}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-2 border-t border-[#3a3632] bg-[#35322e]/30">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            maxLength={140}
            className="flex-1 bg-[#2a2825] border border-[#474239] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-3 py-1.5 bg-orange-600/80 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
          >
            Send
          </button>
        </div>
        <div className="text-[10px] text-gray-600 mt-1 text-right">{inputValue.length}/140</div>
      </form>
    </div>
  );
}
