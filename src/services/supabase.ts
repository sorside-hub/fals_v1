import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'fals_custom_supabase_url';
const STORAGE_KEY_ANON = 'fals_custom_supabase_anon_key';

export function getStoredSupabaseConfig() {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const url = customUrl || envUrl || '';
  const anonKey = customKey || envKey || '';

  return {
    url,
    anonKey,
    isCustom: Boolean(customUrl && customKey),
    isConfigured: Boolean(url && anonKey && url.startsWith('http')),
  };
}

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const { url, anonKey, isConfigured } = getStoredSupabaseConfig();

  // If not configured yet, provide a dummy fallback client to avoid crashes
  const targetUrl = isConfigured ? url : 'https://placeholder-fals.supabase.co';
  const targetKey = isConfigured ? anonKey : 'placeholder-anon-key';

  if (!clientInstance) {
    clientInstance = createClient(targetUrl, targetKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return clientInstance;
}

export function resetSupabaseClient() {
  clientInstance = null;
  return getSupabase();
}

export function saveCustomSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    resetSupabaseClient();
  }
}

export function clearCustomSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
    resetSupabaseClient();
  }
}

export const supabase = getSupabase();

export async function loginWithGoogle() {
  const client = getSupabase();
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : '';
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });
  if (error) throw error;
  return data;
}

export async function logoutUser() {
  const client = getSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
