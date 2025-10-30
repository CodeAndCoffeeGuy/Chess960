'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send, Users, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { groupMessages, type MessageGroup } from '@/lib/message-grouping';
import { useWebSocket } from '@/hooks/useWebSocket';
import { throttle, debounce } from '@/lib/throttle';
import { getDraft, saveDraft, clearDraft } from '@/lib/message-drafts';
import { renderMessageContent } from '@/lib/message-render';

interface User {
  id: string;
  handle: string;
  fullName?: string | null;
  image?: string | null;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: User;
  receiver: User;
}

interface GroupedMessage extends Message {
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  showTimestamp: boolean;
}

interface OptimisticMessage extends Message {
  optimistic?: boolean; // Marks message as not yet confirmed by server
  failed?: boolean;     // Marks message as failed to send
}

interface TypingState {
  userId: string;
  handle: string;
  timeout: NodeJS.Timeout;
}

interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { on, isConnected } = useWebSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<User | null>(null);
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [following, setFollowing] = useState<User[]>([]);
  const [typingState, setTypingState] = useState<TypingState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const optimisticIdCounter = useRef(0); // Counter for generating temporary IDs
  const userScrolledUp = useRef(false); // Track if user manually scrolled up
  const previousMessagesLength = useRef(0); // Track message count for load detection

  useEffect(() => {
    window.scrollTo(0, 0);
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchConversations();
      fetchFollowing();
    }
  }, [status, router]);

  useEffect(() => {
    // Only scroll if messages were added (not loaded older messages)
    if (messages.length > previousMessagesLength.current) {
      // New messages added - use smart scroll (respects user scroll position)
      scrollToBottom();
    }
    previousMessagesLength.current = messages.length;
  }, [messages, scrollToBottom]);

  // Reset textarea height and scroll state when conversation changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    userScrolledUp.current = false;
    previousMessagesLength.current = 0;

    // Load draft for new conversation
    if (selectedConversation) {
      const draft = getDraft(selectedConversation.id);
      setMessageInput(draft);
      // Trigger resize for loaded draft
      setTimeout(() => {
        if (textareaRef.current && draft) {
          handleTextareaResize();
        }
      }, 0);
    } else {
      setMessageInput('');
    }

    // Force scroll to bottom when opening a conversation
    setTimeout(() => scrollToBottom(true), 100);
  }, [selectedConversation, scrollToBottom, handleTextareaResize]);

  // Track user scroll behavior
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if user scrolled up from bottom
      if (!isNearBottom()) {
        userScrolledUp.current = true;
      } else {
        userScrolledUp.current = false;
      }

      // Load older when near top
      if (container.scrollTop < 80 && hasMore && !loadingOlder) {
        loadOlder();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isNearBottom, hasMore, loadingOlder, selectedConversation, messages]);

  // WebSocket: Listen for typing events
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = on('message.typing', (data: any) => {
      // Only show typing indicator if it's from the current conversation partner
      if (selectedConversation && data.userId === selectedConversation.id) {
        // Clear existing timeout if any
        if (typingState?.timeout) {
          clearTimeout(typingState.timeout);
        }

        // Set new typing state with 3-second timeout
        const timeout = setTimeout(() => {
          setTypingState(null);
        }, 3000);

        setTypingState({
          userId: data.userId,
          handle: data.handle || selectedConversation.handle,
          timeout,
        });
      }
    });

    return () => {
      unsubscribe();
      // Clean up timeout on unmount
      if (typingState?.timeout) {
        clearTimeout(typingState.timeout);
      }
    };
  }, [isConnected, on, selectedConversation, typingState]);

  // Throttled function to send typing indicator (max once per 3 seconds)
  const sendTypingIndicator = useMemo(
    () =>
      throttle((userId: string) => {
        if (!isConnected || !messageInput.trim()) return;

        // Send typing event via WebSocket
        fetch('/api/messages/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiverId: userId }),
        }).catch((error) => {
          console.error('Failed to send typing indicator:', error);
        });
      }, 3000),
    [isConnected, messageInput]
  );

  // Debounced function to save draft (500ms after user stops typing)
  const saveDraftDebounced = useMemo(
    () =>
      debounce((conversationId: string, content: string) => {
        saveDraft(conversationId, content);
      }, 500),
    []
  );

  // Check if user is near the bottom of the scroll area
  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const threshold = 100; // pixels from bottom
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return scrollBottom < threshold;
  }, []);

  // Smart scroll: scroll to bottom only if appropriate
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesEndRef.current) return;

    // Always scroll if forced (e.g., when sending a message)
    // Otherwise, only scroll if user is near bottom
    if (force || !userScrolledUp.current || isNearBottom()) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      userScrolledUp.current = false;
    }
  }, [isNearBottom]);

  const handleTextareaResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate the number of rows based on content
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
    const rows = Math.min(Math.max(1, Math.ceil(textarea.scrollHeight / lineHeight)), 10);

    // Set the height based on rows (max 10 rows)
    const maxHeight = lineHeight * 10;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await fetch('/api/follow/list');
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following);
      }
    } catch (error) {
      console.error('Failed to fetch following:', error);
    }
  };

  const fetchMessages = async (userId: string, before?: string, appendTop = false) => {
    try {
      const qs = new URLSearchParams();
      qs.set('limit', '50');
      if (before) qs.set('before', before);
      const response = await fetch(`/api/messages/${userId}?${qs.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (appendTop) {
          const container = messagesContainerRef.current;
          const prevScrollHeight = container?.scrollHeight || 0;
          setMessages(prev => [...data.messages, ...prev]);
          setHasMore(!!data.hasMore);
          setTimeout(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - prevScrollHeight;
            }
          }, 0);
        } else {
          setMessages(data.messages);
          setHasMore(!!data.hasMore);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSelectConversation = (user: User) => {
    setSelectedConversation(user);
    fetchMessages(user.id);
  };

  const loadOlder = async () => {
    if (!selectedConversation || loadingOlder || !hasMore || messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0];
    const before = oldest.createdAt;
    await fetchMessages(selectedConversation.id, before, true);
    setLoadingOlder(false);
  };

  const handleRetryMessage = async (failedMessage: OptimisticMessage) => {
    if (!selectedConversation) return;

    // Mark message as optimistic again (remove failed flag)
    setMessages(prev => prev.map(msg =>
      msg.id === failedMessage.id ? { ...msg, optimistic: true, failed: false } : msg
    ));

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation.id,
          content: failedMessage.content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace failed message with real one from server
        setMessages(prev => prev.map(msg =>
          msg.id === failedMessage.id ? data.message : msg
        ));
        fetchConversations();
      } else {
        // Mark as failed again
        setMessages(prev => prev.map(msg =>
          msg.id === failedMessage.id ? { ...msg, optimistic: false, failed: true } : msg
        ));
      }
    } catch (error) {
      console.error('Failed to retry message:', error);
      // Mark as failed again
      setMessages(prev => prev.map(msg =>
        msg.id === failedMessage.id ? { ...msg, optimistic: false, failed: true } : msg
      ));
    }
  };

  const handleDeleteFailedMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation || sending) return;

    const content = messageInput.trim();
    const tempId = `optimistic_${Date.now()}_${optimisticIdCounter.current++}`;

    // Create optimistic message immediately
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      senderId: session!.user!.id as string,
      receiverId: selectedConversation.id,
      content,
      read: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: session!.user!.id as string,
        handle: (session!.user as any).handle || session!.user!.name || 'You',
        fullName: session!.user!.name,
        image: session!.user!.image,
      },
      receiver: {
        id: selectedConversation.id,
        handle: selectedConversation.handle,
        fullName: selectedConversation.fullName,
        image: selectedConversation.image,
      },
      optimistic: true, // Mark as optimistic
    };

    // Add optimistic message to UI immediately
    setMessages([...messages, optimisticMessage]);
    setMessageInput('');

    // Clear draft from localStorage
    if (selectedConversation) {
      clearDraft(selectedConversation.id);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Force scroll to bottom when sending a message
    setTimeout(() => scrollToBottom(true), 0);

    setSending(true);

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation.id,
          content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic message with real one from server
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? data.message : msg
        ));
        fetchConversations(); // Update conversations list
      } else {
        // Mark message as failed
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? { ...msg, optimistic: false, failed: true } : msg
        ));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark message as failed
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...msg, optimistic: false, failed: true } : msg
      ));
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black py-3 sm:py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-3 sm:mb-4 md:mb-8">
          Messages
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Following List */}
          <div className="lg:col-span-1">
            <div className="bg-[#35322e] light:bg-white rounded-xl border border-[#474239] light:border-[#d4caba] p-3 sm:p-4">
              <h2 className="text-lg font-semibold text-white light:text-black mb-4 flex items-center">
                <Users className="h-4 w-4 mr-2 text-orange-400" />
                Following
              </h2>

              {following.length === 0 ? (
                <p className="text-[#a0958a] light:text-[#5a5449] text-center py-8 text-sm">Follow users to message them</p>
              ) : (
                <div className="space-y-1">
                  {following.map((user) => {
                    const conversation = conversations.find(c => c.user.id === user.id);
                    const unreadCount = conversation?.unreadCount || 0;

                    return (
                      <button
                        key={user.id}
                        onClick={() => handleSelectConversation(user)}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                          selectedConversation?.id === user.id
                            ? 'bg-orange-300/10 border border-orange-300/30'
                            : 'hover:bg-[#2a2723] light:hover:bg-[#f5f1ea] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white light:text-black text-sm truncate">{user.handle}</p>
                            {conversation?.lastMessage && (
                              <p className="text-xs text-[#a0958a] light:text-[#5a5449] truncate mt-0.5">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <span className="ml-2 bg-orange-300 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-[#35322e] light:bg-white rounded-xl border border-[#474239] light:border-[#d4caba] flex flex-col h-[500px] sm:h-[600px]">
                {/* Chat Header */}
                <div className="p-3 sm:p-4 border-b border-[#474239] light:border-[#d4caba]">
                  <h2 className="text-base sm:text-lg font-semibold text-white light:text-black">{selectedConversation.handle}</h2>
                  {selectedConversation.fullName && (
                    <p className="text-xs text-[#a0958a] light:text-[#5a5449] mt-0.5">{selectedConversation.fullName}</p>
                  )}
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4">
                  {messages.length === 0 ? (
                    <p className="text-[#a0958a] light:text-[#5a5449] text-center py-8 text-sm">No messages yet. Start the conversation!</p>
                  ) : (
                    <div className="flex flex-col">
                      {/* Load more button at top */}
                      {hasMore && (
                        <div className="flex justify-center mb-3">
                          <button
                            disabled={loadingOlder}
                            onClick={loadOlder}
                            className="px-3 py-1 text-xs bg-[#2a2723] light:bg-[#f5f1ea] border border-[#3e3a33] light:border-[#d4caba] rounded text-[#a0958a] light:text-[#5a5449] hover:text-white hover:bg-[#33302c] disabled:opacity-60"
                          >
                            {loadingOlder ? 'Loading…' : 'Load more'}
                          </button>
                        </div>
                      )}
                      {groupMessages(messages).map((dayGroup: MessageGroup) => (
                        <div key={dayGroup.dateString} className="mb-6 last:mb-0">
                          {/* Date Separator */}
                          <div className="flex items-center justify-center mb-4">
                            <div className="bg-orange-400/20 border border-orange-400/30 rounded-full px-3 py-1">
                              <span className="text-xs font-semibold text-orange-400">
                                {dayGroup.dateString}
                              </span>
                            </div>
                          </div>

                          {/* Messages for this day */}
                          <div className="space-y-1">
                            {(dayGroup.messages as (GroupedMessage & OptimisticMessage)[]).map((message) => {
                              const isOwn = message.senderId === session?.user?.id;
                              const isOptimistic = message.optimistic;
                              const isFailed = message.failed;

                              return (
                                <div
                                  key={message.id}
                                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`
                                      max-w-[85%] sm:max-w-[75%] px-2.5 sm:px-3 py-2
                                      ${
                                        isFailed
                                          ? 'bg-red-400/20 border border-red-400/50 text-white light:text-black'
                                          : isOptimistic
                                          ? 'bg-orange-400/70 text-white'
                                          : isOwn
                                          ? 'bg-orange-400 text-white'
                                          : 'bg-[#2a2723] light:bg-[#f5f1ea] text-white light:text-black border border-[#3e3a33] light:border-[#d4caba]'
                                      }
                                      ${
                                        // Single message or last in group: fully rounded
                                        (message.isFirstInGroup && message.isLastInGroup) || (!message.isFirstInGroup && message.isLastInGroup)
                                          ? 'rounded-lg'
                                          : // First in group (with more messages following): cut top corner
                                          message.isFirstInGroup
                                          ? isOwn
                                            ? 'rounded-tl-lg rounded-bl-lg rounded-br-lg' // Own: cut top-right
                                            : 'rounded-tr-lg rounded-br-lg rounded-bl-lg' // Their: cut top-left
                                          : // Middle of group: same as first (cut top corner)
                                          isOwn
                                          ? 'rounded-tl-lg rounded-bl-lg rounded-br-lg'
                                          : 'rounded-tr-lg rounded-br-lg rounded-bl-lg'
                                      }
                                      ${isOptimistic ? 'transition-opacity' : ''}
                                    `}
                                  >
                                    {(() => {
                                      const rendered = renderMessageContent(message.content);
                                      return (
                                        <div className="text-xs sm:text-sm break-words">
                                          {rendered.nodes}
                                          {rendered.embeds.length > 0 && (
                                            <div className="mt-1 space-y-1">{rendered.embeds}</div>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {/* Only show timestamp on last message in group */}
                                    {message.showTimestamp && (
                                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                        isFailed
                                          ? 'text-red-300'
                                          : isOptimistic
                                          ? 'text-orange-200'
                                          : isOwn
                                          ? 'text-orange-200'
                                          : 'text-[#6b6460] light:text-[#a0958a]'
                                      }`}>
                                        <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isOwn && (
                                          isFailed ? (
                                            <AlertCircle className="h-3 w-3" />
                                          ) : isOptimistic ? (
                                            <Clock className="h-3 w-3 animate-pulse" />
                                          ) : (
                                            message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                                          )
                                        )}
                                      </div>
                                    )}

                                    {/* Failed message actions */}
                                    {isFailed && isOwn && (
                                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-red-400/30">
                                        <button
                                          onClick={() => handleRetryMessage(message)}
                                          className="flex-1 px-2 py-1 text-xs bg-red-400/20 hover:bg-red-400/30 border border-red-400/50 rounded text-red-300 transition-colors"
                                        >
                                          Retry
                                        </button>
                                        <button
                                          onClick={() => handleDeleteFailedMessage(message.id)}
                                          className="flex-1 px-2 py-1 text-xs bg-red-400/20 hover:bg-red-400/30 border border-red-400/50 rounded text-red-300 transition-colors"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Typing Indicator */}
                      {typingState && (
                        <div className="flex justify-start mb-2">
                          <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#3e3a33] light:border-[#d4caba] rounded-lg px-3 py-2 flex items-center gap-2">
                            <span className="text-xs text-[#a0958a] light:text-[#5a5449]">
                              {typingState.handle} is typing
                            </span>
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
                              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 border-t border-[#474239] light:border-[#d4caba]">
                  <div className="flex gap-2 items-end">
                    <textarea
                      ref={textareaRef}
                      value={messageInput}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setMessageInput(newValue);
                        handleTextareaResize();

                        // Save draft to localStorage (debounced)
                        if (selectedConversation) {
                          saveDraftDebounced(selectedConversation.id, newValue);
                        }

                        // Send typing indicator when user types
                        if (selectedConversation && newValue.trim()) {
                          sendTypingIndicator(selectedConversation.id);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Submit on Enter (without Shift)
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message..."
                      maxLength={1000}
                      rows={1}
                      className="flex-1 px-2.5 sm:px-3 py-2 text-xs sm:text-sm bg-[#2a2723] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6460] light:placeholder-[#a0958a] focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none overflow-y-auto"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || sending}
                      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-600 hover:to-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-[#35322e] light:bg-white rounded-xl border border-[#474239] light:border-[#d4caba] h-[500px] sm:h-[600px] flex items-center justify-center">
                <div className="text-center px-4">
                  <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-[#6b6460] light:text-[#a0958a] mx-auto mb-3" />
                  <p className="text-[#a0958a] light:text-[#5a5449] text-xs sm:text-sm">Select someone to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
