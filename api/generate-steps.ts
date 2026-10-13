import { GoogleGenAI } from '@google/genai';

const MAX_PHOTOS = 13;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const { prompt, subjectHint, photoCount } = req.body || {};

    const count =
      typeof photoCount === 'number' && photoCount > 0
        ? Math.min(photoCount, MAX_PHOTOS)
        : 1;
    const cleanPrompt =
      typeof prompt === 'string' ? prompt.trim().slice(0, 500) : '';
    const cleanSubject =
      typeof subjectHint === 'string' ? subjectHint.trim().slice(0, 100) : '';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: "Le service d'analyse par IA n'est pas configuré. Veuillez vérifier la variable d'environnement GEMINI_API_KEY.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `Tu es l'assistant de l'application Quilo pour collégiens et lycéens.
Ton rôle est de générer entre 4 et 6 étapes de traitement courtes, dynamiques et très précises (4 à 8 mots par étape, se terminant par '...') pour afficher la progression pendant la création d'une fiche.
Format JSON strict uniquement :
{"steps": ["étape 1...", "étape 2...", "étape 3...", "étape 4...", "étape 5..."]}
Ne génère rien d'autre que du JSON.`;

    const userContent = `Nombre de photos : ${count}
Matière : "${cleanSubject || 'Général'}"
Consigne de l'élève : "${cleanPrompt || 'Notions clés'}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userContent,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const clean = (response.text || '')
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(clean);
    if (parsed && Array.isArray(parsed.steps) && parsed.steps.length >= 3) {
      const sanitizedSteps = parsed.steps
        .slice(0, 6)
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => s.trim().slice(0, 80));

      if (sanitizedSteps.length >= 3) {
        return res.status(200).json({ steps: sanitizedSteps });
      }
    }

    return res.status(500).json({
      error: 'Impossible de déterminer les étapes personnalisées.',
    });
  } catch (err: any) {
    console.error('[Vercel generate-steps Error]', err?.status || err?.code || 'internal_error');
    return res.status(500).json({
      error: "Erreur lors de l'initialisation des étapes de génération.",
    });
  }
}
