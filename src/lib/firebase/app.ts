// Firebase app initialization and singleton management
// Provides a single Firebase app instance with proper error handling

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { env } from '../../config/env';

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }

  // Check if Firebase app already exists (prevents duplicate initialization)
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  // Initialize new Firebase app
  const firebaseConfig = {
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain,
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket,
    messagingSenderId: env.firebase.messagingSenderId,
    appId: env.firebase.appId,
    databaseURL: env.firebase.databaseURL,
    ...(env.firebase.measurementId && { measurementId: env.firebase.measurementId }),
  };

  try {
    app = initializeApp(firebaseConfig);
    return app;
  } catch (error) {
    throw new Error(`Failed to initialize Firebase app: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export the app instance for direct access if needed
export const firebaseApp = getFirebaseApp();
