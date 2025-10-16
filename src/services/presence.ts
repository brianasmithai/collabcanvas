// Presence service for real-time user presence and cursor tracking
import { ref, set, onDisconnect, remove, get } from 'firebase/database';
import { rtdb } from '../config/firebaseClient';
import type { Presence } from '../types';

/**
 * Set or update user presence in Realtime Database
 * @param uid - Firebase Auth user ID
 * @param presence - Presence data to store
 */
export const setPresence = async (uid: string, presence: Omit<Presence, 'updatedAt'>) => {
  console.log('🔗 setPresence: Attempting to set presence for', uid, presence);
  const presenceRef = ref(rtdb, `presence/${uid}`);
  
  const presenceData: Presence = {
    ...presence,
    updatedAt: Date.now(),
  };
  
  try {
    await set(presenceRef, presenceData);
    console.log('✅ setPresence: Successfully set presence for', uid);
    
    // Set up automatic cleanup when user disconnects
    onDisconnect(presenceRef).remove();
    console.log('🔌 setPresence: Set up disconnect cleanup for', uid);
  } catch (error) {
    console.error('❌ setPresence: Failed to set presence for', uid, error);
    throw error;
  }
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
  
  console.log('Setting initial presence data:', { uid, displayName, presenceData });
  await setPresence(uid, presenceData);
};

/**
 * Update cursor position for current user
 * @param uid - Firebase Auth user ID
 * @param cursor - New cursor position
 */
export const updateCursor = async (uid: string, cursor: { x: number; y: number }) => {
  console.log('🖱️ updateCursor: Updating cursor for', uid, 'to', cursor);
  // Get current user data to preserve name/displayName
  const presenceRef = ref(rtdb, `presence/${uid}`);
  const snapshot = await get(presenceRef);
  const currentData = snapshot.val();
  
  console.log('🖱️ updateCursor: Current data for', uid, ':', currentData);
  
  // Ensure name and displayName are preserved
  const updatedData = {
    ...currentData,
    cursor: cursor,
    updatedAt: Date.now(),
    // Note: do NOT set default name/displayName here to avoid overwriting with generic labels
  };
  
  try {
    await set(presenceRef, updatedData);
    console.log('✅ updateCursor: Cursor updated successfully for', uid);
  } catch (error) {
    console.error('❌ updateCursor: Failed to update cursor for', uid, error);
    throw error;
  }
};

/**
 * Update selection for current user
 * @param uid - Firebase Auth user ID
 * @param selectionIds - Array of selected rectangle IDs
 */
export const updateSelection = async (uid: string, selectionIds: string[]) => {
  console.log('🎯 updateSelection: Updating selection for', uid, 'to', selectionIds);
  // Get current user data to preserve name/displayName
  const presenceRef = ref(rtdb, `presence/${uid}`);
  const snapshot = await get(presenceRef);
  const currentData = snapshot.val();
  
  console.log('🎯 updateSelection: Current data for', uid, ':', currentData);
  
  // Ensure name and displayName are preserved
  const updatedData = {
    ...currentData,
    selectionIds: selectionIds,
    updatedAt: Date.now(),
    // Note: do NOT set default name/displayName here to avoid overwriting with generic labels
  };
  
  try {
    await set(presenceRef, updatedData);
    console.log('✅ updateSelection: Selection updated successfully for', uid, 'to', selectionIds);
  } catch (error) {
    console.error('❌ updateSelection: Failed to update selection for', uid, error);
    throw error;
  }
};

/**
 * Remove user presence (manual cleanup)
 * @param uid - Firebase Auth user ID
 */
export const removePresence = async (uid: string) => {
  const presenceRef = ref(rtdb, `presence/${uid}`);
  await remove(presenceRef);
};

/**
 * Clean up stale presence entries (users who haven't updated in a while)
 * This should be called periodically to remove inactive users
 */
export const cleanupStalePresence = async () => {
  const presenceRef = ref(rtdb, 'presence');
  const snapshot = await get(presenceRef);
  const data = snapshot.val();
  
  if (!data) return;
  
  const currentTime = Date.now();
  const INACTIVE_THRESHOLD = 300000; // 5 minute threshold for cleanup
  
  const staleUsers: string[] = [];
  
  Object.keys(data).forEach((uid) => {
    const userPresence = data[uid];
    if (userPresence) {
      const lastUpdate = userPresence.updatedAt || currentTime;
      const timeSinceUpdate = currentTime - lastUpdate;
      
      if (timeSinceUpdate > INACTIVE_THRESHOLD) {
        staleUsers.push(uid);
      }
    }
  });
  
  // Remove stale users
  for (const uid of staleUsers) {
    try {
      await removePresence(uid);
      console.log(`🧹 Cleaned up stale presence for user: ${uid}`);
    } catch (error) {
      console.error(`Failed to clean up stale presence for user ${uid}:`, error);
    }
  }
  
  if (staleUsers.length > 0) {
    console.log(`🧹 Cleaned up ${staleUsers.length} stale presence entries`);
  }
};
