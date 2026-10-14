import React, { useState } from 'react';
import { PageRoute, RevisionSheet } from '../types/revision';
import { RevisionSheetView } from '../components/sheet/RevisionSheetView';
import { ExportBar } from '../components/sheet/ExportBar';
import { BookOpen, PlusCircle, BookmarkPlus, Check, Loader2, ChevronRight } from 'lucide-react';

interface ResultPageProps {
  sheet: RevisionSheet;
  onNavigate: (page: PageRoute) => void;
  onResetNewSheet: () => void;
  isSaved?: boolean;
  onSaveToMySheets?: (sheet: RevisionSheet) => Promise<void> | void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  sheet,
  onNavigate,
  onResetNewSheet,
  isSaved = false,
  onSaveToMySheets,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const isActuallySaved = isSaved || justSaved;

  const handleSave = async () => {
    if (!onSaveToMySheets || isActuallySaved || isSaving) return;
    try {
      setIsSaving(true);
      await onSaveToMySheets(sheet);
      setJustSaved(true);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    } finally {
      setIsSaving(false);
    }
  };

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

      {/* Top Banner when a shared sheet is opened and not yet saved in My Sheets */}
      {!isActuallySaved && onSaveToMySheets && (
        <div className="mb-6 p-4 sm:p-5 bg-[#FFFFFF] border border-[#E1E7F0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#5B8DEF]/10 text-[#4874D6] flex items-center justify-center shrink-0">
              <BookmarkPlus className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#5B8DEF]/10 text-[#4874D6] text-[11px] font-semibold mb-1">
                <span>Fiche partagée</span>
              </div>
              <h2 className="font-heading font-bold text-sm sm:text-base text-[#1E2A3A]">
                Cette fiche n'est pas encore enregistrée dans votre espace
              </h2>
              <p className="text-xs text-[#4B5A70]">
                Enregistrez-la dans « Mes fiches » pour la conserver et la réviser hors-ligne sans connexion.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4CAF7D] hover:bg-[#3FA06E] text-white font-heading font-semibold text-xs sm:text-sm rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-98 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Enregistrer dans mes fiches</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Confirmation banner if just saved */}
      {justSaved && (
        <div className="mb-6 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#166534] no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#4CAF7D] text-white flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>
              Fiche enregistrée avec succès dans <strong>« Mes fiches »</strong> ! Elle est disponible hors-ligne.
            </span>
          </div>
          <button
            onClick={() => onNavigate('my-sheets')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#166534] hover:underline self-start sm:self-auto cursor-pointer"
          >
            <span>Accéder à mes fiches</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Export Toolbar (PDF, PNG, DOCX, Print, Save) */}
      <ExportBar
        sheet={sheet}
        targetElementId="quilo-rendered-sheet"
        isSaved={isActuallySaved}
        onSaveToMySheets={onSaveToMySheets}
      />

      {/* The Printable Revision Sheet */}
      <div className="mb-12">
        <RevisionSheetView sheet={sheet} id="quilo-rendered-sheet" />
      </div>

      {/* Bottom helper actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-[#E1E7F0] no-print">
        {!isActuallySaved && onSaveToMySheets && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4CAF7D] hover:bg-[#3FA06E] text-white font-heading font-semibold text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BookmarkPlus className="w-4 h-4" />
            )}
            <span>Enregistrer dans mes fiches</span>
          </button>
        )}

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
          <BookOpen className="w-4 h-4 text-[#4874D6]" />
          <span>Accéder à mes fiches</span>
        </button>
      </div>
    </div>
  );
};
