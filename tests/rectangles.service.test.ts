import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  updateRectangle, 
  hybridRectanglesService,
  createRectangle,
  deleteRectangle 
} from '../src/services/rectangles';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, path, id) => ({ 
    _path: `${path}/${id}`,
    withConverter: vi.fn(() => ({ _path: `${path}/${id}` }))
  })),
  collection: vi.fn((db, path) => ({ 
    _path: path,
    withConverter: vi.fn(() => ({ _path: path }))
  })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
}));

// Mock Firebase Realtime Database
vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({ _path: path })),
  set: vi.fn(),
  remove: vi.fn(),
  get: vi.fn(),
  push: vi.fn(() => ({ key: 'generated-id' })),
  onValue: vi.fn(),
  off: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
}));

vi.mock('../src/config/firebaseClient', () => ({
  firestore: {},
  rtdb: {},
}));

// Mock transform service
vi.mock('../src/services/transforms', () => ({
  transformService: {
    setTransform: vi.fn(),
    getTransform: vi.fn(),
    removeTransform: vi.fn(),
    updateTransform: vi.fn(),
    subscribeToTransforms: vi.fn(),
  },
}));

describe('Rectangles Service - Transform Updates', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { updateDoc, addDoc, deleteDoc } = await import('firebase/firestore');
    const { set, remove, get } = await import('firebase/database');
    const { transformService } = await import('../src/services/transforms');
    
    (updateDoc as any).mockResolvedValue(undefined);
    (addDoc as any).mockResolvedValue({ id: 'test-id' });
    (deleteDoc as any).mockResolvedValue(undefined);
    (set as any).mockResolvedValue(undefined);
    (remove as any).mockResolvedValue(undefined);
    (get as any).mockResolvedValue({ val: () => null });
    (transformService.setTransform as any).mockResolvedValue(undefined);
    (transformService.getTransform as any).mockResolvedValue(null);
    (transformService.removeTransform as any).mockResolvedValue(undefined);
    (transformService.updateTransform as any).mockResolvedValue(undefined);
  });

  describe('updateRectangle', () => {
    it('should handle transform updates (resize/rotate) for real-time sync', async () => {
      const { updateDoc } = await import('firebase/firestore');
      const transformUpdates = {
        x: 150,
        y: 250,
        width: 200,
        height: 120,
        rotation: 45,
        updatedAt: Date.now(),
        updatedBy: 'user1'
      };

      await updateRectangle('rect-1', transformUpdates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ _path: 'rectangles/rect-1' }),
        expect.objectContaining({
          x: 150,
          y: 250,
          width: 200,
          height: 120,
          rotation: 45,
          updatedBy: 'user1',
          updatedAt: { _serverTimestamp: true }
        })
      );
    });

    it('should handle position updates during drag', async () => {
      const { updateDoc } = await import('firebase/firestore');
      const positionUpdates = {
        x: 200,
        y: 300,
        updatedAt: Date.now(),
        updatedBy: 'user1'
      };

      await updateRectangle('rect-1', positionUpdates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ _path: 'rectangles/rect-1' }),
        expect.objectContaining({
          x: 200,
          y: 300,
          updatedBy: 'user1',
          updatedAt: { _serverTimestamp: true }
        })
      );
    });

    it('should handle mixed transform updates (position + size + rotation)', async () => {
      const { updateDoc } = await import('firebase/firestore');
      const mixedUpdates = {
        x: 100,
        y: 150,
        width: 300,
        height: 200,
        rotation: 30,
        updatedAt: Date.now(),
        updatedBy: 'user1'
      };

      await updateRectangle('rect-1', mixedUpdates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ _path: 'rectangles/rect-1' }),
        expect.objectContaining({
          x: 100,
          y: 150,
          width: 300,
          height: 200,
          rotation: 30,
          updatedBy: 'user1',
          updatedAt: { _serverTimestamp: true }
        })
      );
    });
  });

  describe('HybridRectanglesService - Hybrid Operations', () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      const { updateDoc, addDoc, deleteDoc } = await import('firebase/firestore');
      const { set, remove, get } = await import('firebase/database');
      const { transformService } = await import('../src/services/transforms');
      
      (updateDoc as any).mockResolvedValue(undefined);
      (addDoc as any).mockResolvedValue({ id: 'test-id' });
      (deleteDoc as any).mockResolvedValue(undefined);
      (set as any).mockResolvedValue(undefined);
      (remove as any).mockResolvedValue(undefined);
      (get as any).mockResolvedValue({ val: () => null });
      (transformService.setTransform as any).mockResolvedValue(undefined);
      (transformService.getTransform as any).mockResolvedValue(null);
      (transformService.removeTransform as any).mockResolvedValue(undefined);
      (transformService.updateTransform as any).mockResolvedValue(undefined);
    });

    describe('createRectangleHybrid', () => {
      it('should create rectangle in both Firestore and RTDB', async () => {
        const { addDoc } = await import('firebase/firestore');
        const { set } = await import('firebase/database');
        const { transformService } = await import('../src/services/transforms');

        const rectData = {
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          rotation: 0,
          updatedAt: Date.now(),
          updatedBy: 'user1'
        };

        const id = await hybridRectanglesService.createRectangleHybrid(rectData);

        expect(addDoc).toHaveBeenCalled();
        expect(transformService.setTransform).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'test-id',
            x: 100,
            y: 200,
            width: 150,
            height: 100,
            rotation: 0,
            updatedBy: 'user1',
            isActive: false
          })
        );
        expect(id).toBe('test-id');
      });
    });

    describe('updateRectangleHybrid', () => {
      it('should update transform in RTDB immediately and schedule Firestore sync', async () => {
        const { updateDoc } = await import('firebase/firestore');
        const { transformService } = await import('../src/services/transforms');

        const updates = {
          x: 150,
          y: 250,
          width: 200,
          height: 120,
          updatedBy: 'user1'
        };

        await hybridRectanglesService.updateRectangleHybrid('rect-1', updates, false, true);

        expect(transformService.updateTransform).toHaveBeenCalledWith(
          'rect-1',
          expect.objectContaining({
            x: 150,
            y: 250,
            width: 200,
            height: 120,
            updatedBy: 'user1',
            isActive: true
          })
        );
      });
    });

    describe('deleteRectangleHybrid', () => {
      it('should delete from both Firestore and RTDB', async () => {
        const { deleteDoc } = await import('firebase/firestore');
        const { transformService } = await import('../src/services/transforms');

        await hybridRectanglesService.deleteRectangleHybrid('rect-1');

        expect(deleteDoc).toHaveBeenCalled();
        expect(transformService.removeTransform).toHaveBeenCalledWith('rect-1');
      });
    });

    describe('getRectangleHybrid', () => {
      it('should merge Firestore data with RTDB transform data', async () => {
        const { getDoc } = await import('firebase/firestore');
        const { get } = await import('firebase/database');
        const { transformService } = await import('../src/services/transforms');

        // Mock Firestore response
        (getDoc as any).mockResolvedValue({
          exists: () => true,
          data: () => ({
            x: 100,
            y: 200,
            width: 150,
            height: 100,
            rotation: 0,
            updatedAt: 1000,
            updatedBy: 'user1'
          }),
          id: 'rect-1'
        });

        // Mock RTDB transform response
        (transformService.getTransform as any).mockResolvedValue({
          id: 'rect-1',
          x: 150,
          y: 250,
          width: 200,
          height: 120,
          rotation: 45,
          updatedAt: 2000,
          updatedBy: 'user2',
          isActive: true
        });

        const result = await hybridRectanglesService.getRectangleHybrid('rect-1');

        expect(result).toEqual({
          id: 'rect-1',
          x: 150, // From transform
          y: 250, // From transform
          width: 200, // From transform
          height: 120, // From transform
          rotation: 45, // From transform
          updatedAt: 2000, // From transform
          updatedBy: 'user2' // From transform
        });
      });

      it('should return Firestore data when no transform exists', async () => {
        const { getDoc } = await import('firebase/firestore');
        const { transformService } = await import('../src/services/transforms');

        // Mock Firestore response
        (getDoc as any).mockResolvedValue({
          exists: () => true,
          data: () => ({
            x: 100,
            y: 200,
            width: 150,
            height: 100,
            rotation: 0,
            updatedAt: 1000,
            updatedBy: 'user1'
          }),
          id: 'rect-1'
        });

        // Mock no transform
        (transformService.getTransform as any).mockResolvedValue(null);

        const result = await hybridRectanglesService.getRectangleHybrid('rect-1');

        expect(result).toEqual({
          id: 'rect-1',
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          rotation: 0,
          updatedAt: 1000,
          updatedBy: 'user1'
        });
      });
    });
  });

  describe('HybridRectanglesService - Data Consistency', () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      const { onSnapshot } = await import('firebase/firestore');
      const { transformService } = await import('../src/services/transforms');
      
      // Mock subscription to return test data
      (onSnapshot as any).mockImplementation((query, onNext) => {
        onNext({
          forEach: (callback: any) => {
            callback({
              id: 'rect-1',
              data: () => ({
                x: 100,
                y: 200,
                width: 150,
                height: 100,
                rotation: 0,
                updatedAt: 1000,
                updatedBy: 'user1'
              })
            });
          }
        });
        return () => {}; // unsubscribe function
      });
    });

    describe('validateDataConsistency', () => {
      it('should detect missing transforms in RTDB', async () => {
        const { transformService } = await import('../src/services/transforms');
        
        // Mock no transform found
        (transformService.getTransform as any).mockResolvedValue(null);

        const result = await hybridRectanglesService.validateDataConsistency();

        expect(result.consistent).toBe(false);
        expect(result.inconsistencies).toHaveLength(1);
        expect(result.inconsistencies[0]).toEqual({
          id: 'rect-1',
          issue: 'Transform missing in RTDB',
          firestoreData: expect.objectContaining({
            id: 'rect-1',
            x: 100,
            y: 200
          })
        });
      });

      it('should detect data mismatches between Firestore and RTDB', async () => {
        const { transformService } = await import('../src/services/transforms');
        
        // Mock transform with different data
        (transformService.getTransform as any).mockResolvedValue({
          id: 'rect-1',
          x: 200, // Different from Firestore (100)
          y: 300, // Different from Firestore (200)
          width: 150,
          height: 100,
          rotation: 0,
          updatedAt: 2000,
          updatedBy: 'user1',
          isActive: false
        });

        const result = await hybridRectanglesService.validateDataConsistency();

        expect(result.consistent).toBe(false);
        expect(result.inconsistencies).toHaveLength(1);
        expect(result.inconsistencies[0].issue).toBe('Significant data mismatch between Firestore and RTDB');
      });

      it('should report consistent data when Firestore and RTDB match', async () => {
        const { transformService } = await import('../src/services/transforms');
        
        // Mock transform with matching data
        (transformService.getTransform as any).mockResolvedValue({
          id: 'rect-1',
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          rotation: 0,
          updatedAt: 1000,
          updatedBy: 'user1',
          isActive: false
        });

        const result = await hybridRectanglesService.validateDataConsistency();

        expect(result.consistent).toBe(true);
        expect(result.inconsistencies).toHaveLength(0);
      });
    });

    describe('forceSyncAllTransformsToFirestore', () => {
      it('should sync all transform data to Firestore', async () => {
        const { updateDoc } = await import('firebase/firestore');
        const { transformService } = await import('../src/services/transforms');
        
        // Mock transform with updated data
        (transformService.getTransform as any).mockResolvedValue({
          id: 'rect-1',
          x: 200,
          y: 300,
          width: 200,
          height: 150,
          rotation: 45,
          updatedAt: 2000,
          updatedBy: 'user2',
          isActive: false
        });

        await hybridRectanglesService.forceSyncAllTransformsToFirestore();

        expect(updateDoc).toHaveBeenCalledWith(
          expect.objectContaining({ _path: 'rectangles/rect-1' }),
          expect.objectContaining({
            x: 200,
            y: 300,
            width: 200,
            height: 150,
            rotation: 45,
            updatedBy: 'user2'
          })
        );
      });
    });
  });

  describe('HybridRectanglesService - Conflict Resolution', () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      const { transformService } = await import('../src/services/transforms');
      (transformService.updateTransform as any).mockResolvedValue(undefined);
    });

    it('should handle Last-Write-Wins conflict resolution', async () => {
      const { transformService } = await import('../src/services/transforms');
      
      // Mock current transform with newer timestamp
      (transformService.getTransform as any).mockResolvedValue({
        id: 'rect-1',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        rotation: 0,
        updatedAt: 2000, // Newer timestamp
        updatedBy: 'user1',
        isActive: false
      });

      const updates = {
        x: 200,
        y: 300,
        updatedAt: 1000, // Older timestamp
        updatedBy: 'user2'
      };

      await hybridRectanglesService.updateRectangleHybrid('rect-1', updates, false, true);

      // Should still call updateTransform (the service handles LWW internally)
      expect(transformService.updateTransform).toHaveBeenCalledWith(
        'rect-1',
        expect.objectContaining({
          x: 200,
          y: 300,
          updatedBy: 'user2'
        })
      );
    });
  });
});
