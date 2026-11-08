import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-white bg-[#0045F9] hover:bg-[#0036C8] rounded-full shadow-xs transition active:scale-95"
        title="Installer l'application sur ton smartphone ou ordinateur"
      >
        <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span className="hidden sm:inline">Installer l'app</span>
        <span className="hidden xs:inline sm:hidden">Installer</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-[#0045F9] bg-[#EBF0FF] hover:bg-[#d8e4ff] rounded-full transition active:scale-95"
          title="Installer sur iPhone / iPad"
        >
          <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="hidden xs:inline">Installer</span>
        </button>

        {showIOSGuide && createPortal(
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xs sm:items-center">
            <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0045F9] flex items-center justify-center text-white">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#17181C]">Installer sur iPhone</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-[#6B7280]">
                <div className="flex items-start gap-3 p-3 bg-[#F8F9FB] rounded-xl">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0045F9] text-white flex items-center justify-center text-xs font-bold">1</span>
                  <p>Dans Safari, appuie sur le bouton de partage <strong className="text-[#17181C]">Partager</strong> (icône carré avec flèche vers le haut).</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#F8F9FB] rounded-xl">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0045F9] text-white flex items-center justify-center text-xs font-bold">2</span>
                  <p>Fais défiler la liste vers le bas et choisis <strong className="text-[#17181C]">« Sur l’écran d’accueil »</strong>.</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#F8F9FB] rounded-xl">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0045F9] text-white flex items-center justify-center text-xs font-bold">3</span>
                  <p>Valide en haut à droite avec <strong className="text-[#17181C]">Ajouter</strong>.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-[#0045F9] text-white text-sm font-semibold hover:bg-[#0036C8] transition"
              >
                Compris !
              </button>
            </div>
          </div>,
          document.body,
        )}
      </>
    );
  }

  return null;
};
