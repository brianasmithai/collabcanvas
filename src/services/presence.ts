// Presence service for real-time user presence and cursor tracking
import { ref, set, onDisconnect, serverTimestamp, push, remove } from 'firebase/database';
import { rtdb } from '../config/firebaseClient';
import type { Presence } from '../types';

/**
 * Set or update user presence in Realtime Database
 * @param uid - Firebase Auth user ID
 * @param presence - Presence data to store
 */
export const setPresence = async (uid: string, presence: Omit<Presence, 'updatedAt'>) => {
  const presenceRef = ref(rtdb, `presence/${uid}`);
  
  const presenceData: Presence = {
    ...presence,
    updatedAt: Date.now(),
  };
  
  await set(presenceRef, presenceData);
  
  // Set up automatic cleanup when user disconnects
  onDisconnect(presenceRef).remove();
};

/**
 * Set initial presence for a new user
 * @param uid - Firebase Auth user ID
 * @param displayName - User's display name
 */
export const setInitialPresence = async (uid: string, displayName: string) => {
  const presenceData: Omit<Presence, 'updatedAt'> = {
    name: displayName,
    displayName: displayName,
    cursor: { x: 0, y: 0 },
    selectionIds: [],
  };
  
  await setPresence(uid, presenceData);
};

/**
 * Update cursor position for current user
 * @param uid - Firebase Auth user ID
 * @param cursor - New cursor position
 */
export const updateCursor = async (uid: string, cursor: { x: number; y: number }) => {
  console.log('📍 Updating cursor:', { uid, cursor });
  const cursorRef = ref(rtdb, `presence/${uid}/cursor`);
  await set(cursorRef, cursor);
  
  // Also update the timestamp
  const timestampRef = ref(rtdb, `presence/${uid}/updatedAt`);
  await set(timestampRef, Date.now());
  console.log('✅ Cursor updated successfully');
};

/**
 * Update selection for current user
 * @param uid - Firebase Auth user ID
 * @param selectionIds - Array of selected rectangle IDs
 */
export const updateSelection = async (uid: string, selectionIds: string[]) => {
  const selectionRef = ref(rtdb, `presence/${uid}/selectionIds`);
  await set(selectionRef, selectionIds);
  
  // Also update the timestamp
  const timestampRef = ref(rtdb, `presence/${uid}/updatedAt`);
  await set(timestampRef, Date.now());
};

/**
 * Remove user presence (manual cleanup)
 * @param uid - Firebase Auth user ID
 */
export const removePresence = async (uid: string) => {
  const presenceRef = ref(rtdb, `presence/${uid}`);
  await remove(presenceRef);
};
