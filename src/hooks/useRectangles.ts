// Hook for managing rectangles with hybrid Firestore + RTDB integration
import { useEffect, useState, useCallback } from 'react';
import { 
  deleteRectangles,
  hybridRectanglesService
} from '../services/rectangles';
import { transformService } from '../services/transforms';
import type { Rect, Transform } from '../types';

// Hook return type
export interface UseRectanglesReturn {
  rectangles: Rect[];
  loading: boolean;
  error: Error | null;
  createRect: (rect: Omit<Rect, 'id'>) => Promise<string>;
  updateRect: (id: string, updates: Partial<Omit<Rect, 'id'>>, isTransformComplete?: boolean) => Promise<void>;
  deleteRect: (id: string) => Promise<void>;
  deleteRects: (ids: string[]) => Promise<void>;
  // Hybrid storage methods
  validateConsistency: () => Promise<{
    consistent: boolean;
    inconsistencies: Array<{
      id: string;
      issue: string;
      firestoreData?: Partial<Rect>;
      rtdbData?: any;
    }>;
  }>;
  forceSyncAll: () => Promise<void>;
  // Live transform data for real-time visual updates
  liveTransforms: Record<string, Transform>;
}

/**
 * Hook to manage rectangles with hybrid Firestore + RTDB synchronization
 * @returns Object with rectangles array and CRUD operations
 */
export const useRectangles = (): UseRectanglesReturn => {
  const [rectangles, setRectangles] = useState<Rect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [liveTransforms, setLiveTransforms] = useState<Record<string, Transform>>({});

  // Subscribe to rectangles with hybrid storage (Firestore + RTDB)
  useEffect(() => {
    console.log('🔗 useRectangles: Setting up hybrid subscription (Firestore + RTDB)');
    
    const unsubscribe = hybridRectanglesService.subscribeToRectanglesHybrid(
      (newRectangles) => {
        console.log('📦 useRectangles: Received rectangles with real-time transforms:', newRectangles.length);
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
      console.log('🔌 useRectangles: Cleaning up hybrid subscription');
      unsubscribe();
      hybridRectanglesService.cleanup();
    };
  }, []);

  // Subscribe to live transforms (active transforms only) for real-time visual updates
  useEffect(() => {
    console.log('🔗 useRectangles: Setting up live transforms subscription');
    
    const unsubscribe = transformService.subscribeToTransforms((transforms) => {
      console.log('📡 useRectangles: Raw transforms received:', transforms);
      
      // Filter to only active transforms for live visual updates
      const activeTransforms = Object.fromEntries(
        Object.entries(transforms).filter(([_, transform]) => transform.isActive)
      );
      console.log('⚡ useRectangles: Received live transforms:', Object.keys(activeTransforms).length, 'active', activeTransforms);
      setLiveTransforms(activeTransforms);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 useRectangles: Cleaning up live transforms subscription');
      unsubscribe();
    };
  }, []);

  // Create a new rectangle with hybrid storage
  const createRect = useCallback(async (rect: Omit<Rect, 'id'>): Promise<string> => {
    try {
      console.log('➕ useRectangles: Creating rectangle with hybrid storage:', rect);
      const id = await hybridRectanglesService.createRectangleHybrid(rect);
      console.log('✅ useRectangles: Created rectangle with hybrid storage, ID:', id);
      return id;
    } catch (err) {
      console.error('❌ useRectangles: Failed to create rectangle:', err);
      throw err;
    }
  }, []);

  // Update an existing rectangle with hybrid storage
  const updateRect = useCallback(async (
    id: string, 
    updates: Partial<Omit<Rect, 'id'>>,
    isTransformComplete: boolean = false,
    isSelected: boolean = false
  ): Promise<void> => {
    try {
      console.log('✏️ useRectangles: Updating rectangle with hybrid storage:', id, updates, 'complete:', isTransformComplete, 'selected:', isSelected);
      await hybridRectanglesService.updateRectangleHybrid(id, updates, isTransformComplete, isSelected);
      console.log('✅ useRectangles: Updated rectangle with hybrid storage:', id);
    } catch (err) {
      console.error('❌ useRectangles: Failed to update rectangle:', err);
      throw err;
    }
  }, []);

  // Delete a single rectangle with hybrid storage
  const deleteRect = useCallback(async (id: string): Promise<void> => {
    try {
      console.log('🗑️ useRectangles: Deleting rectangle with hybrid storage:', id);
      await hybridRectanglesService.deleteRectangleHybrid(id);
      console.log('✅ useRectangles: Deleted rectangle with hybrid storage:', id);
    } catch (err) {
      console.error('❌ useRectangles: Failed to delete rectangle:', err);
      throw err;
    }
  }, []);

  // Delete multiple rectangles with hybrid storage
  const deleteRects = useCallback(async (ids: string[]): Promise<void> => {
    try {
      console.log('🗑️ useRectangles: Deleting rectangles with hybrid storage:', ids);
      // Delete from both Firestore and RTDB
      await Promise.all([
        deleteRectangles(ids),
        ...ids.map(id => hybridRectanglesService.deleteRectangleHybrid(id))
      ]);
      console.log('✅ useRectangles: Deleted rectangles with hybrid storage:', ids);
    } catch (err) {
      console.error('❌ useRectangles: Failed to delete rectangles:', err);
      throw err;
    }
  }, []);

  // Validate data consistency between RTDB and Firestore
  const validateConsistency = useCallback(async () => {
    try {
      console.log('🔍 useRectangles: Validating data consistency');
      const result = await hybridRectanglesService.validateDataConsistency();
      console.log('✅ useRectangles: Data consistency validation complete:', result.consistent);
      return result;
    } catch (err) {
      console.error('❌ useRectangles: Failed to validate consistency:', err);
      throw err;
    }
  }, []);

  // Force sync all transforms to Firestore
  const forceSyncAll = useCallback(async () => {
    try {
      console.log('🔄 useRectangles: Force syncing all transforms to Firestore');
      await hybridRectanglesService.forceSyncAllTransformsToFirestore();
      console.log('✅ useRectangles: Force sync complete');
    } catch (err) {
      console.error('❌ useRectangles: Failed to force sync:', err);
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
    validateConsistency,
    forceSyncAll,
    liveTransforms,
  };
};
