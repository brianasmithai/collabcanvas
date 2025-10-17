// Performance tests for live transform synchronization
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Transform } from '../src/types';

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

// Import after mocks
import { transformService } from '../src/services/transforms';

describe('Live Transform Performance', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup mocks
    const { ref, set, get, onValue } = await import('firebase/database');
    vi.mocked(ref).mockReturnValue({ key: 'test-key' });
    vi.mocked(set).mockResolvedValue(undefined);
    vi.mocked(get).mockResolvedValue({ val: () => null });
    vi.mocked(onValue).mockReturnValue(vi.fn());
  });

  afterEach(() => {
    // Only cleanup if there are actual subscriptions
    if (transformService.getSubscriptionCount() > 0) {
      transformService.cleanup();
    }
  });

  describe('Sub-100ms Latency Target', () => {
    it('should achieve sub-100ms latency for active transform updates', async () => {
      const transformId = 'perf-test-rect-1';
      const activeTransform: Partial<Transform> = {
        x: 100,
        y: 200,
        isActive: true,
        updatedBy: 'user-1'
      };

      const { ref, set, get } = await import('firebase/database');
      vi.mocked(ref).mockReturnValue({ key: transformId });
      vi.mocked(set).mockImplementation(() => Promise.resolve());

      const startTime = performance.now();
      
      await transformService.updateTransform(transformId, activeTransform);
      
      const endTime = performance.now();
      const latency = endTime - startTime;

      // Should complete within 100ms (allowing some buffer for test environment)
      expect(latency).toBeLessThan(150); // 150ms buffer for test environment
      
      // Verify optimization: should not call getTransform for active transforms
      expect(get).not.toHaveBeenCalled();
    });

    it('should handle multiple rapid active transform updates efficiently', async () => {
      const transformId = 'perf-test-rect-1';
      const updates: Partial<Transform>[] = [];
      
      // Generate 10 rapid updates
      for (let i = 0; i < 10; i++) {
        updates.push({
          x: 100 + i * 10,
          y: 200 + i * 5,
          isActive: true,
          updatedBy: 'user-1'
        });
      }

      const { ref, set, get } = await import('firebase/database');
      vi.mocked(ref).mockReturnValue({ key: transformId });
      vi.mocked(set).mockImplementation(() => Promise.resolve());

      const startTime = performance.now();
      
      // Execute all updates in parallel
      await Promise.all(
        updates.map(update => transformService.updateTransform(transformId, update))
      );
      
      const endTime = performance.now();
      const totalLatency = endTime - startTime;
      const avgLatency = totalLatency / updates.length;

      // Average latency should be sub-100ms
      expect(avgLatency).toBeLessThan(100);
      
      // Should have made 10 set calls (no get calls for active transforms)
      expect(set).toHaveBeenCalledTimes(10);
      expect(get).not.toHaveBeenCalled();
    });

    it('should maintain performance with multiple concurrent users', async () => {
      const transformIds = ['rect-1', 'rect-2', 'rect-3', 'rect-4', 'rect-5'];
      const userIds = ['user-1', 'user-2', 'user-3'];
      
      const updates: Array<{ id: string; update: Partial<Transform> }> = [];
      
      // Generate updates from multiple users on multiple rectangles
      transformIds.forEach(rectId => {
        userIds.forEach(userId => {
          updates.push({
            id: rectId,
            update: {
              x: Math.random() * 1000,
              y: Math.random() * 1000,
              isActive: true,
              updatedBy: userId
            }
          });
        });
      });

      const { ref, set, get } = await import('firebase/database');
      vi.mocked(ref).mockImplementation((path) => ({ key: typeof path === 'string' ? path.split('/').pop() : 'mock-key' }));
      vi.mocked(set).mockImplementation(() => Promise.resolve());

      const startTime = performance.now();
      
      // Execute all updates in parallel
      await Promise.all(
        updates.map(({ id, update }) => transformService.updateTransform(id, update))
      );
      
      const endTime = performance.now();
      const totalLatency = endTime - startTime;
      const avgLatency = totalLatency / updates.length;

      // Should maintain sub-100ms average latency even with multiple users
      expect(avgLatency).toBeLessThan(100);
      
      // Should have made one set call per update
      expect(set).toHaveBeenCalledTimes(updates.length);
      expect(get).not.toHaveBeenCalled();
    });
  });

  describe('Subscription Performance', () => {
    it('should handle high-frequency transform updates without performance degradation', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      // Simulate high-frequency updates (60 FPS = ~16.67ms between updates)
      const updateCount = 60; // 1 second of updates
      const startTime = performance.now();
      
      for (let i = 0; i < updateCount; i++) {
        const mockSnapshot = {
          val: () => ({
            'rect-1': {
              id: 'rect-1',
              x: 100 + i,
              y: 200 + i,
              width: 100,
              height: 50,
              rotation: 0,
              updatedAt: Date.now() + i,
              updatedBy: 'user-1',
              isActive: true
            }
          })
        };

        // Simulate the filtering logic that would happen in the subscription
        const data = mockSnapshot.val() || {};
        const transforms: Record<string, Transform> = {};
        Object.keys(data).forEach(id => {
          transforms[id] = { ...data[id], id };
        });
        
        // Filter to only active transforms
        const activeTransforms = Object.fromEntries(
          Object.entries(transforms).filter(([_, t]) => t.isActive)
        );
        
        mockCallback(activeTransforms);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerUpdate = totalTime / updateCount;

      // Should handle 60 updates efficiently
      expect(avgTimePerUpdate).toBeLessThan(5); // 5ms per update max
      expect(mockCallback).toHaveBeenCalledTimes(updateCount);
    });

    it('should filter active transforms efficiently', () => {
      const mockCallback = vi.fn();
      
      // Create a large dataset with mixed active/inactive transforms
      const transformCount = 1000;
      const mockData: any = {};
      
      for (let i = 0; i < transformCount; i++) {
        mockData[`rect-${i}`] = {
          id: `rect-${i}`,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          width: 100,
          height: 50,
          rotation: 0,
          updatedAt: Date.now(),
          updatedBy: `user-${i % 5}`,
          isActive: i % 2 === 0 // Half active, half inactive
        };
      }

      const startTime = performance.now();
      
      // Simulate the filtering logic
      const transforms: Record<string, Transform> = {};
      Object.keys(mockData).forEach(id => {
        transforms[id] = { ...mockData[id], id };
      });
      
      const activeTransforms = Object.fromEntries(
        Object.entries(transforms).filter(([_, t]) => t.isActive)
      );
      
      mockCallback(activeTransforms);
      
      const endTime = performance.now();
      const filterTime = endTime - startTime;

      // Should filter 1000 transforms quickly
      expect(filterTime).toBeLessThan(10); // 10ms max for filtering
      
      // Should only include active transforms (500 out of 1000)
      const callbackArgs = mockCallback.mock.calls[0][0];
      const activeTransformCount = Object.keys(callbackArgs).length;
      expect(activeTransformCount).toBe(500);
    });
  });

  describe('Memory Management', () => {
    it('should not accumulate memory with repeated subscriptions', async () => {
      const subscriptionCount = 100;
      const mockUnsubscribe = vi.fn();
      
      const { onValue, ref } = await import('firebase/database');
      vi.mocked(onValue).mockReturnValue(mockUnsubscribe);
      vi.mocked(ref).mockReturnValue({});

      // Create and cleanup many subscriptions
      for (let i = 0; i < subscriptionCount; i++) {
        const unsubscribe = transformService.subscribeToTransforms(vi.fn());
        unsubscribe();
      }

      // Should have created and cleaned up all subscriptions
      expect(onValue).toHaveBeenCalledTimes(subscriptionCount);
      expect(mockUnsubscribe).toHaveBeenCalledTimes(subscriptionCount);
    });

    it('should cleanup subscriptions efficiently', async () => {
      const subscriptionCount = 50;
      const mockUnsubscribe = vi.fn();
      
      const { onValue, ref } = await import('firebase/database');
      vi.mocked(onValue).mockReturnValue(mockUnsubscribe);
      vi.mocked(ref).mockReturnValue({});

      // Create multiple subscriptions
      const unsubscribes: (() => void)[] = [];
      for (let i = 0; i < subscriptionCount; i++) {
        unsubscribes.push(transformService.subscribeToTransforms(vi.fn()));
      }

      const startTime = performance.now();
      transformService.cleanup();
      const endTime = performance.now();
      const cleanupTime = endTime - startTime;

      // Should cleanup all subscriptions quickly
      expect(cleanupTime).toBeLessThan(50); // 50ms max for cleanup
      expect(mockUnsubscribe).toHaveBeenCalledTimes(subscriptionCount);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors without significant performance impact', async () => {
      const transformId = 'error-test-rect-1';
      const activeTransform: Partial<Transform> = {
        x: 100,
        y: 200,
        isActive: true,
        updatedBy: 'user-1'
      };

      const { ref, set } = await import('firebase/database');
      vi.mocked(ref).mockReturnValue({ key: transformId });
      
      // Mock alternating success/failure
      let callCount = 0;
      vi.mocked(set).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          return Promise.reject(new Error('Simulated error'));
        }
        return Promise.resolve();
      });

      const startTime = performance.now();
      
      // Attempt 10 updates (5 will fail, 5 will succeed)
      const results = await Promise.allSettled(
        Array(10).fill(null).map(() => 
          transformService.updateTransform(transformId, activeTransform)
        )
      );
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerUpdate = totalTime / 10;

      // Should handle errors without significant performance impact
      expect(avgTimePerUpdate).toBeLessThan(100);
      
      // Should have 5 successful and 5 failed updates
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      expect(successful).toBe(5);
      expect(failed).toBe(5);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should maintain performance during rapid drag operations', async () => {
      const transformId = 'drag-test-rect-1';
      const dragUpdates: Partial<Transform>[] = [];
      
      // Simulate 1 second of drag at 60 FPS
      for (let i = 0; i < 60; i++) {
        dragUpdates.push({
          x: 100 + i * 2, // Moving 2 pixels per frame
          y: 200 + i * 1, // Moving 1 pixel per frame
          isActive: true,
          updatedBy: 'user-1'
        });
      }

      const { ref, set, get } = await import('firebase/database');
      vi.mocked(ref).mockReturnValue({ key: transformId });
      vi.mocked(set).mockImplementation(() => Promise.resolve());

      const startTime = performance.now();
      
      // Simulate rapid sequential updates (not parallel, like real drag)
      for (const update of dragUpdates) {
        await transformService.updateTransform(transformId, update);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgLatency = totalTime / dragUpdates.length;

      // Should maintain sub-100ms average latency during rapid drag
      expect(avgLatency).toBeLessThan(100);
      expect(set).toHaveBeenCalledTimes(60);
      expect(get).not.toHaveBeenCalled();
    });

    it('should handle mixed active/inactive transform scenarios efficiently', async () => {
      const transformIds = ['rect-1', 'rect-2', 'rect-3'];
      const updates: Array<{ id: string; update: Partial<Transform> }> = [];
      
      // Mix of active and inactive updates
      transformIds.forEach((id, index) => {
        updates.push({
          id,
          update: {
            x: 100 + index * 100,
            y: 200 + index * 100,
            isActive: true,
            updatedBy: 'user-1'
          }
        });
        
        // Add inactive update
        updates.push({
          id,
          update: {
            x: 100 + index * 100,
            y: 200 + index * 100,
            isActive: false,
            updatedBy: 'user-1',
            updatedAt: Date.now()
          }
        });
      });

      const { ref, set, get } = await import('firebase/database');
      vi.mocked(ref).mockImplementation((path) => ({ key: typeof path === 'string' ? path.split('/').pop() : 'mock-key' }));
      vi.mocked(set).mockImplementation(() => Promise.resolve());
      vi.mocked(get).mockResolvedValue({ val: () => null }); // No existing transform

      const startTime = performance.now();
      
      await Promise.all(
        updates.map(({ id, update }) => transformService.updateTransform(id, update))
      );
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgLatency = totalTime / updates.length;

      // Should handle mixed scenarios efficiently
      expect(avgLatency).toBeLessThan(100);
      
      // Active updates should not call getTransform, inactive ones should
      expect(set).toHaveBeenCalledTimes(updates.length);
      expect(get).toHaveBeenCalledTimes(3); // Only for inactive updates
    });
  });
});