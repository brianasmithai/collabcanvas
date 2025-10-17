// Tests for live transform synchronization functionality
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Transform, Rect } from '../src/types';

// Mock Firebase modules
vi.mock('../src/config/firebaseClient', () => ({
  rtdb: {},
  firestore: {}
}));

// Mock Firebase RTDB
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  onValue: vi.fn(),
  push: vi.fn(),
  serverTimestamp: vi.fn(() => Date.now())
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => Date.now()),
  getDoc: vi.fn()
}));

// Import after mocks
import { transformService } from '../src/services/transforms';

describe('Live Transform Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Only cleanup if there are actual subscriptions
    if (transformService.getSubscriptionCount() > 0) {
      transformService.cleanup();
    }
  });

  describe('Transform Service - Active Transform Optimization', () => {
    it('should handle active transform updates', async () => {
      const transformId = 'test-rect-1';
      const activeTransform: Partial<Transform> = {
        x: 100,
        y: 200,
        isActive: true,
        updatedBy: 'user-1'
      };

      // Mock the Firebase functions
      const { ref, set, get } = await import('firebase/database');
      vi.mocked(ref).mockReturnValue({ key: transformId });
      vi.mocked(set).mockResolvedValue(undefined);

      await transformService.updateTransform(transformId, activeTransform);

      // Should call set with the transform data
      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          x: 100,
          y: 200,
          isActive: true,
          updatedBy: 'user-1'
        })
      );
    });

    it('should handle inactive transform updates', async () => {
      const transformId = 'test-rect-1';
      const inactiveTransform: Partial<Transform> = {
        x: 100,
        y: 200,
        isActive: false,
        updatedBy: 'user-1',
        updatedAt: 1000
      };

      const { ref, set, get } = await import('firebase/database');
      vi.mocked(ref).mockReturnValue({ key: transformId });
      vi.mocked(set).mockResolvedValue(undefined);
      vi.mocked(get).mockResolvedValue({ val: () => null });

      await transformService.updateTransform(transformId, inactiveTransform);

      // Should call both get and set for inactive transforms
      expect(get).toHaveBeenCalled();
      expect(set).toHaveBeenCalled();
    });
  });

  describe('Transform Subscription', () => {
    it('should set up transform subscription', async () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      const { onValue, ref } = await import('firebase/database');
      vi.mocked(onValue).mockReturnValue(mockUnsubscribe);
      vi.mocked(ref).mockReturnValue({});

      const unsubscribe = transformService.subscribeToTransforms(mockCallback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(onValue).toHaveBeenCalled();
    });
  });

  describe('Hybrid Storage - Live Transform Integration', () => {
    it('should merge live transforms with base rectangle data', () => {
      const baseRectangles: Rect[] = [
        {
          id: 'rect-1',
          x: 50,
          y: 100,
          width: 100,
          height: 50,
          rotation: 0,
          updatedAt: 1000,
          updatedBy: 'user-1'
        }
      ];

      const liveTransforms: Record<string, Transform> = {
        'rect-1': {
          id: 'rect-1',
          x: 150, // Different from base
          y: 200, // Different from base
          width: 100,
          height: 50,
          rotation: 0,
          updatedAt: 2000,
          updatedBy: 'user-2',
          isActive: true
        }
      };

      // Test the merge logic (this would be called by the hybrid service)
      const mergedRectangles = baseRectangles.map(rect => {
        const transform = liveTransforms[rect.id];
        if (transform) {
          return {
            ...rect,
            x: transform.x,
            y: transform.y,
            width: transform.width,
            height: transform.height,
            rotation: transform.rotation,
            updatedAt: transform.updatedAt,
            updatedBy: transform.updatedBy
          };
        }
        return rect;
      });

      expect(mergedRectangles[0]).toEqual({
        id: 'rect-1',
        x: 150, // From live transform
        y: 200, // From live transform
        width: 100,
        height: 50,
        rotation: 0,
        updatedAt: 2000, // From live transform
        updatedBy: 'user-2' // From live transform
      });
    });

    it('should preserve base rectangle data when no live transform exists', () => {
      const baseRectangles: Rect[] = [
        {
          id: 'rect-1',
          x: 50,
          y: 100,
          width: 100,
          height: 50,
          rotation: 0,
          updatedAt: 1000,
          updatedBy: 'user-1'
        }
      ];

      const liveTransforms: Record<string, Transform> = {};

      const mergedRectangles = baseRectangles.map(rect => {
        const transform = liveTransforms[rect.id];
        if (transform) {
          return {
            ...rect,
            x: transform.x,
            y: transform.y,
            width: transform.width,
            height: transform.height,
            rotation: transform.rotation,
            updatedAt: transform.updatedAt,
            updatedBy: transform.updatedBy
          };
        }
        return rect;
      });

      expect(mergedRectangles[0]).toEqual(baseRectangles[0]);
    });
  });

  describe('Transform Lifecycle Management', () => {
    it('should handle transform lifecycle states', () => {
      const activeTransform: Transform = {
        id: 'rect-1',
        x: 100,
        y: 200,
        width: 100,
        height: 50,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: 'user-1',
        isActive: true
      };

      const inactiveTransform: Transform = {
        ...activeTransform,
        isActive: false
      };

      // Test that we can distinguish between active and inactive transforms
      expect(activeTransform.isActive).toBe(true);
      expect(inactiveTransform.isActive).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle transform service errors gracefully', async () => {
      const transformId = 'error-test-rect-1';
      const transformUpdate: Partial<Transform> = {
        x: 100,
        y: 200,
        isActive: true
      };

      const { ref, set } = await import('firebase/database');
      vi.mocked(ref).mockReturnValue({ key: transformId });
      vi.mocked(set).mockRejectedValue(new Error('RTDB connection failed'));

      await expect(transformService.updateTransform(transformId, transformUpdate))
        .rejects.toThrow('Failed to update transform: RTDB connection failed');
    });
  });
});