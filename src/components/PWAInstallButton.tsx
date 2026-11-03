import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#F5F4EE] hover:bg-[#EAE8DF] border border-[#E5E4DE] rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-xs"
        title="Pasang aplikasi FALS di layar utama"
      >
        <Download className="w-3.5 h-3.5 text-[#57534E]" />
        <span>Install PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#F5F4EE] hover:bg-[#EAE8DF] border border-[#E5E4DE] rounded-md transition-colors whitespace-nowrap cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#57534E]" />
          <span>Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#FAF9F5] p-6 border border-[#E5E4DE] shadow-xl text-[#1C1917]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E4DE]">
                <h3 className="text-base font-semibold">Pasang FALS di iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-md text-[#78716C] hover:bg-[#F0EFEA]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-[#44403C] leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold bg-[#EAE8DF] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak panah ke atas) di bilah bawah browser Safari.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold bg-[#EAE8DF] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Gulir ke bawah lalu pilih menu <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold bg-[#EAE8DF] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Buka FALS langsung dari home screen ponselmu tanpa koneksi internet!</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full py-2.5 text-xs font-medium bg-[#1C1917] text-[#FAF9F5] rounded-lg hover:bg-[#292524] transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
