'use client';

import { useState, useRef, useEffect } from 'react';
import type { Color } from '@chess960/proto';

interface ChatMessage {
  from: Color;
  message: string;
  timestamp: number;
}

interface GameChatProps {
  messages: ChatMessage[];
  playerColor: Color;
  onSendMessage: (message: string) => void;
  gameEnded?: boolean;
}

export function GameChat({ messages, playerColor, onSendMessage, gameEnded: _gameEnded }: GameChatProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        <h3 className="text-xs font-semibold text-white">Chat</h3>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 scrollbar-thin scrollbar-thumb-[#474239] scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">No messages yet</div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.from === playerColor;
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`text-[10px] text-gray-500 mb-0.5 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-sm ${
                    isMe
                      ? 'bg-orange-600/30 text-orange-100 border border-orange-500/30'
                      : 'bg-[#35322e] text-gray-200 border border-[#474239]'
                  }`}>
                    {msg.message}
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
