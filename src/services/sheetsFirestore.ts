import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, removeUndefinedFields } from './firebase';
import { RevisionSheet } from '../types/revision';

const SHEETS_COLLECTION = 'sheets';

/**
 * Fetch all revision sheets belonging to a specific user
 */
export async function getUserSheets(userId: string): Promise<RevisionSheet[]> {
  try {
    const q = query(collection(db, SHEETS_COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const sheets: RevisionSheet[] = [];
    snapshot.forEach((d) => {
      sheets.push(d.data() as RevisionSheet);
    });

    // Sort most recent first
    return sheets.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, SHEETS_COLLECTION);
  }
}

/**
 * Real-time listener for user revision sheets (synchronization between devices)
 */
export function subscribeToUserSheets(
  userId: string,
  onUpdate: (sheets: RevisionSheet[]) => void
): () => void {
  const q = query(collection(db, SHEETS_COLLECTION), where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const sheets: RevisionSheet[] = [];
      snapshot.forEach((d) => {
        sheets.push(d.data() as RevisionSheet);
      });
      sheets.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      onUpdate(sheets);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, SHEETS_COLLECTION);
    }
  );

  return unsubscribe;
}

/**
 * Get a single sheet by ID (works for owner or shared public sheet)
 */
export async function getSheetById(id: string): Promise<RevisionSheet | null> {
  const sheetRef = doc(db, SHEETS_COLLECTION, id);
  try {
    const snap = await getDoc(sheetRef);
    if (!snap.exists()) return null;
    return snap.data() as RevisionSheet;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${SHEETS_COLLECTION}/${id}`);
  }
}

/**
 * Save or update a revision sheet in Firestore
 */
export async function saveSheetToFirestore(
  sheet: RevisionSheet,
  userId: string,
  authorName?: string
): Promise<void> {
  const cleanId = sheet.id || `sheet_${Date.now()}`;
  const sheetRef = doc(db, SHEETS_COLLECTION, cleanId);

  const payload: RevisionSheet = {
    ...sheet,
    id: cleanId,
    userId,
    authorName: authorName || sheet.authorName || 'Étudiant Quilo',
    createdAt: sheet.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isShared: sheet.isShared ?? false,
    promptUsed: sheet.promptUsed || 'Révision complète',
    photoCount: sheet.photoCount ?? 1,
    summary: sheet.summary || '',
    essentialTakeaway: sheet.essentialTakeaway || '',
    definitions: sheet.definitions || [],
    keyItems: sheet.keyItems || [],
    sections: sheet.sections || [],
  };

  try {
    await setDoc(sheetRef, removeUndefinedFields(payload), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SHEETS_COLLECTION}/${cleanId}`);
  }
}

/**
 * Delete a revision sheet
 */
export async function deleteSheetFromFirestore(id: string): Promise<void> {
  const sheetRef = doc(db, SHEETS_COLLECTION, id);
  try {
    await deleteDoc(sheetRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${SHEETS_COLLECTION}/${id}`);
  }
}

/**
 * Delete all revision sheets belonging to a user (used when deleting account)
 */
export async function deleteAllUserSheets(userId: string): Promise<void> {
  try {
    const q = query(collection(db, SHEETS_COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, SHEETS_COLLECTION);
  }
}

/**
 * Toggle sharing permission for a sheet
 */
export async function setSheetSharing(id: string, isShared: boolean): Promise<void> {
  const sheetRef = doc(db, SHEETS_COLLECTION, id);
  try {
    await updateDoc(sheetRef, {
      isShared,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${SHEETS_COLLECTION}/${id}`);
  }
}
