import React, { useState, useEffect } from 'react';
import { RevisionSheet } from '../../types/revision';
import { exportToPDF, exportToPNG, exportToDOCX } from '../../services/exporters';
import { getShareUrl } from '../../services/share';
import {
  FileText,
  Image as ImageIcon,
  FileCode2,
  Printer,
  Check,
  Loader2,
  Share2,
  Bookmark,
  BookmarkPlus,
} from 'lucide-react';

interface ExportBarProps {
  sheet: RevisionSheet;
  targetElementId?: string;
  isSaved?: boolean;
  onSaveToMySheets?: (sheet: RevisionSheet) => Promise<void> | void;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  sheet,
  targetElementId = 'revision-sheet-printable',
  isSaved = false,
  onSaveToMySheets,
}) => {
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Sync justSaved if isSaved prop changes
  useEffect(() => {
    if (isSaved) {
      setJustSaved(false);
    }
  }, [isSaved]);

  const isActuallySaved = isSaved || justSaved;

  const handleSaveToMySheets = async () => {
    if (!onSaveToMySheets || isActuallySaved || isSaving) return;
    try {
      setIsSaving(true);
      await onSaveToMySheets(sheet);
      setJustSaved(true);
      setSuccessMessage('Fiche ajoutée à "Mes fiches" !');
    } catch (err: any) {
      console.error('Erreur sauvegarde fiche partagée:', err);
      alert("Impossible d'enregistrer la fiche sur cet appareil.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const handleExport = async (type: 'pdf' | 'png' | 'docx') => {
    try {
      setExportingType(type);
      if (type === 'pdf') {
        await exportToPDF(sheet);
        setSuccessMessage('Fichier PDF téléchargé');
      } else if (type === 'png') {
        await exportToPNG(targetElementId, sheet.title, sheet);
        setSuccessMessage('Image PNG téléchargée');
      } else if (type === 'docx') {
        await exportToDOCX(sheet);
        setSuccessMessage('Document Word (DOCX) téléchargé');
      }
    } catch (err: any) {
      console.error('Erreur export:', err);
      alert("Erreur lors de l'export : " + (err.message || 'Erreur inconnue'));
    } finally {
      setExportingType(null);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Direct native share without custom modal
  const handleShare = async () => {
    const shareUrl = getShareUrl(sheet);
    const fullMessage = `Viens voir ma fiche de révision ➡️ ${shareUrl}`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Fiche de révision : ${sheet.title}`,
          text: `Viens voir ma fiche de révision ➡️ `,
          url: shareUrl,
        });
        setSuccessMessage('Fiche partagée !');
        setTimeout(() => setSuccessMessage(null), 3500);
      } catch (err: any) {
        // User cancelled native share or dismissed it
        if (err?.name !== 'AbortError') {
          console.warn('Native share issue, fallback copy:', err);
          await fallbackCopy(fullMessage);
        }
      }
    } else {
      // Fallback on desktop browsers without Web Share API
      await fallbackCopy(fullMessage);
    }
  };

  const fallbackCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage('Lien copié dans le presse-papier !');
    } catch {
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setSuccessMessage('Lien copié dans le presse-papier !');
    }
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-xl p-4 sm:p-5 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
      {/* Left status confirmation / save state */}
      <div className="flex items-center gap-2.5">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isActuallySaved
              ? 'bg-[#75D6B0]/15 text-[#75D6B0]'
              : 'bg-[#5B8DEF]/10 text-[#385DE8]'
          }`}
        >
          {isActuallySaved ? (
            <Check className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1E2A3A]">
            {isActuallySaved
              ? 'Fiche enregistrée sur cet appareil'
              : 'Fiche partagée par un camarade'}
          </p>
          <p className="text-xs text-[#4B5A70]">
            {isActuallySaved
              ? 'Disponible dans "Mes fiches" sans connexion.'
              : 'Non enregistrée dans vos fiches locales.'}
          </p>
        </div>
      </div>

      {/* Export & Save Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        {successMessage && (
          <span className="text-xs font-medium text-[#75D6B0] bg-[#75D6B0]/15 px-2.5 py-1 rounded-md animate-fade-in">
            {successMessage}
          </span>
        )}

        {/* Bouton pour enregistrer dans "Mes fiches" si la fiche n'est pas encore enregistrée */}
        {!isActuallySaved && onSaveToMySheets && (
          <button
            onClick={handleSaveToMySheets}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#75D6B0] text-white hover:bg-[#5EC49D] transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            title="Enregistrer cette fiche dans votre espace Mes fiches"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <BookmarkPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>Enregistrer dans mes fiches</span>
          </button>
        )}

        {/* Badge fiche déjà enregistrée */}
        {isActuallySaved && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#166534] bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Enregistrée dans mes fiches</span>
          </span>
        )}

        {/* Share Button (triggers phone's native share modal directly) */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#5B8DEF]/10 text-[#385DE8] hover:bg-[#5B8DEF]/20 transition-colors cursor-pointer"
          title="Partager directement avec les applications du téléphone"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Partager</span>
        </button>

        {/* PDF Export */}
        <button
          onClick={() => handleExport('pdf')}
          disabled={exportingType !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#5B8DEF] text-white hover:bg-[#385DE8] transition-colors disabled:opacity-50 cursor-pointer"
          title="Exporter la fiche au format PDF prêt à imprimer"
        >
          {exportingType === 'pdf' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
          <span>Export PDF</span>
        </button>

        {/* PNG Export */}
        <button
          onClick={() => handleExport('png')}
          disabled={exportingType !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E1E7F0] text-[#1E2A3A] hover:bg-[#F4F6FA] transition-colors disabled:opacity-50 cursor-pointer"
          title="Exporter l'image haute définition PNG"
        >
          {exportingType === 'png' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-[#4B5A70]" />
          )}
          <span>Image PNG</span>
        </button>

        {/* DOCX Export */}
        <button
          onClick={() => handleExport('docx')}
          disabled={exportingType !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E1E7F0] text-[#1E2A3A] hover:bg-[#F4F6FA] transition-colors disabled:opacity-50 cursor-pointer"
          title="Exporter en document Word DOCX éditable"
        >
          {exportingType === 'docx' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileCode2 className="w-3.5 h-3.5 text-[#4B5A70]" />
          )}
          <span>Word (DOCX)</span>
        </button>

        {/* Quick Print */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg text-[#4B5A70] hover:text-[#1E2A3A] hover:bg-[#F4F6FA] transition-colors cursor-pointer"
          title="Imprimer directement"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Imprimer</span>
        </button>
      </div>
    </div>
  );
};
