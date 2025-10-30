/**
 * Message Grouping Utilities
 *
 * Groups messages by day and consecutive sender for better visual organization.
 * Provides a clean, modern chat interface experience.
 */

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  [key: string]: any;
}

export interface MessageGroup {
  date: Date;
  dateString: string; // Human-readable date for display
  messages: Message[];
}

export interface GroupedMessage extends Message {
  isFirstInGroup: boolean;  // First message from this sender in consecutive group
  isLastInGroup: boolean;   // Last message from this sender in consecutive group
  showTimestamp: boolean;   // Only show timestamp on last message in group
}

/**
 * Checks if two dates are on the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Formats a date for display as a separator
 * Examples: "Today", "Yesterday", "Monday, Jan 15", "Jan 15, 2024"
 */
export function formatDateSeparator(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if it's today
  if (isSameDay(date, today)) {
    return 'Today';
  }

  // Check if it's yesterday
  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  // Check if it's within the last 7 days
  const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    // Show day of week and date
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  // Check if it's this year
  if (date.getFullYear() === now.getFullYear()) {
    // Show month and day only
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Show full date including year
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Groups messages by day
 * Returns an array of day groups, each containing messages from that day
 */
export function groupMessagesByDay(messages: Message[]): MessageGroup[] {
  if (messages.length === 0) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  // Process messages in chronological order (oldest first)
  for (const message of messages) {
    const messageDate = new Date(message.createdAt);

    // Start a new group if this is the first message or it's a different day
    if (!currentGroup || !isSameDay(currentGroup.date, messageDate)) {
      currentGroup = {
        date: messageDate,
        dateString: formatDateSeparator(messageDate),
        messages: [],
      };
      groups.push(currentGroup);
    }

    // Add message to current group
    currentGroup.messages.push(message);
  }

  return groups;
}

/**
 * Groups consecutive messages from the same sender
 * Adds metadata to each message about its position in the group
 */
export function groupMessagesBySender(messages: Message[]): GroupedMessage[] {
  if (messages.length === 0) return [];

  const groupedMessages: GroupedMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const currentMessage = messages[i];
    const previousMessage = i > 0 ? messages[i - 1] : null;
    const nextMessage = i < messages.length - 1 ? messages[i + 1] : null;

    // Check if this message starts a new group
    const isFirstInGroup = !previousMessage || previousMessage.senderId !== currentMessage.senderId;

    // Check if this message ends a group
    const isLastInGroup = !nextMessage || nextMessage.senderId !== currentMessage.senderId;

    // Only show timestamp on the last message in a group
    const showTimestamp = isLastInGroup;

    groupedMessages.push({
      ...currentMessage,
      isFirstInGroup,
      isLastInGroup,
      showTimestamp,
    });
  }

  return groupedMessages;
}

/**
 * Complete message grouping pipeline
 * Groups messages by day, then by consecutive sender within each day
 */
export function groupMessages(messages: Message[]): MessageGroup[] {
  // First group by day
  const dayGroups = groupMessagesByDay(messages);

  // Then group by sender within each day
  return dayGroups.map(dayGroup => ({
    ...dayGroup,
    messages: groupMessagesBySender(dayGroup.messages) as Message[],
  }));
}
