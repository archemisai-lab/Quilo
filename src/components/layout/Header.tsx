import React from 'react';
import { PageRoute } from '../../types/revision';
import { QuiloMascot } from '../../assets/QuiloMascot';
import { BookOpen, Plus } from 'lucide-react';

interface HeaderProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  savedCount,
}) => {
  const isCreationActive =
    currentPage === 'upload' || currentPage === 'prompt' || currentPage === 'generating';
  const isMySheetsActive = currentPage === 'my-sheets';

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/95 backdrop-blur-xs border-b border-[#E1E7F0] no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
        {/* Brand identity: compact & sleek */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] rounded-md transition-opacity cursor-pointer"
          aria-label="Accueil Quilo"
        >
          <QuiloMascot size={28} />
          <span className="font-heading font-bold text-lg text-[#1E2A3A] group-hover:text-[#385DE8] transition-colors tracking-tight">
            Quilo
          </span>
        </button>

        {/* Navigation & Actions: small, refined, elegant */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {/* Secondary Nav: Mes fiches */}
          <button
            onClick={() => onNavigate('my-sheets')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5B8DEF] ${
              isMySheetsActive
                ? 'text-[#1E2A3A] bg-[#F4F6FA] font-semibold'
                : 'text-[#4B5A70] hover:text-[#1E2A3A] hover:bg-[#F4F6FA]'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${isMySheetsActive ? 'text-[#385DE8]' : 'text-[#4B5A70]'}`} />
            <span>Mes fiches</span>
            {savedCount > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${
                  isMySheetsActive
                    ? 'bg-[#5B8DEF] text-white'
                    : 'bg-[#E1E7F0] text-[#1E2A3A]'
                }`}
              >
                {savedCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="h-3.5 w-px bg-[#E1E7F0] mx-0.5" />

          {/* Primary Action Button: Créer une fiche */}
          <button
            onClick={() => onNavigate('upload')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#5B8DEF] ${
              isCreationActive
                ? 'bg-[#385DE8] text-white shadow-2xs'
                : 'bg-[#5B8DEF] hover:bg-[#385DE8] text-white shadow-2xs active:scale-[0.98]'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Créer une fiche</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
