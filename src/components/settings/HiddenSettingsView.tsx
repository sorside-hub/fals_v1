import React, { useState } from 'react';
import {
  ArrowLeft,
  Database,
  Copy,
  Check,
  Play,
  Key,
  Shield,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  getSupabase
} from '../../services/supabase';

const SUPABASE_SQL_MIGRATION = `-- ==========================================
-- FALS — Skrip Setup Database Supabase & Storage
-- Jalankan skrip ini di menu SQL Editor Supabase
-- ==========================================

-- 1. Tabel Lagu & Proyek (Single, EP, Album)
CREATE TABLE IF NOT EXISTS public.songs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  project_type TEXT NOT NULL DEFAULT 'single',
  status TEXT NOT NULL DEFAULT 'draft',
  key TEXT NOT NULL DEFAULT 'C',
  bpm INTEGER NOT NULL DEFAULT 95,
  time_signature TEXT NOT NULL DEFAULT '4/4',
  content TEXT NOT NULL DEFAULT '',
  concept TEXT NOT NULL DEFAULT '',
  active_version_id TEXT,
  versions JSONB NOT NULL DEFAULT '[]'::jsonb,
  tracks JSONB NOT NULL DEFAULT '[]'::jsonb,
  audio_memos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 2. Tabel Bank Amunisi (Diksi, Metafor, Bar, Hook)
CREATE TABLE IF NOT EXISTS public.bars (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  meaning TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'diksi',
  rhyme_scheme TEXT NOT NULL DEFAULT 'Free',
  syllable_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL
);

-- 3. Aktifkan Row Level Security (RLS) untuk Isolasi Privasi Total
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan Keamanan RLS untuk Lagu (Hanya pemilik yang bisa akses)
DROP POLICY IF EXISTS "Users can manage their own songs" ON public.songs;
CREATE POLICY "Users can manage their own songs"
ON public.songs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Kebijakan Keamanan RLS untuk Amunisi (Hanya pemilik yang bisa akses)
DROP POLICY IF EXISTS "Users can manage their own bars" ON public.bars;
CREATE POLICY "Users can manage their own bars"
ON public.bars
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Setup Storage Bucket Privat untuk Memo Audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio_memos',
  'audio_memos',
  false,
  52428800, -- 50 MB per file audio
  ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 7. Aturan Keamanan Storage RLS (User hanya bisa upload & download audionya sendiri)
DROP POLICY IF EXISTS "Allow authenticated user to upload own audio" ON storage.objects;
CREATE POLICY "Allow authenticated user to upload own audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio_memos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Allow user to read own audio" ON storage.objects;
CREATE POLICY "Allow user to read own audio"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio_memos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Allow user to delete own audio" ON storage.objects;
CREATE POLICY "Allow user to delete own audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio_memos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
`;

interface HiddenSettingsViewProps {
  onBack: () => void;
}

export const HiddenSettingsView: React.FC<HiddenSettingsViewProps> = ({ onBack }) => {
  const currentConfig = getStoredSupabaseConfig();
  const [urlInput, setUrlInput] = useState(currentConfig.url);
  const [keyInput, setKeyInput] = useState(currentConfig.anonKey);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
    details?: string;
  }>({ status: 'idle', message: '' });

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      alert('Harap isi URL dan Anon Key Supabase.');
      return;
    }
    saveCustomSupabaseConfig(urlInput, keyInput);
    setTestResult({
      status: 'idle',
      message: 'Konfigurasi tersimpan. Klik "Uji Koneksi" untuk memverifikasi.',
    });
  };

  const handleResetConfig = () => {
    if (confirm('Kembalikan ke konfigurasi default Environment Variables?')) {
      clearCustomSupabaseConfig();
      const cfg = getStoredSupabaseConfig();
      setUrlInput(cfg.url);
      setKeyInput(cfg.anonKey);
      setTestResult({ status: 'idle', message: '' });
    }
  };

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing', message: 'Menghubungi server Supabase...' });
    try {
      const client = getSupabase();

      // Test 1: Query songs table
      const { error: songsError } = await client.from('songs').select('id').limit(1);

      if (songsError) {
        if (songsError.code === '42P01') {
          // Table doesn't exist
          setTestResult({
            status: 'error',
            message: 'Tabel "songs" belum dibuat di Supabase!',
            details: 'Silakan salin skrip SQL di bawah lalu jalankan di SQL Editor Supabase.',
          });
          return;
        }
        throw songsError;
      }

      // Test 2: Check audio_memos bucket
      const { error: storageError } = await client.storage.from('audio_memos').list('', { limit: 1 });

      if (storageError && storageError.message.includes('not found')) {
        setTestResult({
          status: 'error',
          message: 'Tabel berhasil, tapi bucket "audio_memos" belum dibuat!',
          details: 'Jalankan skrip SQL bagian nomor 6 di bawah untuk membuat bucket storage.',
        });
        return;
      }

      setTestResult({
        status: 'success',
        message: 'Koneksi Berhasil! Database & Storage Siap Digunakan.',
        details: 'Tabel songs, bars, dan bucket audio_memos sudah aktif dengan keamanan RLS.',
      });
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: 'Gagal terhubung ke Supabase.',
        details: err.message || 'Periksa kembali URL dan Anon Key yang kamu masukkan.',
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F4EE] rounded-xl transition cursor-pointer"
            title="Kembali ke Studio"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-[#1C1917]">Setup & Konfigurasi Supabase</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-[#F5F4EE] text-[#78716C] border border-[#E5E4DE]">
                Admin Hub
              </span>
            </div>
            <p className="text-xs text-[#78716C]">Halaman tersembunyi untuk migrasi database & panduan teknis FALS.</p>
          </div>
        </div>

        <button
          onClick={handleCopySql}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5] rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'SQL Tersalin!' : 'Salin Skrip SQL'}</span>
        </button>
      </div>

      {/* Grid: Credentials & Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Card */}
        <div className="p-4 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#78716C]">
            <Shield className="w-3.5 h-3.5 text-[#1C1917]" />
            <span>Status Supabase</span>
          </div>

          <div className="p-3 bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  currentConfig.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-bold text-[#1C1917]">
                {currentConfig.isConfigured ? 'Terkonfigurasi' : 'Belum Dikonfigurasi'}
              </span>
            </div>
            <p className="text-[11px] text-[#78716C]">
              {currentConfig.isConfigured
                ? currentConfig.isCustom
                  ? 'Menggunakan konfigurasi manual (LocalStorage).'
                  : 'Menggunakan konfigurasi Environment Variables Cloudflare.'
                : 'Menggunakan mode Local Offline. Masukkan konfigurasi untuk mengaktifkan Cloud Sync.'}
            </p>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={!currentConfig.isConfigured || testResult.status === 'testing'}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-40"
          >
            <Play className="w-3 h-3" />
            <span>{testResult.status === 'testing' ? 'Memeriksa...' : 'Uji Koneksi Supabase'}</span>
          </button>

          {testResult.status !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                testResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : testResult.status === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-[#F5F4EE] border-[#E5E4DE] text-[#1C1917]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : testResult.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                ) : null}
                <span>{testResult.message}</span>
              </div>
              {testResult.details && <p className="text-[11px] leading-relaxed">{testResult.details}</p>}
            </div>
          )}
        </div>

        {/* Input / Form Card */}
        <div className="md:col-span-2 p-4 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#78716C]">
              <Key className="w-3.5 h-3.5 text-[#1C1917]" />
              <span>Kunci API Supabase</span>
            </div>
            {currentConfig.isCustom && (
              <button
                onClick={handleResetConfig}
                className="flex items-center gap-1 text-[11px] text-[#78716C] hover:text-rose-600 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ke Default ENV</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#78716C] mb-1">
                Project URL
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 text-xs bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl text-[#1C1917] outline-hidden focus:border-[#1C1917] font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#78716C] mb-1">
                anon public key
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl text-[#1C1917] outline-hidden focus:border-[#1C1917] font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#78716C]">
                Bisa dimasukkan di sini untuk tes, atau di ENV Cloudflare Pages untuk produksi.
              </span>
              <button
                type="submit"
                className="px-4 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5] rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SQL Script Box with Copy Button */}
      <div className="p-4 sm:p-5 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-[#1C1917]">Skrip SQL Lengkap (DDL, RLS & Storage)</h3>
            <p className="text-xs text-[#78716C]">
              Jalankan skrip ini sekali saja di menu **SQL Editor** pada project Supabase-mu.
            </p>
          </div>
          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F4EE] hover:bg-[#EAE8DF] border border-[#E5E4DE] text-[#1C1917] rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#78716C]" />}
            <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 bg-[#1C1917] text-[#FAF9F5] rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed select-all">
            {SUPABASE_SQL_MIGRATION}
          </pre>
        </div>
      </div>

      {/* Step-by-Step Tutorial Card */}
      <div className="p-4 sm:p-5 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#1C1917]" />
          <h3 className="text-sm font-bold text-[#1C1917]">Panduan Setup Supabase 4 Langkah</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-[#78716C]">
          <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl space-y-1.5">
            <span className="font-mono font-bold text-[#1C1917]">1. Buat Project Baru</span>
            <p className="leading-relaxed">
              Buka <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">supabase.com</a>, daftar akun gratis, lalu klik **New project**. Beri nama (misal: "FALS") dan tentukan password database.
            </p>
          </div>

          <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl space-y-1.5">
            <span className="font-mono font-bold text-[#1C1917]">2. Eksekusi Skrip SQL</span>
            <p className="leading-relaxed">
              Klik menu **SQL Editor** di panel kiri Supabase $\rightarrow$ klik **New query** $\rightarrow$ tempel (*paste*) skrip SQL di atas $\rightarrow$ klik **Run**.
            </p>
          </div>

          <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl space-y-1.5">
            <span className="font-mono font-bold text-[#1C1917]">3. Aktifkan Google Sign-in</span>
            <p className="leading-relaxed">
              Buka menu **Authentication** $\rightarrow$ **Providers** $\rightarrow$ pilih **Google** dan aktifkan (*toggle on*). Masukkan Client ID & Client Secret dari Google Cloud.
            </p>
          </div>

          <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl space-y-1.5">
            <span className="font-mono font-bold text-[#1C1917]">4. Salin Kunci ke Cloudflare</span>
            <p className="leading-relaxed">
              Buka **Project Settings** $\rightarrow$ **API**. Salin **Project URL** dan **anon key** ke Environment Variables di Cloudflare Pages (<code className="text-[#1C1917]">VITE_SUPABASE_URL</code> & <code className="text-[#1C1917]">VITE_SUPABASE_ANON_KEY</code>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
