// Presence and cursor-related types
// Defines the shape of real-time presence data

export interface CursorPosition {
  x: number;
  y: number;
}

export interface PresenceData {
  name: string;
  cursor: CursorPosition;
  selectionIds?: string[];
  updatedAt: number;
}

export interface PresenceEntry {
  [uid: string]: PresenceData;
}

export interface OnlineUser {
  uid: string;
  name: string;
  cursor: CursorPosition;
  selectionIds: string[];
  color: string; // Stable color derived from uid
  lastSeen: number;
}

// Type guards for runtime validation
export function isCursorPosition(obj: unknown): obj is CursorPosition {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as CursorPosition).x === 'number' &&
    typeof (obj as CursorPosition).y === 'number'
  );
}

export function isPresenceData(obj: unknown): obj is PresenceData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as PresenceData).name === 'string' &&
    isCursorPosition((obj as PresenceData).cursor) &&
    (typeof (obj as PresenceData).selectionIds === 'undefined' ||
      (Array.isArray((obj as PresenceData).selectionIds) &&
        (obj as PresenceData).selectionIds!.every(id => typeof id === 'string'))) &&
    typeof (obj as PresenceData).updatedAt === 'number'
  );
}

export function isPresenceEntry(obj: unknown): obj is PresenceEntry {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  // Reject arrays
  if (Array.isArray(obj)) {
    return false;
  }
  
  const entry = obj as Record<string, unknown>;
  return Object.values(entry).every(value => isPresenceData(value));
}

// Utility types for presence operations
export type PresenceUpdate = Partial<Omit<PresenceData, 'updatedAt'>> & {
  updatedAt: number;
};

export type CursorUpdate = {
  cursor: CursorPosition;
  updatedAt: number;
};

export type SelectionUpdate = {
  selectionIds: string[];
  updatedAt: number;
};
