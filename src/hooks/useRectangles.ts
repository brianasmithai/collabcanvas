// Hook for managing rectangles with Firestore integration
import { useEffect, useState, useCallback } from 'react';
import { 
  subscribeToRectangles, 
  createRectangle, 
  updateRectangle, 
  deleteRectangle, 
  deleteRectangles 
} from '../services/rectangles';
import type { Rect } from '../types';

// Hook return type
export interface UseRectanglesReturn {
  rectangles: Rect[];
  loading: boolean;
  error: Error | null;
  createRect: (rect: Omit<Rect, 'id'>) => Promise<string>;
  updateRect: (id: string, updates: Partial<Omit<Rect, 'id'>>) => Promise<void>;
  deleteRect: (id: string) => Promise<void>;
  deleteRects: (ids: string[]) => Promise<void>;
}

/**
 * Hook to manage rectangles with real-time Firestore synchronization
 * @returns Object with rectangles array and CRUD operations
 */
export const useRectangles = (): UseRectanglesReturn => {
  const [rectangles, setRectangles] = useState<Rect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to rectangles collection
  useEffect(() => {
    console.log('🔗 useRectangles: Setting up Firestore subscription');
    
    const unsubscribe = subscribeToRectangles(
      (newRectangles) => {
        console.log('📦 useRectangles: Received rectangles:', newRectangles.length);
        setRectangles(newRectangles);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('❌ useRectangles: Error:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 useRectangles: Cleaning up subscription');
      unsubscribe();
    };
  }, []);

  // Create a new rectangle
  const createRect = useCallback(async (rect: Omit<Rect, 'id'>): Promise<string> => {
    try {
      console.log('➕ useRectangles: Creating rectangle:', rect);
      const id = await createRectangle(rect);
      console.log('✅ useRectangles: Created rectangle with ID:', id);
      return id;
    } catch (err) {
      console.error('❌ useRectangles: Failed to create rectangle:', err);
      throw err;
    }
  }, []);

  // Update an existing rectangle
  const updateRect = useCallback(async (
    id: string, 
    updates: Partial<Omit<Rect, 'id'>>
  ): Promise<void> => {
    try {
      console.log('✏️ useRectangles: Updating rectangle:', id, updates);
      await updateRectangle(id, updates);
      console.log('✅ useRectangles: Updated rectangle:', id);
    } catch (err) {
      console.error('❌ useRectangles: Failed to update rectangle:', err);
      throw err;
    }
  }, []);

  // Delete a single rectangle
  const deleteRect = useCallback(async (id: string): Promise<void> => {
    try {
      console.log('🗑️ useRectangles: Deleting rectangle:', id);
      await deleteRectangle(id);
      console.log('✅ useRectangles: Deleted rectangle:', id);
    } catch (err) {
      console.error('❌ useRectangles: Failed to delete rectangle:', err);
      throw err;
    }
  }, []);

  // Delete multiple rectangles
  const deleteRects = useCallback(async (ids: string[]): Promise<void> => {
    try {
      console.log('🗑️ useRectangles: Deleting rectangles:', ids);
      await deleteRectangles(ids);
      console.log('✅ useRectangles: Deleted rectangles:', ids);
    } catch (err) {
      console.error('❌ useRectangles: Failed to delete rectangles:', err);
      throw err;
    }
  }, []);

  return {
    rectangles,
    loading,
    error,
    createRect,
    updateRect,
    deleteRect,
    deleteRects,
  };
};
