import React, { useState } from 'react';
import { PageRoute } from '../../types/revision';
import { QuiloMascot } from '../../assets/QuiloMascot';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PrivacyModal } from '../modals/PrivacyModal';
import { LegalModal } from '../modals/LegalModal';
import { useAuth } from '../../contexts/AuthContext';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  X,
  ShieldCheck,
  FileText,
  Sparkles,
  Monitor,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
  currentPage?: PageRoute;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, currentPage }) => {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  const handleGenericInstall = async () => {
    const success = await install();
    if (!success) {
      setShowDesktopGuide(true);
    }
  };

  const isLanding = currentPage === 'landing';

  return (
    <footer className="bg-[#FFFFFF] border-t border-[#E1E7F0] mt-auto no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-8">
        {/* PWA Installation Highlight Banner (Se masque automatiquement si déjà installé en mode autonome) */}
        {!isInstalled && (
          <div className="mb-10 p-5 sm:p-6 bg-gradient-to-r from-[#5B8DEF]/10 via-[#F4F6FA] to-[#FFC04D]/10 rounded-2xl border border-[#5B8DEF]/30 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#5B8DEF] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#5B8DEF]/15 text-[#385DE8] text-[11px] font-bold mb-1">
                    <Sparkles className="w-3 h-3 text-[#FFC04D]" />
                    <span>Quilo en PWA est maintenant disponible !</span>
                  </div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#1E2A3A]">
                    Installez Quilo sur votre écran d'accueil
                  </h3>
                  <p className="text-xs text-[#4B5A70] mt-0.5 max-w-xl leading-relaxed">
                    Révisez vos fiches n'importe où, même hors-ligne sans connexion internet, et ouvrez l'application en 1 clic sans passer par le navigateur.
                  </p>
                </div>
              </div>

              {/* Action Button based on platform */}
              <div className="self-start md:self-center shrink-0">
                {isInstallable ? (
                  <button
                    onClick={install}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white font-heading font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Installer l'app (1 clic)</span>
                  </button>
                ) : isIOS ? (
                  <button
                    onClick={() => setShowIOSGuide(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white font-heading font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Share className="w-4 h-4" />
                    <span>Installer sur iPhone / iPad</span>
                  </button>
                ) : (
                  <button
                    onClick={handleGenericInstall}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white font-heading font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Installer l'application</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#E1E7F0]">
          {/* Brand Info (Cols 1-5) */}
          <div className="md:col-span-5 space-y-3">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] rounded-md transition-opacity cursor-pointer"
            >
              <QuiloMascot size={32} />
              <span className="font-heading font-bold text-xl text-[#1E2A3A] group-hover:text-[#385DE8] transition-colors tracking-tight">
                Quilo
              </span>
            </button>
            <p className="text-xs text-[#4B5A70] leading-relaxed max-w-sm">
              L'outil qui compile les photos de cours en une fiche de révision unique, visuelle et compacte. Pensé spécialement pour les collégiens et les lycéens.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-[#4B5A70]">
              <span className="w-2 h-2 rounded-full bg-[#75D6B0] inline-block shrink-0" />
              <span>Comptes personnels sécurisés et synchronisés sur le Cloud</span>
            </div>
          </div>

          {/* Quick Navigation / Account (Cols 6-8) */}
          <div className="md:col-span-3 space-y-3">
            {isLanding || !user ? (
              <>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E2A3A] font-heading">
                  Espace Membre
                </h2>
                <ul className="space-y-2 text-xs">
                  <li>
                    <button
                      onClick={() => onNavigate('login')}
                      className="text-[#4B5A70] hover:text-[#385DE8] transition-colors cursor-pointer"
                    >
                      Se connecter
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate('register')}
                      className="text-[#4B5A70] hover:text-[#385DE8] transition-colors cursor-pointer"
                    >
                      Créer un compte
                    </button>
                  </li>
                </ul>
              </>
            ) : (
              <>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E2A3A] font-heading">
                  Application
                </h2>
                <ul className="space-y-2 text-xs">
                  <li>
                    <button
                      onClick={() => onNavigate('upload')}
                      className="text-[#4B5A70] hover:text-[#385DE8] transition-colors cursor-pointer"
                    >
                      Créer une fiche de cours
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate('my-sheets')}
                      className="text-[#4B5A70] hover:text-[#385DE8] transition-colors cursor-pointer"
                    >
                      Mes fiches enregistrées
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate('profile')}
                      className="text-[#4B5A70] hover:text-[#385DE8] transition-colors cursor-pointer"
                    >
                      Mon profil
                    </button>
                  </li>
                </ul>
              </>
            )}
          </div>

          {/* Legal & Privacy as Modals (Cols 9-12) */}
          <div className="md:col-span-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E2A3A] font-heading">
              Confidentialité & Légal
            </h2>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-[#4B5A70] hover:text-[#385DE8] transition-colors inline-flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#75D6B0]" />
                  <span>Politique de confidentialité (RGPD)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowLegalModal(true)}
                  className="text-[#4B5A70] hover:text-[#385DE8] transition-colors inline-flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-[#5B8DEF]" />
                  <span>Mentions légales & Droit d'auteur</span>
                </button>
              </li>
              <li className="text-[11px] text-[#4B5A70]/80 pt-1">
                Conçu pour les notes personnelles manuscrites des élèves. Données protégées et synchronisées.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4B5A70]">
          <p>© {currentYear} Quilo. Fiches de révision en un clin d’œil.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Exports PDF • PNG • Word</span>
            <span className="text-[#E1E7F0]">•</span>
            <span>Sans cookies traceurs</span>
          </div>
        </div>
      </div>

      {/* iOS Guided Installation Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2A3A]/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <QuiloMascot size={32} />
                <div>
                  <h3 className="font-heading font-bold text-base text-[#1E2A3A]">
                    Installer Quilo sur iOS
                  </h3>
                  <p className="text-[11px] text-[#4B5A70]">
                    Accès direct et fonctionnement hors-ligne
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-[#4B5A70] hover:text-[#1E2A3A] p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-1 text-xs text-[#1E2A3A]">
              <div className="flex items-start gap-2.5 p-2.5 bg-[#F4F6FA] rounded-xl border border-[#E1E7F0]">
                <Share className="w-4 h-4 text-[#5B8DEF] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">1. Appuyez sur « Partager »</span>
                  <p className="text-[#4B5A70] text-[11px] mt-0.5">
                    L'icône carrée avec une flèche vers le haut dans la barre Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-[#F4F6FA] rounded-xl border border-[#E1E7F0]">
                <PlusSquare className="w-4 h-4 text-[#5B8DEF] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">2. Choisissez « Sur l'écran d'accueil »</span>
                  <p className="text-[#4B5A70] text-[11px] mt-0.5">
                    Faites défiler le menu d'actions vers le bas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-[#F4F6FA] rounded-xl border border-[#E1E7F0]">
                <Smartphone className="w-4 h-4 text-[#75D6B0] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">3. Validez avec « Ajouter »</span>
                  <p className="text-[#4B5A70] text-[11px] mt-0.5">
                    L'icône Quilo apparaîtra directement sur votre écran d'accueil.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-[#5B8DEF] hover:bg-[#385DE8] text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              C'est compris
            </button>
          </div>
        </div>
      )}

      {/* Desktop Guided Installation Modal */}
      {showDesktopGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2A3A]/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowDesktopGuide(false)}
        >
          <div
            className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <QuiloMascot size={32} />
                <div>
                  <h3 className="font-heading font-bold text-base text-[#1E2A3A]">
                    Installer sur ordinateur
                  </h3>
                  <p className="text-[11px] text-[#4B5A70]">
                    Chrome, Edge, Brave ou navigateur compatible
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="text-[#4B5A70] hover:text-[#1E2A3A] p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-1 text-xs text-[#1E2A3A]">
              <div className="flex items-start gap-2.5 p-2.5 bg-[#F4F6FA] rounded-xl border border-[#E1E7F0]">
                <Monitor className="w-4 h-4 text-[#5B8DEF] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">1. Dans la barre d'adresse</span>
                  <p className="text-[#4B5A70] text-[11px] mt-0.5">
                    Cliquez sur l'icône <strong>Installer (⊕)</strong> située à droite de la barre d'URL.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-[#F4F6FA] rounded-xl border border-[#E1E7F0]">
                <Download className="w-4 h-4 text-[#75D6B0] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">2. Ou via le menu du navigateur</span>
                  <p className="text-[#4B5A70] text-[11px] mt-0.5">
                    Cliquez sur les trois points (⋮) puis sur <strong>« Installer Quilo... »</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDesktopGuide(false)}
              className="w-full py-2.5 bg-[#5B8DEF] hover:bg-[#385DE8] text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* Legal & Copyright Modal */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />
    </footer>
  );
};
