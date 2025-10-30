/**
 * Message Draft Persistence
 *
 * Saves and retrieves message drafts from localStorage per conversation.
 * Prevents losing typed messages when switching conversations or refreshing.
 */

const DRAFT_STORAGE_KEY = 'message-drafts';

/**
 * Get all drafts from localStorage
 */
function getAllDrafts(): Record<string, string> {
  try {
    const drafts = localStorage.getItem(DRAFT_STORAGE_KEY);
    return drafts ? JSON.parse(drafts) : {};
  } catch (error) {
    console.error('Failed to load drafts:', error);
    return {};
  }
}

/**
 * Save all drafts to localStorage
 */
function saveAllDrafts(drafts: Record<string, string>): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Failed to save drafts:', error);
  }
}

/**
 * Get draft for a specific conversation
 */
export function getDraft(conversationId: string): string {
  const drafts = getAllDrafts();
  return drafts[conversationId] || '';
}

/**
 * Save draft for a specific conversation
 */
export function saveDraft(conversationId: string, content: string): void {
  const drafts = getAllDrafts();

  if (content.trim()) {
    // Save non-empty draft
    drafts[conversationId] = content;
  } else {
    // Remove empty draft
    delete drafts[conversationId];
  }

  saveAllDrafts(drafts);
}

/**
 * Clear draft for a specific conversation
 */
export function clearDraft(conversationId: string): void {
  const drafts = getAllDrafts();
  delete drafts[conversationId];
  saveAllDrafts(drafts);
}

/**
 * Clear all drafts (useful for cleanup)
 */
export function clearAllDrafts(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear drafts:', error);
  }
}
