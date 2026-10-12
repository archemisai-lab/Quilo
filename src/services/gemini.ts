import { RevisionSheet, UploadedPhoto } from '../types/revision';
import { compressImage } from './imageCompression';

interface GenerateOptions {
  photos: UploadedPhoto[];
  prompt: string;
  subjectHint?: string;
  signal?: AbortSignal;
}

export async function generateRevisionSheet({
  photos,
  prompt,
  subjectHint,
  signal,
}: GenerateOptions): Promise<RevisionSheet> {
  // Compress photos client-side to ensure small payload and fast transfer
  const preparedImages = await Promise.all(
    photos.map(async (p) => {
      if (p.compressedBase64) {
        return {
          data: p.compressedBase64,
          mimeType: 'image/jpeg',
        };
      }
      const compressed = await compressImage(p.file);
      return {
        data: compressed.base64Data,
        mimeType: compressed.mimeType,
      };
    })
  );

  const response = await fetch('/api/generate', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: preparedImages,
      prompt,
      subjectHint,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Erreur serveur lors de la génération (${response.status})`
    );
  }

  const data = await response.json();

  const newSheet: RevisionSheet = {
    id: `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    title: data.title || 'Fiche de révision',
    subject: data.subject || subjectHint || 'Général',
    createdAt: new Date().toISOString(),
    promptUsed: prompt,
    photoCount: photos.length,
    thumbnail: photos[0]?.previewUrl,
    summary: data.summary || '',
    definitions: data.definitions || [],
    keyItems: data.keyItems || [],
    sections: data.sections || [],
    essentialTakeaway: data.essentialTakeaway || '',
  };

  return newSheet;
}
