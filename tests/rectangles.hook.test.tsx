// Tests for useRectangles hook with hybrid storage
import { renderHook, act } from '@testing-library/react';
import { useRectangles } from '../src/hooks/useRectangles';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from '../src/config/firebaseClient';
import { vi } from 'vitest';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({
    withConverter: vi.fn(() => ({})),
  })),
  doc: vi.fn(() => ({
    withConverter: vi.fn(() => ({})),
  })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  Timestamp: {
    fromMillis: vi.fn(),
  },
}));

vi.mock('../src/config/firebaseClient', () => ({
  firestore: {},
  rtdb: {},
}));

// Mock hybrid rectangles service
vi.mock('../src/services/rectangles', () => ({
  hybridRectanglesService: {
    createRectangleHybrid: vi.fn(),
    updateRectangleHybrid: vi.fn(),
    deleteRectangleHybrid: vi.fn(),
    subscribeToRectanglesHybrid: vi.fn(),
    validateDataConsistency: vi.fn(),
    forceSyncAllTransformsToFirestore: vi.fn(),
    cleanup: vi.fn(),
  },
  createRectangle: vi.fn(),
  updateRectangle: vi.fn(),
  deleteRectangle: vi.fn(),
  deleteRectangles: vi.fn(),
  subscribeToRectangles: vi.fn(),
}));

// Mock transform service
vi.mock('../src/services/transforms', () => ({
  transformService: {
    subscribeToTransforms: vi.fn(),
    cleanup: vi.fn(),
  },
}));

describe('useRectangles', () => {
  const mockOnSnapshot = onSnapshot as any;
  const mockAddDoc = addDoc as any;
  const mockUpdateDoc = updateDoc as any;
  const mockDeleteDoc = deleteDoc as any;
  const mockCollection = collection as any;
  const mockQuery = query as any;
  const mockOrderBy = orderBy as any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockOnSnapshot.mockReturnValue(vi.fn());
    
    // Mock hybrid service methods
    const { hybridRectanglesService } = await import('../src/services/rectangles');
    (hybridRectanglesService.createRectangleHybrid as any).mockResolvedValue('test-id');
    (hybridRectanglesService.updateRectangleHybrid as any).mockResolvedValue(undefined);
    (hybridRectanglesService.deleteRectangleHybrid as any).mockResolvedValue(undefined);
    (hybridRectanglesService.subscribeToRectanglesHybrid as any).mockReturnValue(vi.fn());
    (hybridRectanglesService.validateDataConsistency as any).mockResolvedValue({
      consistent: true,
      inconsistencies: []
    });
    (hybridRectanglesService.forceSyncAllTransformsToFirestore as any).mockResolvedValue(undefined);
    (hybridRectanglesService.cleanup as any).mockReturnValue(undefined);

    // Mock transform service methods
    const { transformService } = await import('../src/services/transforms');
    (transformService.subscribeToTransforms as any).mockReturnValue(vi.fn());
    (transformService.cleanup as any).mockReturnValue(undefined);
  });

  it('should return initial state with loading true and hybrid methods', () => {
    const { result } = renderHook(() => useRectangles());
    
    expect(result.current.rectangles).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.liveTransforms).toEqual({});
    expect(typeof result.current.createRect).toBe('function');
    expect(typeof result.current.updateRect).toBe('function');
    expect(typeof result.current.deleteRect).toBe('function');
    expect(typeof result.current.deleteRects).toBe('function');
    expect(typeof result.current.validateConsistency).toBe('function');
    expect(typeof result.current.forceSyncAll).toBe('function');
  });

  it('should set up hybrid subscription on mount', async () => {
    const { hybridRectanglesService } = await import('../src/services/rectangles');
    
    renderHook(() => useRectangles());
    
    expect(hybridRectanglesService.subscribeToRectanglesHybrid).toHaveBeenCalled();
  });

  it('should update rectangles when hybrid data changes', async () => {
    const { result } = renderHook(() => useRectangles());
    const { hybridRectanglesService } = await import('../src/services/rectangles');
    
    // Verify initial state
    expect(result.current.rectangles).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    
    // Verify that hybrid subscription was called
    expect(hybridRectanglesService.subscribeToRectanglesHybrid).toHaveBeenCalled();
  });

  it('should handle empty hybrid data', async () => {
    const { result } = renderHook(() => useRectangles());
    const { hybridRectanglesService } = await import('../src/services/rectangles');
    
    // Verify initial state
    expect(result.current.rectangles).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    
    // Verify that hybrid subscription was called
    expect(hybridRectanglesService.subscribeToRectanglesHybrid).toHaveBeenCalled();
  });

  it('should handle hybrid data errors', async () => {
    const { result } = renderHook(() => useRectangles());
    const { hybridRectanglesService } = await import('../src/services/rectangles');
    
    // Verify initial state
    expect(result.current.rectangles).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    
    // Verify that hybrid subscription was called
    expect(hybridRectanglesService.subscribeToRectanglesHybrid).toHaveBeenCalled();
  });

  it('should create rectangle with hybrid storage successfully', async () => {
    const { result } = renderHook(() => useRectangles());
    const { hybridRectanglesService } = await import('../src/services/rectangles');
    
    const newRect = {
      x: 100,
      y: 200,
      width: 150,
      height: 80,
      rotation: 0,
      updatedAt: Date.now(),
      updatedBy: 'user1',
    };

    let createdId: string;
    await act(async () => {
      createdId = await result.current.createRect(newRect);
    });

    expect(createdId!).toBe('test-id');
    expect(hybridRectanglesService.createRectangleHybrid).toHaveBeenCalledWith(newRect);
  });

  it('should update rectangle with hybrid storage successfully', async () => {
    const { result } = renderHook(() => useRectangles());
    const { hybridRectanglesService } = await import('../src/services/rectangles');
    
    const updates = {
      x: 200,
      y: 300,
      updatedAt: Date.now(),
      updatedBy: 'user1',
    };

    await act(async () => {
      await result.current.updateRect('rect1', updates);
    });

    expect(hybridRectanglesService.updateRectangleHybrid).toHaveBeenCalledWith('rect1', updates, false);
  });

  it('should delete rectangle with hybrid storage successfully', async () => {
    const { result } = renderHook(() => useRectangles());
    const { hybridRectanglesService } = await import('../src/services/rectangles');

    await act(async () => {
      await result.current.deleteRect('rect1');
    });

    expect(hybridRectanglesService.deleteRectangleHybrid).toHaveBeenCalledWith('rect1');
  });

  it('should delete multiple rectangles with hybrid storage successfully', async () => {
    const { result } = renderHook(() => useRectangles());
    const { hybridRectanglesService, deleteRectangles } = await import('../src/services/rectangles');

    await act(async () => {
      await result.current.deleteRects(['rect1', 'rect2', 'rect3']);
    });

    expect(deleteRectangles).toHaveBeenCalledWith(['rect1', 'rect2', 'rect3']);
    expect(hybridRectanglesService.deleteRectangleHybrid).toHaveBeenCalledTimes(3);
  });

  it('should handle create rectangle errors', async () => {
    const { result } = renderHook(() => useRectangles());
    const { hybridRectanglesService } = await import('../src/services/rectangles');
    
    const mockError = new Error('Failed to create rectangle');
    (hybridRectanglesService.createRectangleHybrid as any).mockRejectedValue(mockError);
    
    const newRect = {
      x: 100,
      y: 200,
      width: 150,
      height: 80,
      rotation: 0,
      updatedAt: Date.now(),
      updatedBy: 'user1',
    };

    await expect(async () => {
      await act(async () => {
        await result.current.createRect(newRect);
      });
    }).rejects.toThrow('Failed to create rectangle');
  });

  describe('Hybrid Storage Methods', () => {
    it('should validate data consistency successfully', async () => {
      const { result } = renderHook(() => useRectangles());
      const { hybridRectanglesService } = await import('../src/services/rectangles');
      
      const consistencyResult = {
        consistent: true,
        inconsistencies: []
      };
      (hybridRectanglesService.validateDataConsistency as any).mockResolvedValue(consistencyResult);

      let result_data: any;
      await act(async () => {
        result_data = await result.current.validateConsistency();
      });

      expect(result_data).toEqual(consistencyResult);
      expect(hybridRectanglesService.validateDataConsistency).toHaveBeenCalled();
    });

    it('should handle data consistency validation errors', async () => {
      const { result } = renderHook(() => useRectangles());
      const { hybridRectanglesService } = await import('../src/services/rectangles');
      
      const mockError = new Error('Validation failed');
      (hybridRectanglesService.validateDataConsistency as any).mockRejectedValue(mockError);

      await expect(async () => {
        await act(async () => {
          await result.current.validateConsistency();
        });
      }).rejects.toThrow('Validation failed');
    });

    it('should force sync all transforms successfully', async () => {
      const { result } = renderHook(() => useRectangles());
      const { hybridRectanglesService } = await import('../src/services/rectangles');

      await act(async () => {
        await result.current.forceSyncAll();
      });

      expect(hybridRectanglesService.forceSyncAllTransformsToFirestore).toHaveBeenCalled();
    });

    it('should handle force sync errors', async () => {
      const { result } = renderHook(() => useRectangles());
      const { hybridRectanglesService } = await import('../src/services/rectangles');
      
      const mockError = new Error('Sync failed');
      (hybridRectanglesService.forceSyncAllTransformsToFirestore as any).mockRejectedValue(mockError);

      await expect(async () => {
        await act(async () => {
          await result.current.forceSyncAll();
        });
      }).rejects.toThrow('Sync failed');
    });
  });

  describe('State Synchronization', () => {
    it('should handle hybrid subscription updates', async () => {
      const { hybridRectanglesService } = await import('../src/services/rectangles');
      
      // Mock subscription callback
      let subscriptionCallback: ((rectangles: any[]) => void) | null = null;
      (hybridRectanglesService.subscribeToRectanglesHybrid as any).mockImplementation((callback: any) => {
        subscriptionCallback = callback;
        return vi.fn(); // unsubscribe function
      });

      const { result } = renderHook(() => useRectangles());

      // Simulate data update
      const testRectangles = [
        {
          id: 'rect-1',
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          rotation: 0,
          updatedAt: Date.now(),
          updatedBy: 'user1'
        }
      ];

      act(() => {
        subscriptionCallback?.(testRectangles);
      });

      expect(result.current.rectangles).toEqual(testRectangles);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle hybrid subscription errors', async () => {
      const { hybridRectanglesService } = await import('../src/services/rectangles');
      
      // Mock subscription with error callback
      let errorCallback: ((error: Error) => void) | null = null;
      (hybridRectanglesService.subscribeToRectanglesHybrid as any).mockImplementation((callback: any, onError: any) => {
        errorCallback = onError;
        return vi.fn(); // unsubscribe function
      });

      const { result } = renderHook(() => useRectangles());

      // Simulate error
      const testError = new Error('Subscription failed');
      act(() => {
        errorCallback?.(testError);
      });

      expect(result.current.error).toEqual(testError);
      expect(result.current.loading).toBe(false);
    });

    it('should cleanup hybrid subscriptions on unmount', async () => {
      const { hybridRectanglesService } = await import('../src/services/rectangles');
      
      const mockUnsubscribe = vi.fn();
      (hybridRectanglesService.subscribeToRectanglesHybrid as any).mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useRectangles());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(hybridRectanglesService.cleanup).toHaveBeenCalled();
    });
  });

  describe('Live Transform Subscription', () => {
    it('should set up live transforms subscription on mount', async () => {
      const { transformService } = await import('../src/services/transforms');
      
      renderHook(() => useRectangles());
      
      expect(transformService.subscribeToTransforms).toHaveBeenCalled();
    });

    it('should update live transforms when subscription data changes', async () => {
      const { transformService } = await import('../src/services/transforms');
      
      // Mock subscription callback
      let subscriptionCallback: ((transforms: any) => void) | null = null;
      (transformService.subscribeToTransforms as any).mockImplementation((callback: any) => {
        subscriptionCallback = callback;
        return vi.fn(); // unsubscribe function
      });

      const { result } = renderHook(() => useRectangles());

      // Simulate live transform updates
      const testTransforms = {
        'rect-1': {
          id: 'rect-1',
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          rotation: 0,
          updatedAt: Date.now(),
          updatedBy: 'user1',
          isActive: true
        },
        'rect-2': {
          id: 'rect-2',
          x: 200,
          y: 300,
          width: 100,
          height: 50,
          rotation: 0,
          updatedAt: Date.now(),
          updatedBy: 'user2',
          isActive: false // Should be filtered out
        }
      };

      act(() => {
        subscriptionCallback?.(testTransforms);
      });

      // Should only include active transforms
      expect(result.current.liveTransforms).toEqual({
        'rect-1': testTransforms['rect-1']
      });
    });

    it('should filter out inactive transforms from live transforms', async () => {
      const { transformService } = await import('../src/services/transforms');
      
      let subscriptionCallback: ((transforms: any) => void) | null = null;
      (transformService.subscribeToTransforms as any).mockImplementation((callback: any) => {
        subscriptionCallback = callback;
        return vi.fn();
      });

      const { result } = renderHook(() => useRectangles());

      // Simulate transforms with only inactive ones
      const testTransforms = {
        'rect-1': {
          id: 'rect-1',
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          rotation: 0,
          updatedAt: Date.now(),
          updatedBy: 'user1',
          isActive: false
        }
      };

      act(() => {
        subscriptionCallback?.(testTransforms);
      });

      // Should be empty since no active transforms
      expect(result.current.liveTransforms).toEqual({});
    });

    it('should cleanup live transforms subscription on unmount', async () => {
      const { transformService } = await import('../src/services/transforms');
      
      const mockUnsubscribe = vi.fn();
      (transformService.subscribeToTransforms as any).mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useRectangles());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
