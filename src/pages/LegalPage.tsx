import React from 'react';
import { PageRoute } from '../types/revision';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

interface LegalPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={() => onNavigate('landing')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#385DE8] hover:text-[#5B8DEF] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour à l'accueil</span>
      </button>

      <div className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl p-6 sm:p-10 space-y-8">
        <div>
          <h1 className="font-heading font-bold text-3xl text-[#1E2A3A]">
            Mentions Légales
          </h1>
          <p className="text-xs text-[#4B5A70] mt-1">
            Dernière mise à jour : 12 octobre 2026
          </p>
        </div>

        {/* Éditeur */}
        <section className="space-y-2">
          <h2 className="font-heading font-semibold text-lg text-[#1E2A3A]">
            1. Éditeur de l’application
          </h2>
          <p className="text-sm text-[#4B5A70] leading-relaxed">
            L'application web <strong>Quilo</strong> est un projet indépendant développé à des fins éducatives et d’aide aux révisions pour les collégiens et lycéens.
            <br />
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
        <section className="space-y-2">
          <h2 className="font-heading font-semibold text-lg text-[#1E2A3A]">
            2. Hébergement
          </h2>
          <p className="text-sm text-[#4B5A70] leading-relaxed">
            Le frontend et les fonctions de traitement sont hébergés sur une infrastructure cloud sécurisée.
            <br />
            Aucune base de données d'utilisateurs n’est hébergée sur nos serveurs.
          </p>
        </section>

        {/* Avertissement Droit d'auteur & Propriété intellectuelle */}
        <section className="space-y-3 bg-[#F4F6FA] border border-[#E1E7F0] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[#1E2A3A]">
            <ShieldAlert className="w-5 h-5 text-[#5B8DEF]" />
            <h2 className="font-heading font-semibold text-base">
              3. Respect du droit d’auteur et usage strictement personnel
            </h2>
          </div>
          <p className="text-sm text-[#4B5A70] leading-relaxed">
            Quilo est conçu et optimisé pour le traitement des <strong>notes de cours personnelles manuscrites</strong> prises par l’élève lors de ses cours.
          </p>
          <p className="text-sm text-[#4B5A70] leading-relaxed">
            Il est formellement interdit d’utiliser Quilo pour numériser, reproduire ou diffuser massivement des manuels scolaires ou des ouvrages sous droit d’auteur dans leur intégralité. L’utilisation relève de l’exception de copie privée pour un usage strictement pédagogique et individuel de l’élève.
          </p>
        </section>

        {/* Propriété intellectuelle de la marque */}
        <section className="space-y-2">
          <h2 className="font-heading font-semibold text-lg text-[#1E2A3A]">
            4. Marque et Mascotte
          </h2>
          <p className="text-sm text-[#4B5A70] leading-relaxed">
            Le nom « Quilo », la mascotte officielle (le robot bleu à l'œil objectif) et les éléments graphiques distinctifs sont protégés. Toute reproduction sans autorisation préalable est interdite.
          </p>
        </section>

        {/* Limitation de responsabilité */}
        <section className="space-y-2">
          <h2 className="font-heading font-semibold text-lg text-[#1E2A3A]">
            5. Fiabilité des synthèses générées
          </h2>
          <p className="text-sm text-[#4B5A70] leading-relaxed">
            Quilo utilise des modèles d’analyse visuelle pour synthétiser les notes manuscrites. Bien que le modèle s’efforce d’être le plus fidèle possible aux photos fournies, l’élève est invité à relire sa fiche avant son évaluation pour s’assurer de l’exactitude de ses formules et définitions.
          </p>
        </section>
      </div>
    </div>
  );
};
