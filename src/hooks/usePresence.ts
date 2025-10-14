// Hook for subscribing to real-time presence data
import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../config/firebaseClient';
import type { Presence } from '../types';

// Timeout threshold for considering a user inactive (1 minute)
const INACTIVE_THRESHOLD = 60000;

// Map of user ID to presence data
export type PresenceMap = Record<string, Presence>;

/**
 * Hook to subscribe to real-time presence data from Firebase Realtime Database
 * @returns Map of user IDs to their presence data
 */
export const usePresence = (): PresenceMap => {
  const [presenceMap, setPresenceMap] = useState<PresenceMap>({});

  useEffect(() => {
    const presenceRef = ref(rtdb, 'presence');
    
    console.log('🔗 usePresence: Setting up Firebase presence subscription');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        // Convert Firebase data to our presence map
        const presence: PresenceMap = {};
        const currentTime = Date.now();
        
        Object.keys(data).forEach((uid) => {
          const userPresence = data[uid];
          if (userPresence) {
            const lastUpdate = userPresence.updatedAt || currentTime;
            const timeSinceUpdate = currentTime - lastUpdate;
            
            // Only include users who have been active recently
            if (timeSinceUpdate < INACTIVE_THRESHOLD) {
              const presenceData = {
                name: userPresence.name || 'Unknown User',
                displayName: userPresence.displayName || userPresence.name || 'Unknown User',
                cursor: userPresence.cursor || { x: 0, y: 0 },
                selectionIds: userPresence.selectionIds || [],
                updatedAt: lastUpdate,
              };
              
              console.log(`👥 usePresence: Processing user ${uid}:`, { 
                rawData: userPresence, 
                processedData: presenceData,
                timeSinceUpdate 
              });
              
              presence[uid] = presenceData;
            } else {
              console.log(`👥 usePresence: Filtering out inactive user ${uid} (last seen ${timeSinceUpdate}ms ago)`);
            }
          }
        });
        console.log('👥 usePresence: Received presence data:', presence);
        setPresenceMap(presence);
      } else {
        // No presence data
        console.log('👥 usePresence: No presence data found');
        setPresenceMap({});
      }
    }, (error) => {
      console.error('Error listening to presence:', error);
      setPresenceMap({});
    });

    // Cleanup subscription on unmount
    return () => {
      off(presenceRef, 'value', unsubscribe);
    };
  }, []);

  return presenceMap;
};
