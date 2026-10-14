import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { QuiloMascot } from '../../assets/QuiloMascot';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone mode on home screen, do not show
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop PWA flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#385DE8] bg-[#5B8DEF]/10 hover:bg-[#5B8DEF]/20 transition-colors cursor-pointer"
        title="Ajouter Quilo à l'écran d'accueil"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installer l'app</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#385DE8] bg-[#5B8DEF]/10 hover:bg-[#5B8DEF]/20 transition-colors cursor-pointer"
          title="Ajouter Quilo à l'écran d'accueil sur iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Installer l'app</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2A3A]/40 backdrop-blur-2xs animate-in fade-in duration-150"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl max-w-sm w-full p-5 shadow-lg space-y-4"
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
                className="w-full py-2 bg-[#5B8DEF] hover:bg-[#385DE8] text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
