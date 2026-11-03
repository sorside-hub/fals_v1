// IndexedDB + Firebase Storage for audio memo blobs
import { auth, storage } from '../services/firebase';
import { ref, uploadBytes, getBlob, deleteObject } from 'firebase/storage';

const DB_NAME = 'fals_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_memos';

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
  // 1. Always save to IndexedDB locally for 100% offline access & zero-latency playback
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

  // 2. If user is authenticated and online, upload to Firebase Storage
  const currentUser = auth.currentUser;
  if (currentUser && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const storageRef = ref(storage, `audio_memos/${currentUser.uid}/${id}`);
      await uploadBytes(storageRef, blob);
    } catch (err) {
      console.warn('Firebase Storage background upload deferred (offline/error):', err);
    }
  }
}

export async function getAudioBlob(id: string): Promise<Blob | null> {
  // 1. Try local IndexedDB first
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

  // 3. If missing locally, try fetching from Firebase Storage if logged in
  const currentUser = auth.currentUser;
  if (currentUser && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const storageRef = ref(storage, `audio_memos/${currentUser.uid}/${id}`);
      const cloudBlob = await getBlob(storageRef);
      // Cache it back to IndexedDB for offline access
      if (cloudBlob) {
        saveAudioBlob(id, cloudBlob).catch(console.warn);
        return cloudBlob;
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

  // 2. Delete from Firebase Storage if logged in
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const storageRef = ref(storage, `audio_memos/${currentUser.uid}/${id}`);
      await deleteObject(storageRef);
    } catch {
      // Ignored if file does not exist on storage
    }
  }
}
