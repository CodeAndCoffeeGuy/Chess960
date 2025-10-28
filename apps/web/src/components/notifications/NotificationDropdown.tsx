'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Swords, UserPlus, MessageSquare, Trophy, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Notification {
  id: string;
  type: 'CHALLENGE' | 'FRIEND_REQUEST' | 'MESSAGE' | 'TOURNAMENT' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
  challengeId: string | null;
  friendRequestId: string | null;
  messageId: string | null;
  tournamentId: string | null;
  gameId: string | null;
}

export function NotificationDropdown() {
  const { data: session } = useSession();
  const { on } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetchUnreadCount();
      // Poll every 30 seconds for unread count
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Real-time notification handling
  useEffect(() => {
    if (!session?.user) return;

    const unsubscribeNew = on('notification.new', (message: any) => {
      const newNotification = message.notification;
      
      // Add to notifications list if dropdown is open
      setNotifications(prev => [newNotification, ...prev]);
      
      // Update unread count
      if (!newNotification.read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    const unsubscribeCount = on('notification.count', (message: any) => {
      setUnreadCount(message.count);
    });

    return () => {
      unsubscribeNew();
      unsubscribeCount();
    };
  }, [session, on]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=20');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      
      // Update unread count immediately
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Also fetch from server to ensure accuracy
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'CHALLENGE':
        return <Swords className="h-4 w-4" />;
      case 'FRIEND_REQUEST':
        return <UserPlus className="h-4 w-4" />;
      case 'MESSAGE':
        return <MessageSquare className="h-4 w-4" />;
      case 'TOURNAMENT':
        return <Trophy className="h-4 w-4" />;
      case 'SYSTEM':
        return <Megaphone className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'CHALLENGE':
        return 'text-orange-300';
      case 'FRIEND_REQUEST':
        return 'text-blue-400';
      case 'MESSAGE':
        return 'text-green-400';
      case 'TOURNAMENT':
        return 'text-purple-400';
      case 'SYSTEM':
        return 'text-yellow-400';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      setIsOpen(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#c1b9ad] light:text-[#4a453e] hover:text-orange-200 light:hover:text-orange-600 transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#2a2926] light:bg-white border border-[#454038] light:border-[#d4caba] rounded-lg shadow-lg z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#3e3a33] light:border-[#d4caba]">
            <h3 className="text-white light:text-black font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-orange-300 hover:text-orange-200 transition-colors font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="h-12 w-12 text-[#a0958a] light:text-[#5a5449] mb-3" />
                <p className="text-[#a0958a] light:text-[#5a5449] text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#3e3a33] light:divide-[#d4caba]">
                {notifications.map((notification) => {
                  const content = (
                    <div
                      className={`p-4 hover:bg-[#33302c] light:hover:bg-[#f5f1ea] transition-colors cursor-pointer ${
                        !notification.read ? 'bg-orange-300/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            notification.read ? 'bg-[#35322e] light:bg-[#e5e1da]' : 'bg-orange-300/20'
                          } ${getNotificationColor(notification.type)}`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-white light:text-black font-semibold text-sm truncate pr-2">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-orange-300 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          <p className="text-[#a0958a] light:text-[#5a5449] text-xs mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[#6b6460] light:text-[#9a958e] text-xs">
                            {getTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );

                  if (notification.link) {
                    return (
                      <Link key={notification.id} href={notification.link}>
                        {content}
                      </Link>
                    );
                  }

                  return <div key={notification.id}>{content}</div>;
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
