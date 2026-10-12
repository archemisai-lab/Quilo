import React, { useEffect, useState } from 'react';
import { QuiloMascot } from '../assets/QuiloMascot';
import { CheckCircle2, Loader2, Sparkles, X } from 'lucide-react';

interface GeneratingPageProps {
  photoCount: number;
  onCancel: () => void;
}

const STEPS = [
  'Optimisation et lecture des notes manuscrites...',
  'Extraction des définitions et repères fondamentaux...',
  'Synthèse de l’essentiel pour le contrôle...',
  'Finalisation de la fiche visuelle compacte...',
];

export const GeneratingPage: React.FC<GeneratingPageProps> = ({
  photoCount,
  onCancel,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {/* Central Scanning Mascot */}
      <div className="mb-8 flex justify-center">
        <div className="relative">
          <QuiloMascot size={140} isScanning={true} />
          {/* Subtle glow aura */}
          <div className="absolute inset-0 bg-[#5B8DEF]/10 blur-xl rounded-full -z-10 animate-pulse" />
        </div>
      </div>

      {/* Main Title */}
      <h1 className="font-heading font-bold text-2xl text-[#1E2A3A] mb-2">
        Quilo scanne et compile votre cours
      </h1>
      <p className="text-xs text-[#4B5A70] mb-8">
        Analyse de {photoCount} photo{photoCount > 1 ? 's' : ''} en cours • Temps moyen estimé : moins de 25 secondes
      </p>

      {/* Step by step checklist */}
      <div className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-xl p-5 text-left space-y-3.5 shadow-2xs mb-6">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs transition-opacity ${
                isDone
                  ? 'text-[#4CAF7D] font-medium'
                  : isCurrent
                  ? 'text-[#1E2A3A] font-semibold'
                  : 'text-[#4B5A70]/50'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-[#4CAF7D] shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-[#5B8DEF] animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-[#E1E7F0] shrink-0" />
              )}
              <span>{step}</span>
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
        <span>Génération directe sans création de compte</span>
      </div>
    </div>
  );
};
