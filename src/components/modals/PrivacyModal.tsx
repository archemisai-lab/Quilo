import React from 'react';
import { X, ShieldCheck, HardDrive, EyeOff, UserCheck } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2A3A]/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#E1E7F0] flex items-center justify-between gap-4 bg-white shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#75D6B0]/15 text-[#75D6B0] text-xs font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Conformité RGPD & Protection des mineurs</span>
            </div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#1E2A3A]">
              Politique de Confidentialité
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la politique de confidentialité"
            className="text-[#4B5A70] hover:text-[#1E2A3A] p-1.5 rounded-lg hover:bg-[#F4F6FA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-[#4B5A70] leading-relaxed">
          <p>
            Quilo est conçu spécifiquement pour les élèves de collège et de lycée. La protection de votre vie privée et de vos données scolaires est au cœur de l'architecture technique de l'application.
          </p>

          {/* 1. Pas de compte */}
          <section className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#1E2A3A]">
              <UserCheck className="w-4 h-4 text-[#385DE8]" />
              <h3 className="font-heading font-semibold text-base">
                1. Aucun compte utilisateur requis
              </h3>
            </div>
            <p>
              Pour utiliser Quilo, nous ne demandons ni nom, ni prénom, ni adresse e-mail, ni mot de passe, ni numéro de téléphone. Aucune donnée d'identification personnelle n'est collectée ou stockée sur un serveur d'utilisateurs.
            </p>
          </section>

          {/* 2. Stockage sécurisé sur votre compte Firebase Cloud */}
          <section className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#1E2A3A]">
              <HardDrive className="w-4 h-4 text-[#385DE8]" />
              <h3 className="font-heading font-semibold text-base">
                2. Vos fiches sont sécurisées sur votre compte Cloud
              </h3>
            </div>
            <p>
              Toutes les fiches que vous créez sont enregistrées de manière sécurisée et chiffrée sur Firebase Cloud Firestore, rattachées exclusivement à votre compte utilisateur.
            </p>
            <p className="text-xs text-[#4B5A70]/90">
              Vous seul avez accès à vos fiches personnelles, synchronisées en temps réel entre votre smartphone, votre tablette et votre ordinateur.
            </p>
          </section>

          {/* 3. Traitement éphémère */}
          <section className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#1E2A3A]">
              <EyeOff className="w-4 h-4 text-[#385DE8]" />
              <h3 className="font-heading font-semibold text-base">
                3. Traitement éphémère des photos de cours
              </h3>
            </div>
            <p>Lorsque vous soumettez des photos de cours :</p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>Les photos sont compressées directement dans votre navigateur avant transfert.</li>
              <li>Elles sont transmises de manière chiffrée (HTTPS) au modèle de vision uniquement le temps de générer votre fiche.</li>
              <li>Elles <strong>ne sont pas conservées ni archivées</strong> sur nos serveurs une fois la fiche renvoyée.</li>
              <li>Aucune photo n'est revendue à des tiers ni utilisée à des fins de publicité ciblée.</li>
            </ul>
          </section>

          {/* 4. Vos droits */}
          <section className="space-y-1.5">
            <h3 className="font-heading font-semibold text-base text-[#1E2A3A]">
              4. Vos droits et suppression de vos fiches
            </h3>
            <p>
              Vous disposez d'un contrôle total : dans l'onglet « Mes fiches », vous pouvez à tout moment supprimer individuellement n'importe quelle fiche créée. La suppression efface immédiatement l'entrée de votre appareil.
            </p>
          </section>

          {/* 5. Contact */}
          <section className="pt-3 border-t border-[#E1E7F0] text-xs">
            <p>
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

        {/* Modal Footer */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#E1E7F0] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
