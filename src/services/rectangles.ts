// Rectangles service for Firestore CRUD operations
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from '../config/firebaseClient';
import type { Rect } from '../types';

// Firestore collection reference
const RECTANGLES_COLLECTION = 'rectangles';

// Firestore converter for Rect documents
export const rectConverter = {
  toFirestore: (rect: Omit<Rect, 'id'>) => ({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    rotation: rect.rotation,
    updatedAt: serverTimestamp(),
    updatedBy: rect.updatedBy,
  }),
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      rotation: data.rotation,
      updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
      updatedBy: data.updatedBy,
    } as Rect;
  },
};

/**
 * Create a new rectangle in Firestore
 * @param rect - Rectangle data (without id)
 * @returns Promise with the created rectangle ID
 */
export const createRectangle = async (rect: Omit<Rect, 'id'>): Promise<string> => {
  const docRef = await addDoc(
    collection(firestore, RECTANGLES_COLLECTION).withConverter(rectConverter),
    rect
  );
  return docRef.id;
};

/**
 * Update an existing rectangle in Firestore
 * @param id - Rectangle ID
 * @param updates - Partial rectangle data to update
 * @returns Promise that resolves when update is complete
 */
export const updateRectangle = async (
  id: string, 
  updates: Partial<Omit<Rect, 'id'>>
): Promise<void> => {
  const rectRef = doc(firestore, RECTANGLES_COLLECTION, id);
  await updateDoc(rectRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete a rectangle from Firestore
 * @param id - Rectangle ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteRectangle = async (id: string): Promise<void> => {
  const rectRef = doc(firestore, RECTANGLES_COLLECTION, id);
  await deleteDoc(rectRef);
};

/**
 * Delete multiple rectangles from Firestore
 * @param ids - Array of rectangle IDs to delete
 * @returns Promise that resolves when all deletions are complete
 */
export const deleteRectangles = async (ids: string[]): Promise<void> => {
  const deletePromises = ids.map(id => deleteRectangle(id));
  await Promise.all(deletePromises);
};

/**
 * Subscribe to rectangles collection with real-time updates
 * @param onUpdate - Callback function called when rectangles change
 * @param onError - Optional error callback
 * @returns Unsubscribe function
 */
export const subscribeToRectangles = (
  onUpdate: (rectangles: Rect[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(
    collection(firestore, RECTANGLES_COLLECTION).withConverter(rectConverter),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rectangles: Rect[] = [];
      snapshot.forEach((doc) => {
        rectangles.push(doc.data());
      });
      onUpdate(rectangles);
    },
    (error) => {
      console.error('Error listening to rectangles:', error);
      onError?.(error);
    }
  );
};

/**
 * Get a single rectangle by ID
 * @param id - Rectangle ID
 * @returns Promise with rectangle data or null if not found
 */
export const getRectangle = async (id: string): Promise<Rect | null> => {
  const rectRef = doc(firestore, RECTANGLES_COLLECTION, id).withConverter(rectConverter);
  const snapshot = await rectRef.get();
  return snapshot.exists() ? snapshot.data() : null;
};
