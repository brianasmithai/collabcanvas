import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getDatabase, ref, get } from 'firebase/database';
import { TransformService } from '../src/services/transforms';

describe('Transform Service Tests', () => {
  let testEnv: RulesTestEnvironment;
  let db: any;
  let transformService: TransformService;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'collabcanvas-9c044',
      database: {
        rules: `
        {
          "rules": {
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
    transformService = new TransformService();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('createTransform', () => {
    test('should create transform for authenticated user', async () => {
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);

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

      await expect(transformService.createTransform(transformData)).resolves.not.toThrow();

      // Verify data was written
      const transformRef = ref(userDb, 'transforms/transform1');
      const snapshot = await get(transformRef);
      const data = snapshot.val();

      expect(data).toBeDefined();
      expect(data.id).toBe('transform1');
      expect(data.x).toBe(100);
      expect(data.y).toBe(200);
      expect(data.width).toBe(50);
      expect(data.height).toBe(50);
      expect(data.rotation).toBe(0);
      expect(data.updatedBy).toBe('user1');
      expect(data.isActive).toBe(true);
    });

    test('should fail for unauthenticated user', async () => {
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

      await expect(transformService.createTransform(transformData)).rejects.toThrow();
    });
  });

  describe('updateTransform', () => {
    test('should update transform owned by user', async () => {
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);

      // Create initial transform
      const initialTransform = {
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

      await transformService.createTransform(initialTransform);

      // Update the transform
      const updates = {
        x: 150,
        y: 250,
        isActive: false
      };

      await expect(transformService.updateTransform('transform1', updates)).resolves.not.toThrow();

      // Verify data was updated
      const transformRef = ref(userDb, 'transforms/transform1');
      const snapshot = await get(transformRef);
      const data = snapshot.val();

      expect(data.x).toBe(150);
      expect(data.y).toBe(250);
      expect(data.isActive).toBe(false);
      expect(data.width).toBe(50); // Should be preserved
      expect(data.height).toBe(50); // Should be preserved
    });

    test('should fail when trying to update transform owned by another user', async () => {
      const user1 = await testEnv.authenticatedContext('user1');
      const user2 = await testEnv.authenticatedContext('user2');

      // User1 creates a transform
      const initialTransform = {
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

      await transformService.createTransform(initialTransform);

      // User2 tries to update it
      const updates = {
        x: 999,
        y: 999
      };

      await expect(transformService.updateTransform('transform1', updates)).rejects.toThrow();
    });
  });

  describe('getTransform', () => {
    test('should get transform for authenticated user', async () => {
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);

      // Create a transform
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

      await transformService.createTransform(transformData);

      // Get the transform
      const result = await transformService.getTransform('transform1');

      expect(result).toBeDefined();
      expect(result!.id).toBe('transform1');
      expect(result!.x).toBe(100);
      expect(result!.y).toBe(200);
      expect(result!.updatedBy).toBe('user1');
    });

    test('should return null for non-existent transform', async () => {
      const user = await testEnv.authenticatedContext('user1');

      const result = await transformService.getTransform('nonexistent');

      expect(result).toBeNull();
    });

    test('should fail for unauthenticated user', async () => {
      await expect(transformService.getTransform('transform1')).rejects.toThrow();
    });
  });

  describe('deleteTransform', () => {
    test('should delete transform owned by user', async () => {
      const user = await testEnv.authenticatedContext('user1');
      const userDb = getDatabase(user.app);

      // Create a transform
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

      await transformService.createTransform(transformData);

      // Delete the transform
      await expect(transformService.deleteTransform('transform1')).resolves.not.toThrow();

      // Verify data was deleted
      const transformRef = ref(userDb, 'transforms/transform1');
      const snapshot = await get(transformRef);
      const data = snapshot.val();

      expect(data).toBeNull();
    });

    test('should fail when trying to delete transform owned by another user', async () => {
      const user1 = await testEnv.authenticatedContext('user1');
      const user2 = await testEnv.authenticatedContext('user2');

      // User1 creates a transform
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

      await transformService.createTransform(transformData);

      // User2 tries to delete it
      await expect(transformService.deleteTransform('transform1')).rejects.toThrow();
    });
  });

  describe('Real-time Subscriptions', () => {
    test('should trigger real-time updates when transform changes', async () => {
      const user1 = await testEnv.authenticatedContext('user1');
      const user2 = await testEnv.authenticatedContext('user2');
      
      const user1Db = getDatabase(user1.app);
      const user2Db = getDatabase(user2.app);

      // Set up listener on user1's side
      const transformsRef = ref(user1Db, 'transforms');
      let receivedData: any = null;
      let updateCount = 0;
      
      const unsubscribe = onValue(transformsRef, (snapshot) => {
        receivedData = snapshot.val();
        updateCount++;
      });

      // User2 creates a transform
      const transformData = {
        id: 'transform1',
        x: 100,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: 'user2',
        isActive: true
      };

      await transformService.createTransform(transformData);

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(updateCount).toBeGreaterThan(0);
      expect(receivedData).toBeDefined();
      expect(receivedData.transform1).toBeDefined();
      expect(receivedData.transform1.updatedBy).toBe('user2');

      // User2 updates the transform
      await transformService.updateTransform('transform1', { x: 150, y: 250 });

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(updateCount).toBeGreaterThan(1);
      expect(receivedData.transform1.x).toBe(150);
      expect(receivedData.transform1.y).toBe(250);

      unsubscribe();
    });
  });
});
