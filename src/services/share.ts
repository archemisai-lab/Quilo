import { RevisionSheet } from '../types/revision';
import { setSheetSharing } from './sheetsFirestore';

/**
 * Encodes a revision sheet into a URL-safe base64 string
 */
export function encodeSheetForSharing(sheet: RevisionSheet): string {
  const compact = {
    i: sheet.id,
    t: sheet.title,
    s: sheet.subject,
    u: sheet.summary,
    d: sheet.definitions || [],
    k: sheet.keyItems || [],
    c: sheet.sections || [],
    e: sheet.essentialTakeaway || '',
    p: sheet.photoCount || 1,
  };

  try {
    const jsonStr = JSON.stringify(compact);
    // Safe base64 encoding for UTF-8 strings
    const base64 = btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
    return encodeURIComponent(base64);
  } catch (err) {
    console.error('Erreur encodage partage:', err);
    return '';
  }
}

/**
 * Decodes a revision sheet from a shared base64 string
 */
export function decodeSharedSheet(encodedData: string): RevisionSheet | null {
  try {
    const cleanBase64 = decodeURIComponent(encodedData);
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(atob(cleanBase64), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const obj = JSON.parse(jsonStr);
    if (!obj || !obj.t) return null;

    return {
      id: obj.i || `shared_${Date.now()}`,
      title: obj.t,
      subject: obj.s || 'Cours partagé',
      createdAt: new Date().toISOString(),
      promptUsed: 'Fiche partagée',
      photoCount: obj.p || 1,
      summary: obj.u || '',
      definitions: obj.d || [],
      keyItems: obj.k || [],
      sections: obj.c || [],
      essentialTakeaway: obj.e || '',
      isShared: true,
    };
  } catch (err) {
    console.warn('Impossible de décoder la fiche partagée:', err);
    return null;
  }
}

/**
 * Generates the full shareable URL for a sheet
 * Uses Firebase Cloud Firestore link when available
 */
export function getShareUrl(sheet: RevisionSheet): string {
  const origin = window.location.origin;
  if (sheet.id && !sheet.id.startsWith('exemple-')) {
    // Automatically enable sharing on Firebase in background
    setSheetSharing(sheet.id, true).catch(() => {});
    return `${origin}/?sheetId=${sheet.id}`;
  }
  const encoded = encodeSheetForSharing(sheet);
  return `${origin}/?shared=${encoded}`;
}

/**
 * Generates the user's requested sharing message text:
 * "Viens voir ma fiche de révision ➡️ https://..."
 */
export function getShareMessage(sheet: RevisionSheet): string {
  const url = getShareUrl(sheet);
  return `Viens voir ma fiche de révision ➡️ ${url}`;
}
