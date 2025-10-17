// Core domain types for CollabCanvas

// Rectangle shape interface (Firestore document)
export interface Rect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  updatedAt: number; // ms since epoch
  updatedBy: string; // Firebase Auth uid
}

// User presence interface (Realtime Database)
export interface Presence {
  name: string;
  displayName: string; // user's display name for UI
  cursor: {
    x: number;
    y: number;
  };
  selectionIds: string[]; // selected rectangle ids
  updatedAt: number; // ms since epoch
}

// UI tool modes
export type ToolMode = 'select' | 'create';

// Canvas viewport state
export interface ViewportState {
  scale: number;
  x: number; // pan x offset
  y: number; // pan y offset
}

// Real-time transform interface (Realtime Database)
export interface Transform {
  id: string; // rectangle id
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  updatedAt: number; // ms since epoch
  updatedBy: string; // Firebase Auth uid
  isActive: boolean; // true during active transformation
}

// Transform operation types
export type TransformOperation = 'move' | 'resize' | 'rotate' | 'create' | 'delete';

// Transform subscription callback
export type TransformCallback = (transforms: Record<string, Transform>) => void;

// Object lock interface (Realtime Database)
export interface ObjectLock {
  ownerId: string; // Firebase Auth uid
  ownerName: string; // user's display name
  timestamp: number; // ms since epoch when lock was acquired
}
