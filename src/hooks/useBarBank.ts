import { useState, useEffect, useRef } from 'react';
import { BarItem } from '../types';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/firestoreErrors';

const DUMMY_BAR_IDS = new Set(['bar-aporia', 'bar-jendela', 'bar-1', 'bar-3', 'bar-4', 'bar-5']);

const INITIAL_BARS: BarItem[] = [];

function sanitizeBarForFirestore(bar: BarItem, userId: string) {
  return {
    id: bar.id,
    userId: userId,
    text: bar.text || '',
    meaning: bar.meaning || '',
    category: bar.category || 'diksi',
    rhymeScheme: bar.rhymeScheme || 'Free',
    syllableCount: Number(bar.syllableCount) || 0,
    tags: bar.tags || [],
    createdAt: bar.createdAt || Date.now(),
  };
}

export function useBarBank() {
  const [barItems, setBarItems] = useState<BarItem[]>(() => {
    try {
      const saved = localStorage.getItem('fals_bar_bank');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed
        .filter((item: any) => !DUMMY_BAR_IDS.has(item.id))
        .map((item: any) => {
          let cat = item.category || 'diksi';
          if (cat === 'metaphor' || cat === 'idea') cat = 'metafor';
          if (cat === 'punchline' || cat === 'rhyme') cat = 'bar';
          return { ...item, category: cat };
        });
    } catch {
      return [];
    }
  });

  const userRef = useRef(auth.currentUser);

  // Save to LocalStorage for offline immediate fallback
  useEffect(() => {
    try {
      localStorage.setItem('fals_bar_bank', JSON.stringify(barItems));
    } catch (e) {
      console.error('Failed to save bar bank to localStorage', e);
    }
  }, [barItems]);

  // Sync with Firestore in real-time when authenticated
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      userRef.current = currentUser;

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!currentUser) return;

      const userBarsCol = collection(db, 'users', currentUser.uid, 'bars');

      unsubscribeSnapshot = onSnapshot(
        userBarsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteBars: BarItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as BarItem;
              if (!DUMMY_BAR_IDS.has(data.id)) {
                remoteBars.push(data);
              }
            });
            remoteBars.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setBarItems(remoteBars);
          } else {
            // First time login: migrate local bars only if non-dummy exist
            const localSaved = localStorage.getItem('fals_bar_bank');
            if (localSaved) {
              const parsed = JSON.parse(localSaved);
              const nonDummy = parsed.filter((b: BarItem) => !DUMMY_BAR_IDS.has(b.id));
              if (nonDummy.length > 0) {
                const batch = writeBatch(db);
                nonDummy.forEach((b: BarItem) => {
                  const barDoc = doc(db, 'users', currentUser.uid, 'bars', b.id);
                  batch.set(barDoc, sanitizeBarForFirestore(b, currentUser.uid));
                });
                batch.commit().catch(err => {
                  console.warn('Initial bar bank cloud migration deferred:', err);
                });
              }
            }
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, `users/${currentUser.uid}/bars`, currentUser);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const addBar = (newBar: Omit<BarItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => {
    const item: BarItem = {
      ...newBar,
      id: newBar.id || `bar-${Date.now()}`,
      createdAt: newBar.createdAt || Date.now(),
    };

    setBarItems(prev => [item, ...prev]);

    const user = userRef.current;
    if (user) {
      const barDoc = doc(db, 'users', user.uid, 'bars', item.id);
      setDoc(barDoc, sanitizeBarForFirestore(item, user.uid)).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/bars/${item.id}`, user);
      });
    }

    return item;
  };

  const updateBar = (updatedBar: BarItem) => {
    setBarItems(prev => prev.map(b => b.id === updatedBar.id ? updatedBar : b));

    const user = userRef.current;
    if (user) {
      const barDoc = doc(db, 'users', user.uid, 'bars', updatedBar.id);
      setDoc(barDoc, sanitizeBarForFirestore(updatedBar, user.uid)).catch(error => {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/bars/${updatedBar.id}`, user);
      });
    }
  };

  const deleteBar = (id: string) => {
    setBarItems(prev => prev.filter(b => b.id !== id));

    const user = userRef.current;
    if (user) {
      const barDoc = doc(db, 'users', user.uid, 'bars', id);
      deleteDoc(barDoc).catch(error => {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/bars/${id}`, user);
      });
    }
  };

  return {
    barItems,
    addBar,
    updateBar,
    deleteBar,
  };
}
