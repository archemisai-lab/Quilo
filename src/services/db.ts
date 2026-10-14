import { RevisionSheet } from '../types/revision';
import {
  getUserSheets,
  getSheetById as getSheetFromFs,
  saveSheetToFirestore,
  deleteSheetFromFirestore,
} from './sheetsFirestore';
import { auth } from './firebase';

export const sampleRevisionSheet: RevisionSheet = {
  id: 'exemple-ww1',
  title: 'La Première Guerre Mondiale (1914-1918)',
  subject: 'Histoire - 3e',
  createdAt: new Date().toISOString(),
  promptUsed: 'Toutes les définitions et les dates repères indispensables',
  photoCount: 3,
  summary:
    'Conflit mondial total marqué par le passage d’une guerre de mouvement à une guerre de tranchées extrêmement meurtrière, mobilisant toutes les ressources des sociétés civiles et militaires.',
  definitions: [
    {
      term: 'Guerre totale',
      definition:
        'Conflit qui mobilise l’ensemble des forces d’un pays : militaires, civils, économie, propagande et sciences.',
    },
    {
      term: 'Guerre de position (tranchées)',
      definition:
        'Phase où les armées s’enterrent dans des réseaux de tranchées pour défendre leurs lignes sans progression majeure.',
    },
    {
      term: 'Génocide des Arméniens',
      definition:
        'Extermination systématique et planifiée ordonnée par l’Empire ottoman en 1915-1916 (entre 1 et 1,5 million de victimes).',
    },
    {
      term: 'Poilus',
      definition:
        'Surnom affectueux donné aux soldats français des tranchées, symbolisant leur courage et leurs conditions de vie effroyables.',
    },
    {
      term: 'Propagande / Bourrage de crâne',
      definition:
        'Moyens mis en œuvre par les États pour contrôler l’opinion publique, masquer les revers et maintenir le moral.',
    },
  ],
  keyItems: [
    {
      label: '28 juin 1914',
      detail: 'Attentat de Sarajevo contre l’archiduc François-Ferdinand, élément déclencheur des alliances.',
    },
    {
      label: 'Fév. - Déc. 1916',
      detail: 'Bataille de Verdun (plus de 300 000 morts, symbole de l’enfer des tranchées).',
    },
    {
      label: '1917',
      detail: 'Entrée en guerre des États-Unis et révolutions russes (retrait de la Russie).',
    },
    {
      label: '11 nov. 1918',
      detail: 'Signature de l’armistice à Rethondes mettant fin aux combats.',
    },
    {
      label: '28 juin 1919',
      detail: 'Traité de Versailles imposant des sanctions sévères à l’Allemagne (le "Diktat").',
    },
  ],
  sections: [
    {
      title: '1. Les phases du conflit',
      points: [
        '1914 : Guerre de mouvement rapide sur le front ouest.',
        '1915-1917 : Guerre de tranchées et d’usure (Verdun, la Somme).',
        '1918 : Reprise de la guerre de mouvement suite aux offensives alliées.',
      ],
    },
    {
      title: '2. Une violence de masse inédite',
      points: [
        'Armes industrielles destructrices : obus, gaz asphyxiants, mitrailleuses et chars.',
        'Traumatismes profonds chez les soldats (gueules cassées, choc post-traumatique).',
        'Implication majeure des femmes à l’arrière (usines d’armement "munitionnettes", champs).',
      ],
    },
  ],
  essentialTakeaway:
    'Retenir les 3 phases de la guerre, la définition de "guerre totale" et les dates de Verdun (1916) et de l’armistice (11 nov. 1918).',
};

/**
 * All data storage now runs exclusively via Firebase Cloud Firestore.
 * IndexedDB has been completely removed.
 */
export async function getAllSheets(currentUserId?: string): Promise<RevisionSheet[]> {
  const uid = currentUserId || auth.currentUser?.uid;
  if (!uid) {
    return [];
  }
  return getUserSheets(uid);
}

export async function getSheetById(id: string): Promise<RevisionSheet | undefined> {
  const result = await getSheetFromFs(id);
  return result || undefined;
}

export async function saveSheet(sheet: RevisionSheet, currentUserId?: string): Promise<void> {
  const uid = currentUserId || auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Vous devez être connecté pour enregistrer une fiche sur Firebase.');
  }
  await saveSheetToFirestore(sheet, uid, auth.currentUser?.displayName || undefined);
}

export async function deleteSheet(id: string): Promise<void> {
  await deleteSheetFromFirestore(id);
}
