// Firebase Authentication service singleton
// Provides typed access to Firebase Auth with proper initialization

import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirebaseApp } from './app';
import { env } from '../../config/env';

let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (auth) {
    return auth;
  }

  const app = getFirebaseApp();
  auth = getAuth(app);

  // Connect to emulator in development if available
  if (env.mode === 'development' && !auth.emulatorConfig) {
    const authEmulatorHost = process.env.VITE_FIREBASE_AUTH_EMULATOR_HOST;
    if (authEmulatorHost) {
      try {
        connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true });
      } catch (error) {
        // Emulator connection failed, continue with production auth
        console.warn('Failed to connect to Auth emulator:', error);
      }
    }
  }

  return auth;
}

// Export the auth instance for direct access if needed
export const firebaseAuth = getFirebaseAuth();
