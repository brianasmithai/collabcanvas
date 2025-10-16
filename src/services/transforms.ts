// Transform service for real-time shape transformations using Firebase Realtime Database
import { 
  ref, 
  set, 
  remove, 
  onValue, 
  off, 
  push, 
  get,
  serverTimestamp,
  DatabaseReference,
  Unsubscribe
} from 'firebase/database';
import { rtdb } from '../config/firebaseClient';
import type { Transform, TransformOperation, TransformCallback } from '../types';

// RTDB paths
const TRANSFORMS_PATH = 'transforms';

/**
 * Transform service for managing real-time shape transformations
 * Handles CRUD operations and subscriptions for transform data
 */
export class TransformService {
  private subscriptions: Map<string, Unsubscribe> = new Map();

  /**
   * Create or update a transform in RTDB
   */
  async setTransform(transform: Transform): Promise<void> {
    try {
      const transformRef = ref(rtdb, `${TRANSFORMS_PATH}/${transform.id}`);
      await set(transformRef, {
        ...transform,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error setting transform:', error);
      throw new Error(`Failed to set transform: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific transform by ID
   */
  async getTransform(id: string): Promise<Transform | null> {
    try {
      const transformRef = ref(rtdb, `${TRANSFORMS_PATH}/${id}`);
      const snapshot = await get(transformRef);
      const data = snapshot.val();
      return data ? { ...data, id } : null;
    } catch (error) {
      console.error('Error getting transform:', error);
      throw new Error(`Failed to get transform: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a transform from RTDB
   */
  async removeTransform(id: string): Promise<void> {
    try {
      const transformRef = ref(rtdb, `${TRANSFORMS_PATH}/${id}`);
      await remove(transformRef);
    } catch (error) {
      console.error('Error removing transform:', error);
      throw new Error(`Failed to remove transform: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribe to all transforms with a callback
   */
  subscribeToTransforms(callback: TransformCallback): () => void {
    const transformsRef = ref(rtdb, TRANSFORMS_PATH);
    
    const unsubscribe = onValue(transformsRef, (snapshot) => {
      const data = snapshot.val() || {};
      // Ensure each transform has its ID
      const transforms: Record<string, Transform> = {};
      Object.keys(data).forEach(id => {
        transforms[id] = { ...data[id], id };
      });
      callback(transforms);
    }, (error) => {
      console.error('Error in transform subscription:', error);
    });

    // Store subscription for cleanup
    const subscriptionId = `transforms_${Date.now()}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    // Return cleanup function
    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  /**
   * Subscribe to a specific transform by ID
   */
  subscribeToTransform(id: string, callback: (transform: Transform | null) => void): () => void {
    const transformRef = ref(rtdb, `${TRANSFORMS_PATH}/${id}`);
    
    const unsubscribe = onValue(transformRef, (snapshot) => {
      const data = snapshot.val();
      const transform = data ? { ...data, id } : null;
      callback(transform);
    }, (error) => {
      console.error(`Error in transform subscription for ${id}:`, error);
      callback(null);
    });

    // Store subscription for cleanup
    const subscriptionId = `transform_${id}_${Date.now()}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    // Return cleanup function
    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  /**
   * Create a new transform with auto-generated ID
   */
  async createTransform(transformData: Omit<Transform, 'id'>): Promise<string> {
    try {
      const transformsRef = ref(rtdb, TRANSFORMS_PATH);
      const newTransformRef = push(transformsRef);
      
      if (!newTransformRef.key) {
        throw new Error('Failed to generate transform ID');
      }

      const transform: Transform = {
        ...transformData,
        id: newTransformRef.key,
        updatedAt: Date.now()
      };

      await set(newTransformRef, transform);
      return newTransformRef.key;
    } catch (error) {
      console.error('Error creating transform:', error);
      throw new Error(`Failed to create transform: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update transform with conflict resolution (Last-Write-Wins)
   */
  async updateTransform(id: string, updates: Partial<Transform>): Promise<void> {
    try {
      const transformRef = ref(rtdb, `${TRANSFORMS_PATH}/${id}`);
      
      // Get current transform to check timestamp
      const currentTransform = await this.getTransform(id);
      
      if (currentTransform && updates.updatedAt && updates.updatedAt < currentTransform.updatedAt) {
        // Ignore update if it's older than current (LWW conflict resolution)
        console.warn(`Ignoring older update for transform ${id}`);
        return;
      }

      await set(transformRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating transform:', error);
      throw new Error(`Failed to update transform: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up all active subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Get active subscription count (for debugging)
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}

// Export singleton instance
export const transformService = new TransformService();
