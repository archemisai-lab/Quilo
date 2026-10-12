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
  title: string;
  subject: string;
  createdAt: string;
  promptUsed: string;
  photoCount: number;
  thumbnail?: string; // Base64 compressed preview
  summary: string;
  definitions: DefinitionItem[];
  keyItems: KeyItem[]; // Dates, Formules, Repères clés
  sections: SectionBlock[];
  essentialTakeaway: string; // "L'essentiel pour le contrôle"
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
  | 'privacy';
