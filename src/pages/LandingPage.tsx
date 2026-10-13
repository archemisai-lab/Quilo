import React, { useState } from 'react';
import { PageRoute, RevisionSheet } from '../types/revision';
import { QuiloMascot } from '../assets/QuiloMascot';
import { RevisionSheetView } from '../components/sheet/RevisionSheetView';
import { sampleRevisionSheet } from '../services/db';
import {
  ArrowRight,
  Camera,
  FileCheck2,
  Download,
  ShieldCheck,
  Eye,
  FileText,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectSheet: (sheet: RevisionSheet) => void;
}

// 3 realistic subject samples for the showcase
const SHOWCASE_SAMPLES: Record<string, { label: string; sheet: RevisionSheet }> = {
  histoire: {
    label: 'Histoire (3e)',
    sheet: sampleRevisionSheet,
  },
  svt: {
    label: 'SVT (3e)',
    sheet: {
      id: 'exemple-svt',
      title: 'La Génétique et l’hérédité humaine',
      subject: 'SVT - 3e',
      createdAt: new Date().toISOString(),
      promptUsed: 'Définitions essentielles et chromosomes',
      photoCount: 2,
      summary:
        'L’information génétique est portée par les chromosomes situés dans le noyau des cellules. Chaque individu hérite de caractères provenant de ses deux parents.',
      definitions: [
        {
          term: 'Chromosome',
          definition:
            'Structure cellulaire visible lors de la division, contenant l’ADN et porteuse des gènes de l’individu.',
        },
        {
          term: 'Gène',
          definition:
            'Portion d’ADN déterminant un caractère héréditaire précis (ex: couleur des yeux, groupe sanguin).',
        },
        {
          term: 'Allèle',
          definition:
            'Version différente d’un même gène (ex: allèles A, B ou O pour le groupe sanguin).',
        },
        {
          term: 'Caryotype',
          definition:
            'Photographie ordonnée de l’ensemble des chromosomes d’une cellule (46 chromosomes chez l’humain, 23 paires).',
        },
      ],
      keyItems: [
        {
          label: '23 paires',
          detail: 'Nombre de chromosomes dans l’espèce humaine (22 paires + 1 paire sexuelle).',
        },
        {
          label: 'XX vs XY',
          detail: 'Paire de chromosomes déterminant le sexe biologique (XX pour fille, XY pour garçon).',
        },
        {
          label: 'Dominant / Récessif',
          detail: 'Un allèle dominant s’exprime toujours, un allèle récessif nécessite 2 copies.',
        },
      ],
      sections: [
        {
          title: '1. Transmission des caractères héréditaires',
          points: [
            'Chaque parent transmet la moitié de ses chromosomes lors de la fécondation.',
            'La combinaison aléatoire des allèles explique l’unicité de chaque être humain.',
          ],
        },
      ],
      essentialTakeaway:
        'Retenir la différence entre gène (la fonction) et allèle (la version), ainsi que les 23 paires de chromosomes.',
    },
  },
  maths: {
    label: 'Mathématiques (3e)',
    sheet: {
      id: 'exemple-maths',
      title: 'Théorème de Pythagore et applications',
      subject: 'Mathématiques - 3e',
      createdAt: new Date().toISOString(),
      promptUsed: 'Formules et conditions d’utilisation',
      photoCount: 2,
      summary:
        'Théorème géométrique fondamental permettant de calculer la longueur d’un côté inconnu dans un triangle rectangle, ou de vérifier si un triangle est rectangle grâce à sa réciproque.',
      definitions: [
        {
          term: 'Hypoténuse',
          definition:
            'Le plus grand côté d’un triangle rectangle, toujours situé en face de l’angle droit.',
        },
        {
          term: 'Théorème direct',
          definition:
            'Si un triangle ABC est rectangle en A, alors BC² = AB² + AC² (permet de calculer une longueur).',
        },
        {
          term: 'Réciproque de Pythagore',
          definition:
            'Si dans un triangle ABC, on a BC² = AB² + AC², alors le triangle est rectangle en A.',
        },
      ],
      keyItems: [
        {
          label: 'Condition obligatoire',
          detail: 'Toujours préciser « Le triangle ABC est rectangle en A » avant d’appliquer la formule.',
        },
        {
          label: 'Calcul de l’hypoténuse',
          detail: 'BC = √(AB² + AC²). Toujours garder les valeurs exactes avant d’arrondir.',
        },
        {
          label: 'Calcul d’un côté de l’angle droit',
          detail: 'AB² = BC² - AC² (penser à soustraire et non additionner).',
        },
      ],
      sections: [
        {
          title: '1. Méthode type de rédaction',
          points: [
            '1. Énoncer la nature du triangle (rectangle en quel sommet ?).',
            '2. Citer : « D’après le théorème de Pythagore, on a : »',
            '3. Poser l’égalité avec les lettres, remplacer par les nombres, puis calculer la racine carrée.',
          ],
        },
      ],
      essentialTakeaway:
        'Le théorème calcule une longueur manquante ; la réciproque sert à prouver qu’un angle est droit.',
    },
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onSelectSheet,
}) => {
  const [selectedSampleKey, setSelectedSampleKey] = useState<string>('histoire');
  const currentSample = SHOWCASE_SAMPLES[selectedSampleKey];

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto px-4">
        {/* Mascot */}
        <div className="mb-6 flex justify-center">
          <div className="relative p-2">
            <QuiloMascot size={130} />
          </div>
        </div>

        {/* Heading in Baloo 2 */}
        <h1 className="font-heading font-bold text-3xl sm:text-5xl text-[#1E2A3A] tracking-tight leading-tight">
          Transforme tes photos de cours en{' '}
          <span className="text-[#5B8DEF]">fiche de révision</span> claire
        </h1>

        {/* Description in Inter */}
        <p className="mt-4 text-base sm:text-lg text-[#4B5A70] leading-relaxed max-w-2xl mx-auto">
          Prends en photo les pages de ton cahier ou de ton manuel. Indique ce que tu veux retenir, et Quilo compile l’essentiel en une seule page compacte, prête à imprimer ou réviser.
        </p>

        {/* Primary CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('upload')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#5B8DEF] hover:bg-[#4874D6] text-white font-heading font-semibold text-base rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            <span>Créer ma fiche maintenant</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => {
              onSelectSheet(currentSample.sheet);
              onNavigate('result');
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-[#FFFFFF] border border-[#E1E7F0] hover:bg-[#F4F6FA] text-[#1E2A3A] font-heading font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#4874D6]" />
            <span>Tester les exports avec cet exemple</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#4B5A70]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#4CAF7D]" />
            Sans inscription ni compte
          </span>
          <span className="flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-[#5B8DEF]" />
            Jusqu’à 13 photos par cours
          </span>
          <span className="flex items-center gap-1.5">
            <Download className="w-4 h-4 text-[#FFC04D]" />
            Exports PDF, PNG & Word
          </span>
        </div>
      </section>

      {/* The 3-step sequence */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="border-t border-[#E1E7F0] pt-12">
          <h2 className="font-heading font-bold text-2xl text-center text-[#1E2A3A] mb-8">
            Comment ça marche ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#5B8DEF]/10 text-[#4874D6] flex items-center justify-center font-heading font-bold text-sm">
                1
              </div>
              <h3 className="font-heading font-semibold text-lg text-[#1E2A3A]">
                Photographiez vos cours
              </h3>
              <p className="text-sm text-[#4B5A70] leading-relaxed">
                Prenez jusqu’à 13 photos de vos notes manuscrites ou pages de manuel depuis votre smartphone ou ordinateur.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFC04D]/20 text-[#1E2A3A] flex items-center justify-center font-heading font-bold text-sm">
                2
              </div>
              <h3 className="font-heading font-semibold text-lg text-[#1E2A3A]">
                Donnez votre consigne
              </h3>
              <p className="text-sm text-[#4B5A70] leading-relaxed">
                Choisissez une consigne rapide (« Définitions », « Dates clés », « Formules ») ou écrivez exactement ce que vous voulez retenir.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#4CAF7D]/15 text-[#4CAF7D] flex items-center justify-center font-heading font-bold text-sm">
                3
              </div>
              <h3 className="font-heading font-semibold text-lg text-[#1E2A3A]">
                Récupérez votre fiche unique
              </h3>
              <p className="text-sm text-[#4B5A70] leading-relaxed">
                Une fiche structurée, claire et compacte en moins de 30 secondes, prête à être imprimée ou exportée en PDF, image ou Word.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exemplary Showcase Section: "À quoi ressemble une fiche Quilo ?" */}
      <section className="max-w-4xl mx-auto px-4">
        {/* Section Heading & Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#1E2A3A]">
            À quoi ressemble une fiche Quilo ?
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5A70] mt-2 leading-relaxed">
            Une seule page compacte, claire et aérée, synthétisant l'essentiel de vos notes pour les révisions et le contrôle.
          </p>

          {/* Segmented Subject Selector */}
          <div className="mt-5 inline-flex items-center p-1 bg-[#FFFFFF] border border-[#E1E7F0] rounded-xl shadow-2xs">
            {Object.entries(SHOWCASE_SAMPLES).map(([key, sample]) => {
              const isSelected = selectedSampleKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedSampleKey(key)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#5B8DEF] text-white shadow-xs'
                      : 'text-[#4B5A70] hover:text-[#1E2A3A] hover:bg-[#F4F6FA]'
                  }`}
                >
                  {sample.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clean Paper Surface Display */}
        <div className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl p-5 sm:p-8 shadow-xs">
          {/* Subtle Top Metadata & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[#E1E7F0] text-xs text-[#4B5A70]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4CAF7D]" />
              <span className="font-semibold text-[#1E2A3A]">
                Exemple réel : {currentSample.label}
              </span>
              <span className="text-[#E1E7F0]">•</span>
              <span>Format 1 page A4 prêt à imprimer</span>
            </div>

            <button
              onClick={() => {
                onSelectSheet(currentSample.sheet);
                onNavigate('result');
              }}
              className="inline-flex items-center gap-1 text-[#4874D6] hover:text-[#5B8DEF] font-semibold transition-colors self-start sm:self-auto cursor-pointer"
            >
              <span>Tester les exports avec cet exemple</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Natural Full-Width Document View (No cramped side-split or double-box nesting) */}
          <RevisionSheetView sheet={currentSample.sheet} />

          {/* Bottom Context Bar */}
          <div className="mt-6 pt-5 border-t border-[#E1E7F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4B5A70]">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#5B8DEF]" />
              <span>
                Prêt pour l'impression ou le téléchargement en <strong>PDF</strong>, <strong>Image</strong> ou document <strong>Word</strong>.
              </span>
            </div>

            <button
              onClick={() => {
                onSelectSheet(currentSample.sheet);
                onNavigate('result');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#5B8DEF] hover:bg-[#4874D6] text-white font-heading font-semibold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <span>Ouvrir dans l'outil d'export</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center max-w-xl mx-auto px-4 pb-8">
        <h2 className="font-heading font-bold text-2xl text-[#1E2A3A]">
          Prêt pour votre prochaine évaluation ?
        </h2>
        <p className="text-sm text-[#4B5A70] mt-2 mb-6">
          Pas besoin de créer un compte. Vos fiches restent enregistrées directement sur votre appareil.
        </p>
        <button
          onClick={() => onNavigate('upload')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B8DEF] hover:bg-[#4874D6] text-white font-heading font-semibold text-base rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <Camera className="w-5 h-5" />
          <span>Commencer maintenant</span>
        </button>
      </section>
    </div>
  );
};
