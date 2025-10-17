// Firebase Realtime Database service singleton
// Provides typed access to RTDB with proper initialization

import { getDatabase, Database, connectDatabaseEmulator } from 'firebase/database';
import { getFirebaseApp } from './app';
import { env } from '../../config/env';

let database: Database | null = null;

export function getFirebaseDatabase(): Database {
  if (database) {
    return database;
  }

  const app = getFirebaseApp();
  database = getDatabase(app);

  // Connect to emulator in development if available
  if (env.mode === 'development' && !database._delegate._repoInternal._repoInfo_.host.includes('localhost')) {
    const rtdbEmulatorHost = process.env.VITE_FIREBASE_RTDB_EMULATOR_HOST;
    if (rtdbEmulatorHost) {
      try {
        const [host, port] = rtdbEmulatorHost.split(':');
        connectDatabaseEmulator(database, host, parseInt(port, 10));
      } catch (error) {
        // Emulator connection failed, continue with production RTDB
        console.warn('Failed to connect to RTDB emulator:', error);
      }
    }
  }

  return database;
}

// Export the database instance for direct access if needed
export const firebaseDatabase = getFirebaseDatabase();
