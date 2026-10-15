import React, { useEffect, useState } from 'react';
import { PageRoute, RevisionSheet } from '../types/revision';
import { getSheetById, saveSheetToFirestore } from '../services/sheetsFirestore';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen,
  Share2,
  Calendar,
  User,
  ArrowLeft,
  CheckCircle,
  Copy,
  Lock,
  Download,
  Printer,
  FileText,
  AlertCircle,
  BookmarkPlus,
} from 'lucide-react';
import { QuiloMascot } from '../assets/QuiloMascot';
import { exportToPDF, exportToDOCX } from '../services/exporters';

interface SharedSheetPageProps {
  sheetId: string;
  onNavigate: (page: PageRoute) => void;
  onSelectSheet: (sheet: RevisionSheet) => void;
}

export const SharedSheetPage: React.FC<SharedSheetPageProps> = ({
  sheetId,
  onNavigate,
  onSelectSheet,
}) => {
  const { user } = useAuth();
  const [sheet, setSheet] = useState<RevisionSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!user) {
      onNavigate('login');
    }
  }, [user, onNavigate]);

  if (!user) {
    return null;
  }

  useEffect(() => {
    async function loadShared() {
      if (!sheetId) {
        setError('Aucun identifiant de fiche fourni.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const fetched = await getSheetById(sheetId);
        if (!fetched) {
          setError('Cette fiche de révision n’existe pas ou a été supprimée.');
        } else if (!fetched.isShared && fetched.userId !== user?.uid) {
          setError('Cette fiche est privée. Son auteur n’a pas activé le partage public.');
        } else {
          setSheet(fetched);
        }
      } catch (err: any) {
        console.error('Erreur chargement fiche partagée:', err);
        setError('Impossible d’accéder à cette fiche. Veuillez vérifier le lien.');
      } finally {
        setLoading(false);
      }
    }
    loadShared();
  }, [sheetId, user?.uid]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleImportToMySheets = async () => {
    if (!sheet) return;
    if (!user) {
      onNavigate('login');
      return;
    }

    try {
      setImporting(true);
      const copyId = `sheet_${Date.now()}`;
      const importedSheet: RevisionSheet = {
        ...sheet,
        id: copyId,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        isShared: false,
      };
      await saveSheetToFirestore(importedSheet, user.uid, user.displayName || undefined);
      setImported(true);
      onSelectSheet(importedSheet);
      setTimeout(() => {
        onNavigate('my-sheets');
      }, 1200);
    } catch (err) {
      console.error('Erreur importation fiche:', err);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-3 border-[#5B8DEF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-[#4B5A70]">Chargement de la fiche de révision...</p>
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF0EE] text-[#E8604C] flex items-center justify-center mx-auto mb-4 border border-[#E8604C]/20">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="font-heading font-bold text-lg text-[#1E2A3A] mb-2">
          Fiche inaccessible
        </h2>
        <p className="text-xs text-[#4B5A70] leading-relaxed mb-6">{error}</p>
        <button
          onClick={() => onNavigate('landing')}
          className="px-5 py-2.5 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
        <button
          onClick={() => onNavigate('my-sheets')}
          className="flex items-center gap-1.5 text-xs font-medium text-[#4B5A70] hover:text-[#1E2A3A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Toutes les fiches</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E1E7F0] bg-white hover:bg-[#F4F6FA] text-xs font-semibold text-[#1E2A3A] transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-[#75D6B0]" />
                <span>Lien copié</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#5B8DEF]" />
                <span>Partager</span>
              </>
            )}
          </button>

          <button
            onClick={handleImportToMySheets}
            disabled={importing || imported}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {imported ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Importée dans vos fiches</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>{user ? 'Enregistrer dans mes fiches' : 'Se connecter pour enregistrer'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Sheet Container */}
      <article
        id="printable-revision-sheet"
        className="bg-white border border-[#E1E7F0] rounded-2xl p-6 sm:p-10 shadow-xs space-y-8"
      >
        {/* Header section */}
        <header className="border-b border-[#E1E7F0] pb-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-md bg-[#5B8DEF]/10 text-[#385DE8] font-heading font-semibold text-xs uppercase tracking-wide">
              {sheet.subject}
            </span>
            <span className="text-[11px] text-[#4B5A70] flex items-center gap-1">
              <User className="w-3 h-3 text-[#5B8DEF]" />
              <span>Par {sheet.authorName || 'Étudiant Quilo'}</span>
            </span>
          </div>

          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1E2A3A] tracking-tight">
            {sheet.title}
          </h1>

          {sheet.summary && (
            <p className="mt-3 text-xs sm:text-sm text-[#4B5A70] leading-relaxed">
              {sheet.summary}
            </p>
          )}
        </header>

        {/* Essential Takeaway: L'essentiel pour le contrôle */}
        {sheet.essentialTakeaway && (
          <section className="p-4 sm:p-5 rounded-xl bg-[#FFF9EC] border border-[#FFC04D]/40">
            <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#B37400] mb-2 flex items-center gap-1.5">
              <span>L’essentiel pour le contrôle</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#1E2A3A] leading-relaxed font-medium">
              {sheet.essentialTakeaway}
            </p>
          </section>
        )}

        {/* Definitions Block */}
        {sheet.definitions && sheet.definitions.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-[#1E2A3A] border-b border-[#E1E7F0] pb-2">
              Définitions clés
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sheet.definitions.map((def, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#F4F6FA] border border-[#E1E7F0] space-y-1"
                >
                  <dt className="font-heading font-semibold text-xs text-[#385DE8]">
                    {def.term}
                  </dt>
                  <dd className="text-xs text-[#1E2A3A] leading-relaxed">
                    {def.definition}
                  </dd>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Items: Dates, formules, repères */}
        {sheet.keyItems && sheet.keyItems.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-[#1E2A3A] border-b border-[#E1E7F0] pb-2">
              Dates, formules & repères
            </h2>
            <div className="space-y-2">
              {sheet.keyItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-2.5 rounded-lg hover:bg-[#F4F6FA] transition-colors"
                >
                  <span className="font-heading font-bold text-xs text-[#1E2A3A] shrink-0 sm:w-36">
                    {item.label}
                  </span>
                  <span className="text-xs text-[#4B5A70] leading-relaxed">
                    {item.detail}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Structured Sections */}
        {sheet.sections && sheet.sections.length > 0 && (
          <section className="space-y-5">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-[#1E2A3A] border-b border-[#E1E7F0] pb-2">
              Développement du cours
            </h2>
            <div className="space-y-4">
              {sheet.sections.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="font-heading font-semibold text-xs sm:text-sm text-[#385DE8]">
                    {section.title}
                  </h3>
                  <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-[#1E2A3A] leading-relaxed marker:text-[#5B8DEF]">
                    {section.points.map((pt, pIdx) => (
                      <li key={pIdx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>

      {/* Export tools */}
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4B5A70] no-print">
        <p>Créé et partagé avec Quilo</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToPDF(sheet)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E1E7F0] bg-white hover:bg-[#F4F6FA] text-xs font-semibold text-[#1E2A3A] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => exportToDOCX(sheet)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E1E7F0] bg-white hover:bg-[#F4F6FA] text-xs font-semibold text-[#1E2A3A] transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>DOCX</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E1E7F0] bg-white hover:bg-[#F4F6FA] text-xs font-semibold text-[#1E2A3A] transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
