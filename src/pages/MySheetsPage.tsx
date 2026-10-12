import React, { useState } from 'react';
import { PageRoute, RevisionSheet } from '../types/revision';
import { QuiloMascot } from '../assets/QuiloMascot';
import { deleteSheet } from '../services/db';
import { exportToPDF } from '../services/exporters';
import {
  BookOpen,
  PlusCircle,
  Calendar,
  Trash2,
  FileText,
  Eye,
  HardDrive,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';

interface MySheetsPageProps {
  sheets: RevisionSheet[];
  onSelectSheet: (sheet: RevisionSheet) => void;
  onRefreshSheets: () => void;
  onNavigate: (page: PageRoute) => void;
}

export const MySheetsPage: React.FC<MySheetsPageProps> = ({
  sheets,
  onSelectSheet,
  onRefreshSheets,
  onNavigate,
}) => {
  const [sheetToDelete, setSheetToDelete] = useState<RevisionSheet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!sheetToDelete) return;
    try {
      setIsDeleting(true);
      await deleteSheet(sheetToDelete.id);
      onRefreshSheets();
      setSheetToDelete(null);
    } catch (err) {
      console.error('Erreur suppression:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickPdf = async (sheet: RevisionSheet, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await exportToPDF(sheet);
    } catch (err) {
      console.error('Erreur export rapide PDF:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1E2A3A]">
            Mes fiches de révision
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5A70] mt-1">
            Enregistrées directement sur cet appareil ({sheets.length} fiche{sheets.length > 1 ? 's' : ''})
          </p>
        </div>

        <button
          onClick={() => onNavigate('upload')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5B8DEF] hover:bg-[#4874D6] text-white font-heading font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouvelle fiche</span>
        </button>
      </div>

      {/* Device storage notice */}
      <div className="mb-6 p-3.5 bg-[#FFFFFF] border border-[#E1E7F0] rounded-xl flex items-start gap-3 text-xs text-[#4B5A70]">
        <HardDrive className="w-4 h-4 text-[#4874D6] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#1E2A3A]">Stockage navigateur privé (IndexedDB) : </span>
          Ces fiches sont accessibles hors-connexion sur cet appareil. Elles ne sont partagées sur aucun serveur. Pensez à les exporter en PDF ou Word si vous devez changer d’ordinateur ou de téléphone.
        </div>
      </div>

      {/* Empty State */}
      {sheets.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl p-10 text-center max-w-md mx-auto my-12">
          <div className="mb-4 flex justify-center">
            <QuiloMascot size={90} />
          </div>
          <h2 className="font-heading font-bold text-lg text-[#1E2A3A]">
            Aucune fiche pour l'instant
          </h2>
          <p className="text-xs text-[#4B5A70] mt-1 mb-6">
            Prenez en photo vos notes de cours et laissez Quilo créer votre première fiche de révision.
          </p>
          <button
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B8DEF] hover:bg-[#4874D6] text-white font-heading font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Créer ma première fiche</span>
          </button>
        </div>
      ) : (
        /* Sheets list */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              onClick={() => {
                onSelectSheet(sheet);
                onNavigate('result');
              }}
              className="bg-[#FFFFFF] border border-[#E1E7F0] hover:border-[#5B8DEF]/60 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Subject tag and date */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2 py-0.5 bg-[#5B8DEF]/10 text-[#4874D6] font-semibold text-[11px] rounded-md">
                    {sheet.subject}
                  </span>
                  <span className="text-[#4B5A70] flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    {new Date(sheet.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-heading font-bold text-base text-[#1E2A3A] group-hover:text-[#4874D6] transition-colors line-clamp-2">
                  {sheet.title}
                </h3>

                {/* Summary excerpt */}
                {sheet.summary && (
                  <p className="text-xs text-[#4B5A70] mt-2 line-clamp-2 leading-relaxed">
                    {sheet.summary}
                  </p>
                )}
              </div>

              {/* Bottom stats and action buttons */}
              <div className="mt-5 pt-3.5 border-t border-[#E1E7F0] flex items-center justify-between">
                <span className="text-[11px] text-[#4B5A70]">
                  {sheet.definitions?.length || 0} déf. • {sheet.keyItems?.length || 0} repères
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleQuickPdf(sheet, e)}
                    className="p-1.5 text-[#4B5A70] hover:text-[#4874D6] hover:bg-[#F4F6FA] rounded-md transition-colors cursor-pointer"
                    title="Export PDF direct"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSheetToDelete(sheet);
                    }}
                    className="p-1.5 text-[#4B5A70] hover:text-[#E8604C] hover:bg-[#FFF0EE] rounded-md transition-colors cursor-pointer"
                    title="Supprimer la fiche de l'appareil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="ml-1 flex items-center text-xs font-semibold text-[#5B8DEF] group-hover:translate-x-0.5 transition-transform">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Sheet Deletion */}
      {sheetToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2A3A]/40 backdrop-blur-2xs"
          onClick={() => !isDeleting && setSheetToDelete(null)}
        >
          <div
            className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl max-w-md w-full p-6 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF0EE] text-[#E8604C] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#1E2A3A]">
                    Supprimer cette fiche ?
                  </h3>
                  <p className="text-xs text-[#4B5A70]">
                    Fiche : « {sheetToDelete.title} »
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isDeleting && setSheetToDelete(null)}
                className="text-[#4B5A70] hover:text-[#1E2A3A] p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <p className="text-xs text-[#4B5A70] leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement cette fiche de votre appareil ? Cette action est irréversible et supprimera la fiche de votre mémoire locale (IndexedDB).
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E1E7F0]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSheetToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E1E7F0] text-[#1E2A3A] hover:bg-[#F4F6FA] transition-colors cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#E8604C] hover:bg-[#D94E3A] text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Supprimer définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
