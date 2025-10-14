import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  setPresence, 
  setInitialPresence, 
  updateCursor, 
  updateSelection, 
  removePresence, 
  cleanupStalePresence 
} from '../src/services/presence';

// Mock Firebase Realtime Database
vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({ _path: path })),
  set: vi.fn(),
  remove: vi.fn(),
  get: vi.fn(),
  onDisconnect: vi.fn(),
}));

vi.mock('../src/config/firebaseClient', () => ({
  rtdb: {},
}));

describe('Presence Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { set, remove, get, onDisconnect } = await import('firebase/database');
    (set as any).mockResolvedValue(undefined);
    (remove as any).mockResolvedValue(undefined);
    (get as any).mockResolvedValue({ val: () => null });
    (onDisconnect as any).mockReturnValue({ remove: vi.fn() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setPresence', () => {
    it('should set presence data with timestamp', async () => {
      const { set, onDisconnect } = await import('firebase/database');
      const uid = 'test-user-123';
      const presenceData = {
        name: 'Test User',
        displayName: 'Test User',
        cursor: { x: 100, y: 200 },
        selectionIds: ['rect-1', 'rect-2'],
      };

      await setPresence(uid, presenceData);

      expect(set).toHaveBeenCalledWith(
        { _path: `presence/${uid}` },
        expect.objectContaining({
          ...presenceData,
          updatedAt: expect.any(Number),
        })
      );
      expect(onDisconnect).toHaveBeenCalledWith({ _path: `presence/${uid}` });
    });
  });

  describe('setInitialPresence', () => {
    it('should set initial presence for new user', async () => {
      const { set } = await import('firebase/database');
      const uid = 'new-user-456';
      const displayName = 'New User';

      await setInitialPresence(uid, displayName);

      expect(set).toHaveBeenCalledWith(
        { _path: `presence/${uid}` },
        expect.objectContaining({
          name: displayName,
          displayName: displayName,
          cursor: { x: 0, y: 0 },
          selectionIds: [],
          updatedAt: expect.any(Number),
        })
      );
    });
  });

  describe('updateCursor', () => {
    it('should update cursor position and preserve user data', async () => {
      const { set, get } = await import('firebase/database');
      const uid = 'user-789';
      const cursor = { x: 150, y: 250 };

      // Mock get to return existing user data
      (get as any).mockResolvedValue({
        val: () => ({
          name: 'Test User',
          displayName: 'Test User',
          cursor: { x: 100, y: 200 },
          selectionIds: ['rect1']
        })
      });

      await updateCursor(uid, cursor);

      expect(get).toHaveBeenCalledWith({ _path: `presence/${uid}` });
      expect(set).toHaveBeenCalledWith(
        { _path: `presence/${uid}` },
        expect.objectContaining({
          name: 'Test User',
          displayName: 'Test User',
          cursor: { x: 150, y: 250 },
          selectionIds: ['rect1'],
          updatedAt: expect.any(Number)
        })
      );
    });
  });

  describe('updateSelection', () => {
    it('should update selection IDs and preserve user data', async () => {
      const { set, get } = await import('firebase/database');
      const uid = 'user-101';
      const selectionIds = ['rect-3', 'rect-4'];

      // Mock get to return existing user data
      (get as any).mockResolvedValue({
        val: () => ({
          name: 'Test User',
          displayName: 'Test User',
          cursor: { x: 100, y: 200 },
          selectionIds: ['rect1']
        })
      });

      await updateSelection(uid, selectionIds);

      expect(get).toHaveBeenCalledWith({ _path: `presence/${uid}` });
      expect(set).toHaveBeenCalledWith(
        { _path: `presence/${uid}` },
        expect.objectContaining({
          name: 'Test User',
          displayName: 'Test User',
          cursor: { x: 100, y: 200 },
          selectionIds: ['rect-3', 'rect-4'],
          updatedAt: expect.any(Number)
        })
      );
    });
  });

  describe('removePresence', () => {
    it('should remove user presence from database', async () => {
      const { remove } = await import('firebase/database');
      const uid = 'user-202';

      await removePresence(uid);

      expect(remove).toHaveBeenCalledWith({ _path: `presence/${uid}` });
    });
  });

  describe('cleanupStalePresence', () => {
    it('should remove stale presence entries', async () => {
      const { get, remove } = await import('firebase/database');
      const currentTime = Date.now();
      const staleTime = currentTime - 360000; // 6 minutes ago (beyond 5 minute threshold)
      const activeTime = currentTime - 30000; // 30 seconds ago

      (get as any).mockResolvedValue({
        val: () => ({
          'user-1': {
            name: 'Stale User',
            updatedAt: staleTime,
          },
          'user-2': {
            name: 'Active User',
            updatedAt: activeTime,
          },
        }),
      });

      await cleanupStalePresence();

      expect(remove).toHaveBeenCalledWith({ _path: 'presence/user-1' });
      expect(remove).not.toHaveBeenCalledWith({ _path: 'presence/user-2' });
    });

    it('should handle empty presence data', async () => {
      const { get, remove } = await import('firebase/database');
      (get as any).mockResolvedValue({ val: () => null });

      await cleanupStalePresence();

      expect(remove).not.toHaveBeenCalled();
    });

    it('should handle missing updatedAt field', async () => {
      const { get, remove } = await import('firebase/database');
      const currentTime = Date.now();
      const staleTime = currentTime - 360000; // 6 minutes ago (beyond 5 minute threshold)

      (get as any).mockResolvedValue({
        val: () => ({
          'user-1': {
            name: 'User Without Timestamp',
            // No updatedAt field - treated as currentTime (not stale)
          },
          'user-2': {
            name: 'User With Timestamp',
            updatedAt: staleTime, // This is stale
          },
        }),
      });

      await cleanupStalePresence();

      // Only user-2 should be removed since missing updatedAt is treated as currentTime (not stale)
      expect(remove).toHaveBeenCalledTimes(1);
      expect(remove).toHaveBeenCalledWith({ _path: 'presence/user-2' });
    });
  });
});
