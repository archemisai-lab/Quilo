import React from 'react';
import { PageRoute } from '../../types/revision';
import { QuiloMascot } from '../../assets/QuiloMascot';
import { ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#FFFFFF] border-t border-[#E1E7F0] mt-auto no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#E1E7F0]">
          {/* Brand Info (Cols 1-5) */}
          <div className="md:col-span-5 space-y-3">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] rounded-md transition-opacity cursor-pointer"
            >
              <QuiloMascot size={32} />
              <span className="font-heading font-bold text-xl text-[#1E2A3A] group-hover:text-[#4874D6] transition-colors tracking-tight">
                Quilo
              </span>
            </button>
            <p className="text-xs text-[#4B5A70] leading-relaxed max-w-sm">
              L'outil qui compile les photos de cours en une fiche de révision unique, visuelle et compacte. Pensé spécialement pour les collégiens et les lycéens.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-[#4B5A70]">
              <span className="w-2 h-2 rounded-full bg-[#4CAF7D] inline-block shrink-0" />
              <span>Stockage 100% privé sur votre navigateur (IndexedDB)</span>
            </div>
          </div>

          {/* Quick Navigation (Cols 6-8) */}
          <div className="md:col-span-3 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E2A3A] font-heading">
              Application
            </h2>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('upload')}
                  className="text-[#4B5A70] hover:text-[#4874D6] transition-colors cursor-pointer"
                >
                  Créer une fiche de cours
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('my-sheets')}
                  className="text-[#4B5A70] hover:text-[#4874D6] transition-colors cursor-pointer"
                >
                  Mes fiches enregistrées
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('landing')}
                  className="text-[#4B5A70] hover:text-[#4874D6] transition-colors cursor-pointer"
                >
                  Accueil & Démonstration
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Privacy (Cols 9-12) */}
          <div className="md:col-span-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E2A3A] font-heading">
              Confidentialité & Légal
            </h2>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="text-[#4B5A70] hover:text-[#4874D6] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Politique de confidentialité (RGPD)</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal')}
                  className="text-[#4B5A70] hover:text-[#4874D6] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Mentions légales & Droit d'auteur</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li className="text-[11px] text-[#4B5A70]/80 pt-1">
                Conçu pour les notes personnelles manuscrites des élèves. Pas de compte requis.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4B5A70]">
          <p>© {currentYear} Quilo. Fiches de révision en un clin d’œil.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Exports PDF • PNG • Word</span>
            <span className="text-[#E1E7F0]">•</span>
            <span>Sans cookies traceurs</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
