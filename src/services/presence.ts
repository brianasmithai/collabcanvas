// Presence service for real-time user presence and cursor tracking
import { ref, set, onDisconnect, remove, get, runTransaction } from 'firebase/database';
import { rtdb } from '../config/firebaseClient';
import type { Presence, ObjectLock } from '../types';

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
 * Update selection for current user and manage object locks
 * @param uid - Firebase Auth user ID
 * @param selectionIds - Array of selected rectangle IDs
 * @param ownerName - User's display name for lock ownership
 */
export const updateSelection = async (uid: string, selectionIds: string[], ownerName: string) => {
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
    
    // Manage object locks
    await updateObjectLocks(uid, selectionIds, ownerName);
  } catch (error) {
    console.error('❌ updateSelection: Failed to update selection for', uid, error);
    throw error;
  }
};

/**
 * Update object locks based on current selection
 * @param uid - Firebase Auth user ID
 * @param selectionIds - Array of selected rectangle IDs
 * @param ownerName - User's display name for lock ownership
 */
export const updateObjectLocks = async (uid: string, selectionIds: string[], ownerName: string) => {
  console.log('🔒 updateObjectLocks: Managing locks for', uid, 'with selections:', selectionIds);
  
  try {
    // Get current locks to see what we need to release
    const locksRef = ref(rtdb, 'locks');
    const locksSnapshot = await get(locksRef);
    const currentLocks = locksSnapshot.val() || {};
    
    // Find locks owned by this user that are no longer selected
    const locksToRelease: string[] = [];
    Object.keys(currentLocks).forEach(objectId => {
      const lock = currentLocks[objectId] as ObjectLock;
      if (lock.ownerId === uid && !selectionIds.includes(objectId)) {
        locksToRelease.push(objectId);
      }
    });
    
    // Release locks for objects no longer selected
    for (const objectId of locksToRelease) {
      await releaseObjectLock(objectId);
    }
    
    // Claim locks for newly selected objects
    for (const objectId of selectionIds) {
      await claimObjectLock(objectId, uid, ownerName);
    }
    
    console.log('✅ updateObjectLocks: Lock management complete for', uid);
  } catch (error) {
    console.error('❌ updateObjectLocks: Failed to manage locks for', uid, error);
    throw error;
  }
};

/**
 * Claim a lock for an object
 * @param objectId - Rectangle ID to lock
 * @param ownerId - Firebase Auth user ID
 * @param ownerName - User's display name
 */
export const claimObjectLock = async (objectId: string, ownerId: string, ownerName: string) => {
  console.log('🔒 claimObjectLock: Claiming lock for', objectId, 'by', ownerId);
  
  const lockRef = ref(rtdb, `locks/${objectId}`);
  const lock: ObjectLock = {
    ownerId,
    ownerName,
    timestamp: Date.now()
  };
  
  try {
    await set(lockRef, lock);
    
    // Set up automatic cleanup when user disconnects
    onDisconnect(lockRef).remove();
    
    console.log('✅ claimObjectLock: Successfully claimed lock for', objectId);
  } catch (error) {
    console.error('❌ claimObjectLock: Failed to claim lock for', objectId, error);
    throw error;
  }
};

/**
 * Release a lock for an object
 * @param objectId - Rectangle ID to unlock
 */
export const releaseObjectLock = async (objectId: string) => {
  console.log('🔓 releaseObjectLock: Releasing lock for', objectId);
  
  const lockRef = ref(rtdb, `locks/${objectId}`);
  
  try {
    await remove(lockRef);
    console.log('✅ releaseObjectLock: Successfully released lock for', objectId);
  } catch (error) {
    console.error('❌ releaseObjectLock: Failed to release lock for', objectId, error);
    throw error;
  }
};

/**
 * Check if an object is locked by another user
 * @param objectId - Rectangle ID to check
 * @param currentUserId - Current user's ID
 * @returns Promise<ObjectLock | null> - Lock info if locked by another user, null if unlocked or owned by current user
 */
export const getObjectLock = async (objectId: string, currentUserId: string): Promise<ObjectLock | null> => {
  const lockRef = ref(rtdb, `locks/${objectId}`);
  
  try {
    const snapshot = await get(lockRef);
    const lock = snapshot.val() as ObjectLock | null;
    
    if (!lock) {
      return null; // Object is not locked
    }
    
    if (lock.ownerId === currentUserId) {
      return null; // Object is locked by current user (allowed)
    }
    
    return lock; // Object is locked by another user
  } catch (error) {
    console.error('❌ getObjectLock: Failed to check lock for', objectId, error);
    return null; // Assume unlocked on error
  }
};

/**
 * Try to claim a lock atomically using RTDB transaction.
 * Succeeds if lock is free or already owned by this user.
 */
export const tryClaimObjectLock = async (
  objectId: string,
  ownerId: string,
  ownerName: string
): Promise<{ success: boolean; currentOwnerName?: string }> => {
  console.log('🔒 tryClaimObjectLock: Attempting to claim lock for', objectId, 'by', ownerId, ownerName);
  const lockRef = ref(rtdb, `locks/${objectId}`);
  let lastSeenLock: any = null; // Capture lock info for error handling
  
  try {
    const STALE_TIMEOUT_MS = 30000; // allow takeover if lock is stale
    const result = await runTransaction(lockRef, (current: any) => {
      const now = Date.now();
      console.log('🔒 tryClaimObjectLock: Transaction callback - current lock:', current);
      
      if (current) {
        lastSeenLock = current; // Capture for error handling
      }
      
      if (!current) {
        console.log('🔒 tryClaimObjectLock: Lock is free, claiming');
        return { ownerId, ownerName, timestamp: now } as ObjectLock; // free → claim
      }
      if (current.ownerId === ownerId) {
        console.log('🔒 tryClaimObjectLock: Re-entrant lock by same user, refreshing');
        return { ownerId, ownerName, timestamp: now } as ObjectLock; // re-entrant refresh
      }
      const isStale = typeof current.timestamp === 'number' && (now - current.timestamp) > STALE_TIMEOUT_MS;
      if (isStale) {
        console.log('🔒 tryClaimObjectLock: Lock is stale, taking over');
        return { ownerId, ownerName, timestamp: now } as ObjectLock; // stale → take over
      }
      console.log('🔒 tryClaimObjectLock: Lock held by another user, aborting');
      return current; // locked by a fresh other user → no change
    }, { applyLocally: false });

    console.log('🔒 tryClaimObjectLock: Transaction result - committed:', result.committed, 'snapshot:', result.snapshot.val());
    const val = result.snapshot.val() as ObjectLock | null;
    const success = result.committed && val?.ownerId === ownerId;
    console.log('🔒 tryClaimObjectLock: Final result - success:', success, 'currentOwnerName:', val?.ownerName);
    return { success, currentOwnerName: success ? undefined : val?.ownerName };
  } catch (err: any) {
    // Firebase errors have a 'code' property we can check
    const errorCode = err?.code || '';
    const errorMessage = err?.message || String(err);
    
    console.log('🔒 tryClaimObjectLock: Transaction error code:', errorCode, 'message:', errorMessage);
    
    // PERMISSION_DENIED is the specific code when lock is held by another user
    // This happens when the transaction returns unchanged data that violates security rules
    if (errorCode === 'PERMISSION_DENIED' || errorMessage.includes('permission_denied')) {
      console.log('🔒 tryClaimObjectLock: Lock held by another user (permission denied), owner:', lastSeenLock?.ownerName);
      // Return the owner name from the last transaction callback
      return { success: false, currentOwnerName: lastSeenLock?.ownerName };
    }
    
    // Other errors are unexpected (network issues, database errors, etc.)
    console.error('❌ tryClaimObjectLock: Unexpected transaction error:', err);
    return { success: false };
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

// Lock timeout constants
const AUTO_LOCK_TIMEOUT = 30000; // 30 seconds

/**
 * Clean up stale locks (locks older than timeout)
 * This should be called periodically to remove abandoned locks
 */
export const cleanupStaleLocks = async () => {
  const locksRef = ref(rtdb, 'locks');
  const snapshot = await get(locksRef);
  const data = snapshot.val();
  
  if (!data) return;
  
  const currentTime = Date.now();
  const staleLocks: string[] = [];
  
  Object.keys(data).forEach((objectId) => {
    const lock = data[objectId] as ObjectLock;
    if (lock) {
      const timeSinceLock = currentTime - lock.timestamp;
      
      if (timeSinceLock > AUTO_LOCK_TIMEOUT) {
        staleLocks.push(objectId);
      }
    }
  });
  
  // Remove stale locks
  for (const objectId of staleLocks) {
    try {
      await releaseObjectLock(objectId);
      console.log(`🧹 Cleaned up stale lock for object: ${objectId}`);
    } catch (error) {
      console.error(`Failed to clean up stale lock for object ${objectId}:`, error);
    }
  }
  
  if (staleLocks.length > 0) {
    console.log(`🧹 Cleaned up ${staleLocks.length} stale locks`);
  }
};
