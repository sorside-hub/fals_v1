import { useState, useEffect, useRef } from 'react';
import { BarItem } from '../types';
import { getSupabase, getStoredSupabaseConfig } from '../services/supabase';

const DUMMY_BAR_IDS = new Set(['bar-aporia', 'bar-jendela', 'bar-1', 'bar-3', 'bar-4', 'bar-5']);

const INITIAL_BARS: BarItem[] = [];

function mapBarToRow(bar: BarItem, userId: string) {
  return {
    id: bar.id,
    user_id: userId,
    text: bar.text || '',
    meaning: bar.meaning || '',
    category: bar.category || 'diksi',
    rhyme_scheme: bar.rhymeScheme || 'Free',
    syllable_count: Number(bar.syllableCount) || 0,
    tags: bar.tags || [],
    created_at: bar.createdAt || Date.now(),
  };
}

function mapRowToBar(row: any): BarItem {
  let cat = row.category || 'diksi';
  if (cat === 'metaphor' || cat === 'idea') cat = 'metafor';
  if (cat === 'punchline' || cat === 'rhyme') cat = 'bar';

  return {
    id: row.id,
    text: row.text || '',
    meaning: row.meaning || '',
    category: cat,
    rhymeScheme: row.rhyme_scheme || 'Free',
    syllableCount: Number(row.syllable_count) || 0,
    tags: row.tags || [],
    createdAt: Number(row.created_at) || Date.now(),
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

  const currentUserIdRef = useRef<string | null>(null);

  // Save to LocalStorage for offline immediate fallback
  useEffect(() => {
    try {
      localStorage.setItem('fals_bar_bank', JSON.stringify(barItems));
    } catch (e) {
      console.error('Failed to save bar bank to localStorage', e);
    }
  }, [barItems]);

  // Sync with Supabase when authenticated
  useEffect(() => {
    const config = getStoredSupabaseConfig();
    if (!config.isConfigured) return;

    const client = getSupabase();

    const fetchRemoteBars = async (userId: string) => {
      try {
        const { data, error } = await client
          .from('bars')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase fetch bars notice:', error.message);
          return;
        }

        if (data && data.length > 0) {
          const remoteBars = data.map(mapRowToBar).filter(b => !DUMMY_BAR_IDS.has(b.id));
          setBarItems(remoteBars);
        } else {
          // If remote empty and local has non-dummy bars, migrate them
          const localSaved = localStorage.getItem('fals_bar_bank');
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            const nonDummy = parsed.filter((b: BarItem) => !DUMMY_BAR_IDS.has(b.id));
            if (nonDummy.length > 0) {
              const rows = nonDummy.map((b: BarItem) => mapBarToRow(b, userId));
              await client.from('bars').upsert(rows);
            }
          }
        }
      } catch (err) {
        console.warn('Remote bars sync deferred:', err);
      }
    };

    // Check active session
    client.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      currentUserIdRef.current = user?.id || null;
      if (user) {
        fetchRemoteBars(user.id);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      currentUserIdRef.current = user?.id || null;
      if (user) {
        fetchRemoteBars(user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper to persist single bar item change to Supabase
  const persistBarToSupabase = async (item: BarItem) => {
    const userId = currentUserIdRef.current;
    const config = getStoredSupabaseConfig();
    if (!userId || !config.isConfigured) return;

    try {
      const client = getSupabase();
      const row = mapBarToRow(item, userId);
      const { error } = await client.from('bars').upsert(row);
      if (error) console.warn('Supabase bar save error:', error.message);
    } catch (err) {
      console.warn('Supabase save bar deferred:', err);
    }
  };

  const deleteBarFromSupabase = async (barId: string) => {
    const userId = currentUserIdRef.current;
    const config = getStoredSupabaseConfig();
    if (!userId || !config.isConfigured) return;

    try {
      const client = getSupabase();
      const { error } = await client.from('bars').delete().eq('id', barId);
      if (error) console.warn('Supabase delete bar error:', error.message);
    } catch (err) {
      console.warn('Supabase delete bar deferred:', err);
    }
  };

  const addBar = (newBar: Omit<BarItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => {
    const item: BarItem = {
      ...newBar,
      id: newBar.id || `bar-${Date.now()}`,
      createdAt: newBar.createdAt || Date.now(),
    };

    setBarItems(prev => [item, ...prev]);
    persistBarToSupabase(item);

    return item;
  };

  const updateBar = (updatedBar: BarItem) => {
    setBarItems(prev => prev.map(b => b.id === updatedBar.id ? updatedBar : b));
    persistBarToSupabase(updatedBar);
  };

  const deleteBar = (id: string) => {
    setBarItems(prev => prev.filter(b => b.id !== id));
    deleteBarFromSupabase(id);
  };

  return {
    barItems,
    addBar,
    updateBar,
    deleteBar,
  };
}
