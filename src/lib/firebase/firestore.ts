// Firebase Firestore service singleton
// Provides typed access to Firestore with proper initialization

import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFirebaseApp } from './app';
import { env } from '../../config/env';

let firestore: Firestore | null = null;

export function getFirebaseFirestore(): Firestore {
  if (firestore) {
    return firestore;
  }

  const app = getFirebaseApp();
  firestore = getFirestore(app);

  // Connect to emulator in development if available
  if (env.mode === 'development' && !firestore._delegate._databaseId.projectId.includes('demo-')) {
    const firestoreEmulatorHost = process.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST;
    if (firestoreEmulatorHost) {
      try {
        const [host, port] = firestoreEmulatorHost.split(':');
        connectFirestoreEmulator(firestore, host, parseInt(port, 10));
      } catch (error) {
        // Emulator connection failed, continue with production Firestore
        console.warn('Failed to connect to Firestore emulator:', error);
      }
    }
  }

  return firestore;
}

// Export the firestore instance for direct access if needed
export const firebaseFirestore = getFirebaseFirestore();
