// CursorLayer component for rendering remote user cursors
import React from 'react';
import { Layer, Circle, Text, Group } from 'react-konva';
import { usePresence } from '../hooks/usePresence';
import { useUIStore } from '../state/uiStore';
import type { PresenceMap } from '../hooks/usePresence';

interface CursorLayerProps {
  currentUserId?: string; // Don't show current user's cursor
}

export const CursorLayer: React.FC<CursorLayerProps> = ({ currentUserId }) => {
  const presenceMap = usePresence();
  const { viewport } = useUIStore();

  // Filter out current user and users without valid cursor data
  const remoteUsers = Object.entries(presenceMap).filter(([uid, presence]) => 
    uid !== currentUserId && 
    presence.cursor && 
    typeof presence.cursor.x === 'number' && 
    typeof presence.cursor.y === 'number'
  );

  if (remoteUsers.length === 0) {
    return null;
  }

  return (
    <Layer>
      {remoteUsers.map(([uid, presence]) => {
        const { cursor, name } = presence;
        
        // Convert world coordinates to screen coordinates
        const screenX = cursor.x * viewport.scale + viewport.x;
        const screenY = cursor.y * viewport.scale + viewport.y;

        return (
          <Group key={uid} x={screenX} y={screenY}>
            {/* Cursor pointer */}
            <Circle
              x={0}
              y={0}
              radius={4}
              fill="#007bff"
              stroke="#ffffff"
              strokeWidth={2}
              shadowColor="rgba(0, 0, 0, 0.3)"
              shadowBlur={4}
              shadowOffset={{ x: 1, y: 1 }}
            />
            
            {/* User name label */}
            <Text
              x={8}
              y={-8}
              text={name}
              fontSize={12}
              fontFamily="Arial, sans-serif"
              fill="#333"
              padding={4}
              background="#ffffff"
              cornerRadius={4}
              shadowColor="rgba(0, 0, 0, 0.2)"
              shadowBlur={2}
              shadowOffset={{ x: 1, y: 1 }}
            />
            
            {/* Selection indicator if user has selections */}
            {presence.selectionIds && presence.selectionIds.length > 0 && (
              <Circle
                x={0}
                y={0}
                radius={8}
                fill="transparent"
                stroke="#007bff"
                strokeWidth={2}
                dash={[5, 5]}
                opacity={0.7}
              />
            )}
          </Group>
        );
      })}
    </Layer>
  );
};
