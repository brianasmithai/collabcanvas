// CursorLayer component for rendering remote user cursors
import React from 'react';
import { Layer, Circle, Text, Group } from 'react-konva';
import { usePresence } from '../hooks/usePresence';
import { useUIStore } from '../state/uiStore';
import type { PresenceMap } from '../hooks/usePresence';

// Predefined colors for user cursors
const USER_COLORS = [
  '#28a745', // Green
  '#007bff', // Blue
  '#dc3545', // Red
  '#ffc107', // Yellow
  '#6f42c1', // Purple
  '#fd7e14', // Orange
  '#20c997', // Teal
  '#e83e8c', // Pink
  '#6c757d', // Gray
  '#17a2b8', // Cyan
];

// Function to assign colors to users dynamically to avoid conflicts
const assignUserColors = (userIds: string[]): Record<string, string> => {
  const colorAssignments: Record<string, string> = {};
  
  // Sort user IDs to ensure consistent assignment order
  const sortedUserIds = [...userIds].sort();
  
  sortedUserIds.forEach((userId, index) => {
    // Assign colors in order, cycling through the palette
    const colorIndex = index % USER_COLORS.length;
    colorAssignments[userId] = USER_COLORS[colorIndex];
  });
  
  return colorAssignments;
};

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

  // Assign colors to all remote users to avoid conflicts
  const userIds = remoteUsers.map(([uid]) => uid);
  const colorAssignments = assignUserColors(userIds);

  return (
    <Layer>
      {remoteUsers.map(([uid, presence]) => {
        const { cursor, displayName, name } = presence;
        const userName = displayName || name;
        const userColor = colorAssignments[uid];
        
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
              fill={userColor}
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
              text={userName}
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
                stroke={userColor}
                strokeWidth={2}
                dash={[5, 5]}
                opacity={0.7}
              />
            )}
            
            {/* Debug: Show selection count */}
            {presence.selectionIds && presence.selectionIds.length > 0 && (
              <Text
                x={12}
                y={8}
                text={`${presence.selectionIds.length} selected`}
                fontSize={10}
                fontFamily="Arial, sans-serif"
                fill={userColor}
                background="#ffffff"
                padding={2}
                cornerRadius={2}
              />
            )}
          </Group>
        );
      })}
    </Layer>
  );
};
