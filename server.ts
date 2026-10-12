import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

// Allow large base64 payload for compressed photos (up to 13 photos @ ~200KB each = ~3MB)
app.use(express.json({ limit: '30mb' }));

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Gemini generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { images, prompt, subjectHint } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Au moins une image est requise.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY non fournie. Utilisation du mode démonstration.');
      // Return a realistic structured response if no key is yet injected
      return res.json({
        title: 'Fiche de synthèse : ' + (subjectHint || 'Notions clés du cours'),
        subject: subjectHint || 'Cours général',
        summary:
          'Synthèse compacte extraite des notes photographiées. Ce document récapitule les points essentiels, définitions fondamentales et repères à mémoriser pour l’évaluation.',
        definitions: [
          {
            term: 'Notion principale',
            definition:
              'Concept central identifié sur les pages manuscrites, définissant les règles et mécanismes du chapitre.',
          },
          {
            term: 'Méthode d’application',
            definition:
              'Démarche étape par étape observée dans les exercices et exemples du cours.',
          },
        ],
        keyItems: [
          {
            label: 'Règle essentielle',
            detail: 'Toujours vérifier les conditions d’application avant d’utiliser la formule.',
          },
          {
            label: 'Repère clé',
            detail: 'Point d’ancrage chronologique ou logique mis en exergue dans le cahier.',
          },
        ],
        sections: [
          {
            title: '1. Notions et mécanismes fondamentaux',
            points: [
              'Premier principe mis en avant dans la leçon.',
              'Éléments d’exemples travaillés en classe.',
              'Pièges fréquents signalés dans les annotations de l’élève.',
            ],
          },
          {
            title: '2. Formules et applications directes',
            points: [
              'Relations mathématiques / scientifiques / logiques déduites des observations.',
              'Étapes types de résolution.',
            ],
          },
        ],
        essentialTakeaway:
          'Bien mémoriser les définitions fondamentales et la méthode type pour réussir l’évaluation.',
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

    // Prepare contents: images + structured prompt
    const contents: any[] = [];

    // Add compressed image parts
    for (const img of images) {
      contents.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType || 'image/jpeg',
        },
      });
    }

    const systemInstructions = `Tu es l'assistant IA de Quilo, une application conçue pour des élèves de collège et de lycée.
Ton rôle est d'analyser les photos de cours fournies (pages de cahier manuscrites, fiches, ou pages de manuel scolaire) et d'extraire UNIQUEMENT une fiche de révision claire, compacte, synthétique et directe.

Consigne spécifique de l'élève : "${prompt || 'Toutes les notions, définitions et repères importants'}"
${subjectHint ? `Matière indiquée : ${subjectHint}` : ''}

Règles impératives :
1. Réponds STRICTEMENT au format JSON avec la structure exacte suivante :
{
  "title": "Titre précis et concis du chapitre ou du sujet",
  "subject": "Nom de la matière (ex: Histoire-Géo, SVT, Mathématiques, Français, Physique-Chimie, Espagnol...)",
  "summary": "Résumé en 2 à 3 phrases claires et percutantes",
  "definitions": [
    { "term": "Terme / Vocabulaire", "definition": "Définition simple et exacte" }
  ],
  "keyItems": [
    { "label": "Date / Formule / Repère", "detail": "Explication courte" }
  ],
  "sections": [
    {
      "title": "Titre court de la partie",
      "points": ["Point clé 1", "Point clé 2"]
    }
  ],
  "essentialTakeaway": "La phrase ou les 2 points indispensables à retenir absolument pour avoir la moyenne ou réussir le contrôle"
}

2. Reste compact : la fiche doit tenir idéalement sur une seule page de révision visuelle. Ne rajoute pas de blabla.
3. Si une partie des notes est illisible ou floue, concentre-toi sur ce qui est parfaitement déchiffrable.
4. Remplis les champs avec précision, en français soigné et accessible pour des collégiens ou lycéens.
5. N'inclus aucun Markdown autour du JSON (pas de \`\`\`json). Juste le JSON brut.`;

    contents.push({ text: systemInstructions });

    let responseText = '';
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      responseText = result.text || '';
    } catch (modelErr: any) {
      console.warn('Fallback to gemini-3.5-flash-lite:', modelErr);
      const fallbackResult = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      responseText = fallbackResult.text || '';
    }

    // Clean JSON response if any code block exists
    const cleanJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Erreur API Generate:', err);
    return res.status(500).json({
      error: 'Erreur lors de la génération de la fiche : ' + (err.message || 'Erreur inconnue'),
    });
  }
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur Quilo prêt sur le port ${PORT}`);
  });
}

startServer();
