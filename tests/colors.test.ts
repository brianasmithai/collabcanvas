// Tests for colors utility
import { describe, test, expect } from 'vitest';
import { 
  assignUserColors,
  getUserColor, 
  getUserPrimaryColor, 
  getRectangleStyling, 
  EDITING_STATES 
} from '../src/utils/colors';

describe('colors utility', () => {
  describe('assignUserColors', () => {
    test('should assign colors to users in sorted order', () => {
      const userIds = ['user2', 'user1', 'user3'];
      const colors = assignUserColors(userIds);
      
      expect(colors.user1).toBe('#28a745'); // Green (first in sorted order)
      expect(colors.user2).toBe('#007bff'); // Blue (second in sorted order)
      expect(colors.user3).toBe('#dc3545'); // Red (third in sorted order)
    });

    test('should return consistent colors for same user list', () => {
      const userIds = ['Alice', 'Bob', 'Carol'];
      const colors1 = assignUserColors(userIds);
      const colors2 = assignUserColors(userIds);
      
      expect(colors1).toEqual(colors2);
    });

    test('should cycle through color palette for many users', () => {
      const userIds = Array.from({length: 15}, (_, i) => `user${i}`);
      const colors = assignUserColors(userIds);
      
      // Should cycle through the 10 available colors
      const uniqueColors = new Set(Object.values(colors));
      expect(uniqueColors.size).toBe(10); // All 10 colors should be used
    });
  });

  describe('getUserColor', () => {
    test('should return consistent color for same user in same context', () => {
      const allUserIds = ['user1', 'user2', 'user3'];
      const color1 = getUserColor('user1', allUserIds);
      const color2 = getUserColor('user1', allUserIds);
      
      expect(color1).toBe(color2);
    });

    test('should return different colors for different users', () => {
      const allUserIds = ['user1', 'user2', 'user3'];
      const color1 = getUserColor('user1', allUserIds);
      const color2 = getUserColor('user2', allUserIds);
      
      expect(color1).not.toBe(color2);
    });
  });

  describe('getUserPrimaryColor', () => {
    test('should return same as getUserColor', () => {
      const allUserIds = ['user1', 'user2'];
      const color1 = getUserPrimaryColor('user1', allUserIds);
      const color2 = getUserColor('user1', allUserIds);
      
      expect(color1).toBe(color2);
    });
  });

  describe('getRectangleStyling', () => {
    test('should return self-selected styling when current user has selected rectangle', () => {
      const styling = getRectangleStyling('rect1', true, ['user1'], 'user1', ['user1', 'user2']);
      
      expect(styling).toEqual({
        ...EDITING_STATES.SELF_SELECTED,
        stroke: '#28a745', // user1 gets green color
      });
    });

    test('should return other-selected styling when other users are editing', () => {
      const styling = getRectangleStyling('rect1', false, ['user2'], 'user1', ['user1', 'user2']);
      
      expect(styling.strokeWidth).toBe(EDITING_STATES.OTHER_SELECTED.strokeWidth);
      expect(styling.dash).toEqual(EDITING_STATES.OTHER_SELECTED.dash);
      expect(styling.opacity).toBe(EDITING_STATES.OTHER_SELECTED.opacity);
      expect(styling.stroke).toBeDefined(); // Should have a color assigned
    });

    test('should return default styling when no users are editing', () => {
      const styling = getRectangleStyling('rect1', false, [], 'user1', ['user1', 'user2']);
      
      expect(styling).toEqual(EDITING_STATES.DEFAULT);
    });

    test('should ignore current user in editing users list', () => {
      const styling = getRectangleStyling('rect1', false, ['user1', 'user2'], 'user1', ['user1', 'user2']);
      
      // Should treat as other users editing (user2), not self-selected
      expect(styling.strokeWidth).toBe(EDITING_STATES.OTHER_SELECTED.strokeWidth);
      expect(styling.dash).toEqual(EDITING_STATES.OTHER_SELECTED.dash);
    });

    test('should prioritize self-selected over other users editing', () => {
      const styling = getRectangleStyling('rect1', true, ['user2'], 'user1', ['user1', 'user2']);
      
      // Self-selected should take precedence
      expect(styling).toEqual({
        ...EDITING_STATES.SELF_SELECTED,
        stroke: '#28a745', // user1 gets green color
      });
    });
  });

  describe('EDITING_STATES', () => {
    test('should have all required editing states defined', () => {
      expect(EDITING_STATES.SELF_SELECTED).toBeDefined();
      expect(EDITING_STATES.OTHER_SELECTED).toBeDefined();
      expect(EDITING_STATES.BEING_EDITED).toBeDefined();
      expect(EDITING_STATES.DEFAULT).toBeDefined();
    });

    test('should have consistent styling properties', () => {
      expect(EDITING_STATES.SELF_SELECTED.fill).toBeDefined();
      expect(EDITING_STATES.SELF_SELECTED.stroke).toBeDefined();
      expect(EDITING_STATES.SELF_SELECTED.strokeWidth).toBeDefined();
      
      expect(EDITING_STATES.OTHER_SELECTED.strokeWidth).toBeDefined();
      expect(EDITING_STATES.OTHER_SELECTED.dash).toBeDefined();
      expect(EDITING_STATES.OTHER_SELECTED.opacity).toBeDefined();
      
      expect(EDITING_STATES.DEFAULT.fill).toBeDefined();
      expect(EDITING_STATES.DEFAULT.stroke).toBeDefined();
      expect(EDITING_STATES.DEFAULT.strokeWidth).toBeDefined();
    });
  });
});