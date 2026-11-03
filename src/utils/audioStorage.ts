// Hybrid Audio Storage: IndexedDB (Local Offline & Zero-Latency) + Supabase Storage (Multi-Device Cloud)
import { getSupabase, getStoredSupabaseConfig } from '../services/supabase';

const DB_NAME = 'fals_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_memos';
const BUCKET_NAME = 'audio_memos';

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// In-memory fallback
const memoryFallback = new Map<string, Blob>();

export async function saveAudioBlob(id: string, blob: Blob): Promise<void> {
  // 1. Always save to local IndexedDB for instant playback & 100% offline access
  try {
    const db = await openAudioDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, blob, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write fallback to memory:', err);
    memoryFallback.set(id, blob);
  }

  // 2. If Supabase is configured and user is authenticated, sync to Supabase Storage in background
  const config = getStoredSupabaseConfig();
  if (config.isConfigured && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const client = getSupabase();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const filePath = `${user.id}/${id}`;
        client.storage.from(BUCKET_NAME).upload(filePath, blob, {
          upsert: true,
          contentType: blob.type || 'audio/webm',
        }).catch((uploadErr) => {
          console.warn('Supabase storage background upload deferred:', uploadErr);
        });
      }
    } catch (err) {
      console.warn('Supabase storage check warning:', err);
    }
  }
}

export async function getAudioBlob(id: string): Promise<Blob | null> {
  // 1. Try local IndexedDB first (fastest, zero network)
  try {
    const db = await openAudioDB();
    const localBlob = await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });

    if (localBlob) return localBlob;
  } catch (err) {
    console.warn('IndexedDB read error:', err);
  }

  // 2. Check memory cache
  if (memoryFallback.has(id)) {
    return memoryFallback.get(id) || null;
  }

  // 3. If missing locally, try fetching from Supabase Storage for multi-device sync
  const config = getStoredSupabaseConfig();
  if (config.isConfigured && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const client = getSupabase();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const filePath = `${user.id}/${id}`;
        const { data, error } = await client.storage.from(BUCKET_NAME).download(filePath);
        if (data && !error) {
          // Cache to IndexedDB for offline future access
          saveAudioBlob(id, data).catch(console.warn);
          return data;
        }
      }
    } catch {
      // Audio memo not in cloud or not accessible
    }
  }

  return null;
}

export async function deleteAudioBlob(id: string): Promise<void> {
  memoryFallback.delete(id);

  // 1. Delete from IndexedDB
  try {
    const db = await openAudioDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }

  // 2. Delete from Supabase Storage if logged in
  const config = getStoredSupabaseConfig();
  if (config.isConfigured) {
    try {
      const client = getSupabase();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const filePath = `${user.id}/${id}`;
        client.storage.from(BUCKET_NAME).remove([filePath]).catch(console.warn);
      }
    } catch {
      // Ignored if file does not exist
    }
  }
}
