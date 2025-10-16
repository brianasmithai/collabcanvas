import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getDatabase, ref, set, get, onValue, off } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

describe('RTDB Rules Tests', () => {
  let testEnv: RulesTestEnvironment;
  let db: any;
  let auth: any;

  beforeAll(async () => {
    // Initialize test environment with your project ID
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
            "transforms": {
              "$transformId": {
                ".read": "auth != null",
                ".write": "auth != null && (newData.child('updatedBy').val() == auth.uid || !data.exists())"
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
    auth = getAuth(testEnv.app);
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Presence Rules', () => {
    test('should allow authenticated user to write their own presence', async () => {
      // Create test user
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);
      
      const presenceRef = ref(userDb, 'presence/user1');
      const presenceData = {
        name: 'Test User',
        displayName: 'Test User',
        cursor: { x: 100, y: 200 },
        selectionIds: [],
        updatedAt: Date.now()
      };

      // Should succeed
      await expect(set(presenceRef, presenceData)).resolves.not.toThrow();
    });

    test('should allow authenticated user to read all presence data', async () => {
      // Create two test users
      const user1 = await testEnv.authenticatedContext('user1');
      const user2 = await testEnv.authenticatedContext('user2');
      
      const user1Db = getDatabase(user1.app);
      const user2Db = getDatabase(user2.app);

      // User1 writes their presence
      const user1PresenceRef = ref(user1Db, 'presence/user1');
      await set(user1PresenceRef, {
        name: 'User 1',
        displayName: 'User 1',
        cursor: { x: 100, y: 200 },
        selectionIds: [],
        updatedAt: Date.now()
      });

      // User2 writes their presence
      const user2PresenceRef = ref(user2Db, 'presence/user2');
      await set(user2PresenceRef, {
        name: 'User 2',
        displayName: 'User 2',
        cursor: { x: 300, y: 400 },
        selectionIds: [],
        updatedAt: Date.now()
      });

      // User1 should be able to read all presence data
      const allPresenceRef = ref(user1Db, 'presence');
      const snapshot = await get(allPresenceRef);
      const data = snapshot.val();

      expect(data).toBeDefined();
      expect(data.user1).toBeDefined();
      expect(data.user2).toBeDefined();
      expect(data.user1.name).toBe('User 1');
      expect(data.user2.name).toBe('User 2');
    });

    test('should deny unauthenticated access to presence', async () => {
      const unauthenticatedDb = getDatabase(testEnv.unauthenticatedContext().app);
      const presenceRef = ref(unauthenticatedDb, 'presence');

      // Should fail
      await expect(get(presenceRef)).rejects.toThrow();
    });

    test('should deny user from writing to another users presence', async () => {
      const user1 = await testEnv.authenticatedContext('user1');
      const user1Db = getDatabase(user1.app);
      
      const user2PresenceRef = ref(user1Db, 'presence/user2');
      const presenceData = {
        name: 'Hacker',
        displayName: 'Hacker',
        cursor: { x: 0, y: 0 },
        selectionIds: [],
        updatedAt: Date.now()
      };

      // Should fail
      await expect(set(user2PresenceRef, presenceData)).rejects.toThrow();
    });
  });

  describe('Transform Rules', () => {
    test('should allow authenticated user to write transforms they own', async () => {
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);
      
      const transformRef = ref(userDb, 'transforms/transform1');
      const transformData = {
        id: 'transform1',
        x: 100,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: 'user1',
        isActive: true
      };

      // Should succeed
      await expect(set(transformRef, transformData)).resolves.not.toThrow();
    });

    test('should allow authenticated user to read all transforms', async () => {
      const user1 = await testEnv.authenticatedContext('user1');
      const user2 = await testEnv.authenticatedContext('user2');
      
      const user1Db = getDatabase(user1.app);
      const user2Db = getDatabase(user2.app);

      // User1 writes a transform
      const transform1Ref = ref(user1Db, 'transforms/transform1');
      await set(transform1Ref, {
        id: 'transform1',
        x: 100,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: 'user1',
        isActive: true
      });

      // User2 writes a transform
      const transform2Ref = ref(user2Db, 'transforms/transform2');
      await set(transform2Ref, {
        id: 'transform2',
        x: 300,
        y: 400,
        width: 75,
        height: 75,
        rotation: 45,
        updatedAt: Date.now(),
        updatedBy: 'user2',
        isActive: false
      });

      // User1 should be able to read all transforms
      const allTransformsRef = ref(user1Db, 'transforms');
      const snapshot = await get(allTransformsRef);
      const data = snapshot.val();

      expect(data).toBeDefined();
      expect(data.transform1).toBeDefined();
      expect(data.transform2).toBeDefined();
      expect(data.transform1.updatedBy).toBe('user1');
      expect(data.transform2.updatedBy).toBe('user2');
    });

    test('should deny user from writing transforms they do not own', async () => {
      const user1 = await testEnv.authenticatedContext('user1');
      const user1Db = getDatabase(user1.app);
      
      const transformRef = ref(user1Db, 'transforms/transform1');
      const transformData = {
        id: 'transform1',
        x: 100,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: 'user2', // Trying to claim ownership as user2
        isActive: true
      };

      // Should fail
      await expect(set(transformRef, transformData)).rejects.toThrow();
    });

    test('should allow user to update existing transform they own', async () => {
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);
      
      const transformRef = ref(userDb, 'transforms/transform1');
      
      // Create initial transform
      await set(transformRef, {
        id: 'transform1',
        x: 100,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: 'user1',
        isActive: true
      });

      // Update the transform
      const updatedData = {
        id: 'transform1',
        x: 150,
        y: 250,
        width: 50,
        height: 50,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: 'user1',
        isActive: false
      };

      // Should succeed
      await expect(set(transformRef, updatedData)).resolves.not.toThrow();
    });
  });

  describe('Real-time Subscriptions', () => {
    test('should allow real-time presence subscription', async () => {
      const user1 = await testEnv.authenticatedContext('user1');
      const user2 = await testEnv.authenticatedContext('user2');
      
      const user1Db = getDatabase(user1.app);
      const user2Db = getDatabase(user2.app);

      // Set up listener
      const presenceRef = ref(user1Db, 'presence');
      let receivedData: any = null;
      
      const unsubscribe = onValue(presenceRef, (snapshot) => {
        receivedData = snapshot.val();
      });

      // User2 writes their presence
      const user2PresenceRef = ref(user2Db, 'presence/user2');
      await set(user2PresenceRef, {
        name: 'User 2',
        displayName: 'User 2',
        cursor: { x: 300, y: 400 },
        selectionIds: [],
        updatedAt: Date.now()
      });

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedData).toBeDefined();
      expect(receivedData.user2).toBeDefined();
      expect(receivedData.user2.name).toBe('User 2');

      unsubscribe();
    });

    test('should allow real-time transform subscription', async () => {
      const user1 = await testEnv.authenticatedContext('user1');
      const user2 = await testEnv.authenticatedContext('user2');
      
      const user1Db = getDatabase(user1.app);
      const user2Db = getDatabase(user2.app);

      // Set up listener
      const transformsRef = ref(user1Db, 'transforms');
      let receivedData: any = null;
      
      const unsubscribe = onValue(transformsRef, (snapshot) => {
        receivedData = snapshot.val();
      });

      // User2 writes a transform
      const transformRef = ref(user2Db, 'transforms/transform1');
      await set(transformRef, {
        id: 'transform1',
        x: 100,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: 'user2',
        isActive: true
      });

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedData).toBeDefined();
      expect(receivedData.transform1).toBeDefined();
      expect(receivedData.transform1.updatedBy).toBe('user2');

      unsubscribe();
    });
  });
});
