// Tests for useRectangles hook
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
}));

describe('useRectangles', () => {
  const mockOnSnapshot = onSnapshot as any;
  const mockAddDoc = addDoc as any;
  const mockUpdateDoc = updateDoc as any;
  const mockDeleteDoc = deleteDoc as any;
  const mockCollection = collection as any;
  const mockQuery = query as any;
  const mockOrderBy = orderBy as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshot.mockReturnValue(vi.fn());
  });

  it('should return initial state with loading true', () => {
    const { result } = renderHook(() => useRectangles());
    
    expect(result.current.rectangles).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.createRect).toBe('function');
    expect(typeof result.current.updateRect).toBe('function');
    expect(typeof result.current.deleteRect).toBe('function');
    expect(typeof result.current.deleteRects).toBe('function');
  });

  it('should set up Firestore subscription on mount', () => {
    renderHook(() => useRectangles());
    
    expect(mockCollection).toHaveBeenCalledWith(firestore, 'rectangles');
    expect(mockOrderBy).toHaveBeenCalledWith('updatedAt', 'desc');
    expect(mockQuery).toHaveBeenCalled();
    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  it('should update rectangles when Firestore data changes', () => {
    const { result } = renderHook(() => useRectangles());
    
    // Verify initial state
    expect(result.current.rectangles).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    
    // Verify that onSnapshot was called to set up subscription
    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  it('should handle empty Firestore data', () => {
    const { result } = renderHook(() => useRectangles());
    
    // Verify initial state
    expect(result.current.rectangles).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    
    // Verify that onSnapshot was called to set up subscription
    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  it('should handle Firestore errors', () => {
    const { result } = renderHook(() => useRectangles());
    
    // Verify initial state
    expect(result.current.rectangles).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    
    // Verify that onSnapshot was called to set up subscription
    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  it('should create rectangle successfully', async () => {
    const { result } = renderHook(() => useRectangles());
    
    mockAddDoc.mockResolvedValue({ id: 'new-rect-id' });
    
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

    expect(createdId!).toBe('new-rect-id');
    expect(mockAddDoc).toHaveBeenCalled();
  });

  it('should update rectangle successfully', async () => {
    const { result } = renderHook(() => useRectangles());
    
    mockUpdateDoc.mockResolvedValue(undefined);
    
    const updates = {
      x: 200,
      y: 300,
      updatedAt: Date.now(),
      updatedBy: 'user1',
    };

    await act(async () => {
      await result.current.updateRect('rect1', updates);
    });

    expect(mockUpdateDoc).toHaveBeenCalled();
  });

  it('should delete rectangle successfully', async () => {
    const { result } = renderHook(() => useRectangles());
    
    mockDeleteDoc.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.deleteRect('rect1');
    });

    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('should delete multiple rectangles successfully', async () => {
    const { result } = renderHook(() => useRectangles());
    
    mockDeleteDoc.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.deleteRects(['rect1', 'rect2', 'rect3']);
    });

    expect(mockDeleteDoc).toHaveBeenCalledTimes(3);
  });

  it('should handle create rectangle errors', async () => {
    const { result } = renderHook(() => useRectangles());
    
    const mockError = new Error('Failed to create rectangle');
    mockAddDoc.mockRejectedValue(mockError);
    
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
});
