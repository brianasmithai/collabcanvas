// PresenceList component for showing who's online
import React from 'react';
import { usePresence } from '../hooks/usePresence';
import { getUserColor } from '../utils/colors';

interface PresenceListProps {
  currentUserId?: string; // Don't show current user in the list
  className?: string;
}

export const PresenceList: React.FC<PresenceListProps> = ({ 
  currentUserId, 
  className = '' 
}) => {
  const presenceMap = usePresence();
  
  // Debug logging
  console.log('📋 PresenceList: Current user:', currentUserId, 'Presence map:', presenceMap);

  // Filter out current user and get list of online users
  const onlineUsers = Object.entries(presenceMap)
    .filter(([uid]) => uid !== currentUserId)
    .map(([uid, presence]) => ({
      uid,
      name: presence.displayName || presence.name,
      lastSeen: presence.updatedAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

  // Get all user IDs for consistent color assignment
  const allUserIds = Object.keys(presenceMap).filter(uid => uid !== currentUserId);

  if (onlineUsers.length === 0) {
    return (
      <div className={`presence-list ${className}`}>
        <div className="presence-header">
          <strong>👥 Current Users</strong>
        </div>
        <div className="presence-empty">
          No other users online
        </div>
      </div>
    );
  }

  return (
    <div className={`presence-list ${className}`}>
      <div className="presence-header">
        <strong>👥 Current Users ({onlineUsers.length})</strong>
      </div>
      <div className="presence-users">
        {onlineUsers.map(({ uid, name, lastSeen }) => {
          const timeSinceUpdate = Date.now() - lastSeen;
          const isActive = timeSinceUpdate < 60000; // Active if updated within 60 seconds
          const userColor = getUserColor(uid, allUserIds);
          
          return (
            <div 
              key={uid} 
              className="presence-user"
              title={`Last seen: ${new Date(lastSeen).toLocaleTimeString()}`}
            >
              <div 
                className="presence-indicator" 
                style={{ backgroundColor: userColor }}
              />
              <span className="presence-name">
                {name}
                {!isActive && <span className="presence-status"> (offline)</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
