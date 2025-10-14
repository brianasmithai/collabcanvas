import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateRectangle } from '../src/services/rectangles';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, path, id) => ({ _path: `${path}/${id}` })),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
}));

vi.mock('../src/config/firebaseClient', () => ({
  firestore: {},
}));

describe('Rectangles Service - Transform Updates', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { updateDoc } = await import('firebase/firestore');
    (updateDoc as any).mockResolvedValue(undefined);
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
        { _path: 'rectangles/rect-1' },
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
        { _path: 'rectangles/rect-1' },
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
        { _path: 'rectangles/rect-1' },
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
});
