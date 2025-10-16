// Hybrid rectangles service for Firestore persistence and RTDB real-time transforms
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebaseClient';
import { transformService } from './transforms';
import type { Rect, Transform } from '../types';

// Firestore collection reference
const RECTANGLES_COLLECTION = 'rectangles';

// Firestore converter for Rect documents
export const rectConverter = {
  toFirestore: (rect: Omit<Rect, 'id'>) => ({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    rotation: rect.rotation,
    updatedAt: serverTimestamp(),
    updatedBy: rect.updatedBy,
  }),
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      rotation: data.rotation,
      updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
      updatedBy: data.updatedBy,
    } as Rect;
  },
};

/**
 * Create a new rectangle in Firestore
 * @param rect - Rectangle data (without id)
 * @returns Promise with the created rectangle ID
 */
export const createRectangle = async (rect: Omit<Rect, 'id'>): Promise<string> => {
  const docRef = await addDoc(
    collection(firestore, RECTANGLES_COLLECTION).withConverter(rectConverter),
    rect
  );
  return docRef.id;
};

/**
 * Update an existing rectangle in Firestore
 * @param id - Rectangle ID
 * @param updates - Partial rectangle data to update
 * @returns Promise that resolves when update is complete
 */
export const updateRectangle = async (
  id: string, 
  updates: Partial<Omit<Rect, 'id'>>
): Promise<void> => {
  const rectRef = doc(firestore, RECTANGLES_COLLECTION, id);
  await updateDoc(rectRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete a rectangle from Firestore
 * @param id - Rectangle ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteRectangle = async (id: string): Promise<void> => {
  const rectRef = doc(firestore, RECTANGLES_COLLECTION, id);
  await deleteDoc(rectRef);
};

/**
 * Delete multiple rectangles from Firestore
 * @param ids - Array of rectangle IDs to delete
 * @returns Promise that resolves when all deletions are complete
 */
export const deleteRectangles = async (ids: string[]): Promise<void> => {
  const deletePromises = ids.map(id => deleteRectangle(id));
  await Promise.all(deletePromises);
};

/**
 * Subscribe to rectangles collection with real-time updates
 * @param onUpdate - Callback function called when rectangles change
 * @param onError - Optional error callback
 * @returns Unsubscribe function
 */
export const subscribeToRectangles = (
  onUpdate: (rectangles: Rect[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(
    collection(firestore, RECTANGLES_COLLECTION).withConverter(rectConverter),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rectangles: Rect[] = [];
      snapshot.forEach((doc) => {
        rectangles.push({ ...doc.data(), id: doc.id });
      });
      onUpdate(rectangles);
    },
    (error) => {
      console.error('Error listening to rectangles:', error);
      onError?.(error);
    }
  );
};

/**
 * Get a single rectangle by ID
 * @param id - Rectangle ID
 * @returns Promise with rectangle data or null if not found
 */
export const getRectangle = async (id: string): Promise<Rect | null> => {
  const rectRef = doc(firestore, RECTANGLES_COLLECTION, id).withConverter(rectConverter);
  const snapshot = await getDoc(rectRef);
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
};

/**
 * Hybrid storage service class for managing both RTDB transforms and Firestore persistence
 */
export class HybridRectanglesService {
  private transformSyncTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private readonly SYNC_DELAY_MS = 1000; // 1 second delay before syncing transforms to Firestore

  /**
   * Create a rectangle with both Firestore persistence and RTDB transform
   */
  async createRectangleHybrid(rect: Omit<Rect, 'id'>): Promise<string> {
    try {
      // Create in Firestore first for persistence
      const id = await createRectangle(rect);
      
      // Create corresponding transform in RTDB for real-time updates
      const transform: Omit<Transform, 'id'> = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        rotation: rect.rotation,
        updatedAt: rect.updatedAt,
        updatedBy: rect.updatedBy,
        isActive: false
      };
      
      await transformService.setTransform({ ...transform, id });
      
      console.log('✅ HybridRectanglesService: Created rectangle with hybrid storage:', id);
      return id;
    } catch (error) {
      console.error('❌ HybridRectanglesService: Failed to create rectangle:', error);
      throw error;
    }
  }

  /**
   * Update rectangle with real-time transform and eventual Firestore sync
   */
  async updateRectangleHybrid(
    id: string, 
    updates: Partial<Omit<Rect, 'id'>>, 
    isTransformComplete: boolean = false
  ): Promise<void> {
    console.log(`🚀 HybridRectanglesService: updateRectangleHybrid called for ${id}`, updates, 'complete:', isTransformComplete);
    try {
      // Update transform in RTDB immediately for real-time updates
      const transformUpdates: Partial<Transform> = {
        ...updates,
        updatedAt: Date.now(),
        isActive: !isTransformComplete // Mark as inactive when transform is complete
      };
      
      console.log(`📡 HybridRectanglesService: Sending to RTDB:`, transformUpdates);
      await transformService.updateTransform(id, transformUpdates);
      console.log(`🔄 HybridRectanglesService: Updated RTDB transform for ${id}, active: ${!isTransformComplete}`);
      
      if (isTransformComplete) {
        // Transform completed - immediately sync final state to Firestore
        console.log('🔄 HybridRectanglesService: Transform complete - syncing final state to Firestore');
        await this.syncTransformToFirestore(id, updates);
      } else {
        // Transform in progress - schedule debounced Firestore sync
        console.log('⏰ HybridRectanglesService: Scheduling debounced Firestore sync');
        this.scheduleFirestoreSync(id, updates);
      }
      
      console.log('✅ HybridRectanglesService: Updated rectangle with hybrid storage:', id);
    } catch (error) {
      console.error('❌ HybridRectanglesService: Failed to update rectangle:', error);
      throw error;
    }
  }

  /**
   * Delete rectangle from both Firestore and RTDB
   */
  async deleteRectangleHybrid(id: string): Promise<void> {
    try {
      // Cancel any pending sync
      this.cancelFirestoreSync(id);
      
      // Delete from both stores
      await Promise.all([
        deleteRectangle(id),
        transformService.removeTransform(id)
      ]);
      
      console.log('✅ HybridRectanglesService: Deleted rectangle from hybrid storage:', id);
    } catch (error) {
      console.error('❌ HybridRectanglesService: Failed to delete rectangle:', error);
      throw error;
    }
  }

  /**
   * Get rectangle with real-time transform data merged in
   */
  async getRectangleHybrid(id: string): Promise<Rect | null> {
    try {
      // Get base rectangle from Firestore
      const rect = await getRectangle(id);
      if (!rect) return null;

      // Get current transform from RTDB
      const transform = await transformService.getTransform(id);
      
      if (transform) {
        // Merge transform data with rectangle data (transform takes precedence for real-time values)
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
    } catch (error) {
      console.error('❌ HybridRectanglesService: Failed to get rectangle:', error);
      throw error;
    }
  }

  /**
   * Subscribe to rectangles with real-time transform updates
   */
  subscribeToRectanglesHybrid(
    onUpdate: (rectangles: Rect[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let firestoreUnsubscribe: (() => void) | null = null;
    let transformUnsubscribe: (() => void) | null = null;
    let currentRectangles: Rect[] = [];
    let currentTransforms: Record<string, Transform> = {};

    // Subscribe to Firestore rectangles
    firestoreUnsubscribe = subscribeToRectangles(
      (rectangles) => {
        currentRectangles = rectangles;
        this.mergeRectanglesWithTransforms(currentRectangles, currentTransforms, onUpdate);
      },
      onError
    );

    // Subscribe to RTDB transforms
    transformUnsubscribe = transformService.subscribeToTransforms((transforms) => {
      currentTransforms = transforms;
      this.mergeRectanglesWithTransforms(currentRectangles, currentTransforms, onUpdate);
    });

    // Return cleanup function
    return () => {
      firestoreUnsubscribe?.();
      transformUnsubscribe?.();
    };
  }

  /**
   * Validate data consistency between RTDB and Firestore
   */
  async validateDataConsistency(): Promise<{
    consistent: boolean;
    inconsistencies: Array<{
      id: string;
      issue: string;
      firestoreData?: Partial<Rect>;
      rtdbData?: Partial<Transform>;
    }>;
  }> {
    const inconsistencies: Array<{
      id: string;
      issue: string;
      firestoreData?: Partial<Rect>;
      rtdbData?: Partial<Transform>;
    }> = [];

    try {
      // Get all rectangles from Firestore
      const rectangles = await this.getAllRectangles();
      
      for (const rect of rectangles) {
        const transform = await transformService.getTransform(rect.id);
        
        if (!transform) {
          inconsistencies.push({
            id: rect.id,
            issue: 'Transform missing in RTDB',
            firestoreData: rect
          });
          continue;
        }

        // Check for significant differences (allow small floating point differences)
        const tolerance = 0.01;
        const hasSignificantDifference = 
          Math.abs(rect.x - transform.x) > tolerance ||
          Math.abs(rect.y - transform.y) > tolerance ||
          Math.abs(rect.width - transform.width) > tolerance ||
          Math.abs(rect.height - transform.height) > tolerance ||
          Math.abs(rect.rotation - transform.rotation) > tolerance;

        if (hasSignificantDifference) {
          inconsistencies.push({
            id: rect.id,
            issue: 'Significant data mismatch between Firestore and RTDB',
            firestoreData: rect,
            rtdbData: transform
          });
        }
      }

      return {
        consistent: inconsistencies.length === 0,
        inconsistencies
      };
    } catch (error) {
      console.error('❌ HybridRectanglesService: Failed to validate consistency:', error);
      throw error;
    }
  }

  /**
   * Force sync all transforms to Firestore (for recovery scenarios)
   */
  async forceSyncAllTransformsToFirestore(): Promise<void> {
    try {
      console.log('🔄 HybridRectanglesService: Starting forced sync of all transforms to Firestore');
      
      // Get all rectangles
      const rectangles = await this.getAllRectangles();
      
      for (const rect of rectangles) {
        const transform = await transformService.getTransform(rect.id);
        if (transform) {
          // Update Firestore with latest transform data
          await updateRectangle(rect.id, {
            x: transform.x,
            y: transform.y,
            width: transform.width,
            height: transform.height,
            rotation: transform.rotation,
            updatedAt: transform.updatedAt,
            updatedBy: transform.updatedBy
          });
        }
      }
      
      console.log('✅ HybridRectanglesService: Completed forced sync of all transforms');
    } catch (error) {
      console.error('❌ HybridRectanglesService: Failed to force sync transforms:', error);
      throw error;
    }
  }

  /**
   * Clean up all pending sync operations
   */
  cleanup(): void {
    this.transformSyncTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.transformSyncTimeouts.clear();
  }

  // Private helper methods

  /**
   * Immediately sync transform to Firestore (for completed operations)
   */
  private async syncTransformToFirestore(id: string, updates: Partial<Omit<Rect, 'id'>>): Promise<void> {
    try {
      // Cancel any pending debounced sync
      this.cancelFirestoreSync(id);
      
      // Immediately update Firestore with final state
      await updateRectangle(id, updates);
      console.log('✅ HybridRectanglesService: Synced final transform state to Firestore:', id);
    } catch (error) {
      console.error('❌ HybridRectanglesService: Failed to sync final state to Firestore:', error);
      throw error;
    }
  }

  private scheduleFirestoreSync(id: string, updates: Partial<Omit<Rect, 'id'>>): void {
    // Cancel existing sync for this rectangle
    this.cancelFirestoreSync(id);
    
    // Schedule new sync
    const timeout = setTimeout(async () => {
      try {
        await updateRectangle(id, updates);
        console.log('🔄 HybridRectanglesService: Synced transform to Firestore (debounced):', id);
      } catch (error) {
        console.error('❌ HybridRectanglesService: Failed to sync transform to Firestore:', error);
      } finally {
        this.transformSyncTimeouts.delete(id);
      }
    }, this.SYNC_DELAY_MS);
    
    this.transformSyncTimeouts.set(id, timeout);
  }

  private cancelFirestoreSync(id: string): void {
    const timeout = this.transformSyncTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.transformSyncTimeouts.delete(id);
    }
  }

  private mergeRectanglesWithTransforms(
    rectangles: Rect[],
    transforms: Record<string, Transform>,
    onUpdate: (rectangles: Rect[]) => void
  ): void {
    const mergedRectangles = rectangles.map(rect => {
      const transform = transforms[rect.id];
      if (transform) {
        // Merge with transform data (transform takes precedence for real-time values)
        const merged = {
          ...rect,
          x: transform.x,
          y: transform.y,
          width: transform.width,
          height: transform.height,
          rotation: transform.rotation,
          updatedAt: transform.updatedAt,
          updatedBy: transform.updatedBy
        };
        console.log('🔄 HybridRectanglesService: Merging transform for', rect.id, 'isActive:', transform.isActive);
        return merged;
      }
      return rect;
    });
    
    console.log('📦 HybridRectanglesService: Sending merged rectangles to UI:', mergedRectangles.length);
    onUpdate(mergedRectangles);
  }

  private async getAllRectangles(): Promise<Rect[]> {
    // This is a simplified version - in a real app you might want to implement pagination
    return new Promise((resolve, reject) => {
      let unsubscribe: (() => void) | null = null;
      unsubscribe = subscribeToRectangles(
        (rectangles) => {
          if (unsubscribe) {
            unsubscribe();
          }
          resolve(rectangles);
        },
        (error) => {
          if (unsubscribe) {
            unsubscribe();
          }
          reject(error);
        }
      );
    });
  }
}

// Export singleton instance
export const hybridRectanglesService = new HybridRectanglesService();
