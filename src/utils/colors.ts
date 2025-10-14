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
