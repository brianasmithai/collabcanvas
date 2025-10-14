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
    
    // Simulate Firebase data update
    const mockSnapshot = {
      val: () => ({
        'user1': {
          name: 'Alice',
          cursor: { x: 100, y: 200 },
          selectionIds: ['rect1'],
          updatedAt: 1234567890,
        },
        'user2': {
          name: 'Bob',
          cursor: { x: 300, y: 400 },
          selectionIds: [],
          updatedAt: 1234567891,
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
        cursor: { x: 100, y: 200 },
        selectionIds: ['rect1'],
        updatedAt: 1234567890,
      },
      'user2': {
        name: 'Bob',
        cursor: { x: 300, y: 400 },
        selectionIds: [],
        updatedAt: 1234567891,
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
    
    const mockSnapshot = {
      val: () => ({
        'user1': {
          // Missing name, cursor, selectionIds
          updatedAt: 1234567890,
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
        cursor: { x: 0, y: 0 },
        selectionIds: [],
        updatedAt: 1234567890,
      },
    });
  });

  it('should set up subscription on mount', () => {
    renderHook(() => usePresence());
    
    // Verify that onValue was called to set up the subscription
    expect(mockOnValue).toHaveBeenCalled();
    expect(mockRef).toHaveBeenCalledWith(rtdb, 'presence');
  });
});
