// Hook for managing real-time object locks
import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, Unsubscribe } from 'firebase/database';
import { rtdb } from '../config/firebaseClient';
import type { ObjectLock } from '../types';

// Map of object ID to lock information
export type LockMap = Map<string, ObjectLock>;

/**
 * Hook for subscribing to real-time object locks
 * @returns Object with lock state and helper functions
 */
export const useLocks = () => {
  const [locks, setLocks] = useState<LockMap>(new Map());
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const locksRef = ref(rtdb, 'locks');
    
    console.log('🔗 useLocks: Setting up lock subscription');
    
    const unsubscribe: Unsubscribe = onValue(locksRef, (snapshot) => {
      const data = snapshot.val() || {};
      console.log('🔒 useLocks: Received lock data:', data);
      
      // Convert to Map for easier lookup
      const lockMap = new Map<string, ObjectLock>();
      Object.keys(data).forEach(objectId => {
        lockMap.set(objectId, data[objectId] as ObjectLock);
      });
      
      setLocks(lockMap);
      setIsConnected(true);
      setError(null);
    }, (error) => {
      console.error('❌ useLocks: Error in lock subscription:', error);
      setError(error.message);
      setIsConnected(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 useLocks: Cleaning up lock subscription');
      unsubscribe();
    };
  }, []);

  // Helper function to check if an object is locked by another user
  const isLockedByOther = useCallback((objectId: string, currentUserId: string): boolean => {
    const lock = locks.get(objectId);
    if (!lock) return false; // Not locked
    return lock.ownerId !== currentUserId; // Locked by someone else
  }, [locks]);

  // Helper function to get lock owner information
  const getLockOwner = useCallback((objectId: string): ObjectLock | null => {
    return locks.get(objectId) || null;
  }, [locks]);

  // Helper function to check if current user owns the lock
  const isOwnedByCurrentUser = useCallback((objectId: string, currentUserId: string): boolean => {
    const lock = locks.get(objectId);
    if (!lock) return false; // Not locked
    return lock.ownerId === currentUserId; // Owned by current user
  }, [locks]);

  // Helper function to get all locks owned by current user
  const getOwnedLocks = useCallback((currentUserId: string): string[] => {
    const ownedLocks: string[] = [];
    locks.forEach((lock, objectId) => {
      if (lock.ownerId === currentUserId) {
        ownedLocks.push(objectId);
      }
    });
    return ownedLocks;
  }, [locks]);

  return {
    locks,
    isConnected,
    error,
    isLockedByOther,
    getLockOwner,
    isOwnedByCurrentUser,
    getOwnedLocks,
  };
};
