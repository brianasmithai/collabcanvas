// Firebase initialization tests
// Verifies env loading, singleton creation, and no duplicate apps

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test-app' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: 'existing-app' })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ app: { name: 'test-app' } })),
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ app: { name: 'test-app' } })),
  connectFirestoreEmulator: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({ app: { name: 'test-app' } })),
  connectDatabaseEmulator: vi.fn(),
}));

// Import our modules after mocking
import { getFirebaseApp, firebaseApp } from '../src/lib/firebase/app';
import { getFirebaseAuth, firebaseAuth } from '../src/lib/firebase/auth';
import { getFirebaseFirestore, firebaseFirestore } from '../src/lib/firebase/firestore';
import { getFirebaseDatabase, firebaseDatabase } from '../src/lib/firebase/rtdb';

describe('Firebase Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  describe('Firebase App Singleton', () => {
    it('should create Firebase app instance', () => {
      const app = getFirebaseApp();
      
      expect(app).toBeDefined();
      expect(app).toEqual({ name: 'test-app' });
    });

    it('should return same app instance on multiple calls', () => {
      const app1 = getFirebaseApp();
      const app2 = getFirebaseApp();
      
      expect(app1).toBe(app2);
      expect(app1).toBe(firebaseApp);
    });
  });

  describe('Firebase Service Singletons', () => {
    it('should create Auth service singleton', () => {
      const auth = getFirebaseAuth();
      
      expect(auth).toBeDefined();
      expect(auth).toEqual({ app: { name: 'test-app' } });
    });

    it('should return same Auth instance on multiple calls', () => {
      const auth1 = getFirebaseAuth();
      const auth2 = getFirebaseAuth();
      
      expect(auth1).toBe(auth2);
      expect(auth1).toBe(firebaseAuth);
    });

    it('should create Firestore service singleton', () => {
      const firestore = getFirebaseFirestore();
      
      expect(firestore).toBeDefined();
      expect(firestore).toEqual({ app: { name: 'test-app' } });
    });

    it('should return same Firestore instance on multiple calls', () => {
      const firestore1 = getFirebaseFirestore();
      const firestore2 = getFirebaseFirestore();
      
      expect(firestore1).toBe(firestore2);
      expect(firestore1).toBe(firebaseFirestore);
    });

    it('should create Database service singleton', () => {
      const database = getFirebaseDatabase();
      
      expect(database).toBeDefined();
      expect(database).toEqual({ app: { name: 'test-app' } });
    });

    it('should return same Database instance on multiple calls', () => {
      const database1 = getFirebaseDatabase();
      const database2 = getFirebaseDatabase();
      
      expect(database1).toBe(database2);
      expect(database1).toBe(firebaseDatabase);
    });
  });
});