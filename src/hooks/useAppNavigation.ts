import { useState, useEffect, useRef, useCallback } from 'react';
import { TabType } from '../types';

export interface ParsedRoute {
  rawHash: string;
  tab: TabType;
  subView?: 'editor' | 'deep' | 'concept' | 'album' | null;
  id?: string | null;
}

export function parseHash(hashStr: string): ParsedRoute {
  const clean = hashStr.replace(/^#\/?/, '').trim();
  if (!clean) {
    return { rawHash: '#lyrics', tab: 'lyrics', subView: null, id: null };
  }

  const parts = clean.split('/');
  const rawTab = parts[0]?.toLowerCase();

  let tab: TabType = 'lyrics';
  if (rawTab === 'bank' || rawTab === 'amunisi') {
    tab = 'bank';
  } else {
    tab = 'lyrics';
  }

  const subView = (parts[1] === 'editor' || parts[1] === 'deep' || parts[1] === 'concept' || parts[1] === 'album')
    ? (parts[1] as 'editor' | 'deep' | 'concept' | 'album')
    : null;
  const id = parts[2] ? decodeURIComponent(parts[2]) : null;

  return {
    rawHash: `#${clean}`,
    tab,
    subView,
    id,
  };
}

export function useAppNavigation() {
  const [route, setRoute] = useState<ParsedRoute>(() => {
    if (typeof window !== 'undefined') {
      return parseHash(window.location.hash);
    }
    return { rawHash: '#lyrics', tab: 'lyrics', subView: null, id: null };
  });

  // Scroll retention memory map
  const scrollMemoryRef = useRef<Record<string, number>>({});
  const lastHashRef = useRef<string>(route.rawHash);

  // Helper to save current scroll position for the active hash
  const saveCurrentScroll = useCallback(() => {
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash || '#lyrics';
      scrollMemoryRef.current[currentHash] = window.scrollY;
    }
  }, []);

  // Helper to restore scroll position for a target hash
  const restoreScroll = useCallback((targetHash: string) => {
    if (typeof window !== 'undefined') {
      const savedY = scrollMemoryRef.current[targetHash] ?? 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: 'instant' });
      });
    }
  }, []);

  // Listen for hashchange and popstate (native gesture back, browser buttons)
  useEffect(() => {
    // If no initial hash, set default #learn without polluting extra history
    if (!window.location.hash) {
      window.history.replaceState({ tab: 'learn' }, '', '#learn');
    }

    const handlePopState = (e: PopStateEvent) => {
      saveCurrentScroll();

      const newHash = window.location.hash || '#lyrics';
      const parsed = parseHash(newHash);

      setRoute(parsed);
      lastHashRef.current = newHash;
      restoreScroll(newHash);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [saveCurrentScroll, restoreScroll]);

  // Navigate explicitly to a new hash route
  const navigate = useCallback((targetHash: string, preserveScroll = false, replace = false) => {
    if (typeof window === 'undefined') return;

    const formatted = targetHash.startsWith('#') ? targetHash : `#${targetHash}`;
    if (window.location.hash === formatted) return;

    if (!preserveScroll) {
      saveCurrentScroll();
    }

    const parsed = parseHash(formatted);
    if (replace) {
      window.history.replaceState({ tab: parsed.tab, subView: parsed.subView, id: parsed.id }, '', formatted);
    } else {
      window.history.pushState({ tab: parsed.tab, subView: parsed.subView, id: parsed.id }, '', formatted);
    }
    setRoute(parsed);
    lastHashRef.current = formatted;

    if (!preserveScroll) {
      // New page navigation starts at top unless it's a restored route
      if (scrollMemoryRef.current[formatted] !== undefined) {
        restoreScroll(formatted);
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [saveCurrentScroll, restoreScroll]);

  // Go back natively
  const goBack = useCallback(() => {
    if (typeof window === 'undefined') return;

    saveCurrentScroll();

    // Check if we have history to go back to
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback: If no previous history entry in current tab
      if (route.subView) {
        navigate(`#${route.tab}`);
      } else if (route.tab !== 'lyrics') {
        navigate('#lyrics');
      }
    }
  }, [route, saveCurrentScroll, navigate]);

  return {
    route,
    navigate,
    goBack,
    saveCurrentScroll,
    restoreScroll,
  };
}
