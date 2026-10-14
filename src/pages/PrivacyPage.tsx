import React from 'react';
import { PageRoute } from '../types/revision';
import { ArrowLeft, ShieldCheck, HardDrive, EyeOff, UserCheck } from 'lucide-react';

interface PrivacyPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#75D6B0]/15 text-[#75D6B0] text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Conformité RGPD & Protection des mineurs</span>
          </div>
          <h1 className="font-heading font-bold text-3xl text-[#1E2A3A]">
            Politique de Confidentialité
          </h1>
          <p className="text-xs text-[#4B5A70] mt-1">
            Dernière révision : 12 octobre 2026
          </p>
        </div>

        {/* Introduction */}
        <p className="text-sm text-[#4B5A70] leading-relaxed">
          Quilo est conçu pour les élèves de collège et de lycée. La protection de votre vie privée et de vos données scolaires est au cœur de l'architecture technique de l'application.
        </p>

        {/* 1. Pas de compte, pas de profil */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#385DE8]" />
            <h2 className="font-heading font-semibold text-lg text-[#1E2A3A]">
              1. Aucun compte utilisateur requis
            </h2>
          </div>
          <p className="text-sm text-[#4B5A70] leading-relaxed">
            Pour utiliser Quilo, nous ne demandons ni nom, ni prénom, ni adresse e-mail, ni mot de passe, ni numéro de téléphone. Aucune donnée d'identification personnelle n'est collectée ou stockée sur un serveur d'utilisateurs.
          </p>
        </section>

        {/* 2. Stockage 100% local sur l'appareil */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#385DE8]" />
            <h2 className="font-heading font-semibold text-lg text-[#1E2A3A]">
              2. Vos fiches restent sur votre appareil (IndexedDB)
            </h2>
          </div>
          <p className="text-sm text-[#4B5A70] leading-relaxed">
            Toutes les fiches que vous créez sont enregistrées localement dans la base de données sécurisée de votre navigateur (IndexedDB).
          </p>
          <p className="text-sm text-[#4B5A70] leading-relaxed">
            Cela signifie que nous ne possédons pas vos fiches. Si vous videz les données de votre navigateur ou changez d'appareil, vos fiches locales ne sont pas transférées.
          </p>
        </section>

        {/* 3. Traitement éphémère des photos de cours */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-[#385DE8]" />
            <h2 className="font-heading font-semibold text-lg text-[#1E2A3A]">
              3. Traitement éphémère des photos de cours
            </h2>
          </div>
          <p className="text-sm text-[#4B5A70] leading-relaxed">
            Lorsque vous soumettez des photos de cours :
          </p>
          <ul className="list-disc pl-5 text-sm text-[#4B5A70] space-y-1">
            <li>Les photos sont compressées directement dans votre navigateur avant transfert.</li>
            <li>Elles sont transmises de manière chiffrée (HTTPS) au modèle de vision uniquement le temps de générer votre fiche.</li>
            <li>Elles <strong>ne sont pas conservées ni archivées</strong> sur nos serveurs une fois la fiche renvoyée.</li>
            <li>Aucune photo n'est revendue à des tiers ni utilisée à des fins de publicité ciblée.</li>
          </ul>
        </section>

        {/* 4. Vos droits */}
        <section className="space-y-2">
          <h2 className="font-heading font-semibold text-lg text-[#1E2A3A]">
            4. Vos droits et suppression de vos fiches
          </h2>
          <p className="text-sm text-[#4B5A70] leading-relaxed">
            Vous disposez d'un contrôle total : dans l'onglet « Mes fiches », vous pouvez à tout moment supprimer individuellement n'importe quelle fiche créée. La suppression efface immédiatement l'entrée de votre appareil.
          </p>
        </section>

        {/* 5. Contact */}
        <section className="pt-4 border-t border-[#E1E7F0]">
          <p className="text-xs text-[#4B5A70]">
            Pour toute question concernant la confidentialité ou le RGPD :{' '}
            <a
              href="mailto:archemis.ai@gmail.com"
              className="text-[#385DE8] hover:underline font-medium"
            >
              archemis.ai@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};
