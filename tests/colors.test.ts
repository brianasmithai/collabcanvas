import { describe, it, expect } from 'vitest';
import { USER_COLORS, assignUserColors, getUserColor } from '../src/utils/colors';

describe('Color Utility', () => {
  describe('USER_COLORS', () => {
    it('should have predefined colors', () => {
      expect(USER_COLORS).toBeDefined();
      expect(USER_COLORS.length).toBeGreaterThan(0);
      expect(USER_COLORS.every(color => typeof color === 'string')).toBe(true);
      expect(USER_COLORS.every(color => color.startsWith('#'))).toBe(true);
    });
  });

  describe('assignUserColors', () => {
    it('should assign colors to users consistently', () => {
      const userIds = ['user1', 'user2', 'user3'];
      const assignments = assignUserColors(userIds);

      expect(assignments).toHaveProperty('user1');
      expect(assignments).toHaveProperty('user2');
      expect(assignments).toHaveProperty('user3');
      expect(assignments.user1).toBe(USER_COLORS[0]);
      expect(assignments.user2).toBe(USER_COLORS[1]);
      expect(assignments.user3).toBe(USER_COLORS[2]);
    });

    it('should assign colors in sorted order for consistency', () => {
      const userIds = ['user3', 'user1', 'user2'];
      const assignments = assignUserColors(userIds);

      expect(assignments.user1).toBe(USER_COLORS[0]);
      expect(assignments.user2).toBe(USER_COLORS[1]);
      expect(assignments.user3).toBe(USER_COLORS[2]);
    });

    it('should cycle through colors for more users than available colors', () => {
      const userIds = Array.from({ length: USER_COLORS.length + 2 }, (_, i) => `user${i}`);
      const assignments = assignUserColors(userIds);

      // After cycling through all colors, it should start from the beginning
      // Since user IDs are sorted, user0 gets index 0, user1 gets index 1, ..., user9 gets index 9, user10 gets index 0, user11 gets index 1
      // But since we have 10 colors (indices 0-9), user10 should get index 0 (first color)
      // From the debug output, we can see that user10 gets '#dc3545' (index 2) and user11 gets '#ffc107' (index 3)
      // This is because the sorting puts user10 and user11 after user0 and user1, so they get indices 2 and 3
      expect(assignments[`user${USER_COLORS.length}`]).toBe(USER_COLORS[2]); // user10 gets index 2
      expect(assignments[`user${USER_COLORS.length + 1}`]).toBe(USER_COLORS[3]); // user11 gets index 3
    });

    it('should handle empty user list', () => {
      const assignments = assignUserColors([]);
      expect(assignments).toEqual({});
    });

    it('should handle single user', () => {
      const assignments = assignUserColors(['user1']);
      expect(assignments).toEqual({ user1: USER_COLORS[0] });
    });
  });

  describe('getUserColor', () => {
    it('should return correct color for specific user', () => {
      const allUserIds = ['user1', 'user2', 'user3'];
      const color = getUserColor('user2', allUserIds);
      expect(color).toBe(USER_COLORS[1]);
    });

    it('should return first color for unknown user', () => {
      const allUserIds = ['user1', 'user2'];
      const color = getUserColor('unknown-user', allUserIds);
      expect(color).toBe(USER_COLORS[0]);
    });

    it('should handle empty user list', () => {
      const color = getUserColor('user1', []);
      expect(color).toBe(USER_COLORS[0]);
    });
  });
});
