// PresenceList component for showing who's online
import React from 'react';
import { usePresence } from '../hooks/usePresence';
import { assignUserColors } from '../utils/colors';

interface PresenceListProps {
  currentUserId?: string; // Show all users including current user
  className?: string;
}

export const PresenceList: React.FC<PresenceListProps> = ({ 
  currentUserId, 
  className = '' 
}) => {
  const presenceMap = usePresence();
  
  // Debug logging
  console.log('📋 PresenceList: Current user:', currentUserId, 'Presence map:', presenceMap);

  // Get list of all online users (including current user)
  const onlineUsers = Object.entries(presenceMap)
    .map(([uid, presence]) => ({
      uid,
      name: presence.displayName || presence.name,
      lastSeen: presence.updatedAt,
      isCurrentUser: uid === currentUserId,
    }))
    .sort((a, b) => {
      // Sort alphabetically by name for all users
      return a.name.localeCompare(b.name);
    });

  if (onlineUsers.length === 0) {
    return (
      <div className={`presence-list ${className}`}>
        <div className="presence-header">
          <strong>👥 Current Users (0)</strong>
        </div>
        <div className="presence-empty">
          No users online
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
        {(() => {
          // Get color assignments for all users (including current user for consistent color assignment)
          const allUserIds = onlineUsers.map(user => user.uid);
          const colorAssignments = assignUserColors(allUserIds);
          
          return onlineUsers.map(({ uid, name, lastSeen, isCurrentUser }) => {
            const timeSinceUpdate = Date.now() - lastSeen;
            const isActive = timeSinceUpdate < 60000; // Active if updated within 60 seconds
            const userColor = colorAssignments[uid];
          
            return (
              <div 
                key={uid} 
                className="presence-user"
                title={`Last seen: ${new Date(lastSeen).toLocaleTimeString()}`}
              >
                {isCurrentUser ? (
                  // Current user gets a gray box - match circle dimensions
                  <div 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: '#6c757d', 
                      borderRadius: '2px',
                      display: 'inline-block'
                    }}
                  />
                ) : (
                  // Other users get colored circles matching their cursor presence
                  <div 
                    className="presence-indicator" 
                    style={{ backgroundColor: userColor }}
                  />
                )}
                <span className="presence-name">
                  {name}
                  {isCurrentUser && <span className="presence-status"> (you)</span>}
                  {!isActive && !isCurrentUser && <span className="presence-status"> (offline)</span>}
                </span>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};
