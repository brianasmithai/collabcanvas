// Tests for usePresence hook
import { renderHook, act } from '@testing-library/react';
import { usePresence } from '../src/hooks/usePresence';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../src/config/firebaseClient';
import { vi } from 'vitest';

// Mock Firebase Realtime Database
const mockOff = vi.fn();
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn(() => mockOff), // Return the cleanup function
  off: vi.fn(),
}));

vi.mock('../src/config/firebaseClient', () => ({
  rtdb: {},
}));

describe('usePresence', () => {
  const mockOnValue = onValue as any;
  const mockRef = ref as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty presence map initially', () => {
    const { result } = renderHook(() => usePresence());
    
    expect(result.current).toEqual({});
    expect(mockRef).toHaveBeenCalledWith(rtdb, 'presence');
    expect(mockOnValue).toHaveBeenCalled();
  });

  it('should update presence map when Firebase data changes', () => {
    const { result } = renderHook(() => usePresence());
    
        const currentTime = Date.now();
        const recentTime = currentTime - 30000; // 30 seconds ago (active, within 1 minute threshold)
    
    // Simulate Firebase data update
    const mockSnapshot = {
      val: () => ({
        'user1': {
          name: 'Alice',
          cursor: { x: 100, y: 200 },
          selectionIds: ['rect1'],
          updatedAt: recentTime,
        },
        'user2': {
          name: 'Bob',
          cursor: { x: 300, y: 400 },
          selectionIds: [],
          updatedAt: recentTime + 1000,
        },
      }),
    };

    // Get the callback that was passed to onValue
    const onValueCallback = mockOnValue.mock.calls[0][1];
    
    act(() => {
      onValueCallback(mockSnapshot);
    });

    expect(result.current).toEqual({
      'user1': {
        name: 'Alice',
        displayName: 'Alice',
        cursor: { x: 100, y: 200 },
        selectionIds: ['rect1'],
        updatedAt: recentTime,
      },
      'user2': {
        name: 'Bob',
        displayName: 'Bob',
        cursor: { x: 300, y: 400 },
        selectionIds: [],
        updatedAt: recentTime + 1000,
      },
    });
  });

  it('should handle null Firebase data', () => {
    const { result } = renderHook(() => usePresence());
    
    const mockSnapshot = {
      val: () => null,
    };

    const onValueCallback = mockOnValue.mock.calls[0][1];
    
    act(() => {
      onValueCallback(mockSnapshot);
    });

    expect(result.current).toEqual({});
  });

  it('should handle missing presence fields with defaults', () => {
    const { result } = renderHook(() => usePresence());
    
        const currentTime = Date.now();
        const recentTime = currentTime - 30000; // 30 seconds ago (active, within 1 minute threshold)
    
    const mockSnapshot = {
      val: () => ({
        'user1': {
          // Missing name, cursor, selectionIds
          updatedAt: recentTime,
        },
      }),
    };

    const onValueCallback = mockOnValue.mock.calls[0][1];
    
    act(() => {
      onValueCallback(mockSnapshot);
    });

    expect(result.current).toEqual({
      'user1': {
        name: 'Unknown User',
        displayName: 'Unknown User',
        cursor: { x: 0, y: 0 },
        selectionIds: [],
        updatedAt: recentTime,
      },
    });
  });

  it('should set up subscription on mount', () => {
    renderHook(() => usePresence());
    
    // Verify that onValue was called to set up the subscription
    expect(mockOnValue).toHaveBeenCalled();
    expect(mockRef).toHaveBeenCalledWith(rtdb, 'presence');
  });

  it('should filter out inactive users based on timeout', () => {
    const { result } = renderHook(() => usePresence());
    
    const currentTime = Date.now();
    const activeTime = currentTime - 30000; // 30 seconds ago (active, within 1 minute threshold)
    const inactiveTime = currentTime - 90000; // 90 seconds ago (inactive, beyond 1 minute threshold)
    
    const mockSnapshot = {
      val: () => ({
        'active-user': {
          name: 'Active User',
          cursor: { x: 100, y: 200 },
          selectionIds: [],
          updatedAt: activeTime,
        },
        'inactive-user': {
          name: 'Inactive User',
          cursor: { x: 300, y: 400 },
          selectionIds: [],
          updatedAt: inactiveTime,
        },
      }),
    };

    const onValueCallback = mockOnValue.mock.calls[0][1];
    
    act(() => {
      onValueCallback(mockSnapshot);
    });

    // Only active user should be included
    expect(result.current).toHaveProperty('active-user');
    expect(result.current).not.toHaveProperty('inactive-user');
    expect(Object.keys(result.current)).toHaveLength(1);
  });

  it('should handle users without updatedAt field', () => {
    const { result } = renderHook(() => usePresence());
    
    const mockSnapshot = {
      val: () => ({
        'user-without-timestamp': {
          name: 'User Without Timestamp',
          cursor: { x: 100, y: 200 },
          selectionIds: [],
          // No updatedAt field
        },
      }),
    };

    const onValueCallback = mockOnValue.mock.calls[0][1];
    
    act(() => {
      onValueCallback(mockSnapshot);
    });

    // User without timestamp should be included (treated as current time)
    expect(result.current).toHaveProperty('user-without-timestamp');
    expect(result.current['user-without-timestamp'].updatedAt).toBeGreaterThan(0);
  });

  it('should handle error in Firebase subscription', () => {
    const { result } = renderHook(() => usePresence());
    
    const onValueCallback = mockOnValue.mock.calls[0][1];
    const errorCallback = mockOnValue.mock.calls[0][2];
    
    act(() => {
      errorCallback(new Error('Firebase connection error'));
    });

    // Should return empty map on error
    expect(result.current).toEqual({});
  });
});
