import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Cloud, CloudOff, LogIn, LogOut, CheckCircle2, Shield, User, X } from 'lucide-react';

interface UserSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSyncModal: React.FC<UserSyncModalProps> = ({ isOpen, onClose }) => {
  const { user, loading, signIn, signOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      await signIn();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login dengan Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal logout');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-xl p-5 space-y-4 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#1C1917]" />
            <h3 className="text-sm font-bold text-[#1C1917]">Akun & Cloud Sync</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F4EE] rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-10 h-10 rounded-full border border-[#E5E4DE] object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1C1917] text-[#FAF9F5] flex items-center justify-center font-bold text-sm">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1C1917] truncate">{user.displayName || 'Musisi FALS'}</p>
                <p className="text-xs text-[#78716C] truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Cloud Sync Aktif</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Lirik, versi lagu, dan bank amunisi otomatis tersimpan aman di Firebase Firestore.
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Akun</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#1C1917] font-semibold">
                <Shield className="w-4 h-4 text-[#1C1917]" />
                <span>Simpan Lagu Lintas Perangkat</span>
              </div>
              <p className="text-[#78716C] leading-relaxed text-[11px]">
                Masuk dengan akun Google untuk menyinkronkan lirik dan bank amunisi ide lagumu ke cloud secara otomatis. Tetap berfungsi offline saat tanpa sinyal!
              </p>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5] text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSigningIn ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
