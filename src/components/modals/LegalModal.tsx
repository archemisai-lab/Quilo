import React from 'react';
import { X, ShieldAlert, BookOpen } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2A3A]/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#E1E7F0] flex items-center justify-between gap-4 bg-white shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#5B8DEF]/10 text-[#385DE8] text-xs font-semibold mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Informations légales & Droit d'auteur</span>
            </div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#1E2A3A]">
              Mentions Légales
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer les mentions légales"
            className="text-[#4B5A70] hover:text-[#1E2A3A] p-1.5 rounded-lg hover:bg-[#F4F6FA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-[#4B5A70] leading-relaxed">
          {/* Éditeur */}
          <section className="space-y-1.5">
            <h3 className="font-heading font-semibold text-base text-[#1E2A3A]">
              1. Éditeur de l’application
            </h3>
            <p>
              L'application web <strong>Quilo</strong> est un projet indépendant développé à des fins éducatives et d’aide aux révisions pour les collégiens et lycéens.
            </p>
            <p>
              Contact éditeur :{' '}
              <a
                href="mailto:archemis.ai@gmail.com"
                className="text-[#385DE8] hover:underline font-medium"
              >
                archemis.ai@gmail.com
              </a>
            </p>
          </section>

          {/* Hébergement */}
          <section className="space-y-1.5">
            <h3 className="font-heading font-semibold text-base text-[#1E2A3A]">
              2. Hébergement
            </h3>
            <p>
              Le frontend et les fonctions de traitement sont hébergés sur une infrastructure cloud sécurisée.
            </p>
            <p className="text-xs">
              Aucune base de données d'utilisateurs n’est hébergée sur nos serveurs.
            </p>
          </section>

          {/* Droit d'auteur */}
          <section className="space-y-2.5 bg-[#F8FAFC] border border-[#E1E7F0] p-4 rounded-xl">
            <div className="flex items-center gap-2 text-[#1E2A3A]">
              <ShieldAlert className="w-5 h-5 text-[#5B8DEF] shrink-0" />
              <h3 className="font-heading font-semibold text-sm sm:text-base">
                3. Respect du droit d’auteur et usage strictement personnel
              </h3>
            </div>
            <p className="text-xs sm:text-sm">
              Quilo est conçu et optimisé pour le traitement des <strong>notes de cours personnelles manuscrites</strong> prises par l’élève lors de ses cours.
            </p>
            <p className="text-xs sm:text-sm text-[#4B5A70]/90">
              Il est formellement interdit d’utiliser Quilo pour numériser, reproduire ou diffuser massivement des manuels scolaires ou des ouvrages sous droit d’auteur dans leur intégralité. L’utilisation relève de l’exception de copie privée pour un usage strictement pédagogique et individuel de l’élève.
            </p>
          </section>

          {/* Propriété de la marque */}
          <section className="space-y-1.5">
            <h3 className="font-heading font-semibold text-base text-[#1E2A3A]">
              4. Marque et Mascotte
            </h3>
            <p>
              Le nom « Quilo », la mascotte officielle (le robot bleu à l'œil objectif) et les éléments graphiques distinctifs sont protégés. Toute reproduction sans autorisation préalable est interdite.
            </p>
          </section>

          {/* Fiabilité */}
          <section className="space-y-1.5">
            <h3 className="font-heading font-semibold text-base text-[#1E2A3A]">
              5. Fiabilité des synthèses générées
            </h3>
            <p>
              Quilo utilise des modèles d’analyse visuelle pour synthétiser les notes manuscrites. Bien que le modèle s’efforce d’être le plus fidèle possible aux photos fournies, l’élève est invité à relire sa fiche avant son évaluation pour s’assurer de l’exactitude de ses formules et définitions.
            </p>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#E1E7F0] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
