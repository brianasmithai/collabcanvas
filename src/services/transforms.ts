// Transform service for real-time shape transformations using Firebase Realtime Database
import { 
  ref, 
  set, 
  remove, 
  onValue, 
  push, 
  get
} from 'firebase/database';
import type { 
  Unsubscribe
} from 'firebase/database';
import { rtdb } from '../config/firebaseClient';
import type { Transform, TransformCallback } from '../types';

// RTDB paths
const TRANSFORMS_PATH = 'transforms';

/**
 * Transform service for managing real-time shape transformations
 * Handles CRUD operations and subscriptions for transform data
 */
export class TransformService {
  private subscriptions: Map<string, Unsubscribe> = new Map();
  private subscriptionCounter = 0;

  /**
   * Create or update a transform in RTDB
   */
  async setTransform(transform: Transform): Promise<void> {
    try {
      const transformRef = ref(rtdb, `${TRANSFORMS_PATH}/${transform.id}`);
      await set(transformRef, {
        ...transform,
        updatedAt: transform.updatedAt || Date.now() // Use provided timestamp or current time
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
    
    const subscriptionId = `transforms_${++this.subscriptionCounter}`;
    console.log('🔗 TransformService: Setting up subscription to', TRANSFORMS_PATH, 'ID:', subscriptionId);
    
    const unsubscribe = onValue(transformsRef, (snapshot) => {
      const data = snapshot.val() || {};
      console.log('📡 TransformService: Raw RTDB data received for subscription', subscriptionId, ':', data);
      
      // Ensure each transform has its ID
      const transforms: Record<string, Transform> = {};
      Object.keys(data).forEach(id => {
        transforms[id] = { ...data[id], id };
      });
      console.log('🔄 TransformService: Processed transform updates for subscription', subscriptionId, ':', Object.keys(transforms).length, 'transforms', transforms);
      callback(transforms);
    }, (error) => {
      console.error('❌ TransformService: Error in transform subscription', subscriptionId, ':', error);
    });

    // Store subscription for cleanup
    this.subscriptions.set(subscriptionId, unsubscribe);

    // Return cleanup function
    return () => {
      console.log('🔌 TransformService: Cleaning up subscription', subscriptionId);
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
    const subscriptionId = `transform_${id}_${++this.subscriptionCounter}`;
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
   * Optimized for active transforms to achieve sub-100ms latency
   */
  async updateTransform(id: string, updates: Partial<Transform>): Promise<void> {
    try {
      const transformRef = ref(rtdb, `${TRANSFORMS_PATH}/${id}`);
      
      // For active transforms, skip timestamp checking for maximum speed
      if (updates.isActive) {
        console.log(`⚡ TransformService: Fast path for active transform ${id}:`, updates);
        await set(transformRef, {
          ...updates,
          updatedAt: Date.now() // Use client timestamp for RTDB
        });
        console.log(`✅ TransformService: Active transform ${id} sent to RTDB`);
        return;
      }
      
      // For inactive/final transforms, use LWW conflict resolution
      console.log(`🔄 TransformService: LWW path for inactive transform ${id}:`, updates);
      const currentTransform = await this.getTransform(id);
      
      if (currentTransform && updates.updatedAt && updates.updatedAt < currentTransform.updatedAt) {
        // Ignore update if it's older than current (LWW conflict resolution)
        console.warn(`Ignoring older update for transform ${id}`);
        return;
      }

      await set(transformRef, {
        ...updates,
        updatedAt: Date.now() // Use client timestamp for RTDB
      });
      console.log(`✅ TransformService: Inactive transform ${id} sent to RTDB`);
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

  /**
   * Test RTDB connection by writing a test transform
   */
  async testConnection(): Promise<boolean> {
    try {
      const testId = `test-${Date.now()}`;
      const testTransform: Transform = {
        id: testId,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: 'test-user',
        isActive: true
      };
      
      console.log('🧪 TransformService: Testing RTDB connection with test transform:', testId);
      await this.setTransform(testTransform);
      
      // Clean up test transform
      setTimeout(() => {
        this.removeTransform(testId).catch(console.error);
      }, 1000);
      
      console.log('✅ TransformService: RTDB connection test successful');
      return true;
    } catch (error) {
      console.error('❌ TransformService: RTDB connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const transformService = new TransformService();
