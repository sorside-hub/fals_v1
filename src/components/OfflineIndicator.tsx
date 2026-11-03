import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#292524] text-[#FAF9F5] text-xs font-medium shadow-md border border-[#44403C]/40 animate-fade-in">
      <WifiOff className="w-3.5 h-3.5 text-[#D6D3D1]" />
      <span>Mode Offline — Semua data lirik & instrumen tetap aktif</span>
    </div>
  );
};
