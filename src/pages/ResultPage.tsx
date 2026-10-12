import React from 'react';
import { PageRoute, RevisionSheet } from '../types/revision';
import { RevisionSheetView } from '../components/sheet/RevisionSheetView';
import { ExportBar } from '../components/sheet/ExportBar';
import { ArrowLeft, BookOpen, PlusCircle } from 'lucide-react';

interface ResultPageProps {
  sheet: RevisionSheet;
  onNavigate: (page: PageRoute) => void;
  onResetNewSheet: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  sheet,
  onNavigate,
  onResetNewSheet,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top navigation row */}
      <div className="flex items-center justify-between mb-6 no-print">
        <button
          onClick={onResetNewSheet}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4874D6] hover:text-[#5B8DEF] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Créer une autre fiche</span>
        </button>

        <button
          onClick={() => onNavigate('my-sheets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5A70] hover:text-[#1E2A3A] cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>Voir toutes mes fiches</span>
        </button>
      </div>

      {/* Export Toolbar (PDF, PNG, DOCX, Print) */}
      <ExportBar sheet={sheet} targetElementId="quilo-rendered-sheet" />

      {/* The Printable Revision Sheet */}
      <div className="mb-12">
        <RevisionSheetView sheet={sheet} id="quilo-rendered-sheet" />
      </div>

      {/* Bottom helper actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-[#E1E7F0] no-print">
        <button
          onClick={onResetNewSheet}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5B8DEF] hover:bg-[#4874D6] text-white font-heading font-semibold text-sm rounded-xl transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Créer une nouvelle fiche de cours</span>
        </button>

        <button
          onClick={() => onNavigate('my-sheets')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFFFF] border border-[#E1E7F0] hover:bg-[#F4F6FA] text-[#1E2A3A] font-heading font-semibold text-sm rounded-xl transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-[#4B5A70]" />
          <span>Consulter ma bibliothèque locale</span>
        </button>
      </div>
    </div>
  );
};
