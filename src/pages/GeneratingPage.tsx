import React, { useEffect, useState } from 'react';
import { QuiloMascot } from '../assets/QuiloMascot';
import { CheckCircle2, Loader2, Sparkles, X } from 'lucide-react';

interface GeneratingPageProps {
  photoCount: number;
  onCancel: () => void;
  steps: string[];
}

export const GeneratingPage: React.FC<GeneratingPageProps> = ({
  photoCount,
  onCancel,
  steps,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Smooth progression across the dynamic steps (max 6 steps)
  useEffect(() => {
    if (!steps || steps.length === 0) return;

    // Advance step every 3.8 to 4.5 seconds depending on step count
    const intervalTime = Math.max(3400, Math.floor(22000 / steps.length));
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, intervalTime);

    return () => clearInterval(interval);
  }, [steps]);

  const activeSteps =
    steps && steps.length > 0
      ? steps
      : [
          `Déchiffrage et amélioration des ${photoCount} photos de cours...`,
          'Recherche des définitions et repères clés...',
          'Synthèse de l’essentiel pour le contrôle...',
          'Finalisation de la fiche visuelle compacte...',
        ];

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16 text-center">
      {/* Central Scanning Mascot with elevated animations */}
      <div className="mb-8 flex justify-center">
        <div className="relative">
          <QuiloMascot size={150} isScanning={true} />
          {/* Gentle ambient halo aura */}
          <div className="absolute inset-0 bg-[#5B8DEF]/15 blur-2xl rounded-full -z-10 animate-pulse pointer-events-none" />
        </div>
      </div>

      {/* Main Title */}
      <h1 className="font-heading font-bold text-2xl text-[#1E2A3A] mb-2">
        Quilo scanne et compile votre cours
      </h1>
      <p className="text-xs text-[#4B5A70] mb-8">
        Analyse de {photoCount} photo{photoCount > 1 ? 's' : ''} en cours • Moins de 25 secondes
      </p>

      {/* Dynamic AI-generated step by step checklist (Max 6 steps) */}
      <div className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl p-5 text-left space-y-3.5 shadow-2xs mb-6">
        {activeSteps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs transition-all duration-200 ${
                isDone
                  ? 'text-[#4CAF7D] font-medium'
                  : isCurrent
                  ? 'text-[#1E2A3A] font-semibold translate-x-0.5'
                  : 'text-[#4B5A70]/50'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-[#4CAF7D] shrink-0" />
              ) : isCurrent ? (
                <div className="relative flex items-center justify-center shrink-0 w-4 h-4">
                  <Loader2 className="w-4 h-4 text-[#5B8DEF] animate-spin" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-[#E1E7F0] shrink-0" />
              )}
              <span className="leading-relaxed">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Cancel button during active creation */}
      <div className="mb-6">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#4B5A70] hover:text-[#E8604C] hover:bg-[#FFF0EE] rounded-lg border border-[#E1E7F0] hover:border-[#E8604C]/30 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Annuler la création</span>
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#4B5A70]">
        <Sparkles className="w-3.5 h-3.5 text-[#FFC04D]" />
        <span>Étapes créées sur-mesure pour votre matière</span>
      </div>
    </div>
  );
};
