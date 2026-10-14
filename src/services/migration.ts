import { openDB } from 'idb';
import { RevisionSheet } from '../types/revision';
import { saveSheetToFirestore } from './sheetsFirestore';

const LEGACY_DB_NAME = 'quilo_sheets_db';

/**
 * Migrates existing sheets from IndexedDB to Firebase Cloud Firestore for the logged-in user.
 * Once successfully copied to Firebase, cleanly purges the legacy IndexedDB.
 */
export async function migrateIndexedDBToFirestore(userId: string): Promise<number> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return 0;
  }

  const migrationKey = `quilo_migrated_user_${userId}`;
  if (localStorage.getItem(migrationKey) === 'true') {
    return 0;
  }

  let migratedCount = 0;

  try {
    // Check if the legacy database exists
    const db = await openDB(LEGACY_DB_NAME, 1, {
      upgrade(database) {
        // If it didn't exist, it will just create an empty structure
        if (!database.objectStoreNames.contains('sheets')) {
          database.createObjectStore('sheets', { keyPath: 'id' });
        }
      },
    });

    const legacySheets: RevisionSheet[] = await db.getAll('sheets');
    db.close();

    if (legacySheets && legacySheets.length > 0) {
      for (const sheet of legacySheets) {
        // Only migrate valid sheets
        if (sheet && sheet.title) {
          await saveSheetToFirestore(sheet, userId);
          migratedCount++;
        }
      }
    }

    // Now completely delete the IndexedDB to ensure no leftover legacy storage
    try {
      window.indexedDB.deleteDatabase(LEGACY_DB_NAME);
    } catch (delErr) {
      console.warn('Erreur suppression base IndexedDB:', delErr);
    }

    // Mark migration as done for this account
    localStorage.setItem(migrationKey, 'true');
    console.log(`Migration Firebase réussie : ${migratedCount} fiche(s) transférée(s).`);
  } catch (err) {
    console.error('Erreur durant la migration IndexedDB vers Firebase:', err);
  }

  return migratedCount;
}
