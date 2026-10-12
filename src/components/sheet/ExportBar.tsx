import React, { useState } from 'react';
import { RevisionSheet } from '../../types/revision';
import { exportToPDF, exportToPNG, exportToDOCX } from '../../services/exporters';
import { FileText, Image as ImageIcon, FileCode2, Printer, Check, Loader2 } from 'lucide-react';

interface ExportBarProps {
  sheet: RevisionSheet;
  targetElementId?: string;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  sheet,
  targetElementId = 'revision-sheet-printable',
}) => {
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  return (
    <div className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-xl p-4 sm:p-5 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
      {/* Left status confirmation */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#4CAF7D]/10 text-[#4CAF7D] flex items-center justify-center shrink-0">
          <Check className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1E2A3A]">
            Fiche enregistrée sur cet appareil
          </p>
          <p className="text-xs text-[#4B5A70]">
            Disponible dans "Mes fiches" sans connexion.
          </p>
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        {successMessage && (
          <span className="text-xs font-medium text-[#4CAF7D] bg-[#4CAF7D]/10 px-2.5 py-1 rounded-md animate-fade-in">
            {successMessage}
          </span>
        )}

        {/* PDF Export */}
        <button
          onClick={() => handleExport('pdf')}
          disabled={exportingType !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#5B8DEF] text-white hover:bg-[#4874D6] transition-colors disabled:opacity-50 cursor-pointer"
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
