import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getDatabase } from 'firebase/database';
import { setPresence, setInitialPresence, updateCursor, updateSelection, removePresence } from '../src/services/presence';

describe('Presence Service Tests', () => {
  let testEnv: RulesTestEnvironment;
  let db: any;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'collabcanvas-9c044',
      database: {
        rules: `
        {
          "rules": {
            "presence": {
              ".read": "auth != null",
              "$uid": {
                ".write": "auth != null && auth.uid == $uid"
              }
            },
            ".read": false,
            ".write": false
          }
        }`
      }
    });
  });

  beforeEach(async () => {
    await testEnv.clearDatabase();
    db = getDatabase(testEnv.app);
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('setPresence', () => {
    test('should set presence data for authenticated user', async () => {
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);

      const presenceData = {
        name: 'Test User',
        displayName: 'Test User',
        cursor: { x: 100, y: 200 },
        selectionIds: ['rect1', 'rect2']
      };

      await expect(setPresence('user1', presenceData)).resolves.not.toThrow();

      // Verify data was written
      const presenceRef = ref(userDb, 'presence/user1');
      const snapshot = await get(presenceRef);
      const data = snapshot.val();

      expect(data).toBeDefined();
      expect(data.name).toBe('Test User');
      expect(data.displayName).toBe('Test User');
      expect(data.cursor).toEqual({ x: 100, y: 200 });
      expect(data.selectionIds).toEqual(['rect1', 'rect2']);
      expect(data.updatedAt).toBeDefined();
    });

    test('should fail for unauthenticated user', async () => {
      const unauthenticatedDb = getDatabase(testEnv.unauthenticatedContext().app);

      const presenceData = {
        name: 'Test User',
        displayName: 'Test User',
        cursor: { x: 100, y: 200 },
        selectionIds: []
      };

      await expect(setPresence('user1', presenceData)).rejects.toThrow();
    });
  });

  describe('setInitialPresence', () => {
    test('should set initial presence with correct structure', async () => {
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);

      await expect(setInitialPresence('user1', 'Test User')).resolves.not.toThrow();

      // Verify data was written
      const presenceRef = ref(userDb, 'presence/user1');
      const snapshot = await get(presenceRef);
      const data = snapshot.val();

      expect(data).toBeDefined();
      expect(data.name).toBe('Test User');
      expect(data.displayName).toBe('Test User');
      expect(data.cursor).toEqual({ x: 0, y: 0 });
      expect(data.selectionIds).toEqual([]);
      expect(data.updatedAt).toBeDefined();
    });
  });

  describe('updateCursor', () => {
    test('should update cursor position while preserving other data', async () => {
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);

      // Set initial presence
      await setInitialPresence('user1', 'Test User');

      // Update cursor
      await expect(updateCursor('user1', { x: 150, y: 250 })).resolves.not.toThrow();

      // Verify data was updated
      const presenceRef = ref(userDb, 'presence/user1');
      const snapshot = await get(presenceRef);
      const data = snapshot.val();

      expect(data.cursor).toEqual({ x: 150, y: 250 });
      expect(data.name).toBe('Test User'); // Should be preserved
      expect(data.displayName).toBe('Test User'); // Should be preserved
      expect(data.updatedAt).toBeDefined();
    });

    test('should fail for unauthenticated user', async () => {
      await expect(updateCursor('user1', { x: 150, y: 250 })).rejects.toThrow();
    });
  });

  describe('updateSelection', () => {
    test('should update selection while preserving other data', async () => {
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);

      // Set initial presence
      await setInitialPresence('user1', 'Test User');

      // Update selection
      const newSelection = ['rect1', 'rect3', 'rect5'];
      await expect(updateSelection('user1', newSelection)).resolves.not.toThrow();

      // Verify data was updated
      const presenceRef = ref(userDb, 'presence/user1');
      const snapshot = await get(presenceRef);
      const data = snapshot.val();

      expect(data.selectionIds).toEqual(newSelection);
      expect(data.name).toBe('Test User'); // Should be preserved
      expect(data.displayName).toBe('Test User'); // Should be preserved
      expect(data.updatedAt).toBeDefined();
    });

    test('should fail for unauthenticated user', async () => {
      await expect(updateSelection('user1', ['rect1'])).rejects.toThrow();
    });
  });

  describe('removePresence', () => {
    test('should remove presence data', async () => {
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);

      // Set initial presence
      await setInitialPresence('user1', 'Test User');

      // Remove presence
      await expect(removePresence('user1')).resolves.not.toThrow();

      // Verify data was removed
      const presenceRef = ref(userDb, 'presence/user1');
      const snapshot = await get(presenceRef);
      const data = snapshot.val();

      expect(data).toBeNull();
    });

    test('should fail for unauthenticated user', async () => {
      await expect(removePresence('user1')).rejects.toThrow();
    });
  });

  describe('Real-time Updates', () => {
    test('should trigger real-time updates when presence changes', async () => {
      const user1 = await testEnv.authenticatedContext('user1');
      const user2 = await testEnv.authenticatedContext('user2');
      
      const user1Db = getDatabase(user1.app);
      const user2Db = getDatabase(user2.app);

      // Set up listener on user1's side
      const presenceRef = ref(user1Db, 'presence');
      let receivedData: any = null;
      let updateCount = 0;
      
      const unsubscribe = onValue(presenceRef, (snapshot) => {
        receivedData = snapshot.val();
        updateCount++;
      });

      // User2 sets their presence
      await setInitialPresence('user2', 'User 2');

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(updateCount).toBeGreaterThan(0);
      expect(receivedData).toBeDefined();
      expect(receivedData.user2).toBeDefined();
      expect(receivedData.user2.name).toBe('User 2');

      // User2 updates their cursor
      await updateCursor('user2', { x: 300, y: 400 });

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(updateCount).toBeGreaterThan(1);
      expect(receivedData.user2.cursor).toEqual({ x: 300, y: 400 });

      unsubscribe();
    });
  });
});
