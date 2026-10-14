export interface DefinitionItem {
  term: string;
  definition: string;
}

export interface KeyItem {
  label: string;
  detail: string;
}

export interface SectionBlock {
  title: string;
  points: string[];
}

export interface RevisionSheet {
  id: string;
  userId?: string;
  authorName?: string;
  title: string;
  subject: string;
  createdAt: string;
  updatedAt?: string;
  promptUsed: string;
  photoCount: number;
  thumbnail?: string; // Base64 compressed preview
  summary: string;
  definitions: DefinitionItem[];
  keyItems: KeyItem[]; // Dates, Formules, Repères clés
  sections: SectionBlock[];
  essentialTakeaway: string; // "L'essentiel pour le contrôle"
  isShared?: boolean;
  shareSlug?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  schoolGrade?: string;
  createdAt: string;
  updatedAt?: string;
  photoUrl?: string;
}

export interface UploadedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  compressedBase64?: string;
  name: string;
  size: number;
}

export type PageRoute =
  | 'landing'
  | 'upload'
  | 'prompt'
  | 'generating'
  | 'result'
  | 'my-sheets'
  | 'legal'
  | 'privacy'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'profile'
  | 'shared-sheet';
