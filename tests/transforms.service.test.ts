// Tests for TransformService
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TransformService } from '../src/services/transforms';
import type { Transform } from '../src/types';
import * as firebaseDatabase from 'firebase/database';

// Mock Firebase Realtime Database
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
  push: vi.fn(),
  get: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp')
}));

vi.mock('../src/config/firebaseClient', () => ({
  rtdb: {}
}));

describe('TransformService', () => {
  let transformService: TransformService;
  let mockTransform: Transform;

  beforeEach(() => {
    transformService = new TransformService();
    mockTransform = {
      id: 'test-id',
      x: 100,
      y: 200,
      width: 50,
      height: 75,
      rotation: 0,
      updatedAt: Date.now(),
      updatedBy: 'user-123',
      isActive: true
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    transformService.cleanup();
  });

  describe('setTransform', () => {
    it('should set a transform successfully', async () => {
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined);
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      await transformService.setTransform(mockTransform);

      expect(firebaseDatabase.ref).toHaveBeenCalledWith({}, 'transforms/test-id');
      expect(firebaseDatabase.set).toHaveBeenCalledWith({}, {
        ...mockTransform,
        updatedAt: expect.any(Number)
      });
    });

    it('should handle errors when setting transform', async () => {
      const error = new Error('Database error');
      vi.mocked(firebaseDatabase.set).mockRejectedValue(error);
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      await expect(transformService.setTransform(mockTransform)).rejects.toThrow('Failed to set transform: Database error');
    });
  });

  describe('getTransform', () => {
    it('should get a transform successfully', async () => {
      const mockSnapshot = {
        val: () => mockTransform
      };

      vi.mocked(firebaseDatabase.get).mockResolvedValue(mockSnapshot);
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      const result = await transformService.getTransform('test-id');

      expect(firebaseDatabase.ref).toHaveBeenCalledWith({}, 'transforms/test-id');
      expect(firebaseDatabase.get).toHaveBeenCalledWith({});
      expect(result).toEqual({ ...mockTransform, id: 'test-id' });
    });

    it('should return null for non-existent transform', async () => {
      const mockSnapshot = {
        val: () => null
      };

      vi.mocked(firebaseDatabase.get).mockResolvedValue(mockSnapshot);
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      const result = await transformService.getTransform('non-existent');

      expect(result).toBeNull();
    });

    it('should handle errors when getting transform', async () => {
      const error = new Error('Database error');
      vi.mocked(firebaseDatabase.get).mockRejectedValue(error);
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      await expect(transformService.getTransform('test-id')).rejects.toThrow('Failed to get transform: Database error');
    });
  });

  describe('removeTransform', () => {
    it('should remove a transform successfully', async () => {
      vi.mocked(firebaseDatabase.remove).mockResolvedValue(undefined);
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      await transformService.removeTransform('test-id');

      expect(firebaseDatabase.ref).toHaveBeenCalledWith({}, 'transforms/test-id');
      expect(firebaseDatabase.remove).toHaveBeenCalledWith({});
    });

    it('should handle errors when removing transform', async () => {
      const error = new Error('Database error');
      vi.mocked(firebaseDatabase.remove).mockRejectedValue(error);
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      await expect(transformService.removeTransform('test-id')).rejects.toThrow('Failed to remove transform: Database error');
    });
  });

  describe('subscribeToTransforms', () => {
    it('should subscribe to transforms and call callback', () => {
      const mockCallback = vi.fn();
      const mockSnapshot = {
        val: () => ({
          'test-id': mockTransform
        })
      };

      vi.mocked(firebaseDatabase.onValue).mockImplementation((ref, callback) => {
        callback(mockSnapshot);
        return () => {}; // unsubscribe function
      });
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      const unsubscribe = transformService.subscribeToTransforms(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        'test-id': { ...mockTransform, id: 'test-id' }
      });
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle empty transforms data', () => {
      const mockCallback = vi.fn();
      const mockSnapshot = {
        val: () => null
      };

      vi.mocked(firebaseDatabase.onValue).mockImplementation((ref, callback) => {
        callback(mockSnapshot);
        return () => {}; // unsubscribe function
      });
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      transformService.subscribeToTransforms(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({});
    });

    it('should handle subscription errors', () => {
      const mockCallback = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(firebaseDatabase.onValue).mockImplementation((ref, callback, errorCallback) => {
        errorCallback(new Error('Subscription error'));
        return () => {}; // unsubscribe function
      });
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      transformService.subscribeToTransforms(mockCallback);

      expect(consoleSpy).toHaveBeenCalledWith('❌ TransformService: Error in transform subscription', expect.any(String), ':', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('createTransform', () => {
    it('should create a new transform with auto-generated ID', async () => {
      const mockNewRef = { key: 'new-transform-id' };
      vi.mocked(firebaseDatabase.push).mockReturnValue(mockNewRef);
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined);
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      const transformData = {
        x: 100,
        y: 200,
        width: 50,
        height: 75,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: 'user-123',
        isActive: true
      };

      const result = await transformService.createTransform(transformData);

      expect(result).toBe('new-transform-id');
      expect(firebaseDatabase.set).toHaveBeenCalledWith(mockNewRef, {
        ...transformData,
        id: 'new-transform-id',
        updatedAt: expect.any(Number)
      });
    });

    it('should handle error when push fails to generate key', async () => {
      const mockNewRef = { key: null };
      vi.mocked(firebaseDatabase.push).mockReturnValue(mockNewRef);
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      const transformData = {
        x: 100,
        y: 200,
        width: 50,
        height: 75,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: 'user-123',
        isActive: true
      };

      await expect(transformService.createTransform(transformData)).rejects.toThrow('Failed to generate transform ID');
    });
  });

  describe('updateTransform', () => {
    it('should update transform with conflict resolution', async () => {
      const currentTransform = { ...mockTransform, updatedAt: 1000 };
      const updates = { x: 150, updatedAt: 2000 };

      // Mock getTransform to return current transform
      vi.spyOn(transformService, 'getTransform').mockResolvedValue(currentTransform);
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined);
      vi.mocked(firebaseDatabase.ref).mockReturnValue({});

      await transformService.updateTransform('test-id', updates);

      expect(firebaseDatabase.set).toHaveBeenCalledWith({}, {
        ...updates,
        updatedAt: expect.any(Number)
      });
    });

    it('should ignore older updates (LWW conflict resolution)', async () => {
      const currentTransform = { ...mockTransform, updatedAt: 2000 };
      const updates = { x: 150, updatedAt: 1000 }; // Older timestamp

      // Mock getTransform to return current transform
      vi.spyOn(transformService, 'getTransform').mockResolvedValue(currentTransform);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await transformService.updateTransform('test-id', updates);

      expect(consoleSpy).toHaveBeenCalledWith('Ignoring older update for transform test-id');
      expect(firebaseDatabase.set).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should cleanup all subscriptions', () => {
      const mockUnsubscribe1 = vi.fn();
      const mockUnsubscribe2 = vi.fn();

      // Add mock subscriptions
      transformService['subscriptions'].set('sub1', mockUnsubscribe1);
      transformService['subscriptions'].set('sub2', mockUnsubscribe2);

      transformService.cleanup();

      expect(mockUnsubscribe1).toHaveBeenCalled();
      expect(mockUnsubscribe2).toHaveBeenCalled();
      expect(transformService.getSubscriptionCount()).toBe(0);
    });
  });

  describe('getSubscriptionCount', () => {
    it('should return correct subscription count', () => {
      expect(transformService.getSubscriptionCount()).toBe(0);

      transformService['subscriptions'].set('sub1', vi.fn());
      transformService['subscriptions'].set('sub2', vi.fn());

      expect(transformService.getSubscriptionCount()).toBe(2);
    });
  });
});