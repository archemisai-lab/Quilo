import React, { useState, useEffect } from 'react';
import { PageRoute, UploadedPhoto } from '../types/revision';
import { ArrowLeft, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PromptPageProps {
  photos: UploadedPhoto[];
  prompt: string;
  onPromptChange: (prompt: string) => void;
  subjectHint: string;
  onSubjectHintChange: (subject: string) => void;
  onNavigate: (page: PageRoute) => void;
  onStartGeneration: () => void;
  onCancel?: () => void;
}

const QUICK_CHIPS = [
  'Toutes les définitions du cours',
  'Les dates clés et repères chronologiques',
  'Les formules et propriétés à retenir',
  'Causes, déroulement et conséquences',
  'Vocabulaire et notions fondamentales',
  'Schémas, légendes et synthèse générale',
];

const SUBJECTS = [
  'Histoire-Géo',
  'SVT',
  'Physique-Chimie',
  'Mathématiques',
  'Français',
  'Philosophie',
  'Anglais / LV1',
  'Espagnol / LV2',
  'Autre matière',
];

export const PromptPage: React.FC<PromptPageProps> = ({
  photos,
  prompt,
  onPromptChange,
  subjectHint,
  onSubjectHintChange,
  onNavigate,
  onStartGeneration,
  onCancel,
}) => {
  const { user } = useAuth();
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  // Strict route & creation guard
  useEffect(() => {
    if (!user) {
      onNavigate('login');
    }
  }, [user, onNavigate]);

  if (!user) {
    return null;
  }

  const handleChipClick = (chip: string) => {
    setSelectedChip(chip);
    if (!prompt.trim()) {
      onPromptChange(chip);
    } else if (!prompt.includes(chip)) {
      onPromptChange(`${prompt.trim()} + ${chip.toLowerCase()}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-[#4B5A70] mb-2">
          <span className="text-[#385DE8]">Étape 2 sur 3 • Consigne de révision</span>
          <span>{photos.length} photo{photos.length > 1 ? 's' : ''} prête{photos.length > 1 ? 's' : ''}</span>
        </div>
        <div className="w-full h-1.5 bg-[#E1E7F0] rounded-full overflow-hidden">
          <div className="h-full bg-[#5B8DEF] w-2/3 transition-all duration-300" />
        </div>
      </div>

      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1E2A3A]">
          Que souhaitez-vous retenir de ce cours ?
        </h1>
        <p className="text-sm text-[#4B5A70] mt-1">
          Précisez l'objectif de votre évaluation pour obtenir une fiche sur-mesure.
        </p>
      </div>

      {/* Subject selector (optional quick tag) */}
      <div className="mb-6 bg-[#FFFFFF] border border-[#E1E7F0] rounded-xl p-4">
        <label className="block text-xs font-semibold text-[#1E2A3A] mb-2">
          Matière du cours (recommandé pour adapter le vocabulaire)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SUBJECTS.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => onSubjectHintChange(subjectHint === sub ? '' : sub)}
              className={`px-3 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                subjectHint === sub
                  ? 'bg-[#5B8DEF] border-[#5B8DEF] text-white font-medium'
                  : 'bg-[#F4F6FA] border-[#E1E7F0] text-[#4B5A70] hover:text-[#1E2A3A]'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FFC04D]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1E2A3A]">
            Suggestions rapides en un clic
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all text-left cursor-pointer ${
                prompt.includes(chip)
                  ? 'border-[#5B8DEF] bg-[#5B8DEF]/10 text-[#385DE8] font-semibold'
                  : 'border-[#E1E7F0] bg-white text-[#1E2A3A] hover:border-[#5B8DEF]/40'
              }`}
            >
              + {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Free Text Prompt Area */}
      <div className="mb-8 bg-[#FFFFFF] border border-[#E1E7F0] rounded-xl p-4">
        <label className="block text-xs font-semibold text-[#1E2A3A] mb-2">
          Votre consigne précise ou personnalisée
        </label>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Ex : Toutes les définitions, les 3 dates importantes, et la formule du calcul..."
          className="w-full text-sm text-[#1E2A3A] placeholder-[#4B5A70]/60 border border-[#E1E7F0] rounded-lg p-3 focus:outline-none focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF]"
        />
        <div className="flex items-center justify-between mt-2 text-[11px] text-[#4B5A70]">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Plus la consigne est ciblée, plus la fiche est percutante.
          </span>
          <span>{prompt.length} caractères</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E1E7F0]">
        <button
          onClick={() => onNavigate('upload')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#4B5A70] hover:text-[#1E2A3A] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Modifier les photos</span>
        </button>

        <button
          onClick={onStartGeneration}
          className="flex items-center gap-2 px-6 py-3 bg-[#5B8DEF] hover:bg-[#385DE8] text-white font-heading font-semibold text-sm rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          <span>Générer ma fiche</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
