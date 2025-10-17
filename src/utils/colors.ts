// Color utility for consistent user identification across components

// Predefined colors for user cursors and presence indicators
export const USER_COLORS = [
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

/**
 * Assign colors to users dynamically to avoid conflicts
 * @param userIds - Array of user IDs to assign colors to
 * @returns Record mapping user ID to assigned color
 */
export const assignUserColors = (userIds: string[]): Record<string, string> => {
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

/**
 * Get a consistent color for a specific user ID
 * @param userId - The user ID to get a color for
 * @param allUserIds - All user IDs to ensure consistent assignment
 * @returns The assigned color for the user
 */
export const getUserColor = (userId: string, allUserIds: string[]): string => {
  const colorAssignments = assignUserColors(allUserIds);
  return colorAssignments[userId] || USER_COLORS[0]; // Fallback to first color
};

/**
 * Get the primary color for a user (for backward compatibility)
 * @param userId - The user ID
 * @param allUserIds - All user IDs to ensure consistent assignment
 * @returns Primary color string
 */
export const getUserPrimaryColor = (userId: string, allUserIds: string[]): string => {
  return getUserColor(userId, allUserIds);
};

/**
 * Get visual feedback colors for different editing states
 */
export const EDITING_STATES = {
  // Current user's selection
  SELF_SELECTED: {
    fill: '#e3f2fd',
    stroke: '#1976d2',
    strokeWidth: 3,
    dash: undefined,
    opacity: 1,
  },
  
  // Other user's selection
  OTHER_SELECTED: {
    fill: '#bbdefb',
    stroke: '#2196f3',
    strokeWidth: 2,
    dash: [8, 4],
    opacity: 0.8,
  },
  
  // Object being actively edited (dragged/resized/rotated)
  BEING_EDITED: {
    fill: '#bbdefb',
    stroke: '#2196f3',
    strokeWidth: 3,
    dash: [4, 4],
    opacity: 0.9,
  },
  
  // Default state
  DEFAULT: {
    fill: '#bbdefb',
    stroke: '#2196f3',
    strokeWidth: 2,
    dash: undefined,
    opacity: 1,
  },
};

/**
 * Get visual styling for a rectangle based on editing state
 * @param rectId - The rectangle ID
 * @param isSelected - Whether the current user has selected this rectangle
 * @param editingUsers - Array of user IDs currently editing this rectangle
 * @param currentUserId - The current user's ID
 * @param allUserIds - All user IDs for color assignment
 * @returns Styling object for the rectangle
 */
export const getRectangleStyling = (
  isSelected: boolean,
  editingUsers: string[],
  currentUserId?: string,
  allUserIds?: string[]
) => {
  // If current user has selected it
  if (isSelected && currentUserId && allUserIds) {
    return {
      ...EDITING_STATES.SELF_SELECTED,
      stroke: getUserColor(currentUserId, allUserIds), // Use current user's color
    };
  }
  
  // If other users are editing it
  if (editingUsers.length > 0) {
    const otherUsers = editingUsers.filter(uid => uid !== currentUserId);
    if (otherUsers.length > 0 && allUserIds) {
      const userColor = getUserColor(otherUsers[0], allUserIds);
      return {
        ...EDITING_STATES.OTHER_SELECTED,
        stroke: userColor, // Use first other user's color
      };
    }
  }
  
  // Default styling
  return EDITING_STATES.DEFAULT;
};