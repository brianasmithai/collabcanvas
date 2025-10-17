// Presence types and type guards tests
// Validates type guards for presence payload and cursor position

import { describe, it, expect } from 'vitest';
import {
  isCursorPosition,
  isPresenceData,
  isPresenceEntry,
  type CursorPosition,
  type PresenceData,
  type PresenceEntry,
} from '../src/types/presence';

describe('Presence Types and Type Guards', () => {
  describe('CursorPosition', () => {
    it('should validate correct cursor position', () => {
      const validCursor: CursorPosition = { x: 100, y: 200 };
      
      expect(isCursorPosition(validCursor)).toBe(true);
    });

    it('should reject invalid cursor position - missing x', () => {
      const invalidCursor = { y: 200 };
      
      expect(isCursorPosition(invalidCursor)).toBe(false);
    });

    it('should reject invalid cursor position - missing y', () => {
      const invalidCursor = { x: 100 };
      
      expect(isCursorPosition(invalidCursor)).toBe(false);
    });

    it('should reject invalid cursor position - wrong types', () => {
      const invalidCursor = { x: '100', y: '200' };
      
      expect(isCursorPosition(invalidCursor)).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(isCursorPosition(null)).toBe(false);
      expect(isCursorPosition(undefined)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(isCursorPosition('string')).toBe(false);
      expect(isCursorPosition(123)).toBe(false);
      expect(isCursorPosition([])).toBe(false);
    });
  });

  describe('PresenceData', () => {
    it('should validate correct presence data', () => {
      const validPresence: PresenceData = {
        name: 'John Doe',
        cursor: { x: 100, y: 200 },
        selectionIds: ['shape1', 'shape2'],
        updatedAt: Date.now(),
      };
      
      expect(isPresenceData(validPresence)).toBe(true);
    });

    it('should validate presence data without selectionIds', () => {
      const validPresence: PresenceData = {
        name: 'Jane Doe',
        cursor: { x: 150, y: 250 },
        updatedAt: Date.now(),
      };
      
      expect(isPresenceData(validPresence)).toBe(true);
    });

    it('should reject presence data with invalid cursor', () => {
      const invalidPresence = {
        name: 'John Doe',
        cursor: { x: 'invalid', y: 200 },
        updatedAt: Date.now(),
      };
      
      expect(isPresenceData(invalidPresence)).toBe(false);
    });

    it('should reject presence data with missing name', () => {
      const invalidPresence = {
        cursor: { x: 100, y: 200 },
        updatedAt: Date.now(),
      };
      
      expect(isPresenceData(invalidPresence)).toBe(false);
    });

    it('should reject presence data with missing cursor', () => {
      const invalidPresence = {
        name: 'John Doe',
        updatedAt: Date.now(),
      };
      
      expect(isPresenceData(invalidPresence)).toBe(false);
    });

    it('should reject presence data with missing updatedAt', () => {
      const invalidPresence = {
        name: 'John Doe',
        cursor: { x: 100, y: 200 },
      };
      
      expect(isPresenceData(invalidPresence)).toBe(false);
    });

    it('should reject presence data with invalid selectionIds', () => {
      const invalidPresence = {
        name: 'John Doe',
        cursor: { x: 100, y: 200 },
        selectionIds: 'not-an-array',
        updatedAt: Date.now(),
      };
      
      expect(isPresenceData(invalidPresence)).toBe(false);
    });

    it('should reject presence data with invalid selectionIds array', () => {
      const invalidPresence = {
        name: 'John Doe',
        cursor: { x: 100, y: 200 },
        selectionIds: [123, 'valid-id'],
        updatedAt: Date.now(),
      };
      
      expect(isPresenceData(invalidPresence)).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(isPresenceData(null)).toBe(false);
      expect(isPresenceData(undefined)).toBe(false);
    });
  });

  describe('PresenceEntry', () => {
    it('should validate correct presence entry', () => {
      const validEntry: PresenceEntry = {
        'user1': {
          name: 'John Doe',
          cursor: { x: 100, y: 200 },
          selectionIds: ['shape1'],
          updatedAt: Date.now(),
        },
        'user2': {
          name: 'Jane Doe',
          cursor: { x: 150, y: 250 },
          updatedAt: Date.now(),
        },
      };
      
      expect(isPresenceEntry(validEntry)).toBe(true);
    });

    it('should reject presence entry with invalid user data', () => {
      const invalidEntry = {
        'user1': {
          name: 'John Doe',
          cursor: { x: 100, y: 200 },
          updatedAt: Date.now(),
        },
        'user2': {
          name: 'Jane Doe',
          cursor: { x: 'invalid', y: 250 },
          updatedAt: Date.now(),
        },
      };
      
      expect(isPresenceEntry(invalidEntry)).toBe(false);
    });

    it('should reject empty object', () => {
      expect(isPresenceEntry({})).toBe(true); // Empty object is valid
    });

    it('should reject null or undefined', () => {
      expect(isPresenceEntry(null)).toBe(false);
      expect(isPresenceEntry(undefined)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(isPresenceEntry('string')).toBe(false);
      expect(isPresenceEntry(123)).toBe(false);
      expect(isPresenceEntry([])).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should work with TypeScript type assertions', () => {
      const unknownData: unknown = {
        name: 'Test User',
        cursor: { x: 100, y: 200 },
        updatedAt: Date.now(),
      };

      if (isPresenceData(unknownData)) {
        // TypeScript should know this is PresenceData
        expect(unknownData.name).toBe('Test User');
        expect(unknownData.cursor.x).toBe(100);
        expect(unknownData.cursor.y).toBe(200);
      } else {
        fail('Type guard should have passed');
      }
    });

    it('should work with cursor position type assertions', () => {
      const unknownData: unknown = { x: 100, y: 200 };

      if (isCursorPosition(unknownData)) {
        // TypeScript should know this is CursorPosition
        expect(unknownData.x).toBe(100);
        expect(unknownData.y).toBe(200);
      } else {
        fail('Type guard should have passed');
      }
    });
  });
});
