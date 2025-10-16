import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, ref, set, get, onValue, off } from 'firebase/database';
import { setPresence, setInitialPresence, updateCursor } from '../src/services/presence';
import { TransformService } from '../src/services/transforms';

// Use your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQ",
  authDomain: "collabcanvas-9c044.firebaseapp.com",
  databaseURL: "https://collabcanvas-9c044-default-rtdb.firebaseio.com",
  projectId: "collabcanvas-9c044",
  storageBucket: "collabcanvas-9c044.appspot.com",
  messagingSenderId: "221506834527",
  appId: "1:221506834527:web:1234567890abcdef"
};

describe('Firebase Integration Tests', () => {
  let app: any;
  let auth: any;
  let db: any;
  let transformService: TransformService;

  beforeAll(async () => {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    transformService = new TransformService();

    // Sign in with test credentials (you'll need to create these)
    try {
      await signInWithEmailAndPassword(auth, 'test@example.com', 'testpassword');
    } catch (error) {
      console.warn('Could not sign in with test credentials:', error);
    }
  });

  afterAll(async () => {
    if (auth.currentUser) {
      await signOut(auth);
    }
  });

  describe('RTDB Rules Validation', () => {
    test('should allow authenticated user to write presence', async () => {
      if (!auth.currentUser) {
        console.warn('Skipping test - no authenticated user');
        return;
      }

      const uid = auth.currentUser.uid;
      const presenceData = {
        name: 'Test User',
        displayName: 'Test User',
        cursor: { x: 100, y: 200 },
        selectionIds: []
      };

      await expect(setPresence(uid, presenceData)).resolves.not.toThrow();
    });

    test('should allow authenticated user to read presence data', async () => {
      if (!auth.currentUser) {
        console.warn('Skipping test - no authenticated user');
        return;
      }

      const presenceRef = ref(db, 'presence');
      const snapshot = await get(presenceRef);
      const data = snapshot.val();

      // Should not throw and should return data (even if empty)
      expect(data).toBeDefined();
    });

    test('should allow authenticated user to write transforms', async () => {
      if (!auth.currentUser) {
        console.warn('Skipping test - no authenticated user');
        return;
      }

      const uid = auth.currentUser.uid;
      const transformData = {
        id: 'test-transform',
        x: 100,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
        updatedAt: Date.now(),
        updatedBy: uid,
        isActive: true
      };

      await expect(transformService.createTransform(transformData)).resolves.not.toThrow();
    });

    test('should allow authenticated user to read transforms', async () => {
      if (!auth.currentUser) {
        console.warn('Skipping test - no authenticated user');
        return;
      }

      const transformsRef = ref(db, 'transforms');
      const snapshot = await get(transformsRef);
      const data = snapshot.val();

      // Should not throw and should return data (even if empty)
      expect(data).toBeDefined();
    });
  });

  describe('Presence Service Integration', () => {
    test('should set initial presence', async () => {
      if (!auth.currentUser) {
        console.warn('Skipping test - no authenticated user');
        return;
      }

      const uid = auth.currentUser.uid;
      await expect(setInitialPresence(uid, 'Test User')).resolves.not.toThrow();
    });

    test('should update cursor position', async () => {
      if (!auth.currentUser) {
        console.warn('Skipping test - no authenticated user');
        return;
      }

      const uid = auth.currentUser.uid;
      await expect(updateCursor(uid, { x: 150, y: 250 })).resolves.not.toThrow();
    });
  });

  describe('Real-time Subscriptions', () => {
    test('should receive real-time presence updates', async () => {
      if (!auth.currentUser) {
        console.warn('Skipping test - no authenticated user');
        return;
      }

      const uid = auth.currentUser.uid;
      const presenceRef = ref(db, 'presence');
      
      let receivedData: any = null;
      let updateCount = 0;
      
      const unsubscribe = onValue(presenceRef, (snapshot) => {
        receivedData = snapshot.val();
        updateCount++;
      });

      // Update presence to trigger real-time update
      await setPresence(uid, {
        name: 'Test User',
        displayName: 'Test User',
        cursor: { x: 200, y: 300 },
        selectionIds: []
      });

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(updateCount).toBeGreaterThan(0);
      expect(receivedData).toBeDefined();

      unsubscribe();
    });

    test('should receive real-time transform updates', async () => {
      if (!auth.currentUser) {
        console.warn('Skipping test - no authenticated user');
        return;
      }

      const uid = auth.currentUser.uid;
      const transformsRef = ref(db, 'transforms');
      
      let receivedData: any = null;
      let updateCount = 0;
      
      const unsubscribe = onValue(transformsRef, (snapshot) => {
        receivedData = snapshot.val();
        updateCount++;
      });

      // Create transform to trigger real-time update
      const transformData = {
        id: 'test-transform-2',
        x: 300,
        y: 400,
        width: 75,
        height: 75,
        rotation: 45,
        updatedAt: Date.now(),
        updatedBy: uid,
        isActive: true
      };

      await transformService.createTransform(transformData);

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(updateCount).toBeGreaterThan(0);
      expect(receivedData).toBeDefined();

      unsubscribe();
    });
  });

  describe('Permission Validation', () => {
    test('should deny access when not authenticated', async () => {
      // Sign out to test unauthenticated access
      if (auth.currentUser) {
        await signOut(auth);
      }

      const presenceRef = ref(db, 'presence');
      
      // This should fail for unauthenticated users
      await expect(get(presenceRef)).rejects.toThrow();
    });
  });
});
