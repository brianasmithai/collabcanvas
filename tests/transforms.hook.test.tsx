// Tests for useTransforms hook
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTransforms, useTransform } from '../src/hooks/useTransforms';
import { transformService } from '../src/services/transforms';
import type { Transform } from '../src/types';

// Mock the transform service
vi.mock('../src/services/transforms', () => ({
  transformService: {
    subscribeToTransforms: vi.fn(),
    subscribeToTransform: vi.fn(),
    setTransform: vi.fn(),
    removeTransform: vi.fn(),
    createTransform: vi.fn(),
    updateTransform: vi.fn(),
    getTransform: vi.fn(),
    getSubscriptionCount: vi.fn()
  }
}));

describe('useTransforms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('subscription and state management', () => {
    it('should initialize with empty transforms and connected state', () => {
      const mockUnsubscribe = vi.fn();
      vi.mocked(transformService.subscribeToTransforms).mockReturnValue(mockUnsubscribe);

      const { result } = renderHook(() => useTransforms());

      expect(result.current.transforms).toEqual({});
      expect(result.current.isConnected).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should subscribe to transforms on mount', () => {
      const mockUnsubscribe = vi.fn();
      vi.mocked(transformService.subscribeToTransforms).mockReturnValue(mockUnsubscribe);

      renderHook(() => useTransforms());

      expect(transformService.subscribeToTransforms).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should cleanup subscription on unmount', () => {
      const mockUnsubscribe = vi.fn();
      vi.mocked(transformService.subscribeToTransforms).mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useTransforms());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle subscription errors', () => {
      const error = new Error('Subscription failed');
      vi.mocked(transformService.subscribeToTransforms).mockImplementation(() => {
        throw error;
      });

      const { result } = renderHook(() => useTransforms());

      expect(result.current.error).toBe('Subscription failed');
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('transform operations', () => {
    it('should set transform successfully', async () => {
      const mockTransform: Transform = {
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

      vi.mocked(transformService.setTransform).mockResolvedValue(undefined);
      vi.mocked(transformService.subscribeToTransforms).mockReturnValue(vi.fn());

      const { result } = renderHook(() => useTransforms());

      await act(async () => {
        await result.current.setTransform(mockTransform);
      });

      expect(transformService.setTransform).toHaveBeenCalledWith(mockTransform);
      expect(result.current.error).toBeNull();
    });

    it('should handle setTransform errors', async () => {
      const mockTransform: Transform = {
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

      const error = new Error('Set transform failed');
      vi.mocked(transformService.setTransform).mockRejectedValue(error);
      vi.mocked(transformService.subscribeToTransforms).mockReturnValue(vi.fn());

      const { result } = renderHook(() => useTransforms());

      await act(async () => {
        await expect(result.current.setTransform(mockTransform)).rejects.toThrow('Set transform failed');
      });

      expect(result.current.error).toBe('Set transform failed');
    });

    it('should remove transform successfully', async () => {
      vi.mocked(transformService.removeTransform).mockResolvedValue(undefined);
      vi.mocked(transformService.subscribeToTransforms).mockReturnValue(vi.fn());

      const { result } = renderHook(() => useTransforms());

      await act(async () => {
        await result.current.removeTransform('test-id');
      });

      expect(transformService.removeTransform).toHaveBeenCalledWith('test-id');
      expect(result.current.error).toBeNull();
    });

    it('should create transform successfully', async () => {
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

      vi.mocked(transformService.createTransform).mockResolvedValue('new-id');
      vi.mocked(transformService.subscribeToTransforms).mockReturnValue(vi.fn());

      const { result } = renderHook(() => useTransforms());

      let createdId: string;
      await act(async () => {
        createdId = await result.current.createTransform(transformData);
      });

      expect(transformService.createTransform).toHaveBeenCalledWith(transformData);
      expect(createdId!).toBe('new-id');
      expect(result.current.error).toBeNull();
    });

    it('should update transform successfully', async () => {
      const updates = { x: 150, y: 250 };
      vi.mocked(transformService.updateTransform).mockResolvedValue(undefined);
      vi.mocked(transformService.subscribeToTransforms).mockReturnValue(vi.fn());

      const { result } = renderHook(() => useTransforms());

      await act(async () => {
        await result.current.updateTransform('test-id', updates);
      });

      expect(transformService.updateTransform).toHaveBeenCalledWith('test-id', updates);
      expect(result.current.error).toBeNull();
    });

    it('should get transform successfully', async () => {
      const mockTransform: Transform = {
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

      vi.mocked(transformService.getTransform).mockResolvedValue(mockTransform);
      vi.mocked(transformService.subscribeToTransforms).mockReturnValue(vi.fn());

      const { result } = renderHook(() => useTransforms());

      let retrievedTransform: Transform | null;
      await act(async () => {
        retrievedTransform = await result.current.getTransform('test-id');
      });

      expect(transformService.getTransform).toHaveBeenCalledWith('test-id');
      expect(retrievedTransform!).toEqual(mockTransform);
      expect(result.current.error).toBeNull();
    });

    it('should get subscription count', () => {
      vi.mocked(transformService.getSubscriptionCount).mockReturnValue(3);
      vi.mocked(transformService.subscribeToTransforms).mockReturnValue(vi.fn());

      const { result } = renderHook(() => useTransforms());

      expect(result.current.getSubscriptionCount()).toBe(3);
    });
  });
});

describe('useTransform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with null transform and connected state', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(transformService.subscribeToTransform).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useTransform('test-id'));

    expect(result.current.transform).toBeNull();
    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should subscribe to specific transform on mount', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(transformService.subscribeToTransform).mockReturnValue(mockUnsubscribe);

    renderHook(() => useTransform('test-id'));

    expect(transformService.subscribeToTransform).toHaveBeenCalledWith('test-id', expect.any(Function));
  });

  it('should cleanup subscription on unmount', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(transformService.subscribeToTransform).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useTransform('test-id'));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle empty id', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(transformService.subscribeToTransform).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useTransform(''));

    expect(result.current.transform).toBeNull();
    expect(transformService.subscribeToTransform).not.toHaveBeenCalled();
  });

  it('should handle subscription errors', () => {
    const error = new Error('Subscription failed');
    vi.mocked(transformService.subscribeToTransform).mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useTransform('test-id'));

    expect(result.current.error).toBe('Subscription failed');
    expect(result.current.isConnected).toBe(false);
  });

  it('should update when transform changes', async () => {
    const mockTransform: Transform = {
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

    let callback: (transform: Transform | null) => void;
    vi.mocked(transformService.subscribeToTransform).mockImplementation((id, cb) => {
      callback = cb;
      return vi.fn();
    });

    const { result } = renderHook(() => useTransform('test-id'));

    act(() => {
      callback!(mockTransform);
    });

    expect(result.current.transform).toEqual(mockTransform);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle null transform updates', async () => {
    let callback: (transform: Transform | null) => void;
    vi.mocked(transformService.subscribeToTransform).mockImplementation((id, cb) => {
      callback = cb;
      return vi.fn();
    });

    const { result } = renderHook(() => useTransform('test-id'));

    act(() => {
      callback!(null);
    });

    expect(result.current.transform).toBeNull();
    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
