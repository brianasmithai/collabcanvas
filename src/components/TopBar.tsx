import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseClient';
import { removePresence } from '../services/presence';

interface TopBarProps {
  userEmail?: string;
  userDisplayName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ userEmail, userDisplayName }) => {
  const handleSignOut = async () => {
    try {
      // Get current user before signing out
      const currentUser = auth.currentUser;
      const userId = currentUser?.uid;

      // IMPORTANT: Remove presence BEFORE signing out so we still have write access
      if (userId) {
        try {
          await removePresence(userId);
          console.log('Presence removed successfully');
        } catch (presenceError) {
          console.error('Error removing presence before sign out:', presenceError);
          // Continue with sign-out even if presence removal fails; onDisconnect should still handle it
        }
      }

      // Now sign out
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const displayName = userDisplayName || userEmail?.split('@')[0] || 'User';

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      backgroundColor: '#2c3e50',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #34495e'
    }}>
      {/* App Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        <span style={{ marginRight: '10px' }}>🎨</span>
        CollabCanvas
      </div>

      {/* User Info and Sign Out */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        {/* User Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: '500' }}>
            {displayName}
          </div>
          {userEmail && (
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.8,
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {userEmail}
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#c0392b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#e74c3c';
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
