import React from 'react';
import { RevisionSheet } from '../../types/revision';
import { Sparkles, Calendar, BookOpen, BookmarkCheck } from 'lucide-react';

interface RevisionSheetViewProps {
  sheet: RevisionSheet;
  id?: string;
}

export const RevisionSheetView: React.FC<RevisionSheetViewProps> = ({
  sheet,
  id = 'revision-sheet-printable',
}) => {
  return (
    <article
      id={id}
      className="bg-[#FFFFFF] text-[#1E2A3A] border border-[#E1E7F0] rounded-xl shadow-xs p-6 sm:p-10 max-w-4xl mx-auto transition-all"
    >
      {/* Top Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#E1E7F0]">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#5B8DEF]/10 text-[#4874D6] font-semibold text-xs tracking-wide uppercase rounded-md">
            {sheet.subject || 'Fiche de cours'}
          </span>
          <span className="text-xs text-[#4B5A70]">
            • {sheet.photoCount} photo{sheet.photoCount > 1 ? 's' : ''} analysée{sheet.photoCount > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#4B5A70]">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(sheet.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}</span>
        </div>
      </div>

      {/* Main Title */}
      <div className="mt-6 mb-4">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1E2A3A] leading-tight">
          {sheet.title}
        </h1>
        {sheet.promptUsed && (
          <p className="mt-1 text-xs text-[#4B5A70]">
            Objectif ciblé : <span className="italic text-[#1E2A3A]">« {sheet.promptUsed} »</span>
          </p>
        )}
      </div>

      {/* Summary Box */}
      {sheet.summary && (
        <div className="bg-[#F4F6FA] border-l-3 border-[#5B8DEF] px-4 py-3 rounded-r-lg mb-6">
          <p className="text-sm text-[#1E2A3A] leading-relaxed">
            {sheet.summary}
          </p>
        </div>
      )}

      {/* Essential Takeaway / À retenir pour le contrôle */}
      {sheet.essentialTakeaway && (
        <div className="bg-[#FFF9EC] border border-[#FFC04D] px-4 py-3 rounded-lg mb-8 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[#FFC04D] text-[#1E2A3A] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3 h-3" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E2A3A] font-heading">
              À retenir pour le contrôle
            </h2>
            <p className="text-sm font-medium text-[#1E2A3A] mt-0.5 leading-normal">
              {sheet.essentialTakeaway}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid: Definitions + Key Dates/Formulas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Definitions Column */}
        {sheet.definitions && sheet.definitions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#E1E7F0]">
              <BookOpen className="w-4 h-4 text-[#4874D6]" />
              <h2 className="font-heading font-bold text-base text-[#1E2A3A]">
                Définitions indispensables
              </h2>
            </div>
            <dl className="space-y-3.5">
              {sheet.definitions.map((def, idx) => (
                <div key={idx} className="text-sm">
                  <dt className="font-semibold text-[#4874D6]">
                    {def.term}
                  </dt>
                  <dd className="text-[#1E2A3A] text-xs sm:text-sm mt-0.5 leading-relaxed">
                    {def.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Key Items / Dates / Formules Column */}
        {sheet.keyItems && sheet.keyItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#E1E7F0]">
              <BookmarkCheck className="w-4 h-4 text-[#4874D6]" />
              <h2 className="font-heading font-bold text-base text-[#1E2A3A]">
                Repères & Formules clés
              </h2>
            </div>
            <ul className="space-y-3">
              {sheet.keyItems.map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFC04D] shrink-0 mt-2" />
                  <div>
                    <span className="font-semibold text-[#1E2A3A]">
                      {item.label}
                    </span>
                    <p className="text-xs sm:text-sm text-[#4B5A70] mt-0.5 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sections / Synthèse détaillée */}
      {sheet.sections && sheet.sections.length > 0 && (
        <div className="pt-6 border-t border-[#E1E7F0] space-y-6">
          {sheet.sections.map((section, idx) => (
            <section key={idx}>
              <h3 className="font-heading font-bold text-base text-[#1E2A3A] mb-2.5">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.points.map((point, pIdx) => (
                  <li key={pIdx} className="text-sm text-[#1E2A3A] flex items-start gap-2 leading-relaxed">
                    <span className="text-[#4874D6] font-bold select-none">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Printable Sheet Footer */}
      <div className="mt-10 pt-4 border-t border-[#E1E7F0] flex items-center justify-between text-[11px] text-[#4B5A70]">
        <span>Quilo • Fiche de révision compacte</span>
        <span>Sauvegardée localement sur cet appareil</span>
      </div>
    </article>
  );
};
