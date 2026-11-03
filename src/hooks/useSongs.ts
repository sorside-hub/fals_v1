import { useState, useEffect, useRef } from 'react';
import { SongDraft, LyricVersion, AudioMemo, ProjectType, SongStatus } from '../types';
import { saveAudioBlob, deleteAudioBlob } from '../utils/audioStorage';
import { getSupabase, getStoredSupabaseConfig } from '../services/supabase';

const DUMMY_SONG_IDS = new Set(['song-1', 'song-2', 'project-ep-1', 'track-ep-1', 'track-ep-2', 'track-ep-3']);

const INITIAL_SONGS: SongDraft[] = [];

const DEFAULT_EMPTY_SONG: SongDraft = {
  id: 'temp-empty',
  title: 'Tanpa Judul',
  projectType: 'single',
  key: 'C',
  bpm: 95,
  timeSignature: '4/4',
  status: 'draft',
  updatedAt: Date.now(),
  content: '<h3>[Verse 1]</h3><p></p><h3>[Chorus]</h3><p></p>',
  versions: [
    {
      id: 'v-1',
      name: 'Versi 1',
      content: '<h3>[Verse 1]</h3><p></p><h3>[Chorus]</h3><p></p>',
      key: 'C',
      bpm: 95,
      isFinal: true,
      createdAt: Date.now(),
    }
  ],
  activeVersionId: 'v-1',
};

export function ensureSongVersions(song: SongDraft): SongDraft {
  const projectType = song.projectType || 'single';
  const rawStatus = song.status || 'draft';
  const status = rawStatus === 'proses' ? 'progress' : rawStatus;

  // Recursively ensure tracks for EP and Album
  let tracks = song.tracks;
  if (tracks && tracks.length > 0) {
    tracks = tracks.map(t => ensureSongVersions({ ...t, projectType: 'single' }));
  }

  if (song.versions && song.versions.length > 0) {
    const activeVersionId = song.activeVersionId || song.versions.find(v => v.isFinal)?.id || song.versions[0].id;
    const versions = song.versions.map(v => ({
      ...v,
      key: v.key || song.key || 'C',
      bpm: v.bpm || song.bpm || 95,
    }));
    const finalVer = versions.find(v => v.isFinal) || versions[0];
    return {
      ...song,
      projectType,
      status,
      tracks,
      key: finalVer?.key || song.key || 'C',
      bpm: finalVer?.bpm ?? song.bpm ?? 95,
      versions,
      activeVersionId,
    };
  }

  const defaultVersion: LyricVersion = {
    id: `v-${song.id}-1`,
    name: 'Versi 1',
    content: song.content || '',
    key: song.key || 'C',
    bpm: song.bpm || 95,
    isFinal: true,
    createdAt: song.updatedAt || Date.now(),
  };

  return {
    ...song,
    projectType,
    status,
    tracks,
    versions: [defaultVersion],
    activeVersionId: defaultVersion.id,
  };
}

// Convert SongDraft to Supabase database row format
function mapSongToRow(song: SongDraft, userId: string) {
  return {
    id: song.id,
    user_id: userId,
    title: song.title || '',
    project_type: song.projectType || 'single',
    status: song.status || 'draft',
    key: song.key || 'C',
    bpm: Number(song.bpm) || 95,
    time_signature: song.timeSignature || '4/4',
    content: song.content || '',
    concept: song.concept || '',
    active_version_id: song.activeVersionId || '',
    versions: song.versions || [],
    tracks: song.tracks || [],
    audio_memos: song.audioMemos || [],
    created_at: song.createdAt || Date.now(),
    updated_at: song.updatedAt || Date.now(),
  };
}

// Convert Supabase database row to SongDraft format
function mapRowToSong(row: any): SongDraft {
  return ensureSongVersions({
    id: row.id,
    title: row.title,
    projectType: row.project_type,
    status: row.status,
    key: row.key,
    bpm: row.bpm,
    timeSignature: row.time_signature,
    content: row.content,
    concept: row.concept,
    activeVersionId: row.active_version_id,
    versions: row.versions || [],
    tracks: row.tracks || [],
    audioMemos: row.audio_memos || [],
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Date.now(),
  });
}

export function useSongs() {
  const [songs, setSongs] = useState<SongDraft[]>(() => {
    try {
      const saved = localStorage.getItem('fals_songs');
      if (saved) {
        const parsed: SongDraft[] = JSON.parse(saved);
        const nonDummy = parsed.filter(s => !DUMMY_SONG_IDS.has(s.id));
        return nonDummy.map(ensureSongVersions);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [currentSongId, setCurrentSongId] = useState<string>(() => {
    return songs[0]?.id || '';
  });

  const [activeParentAlbumId, setActiveParentAlbumId] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // Sync to LocalStorage as instant offline fallback
  useEffect(() => {
    try {
      localStorage.setItem('fals_songs', JSON.stringify(songs));
    } catch (e) {
      console.error('Failed to save songs to localStorage', e);
    }
  }, [songs]);

  // Supabase Real-Time & Initial Sync
  useEffect(() => {
    const config = getStoredSupabaseConfig();
    if (!config.isConfigured) return;

    const client = getSupabase();

    const fetchRemoteSongs = async (userId: string) => {
      try {
        const { data, error } = await client
          .from('songs')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) {
          console.warn('Supabase fetch songs notice:', error.message);
          return;
        }

        if (data && data.length > 0) {
          const remoteSongs = data.map(mapRowToSong).filter(s => !DUMMY_SONG_IDS.has(s.id));
          setSongs(remoteSongs);
        } else {
          // Empty remote: if local has non-dummy songs, migrate them to Supabase
          const localSaved = localStorage.getItem('fals_songs');
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            const nonDummy = parsed.filter((s: SongDraft) => !DUMMY_SONG_IDS.has(s.id));
            if (nonDummy.length > 0) {
              const rows = nonDummy.map((s: SongDraft) => mapSongToRow(ensureSongVersions(s), userId));
              await client.from('songs').upsert(rows);
            }
          }
        }
      } catch (err) {
        console.warn('Remote song sync deferred:', err);
      }
    };

    // Check current session
    client.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      currentUserIdRef.current = user?.id || null;
      if (user) {
        fetchRemoteSongs(user.id);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      currentUserIdRef.current = user?.id || null;
      if (user) {
        fetchRemoteSongs(user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper to persist single song or track change to Supabase
  const persistSongToSupabase = async (song: SongDraft) => {
    const userId = currentUserIdRef.current;
    const config = getStoredSupabaseConfig();
    if (!userId || !config.isConfigured) return;

    try {
      const client = getSupabase();
      const row = mapSongToRow(song, userId);
      const { error } = await client.from('songs').upsert(row);
      if (error) console.warn('Supabase song save error:', error.message);
    } catch (err) {
      console.warn('Supabase save song deferred:', err);
    }
  };

  const deleteSongFromSupabase = async (songId: string) => {
    const userId = currentUserIdRef.current;
    const config = getStoredSupabaseConfig();
    if (!userId || !config.isConfigured) return;

    try {
      const client = getSupabase();
      const { error } = await client.from('songs').delete().eq('id', songId);
      if (error) console.warn('Supabase delete song error:', error.message);
    } catch (err) {
      console.warn('Supabase delete song deferred:', err);
    }
  };

  function applyToSongOrTrack(
    prevSongs: SongDraft[],
    targetId: string,
    updater: (song: SongDraft) => SongDraft
  ): SongDraft[] {
    let affectedParent: SongDraft | null = null;
    let affectedDirect: SongDraft | null = null;

    const next = prevSongs.map(s => {
      if (s.id === targetId) {
        const updated = ensureSongVersions(updater(ensureSongVersions(s)));
        affectedDirect = updated;
        return updated;
      }
      if (s.tracks && s.tracks.some(t => t.id === targetId)) {
        const updatedParent: SongDraft = {
          ...s,
          updatedAt: Date.now(),
          tracks: s.tracks.map(t =>
            t.id === targetId ? ensureSongVersions(updater(ensureSongVersions(t))) : t
          ),
        };
        affectedParent = updatedParent;
        return updatedParent;
      }
      return s;
    });

    if (affectedDirect) {
      persistSongToSupabase(affectedDirect);
    } else if (affectedParent) {
      persistSongToSupabase(affectedParent);
    }

    return next;
  }

  const findSong = (id: string): { song: SongDraft; parentAlbum?: SongDraft } | null => {
    for (const s of songs) {
      if (s.id === id) return { song: s };
      if (s.tracks) {
        const tr = s.tracks.find(t => t.id === id);
        if (tr) return { song: tr, parentAlbum: s };
      }
    }
    return null;
  };

  const lookup = findSong(currentSongId);
  const currentSong = lookup ? ensureSongVersions(lookup.song) : ensureSongVersions(songs[0] || DEFAULT_EMPTY_SONG);
  const currentParentAlbum = lookup?.parentAlbum || (activeParentAlbumId ? songs.find(s => s.id === activeParentAlbumId) : undefined);

  const updateSong = (updatedSong: SongDraft) => {
    setSongs(prev => applyToSongOrTrack(prev, updatedSong.id, () => updatedSong));
  };

  const createProject = (
    type: ProjectType,
    title: string,
    options?: {
      key?: string;
      concept?: string;
      trackCount?: number;
      status?: SongStatus;
    }
  ) => {
    const timestamp = Date.now();
    const status = options?.status || 'draft';
    const initialKey = options?.key || 'C';

    if (type === 'single') {
      const initialContent = `<h3>[Verse 1]</h3><p></p><h3>[Chorus]</h3><p></p>`;
      const defaultVersion: LyricVersion = {
        id: `v-${timestamp}`,
        name: 'Versi 1',
        content: initialContent,
        key: initialKey,
        bpm: 95,
        isFinal: true,
        createdAt: timestamp,
      };
      const newSong: SongDraft = {
        id: `song-${timestamp}`,
        title,
        projectType: 'single',
        key: initialKey,
        bpm: 95,
        timeSignature: '4/4',
        status,
        updatedAt: timestamp,
        content: initialContent,
        versions: [defaultVersion],
        activeVersionId: defaultVersion.id,
      };
      setSongs(prev => [newSong, ...prev]);
      setCurrentSongId(newSong.id);
      setActiveParentAlbumId(null);
      persistSongToSupabase(newSong);
      return newSong;
    }

    const defaultTrackCount = options?.trackCount !== undefined ? options.trackCount : (type === 'ep' ? 4 : 8);
    const generatedTracks: SongDraft[] = Array.from({ length: defaultTrackCount }).map((_, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const trackId = `track-${timestamp}-${idx + 1}`;
      const trackVerId = `v-track-${timestamp}-${idx + 1}`;
      return {
        id: trackId,
        title: `Track ${num}`,
        projectType: 'single',
        key: 'C',
        bpm: 95,
        timeSignature: '4/4',
        status: 'draft',
        updatedAt: timestamp,
        content: `<h3>[Verse 1]</h3><p></p><h3>[Chorus]</h3><p></p>`,
        versions: [
          {
            id: trackVerId,
            name: 'Versi 1',
            content: `<h3>[Verse 1]</h3><p></p><h3>[Chorus]</h3><p></p>`,
            key: 'C',
            bpm: 95,
            isFinal: true,
            createdAt: timestamp,
          }
        ],
        activeVersionId: trackVerId,
      };
    });

    const newProject: SongDraft = {
      id: `project-${timestamp}`,
      title,
      projectType: type,
      concept: options?.concept || '',
      key: 'C',
      bpm: 95,
      timeSignature: '4/4',
      status,
      updatedAt: timestamp,
      content: '',
      tracks: generatedTracks,
    };

    setSongs(prev => [newProject, ...prev]);
    setCurrentSongId(newProject.id);
    setActiveParentAlbumId(null);
    persistSongToSupabase(newProject);
    return newProject;
  };

  const createSong = (title: string, key: string, status: 'draft' | 'proses' | 'release' = 'draft') => {
    return createProject('single', title, { key, status });
  };

  const deleteSong = (id: string) => {
    const target = songs.find(s => s.id === id);
    if (target?.audioMemos) {
      target.audioMemos.forEach(m => deleteAudioBlob(m.id).catch(console.error));
    }
    if (target?.tracks) {
      target.tracks.forEach(tr => {
        tr.audioMemos?.forEach(m => deleteAudioBlob(m.id).catch(console.error));
      });
    }

    const remaining = songs.filter(s => s.id !== id);
    setSongs(remaining);
    deleteSongFromSupabase(id);
    if (currentSongId === id) {
      setCurrentSongId(remaining[0]?.id || '');
      setActiveParentAlbumId(null);
    }
  };

  const selectSong = (song: SongDraft, parentAlbum?: SongDraft) => {
    setCurrentSongId(song.id);
    setActiveParentAlbumId(parentAlbum ? parentAlbum.id : null);
    const ensured = ensureSongVersions(song);
    const finalVersion = ensured.versions?.find(v => v.isFinal) || ensured.versions?.[0];
    if (finalVersion && ensured.projectType === 'single') {
      const updated = {
        ...ensured,
        activeVersionId: finalVersion.id,
        content: finalVersion.content,
        key: finalVersion.key || ensured.key,
        bpm: finalVersion.bpm ?? ensured.bpm,
      };
      updateSong(updated);
    }
  };

  const addTrackToProject = (projectId: string, title?: string) => {
    setSongs(prev => prev.map(proj => {
      if (proj.id !== projectId) return proj;
      const count = (proj.tracks?.length || 0) + 1;
      const num = String(count).padStart(2, '0');
      const timestamp = Date.now();
      const trackId = `track-${timestamp}`;
      const verId = `v-${timestamp}`;
      const newTrack: SongDraft = {
        id: trackId,
        title: title || `Track ${num}`,
        projectType: 'single',
        key: 'C',
        bpm: 95,
        timeSignature: '4/4',
        status: 'draft',
        updatedAt: timestamp,
        content: `<h3>[Verse 1]</h3><p></p><h3>[Chorus]</h3><p></p>`,
        versions: [
          {
            id: verId,
            name: 'Versi 1',
            content: `<h3>[Verse 1]</h3><p></p><h3>[Chorus]</h3><p></p>`,
            key: 'C',
            bpm: 95,
            isFinal: true,
            createdAt: timestamp,
          }
        ],
        activeVersionId: verId,
      };
      const updatedProj: SongDraft = {
        ...proj,
        tracks: [...(proj.tracks || []), newTrack],
        updatedAt: timestamp,
      };
      persistSongToSupabase(updatedProj);
      return updatedProj;
    }));
  };

  const deleteTrackFromProject = (projectId: string, trackId: string) => {
    setSongs(prev => prev.map(proj => {
      if (proj.id !== projectId) return proj;
      if (!proj.tracks || proj.tracks.length <= 1) return proj;
      const targetTrack = proj.tracks.find(t => t.id === trackId);
      targetTrack?.audioMemos?.forEach(m => deleteAudioBlob(m.id).catch(console.error));
      const updatedProj = {
        ...proj,
        tracks: proj.tracks.filter(t => t.id !== trackId),
        updatedAt: Date.now(),
      };
      persistSongToSupabase(updatedProj);
      return updatedProj;
    }));
  };

  const updateProjectConcept = (projectId: string, concept: string) => {
    setSongs(prev => prev.map(proj => {
      if (proj.id !== projectId) return proj;
      const updatedProj = {
        ...proj,
        concept,
        updatedAt: Date.now(),
      };
      persistSongToSupabase(updatedProj);
      return updatedProj;
    }));
  };

  const moveSingleToAlbum = (
    singleId: string,
    targetAlbumId: string
  ): { movedTrack: SongDraft | null; targetAlbum: SongDraft | null } => {
    const single = songs.find(s => s.id === singleId);
    const album = songs.find(s => s.id === targetAlbumId);
    if (!single || !album) {
      return { movedTrack: null, targetAlbum: null };
    }

    const rawStatus = single.status || 'draft';
    const trackStatus: SongStatus = rawStatus === 'release' ? 'final' : rawStatus;

    const newTrack: SongDraft = {
      ...ensureSongVersions(single),
      projectType: 'single',
      status: trackStatus,
      updatedAt: Date.now(),
    };

    const updatedAlbum: SongDraft = {
      ...album,
      tracks: [...(album.tracks || []), newTrack],
      updatedAt: Date.now(),
    };

    setSongs(prev =>
      prev
        .filter(s => s.id !== singleId)
        .map(s => s.id === targetAlbumId ? updatedAlbum : s)
    );

    setCurrentSongId(singleId);
    setActiveParentAlbumId(targetAlbumId);

    deleteSongFromSupabase(singleId);
    persistSongToSupabase(updatedAlbum);

    return { movedTrack: newTrack, targetAlbum: updatedAlbum };
  };

  const convertTrackToSingle = (
    trackId: string,
    parentAlbumId: string
  ): SongDraft | null => {
    const album = songs.find(s => s.id === parentAlbumId);
    if (!album || !album.tracks) return null;

    const track = album.tracks.find(t => t.id === trackId);
    if (!track) return null;

    const rawStatus = track.status || 'draft';
    const singleStatus: SongStatus = rawStatus === 'final' ? 'release' : rawStatus;

    const newSingle: SongDraft = {
      ...ensureSongVersions(track),
      projectType: 'single',
      status: singleStatus,
      updatedAt: Date.now(),
    };

    const updatedTracks = album.tracks.filter(t => t.id !== trackId);
    const updatedAlbum: SongDraft = {
      ...album,
      tracks: updatedTracks,
      updatedAt: Date.now(),
    };

    setSongs(prev => {
      const albumIdx = prev.findIndex(s => s.id === parentAlbumId);
      if (albumIdx === -1) return prev;
      const nextSongs = [...prev];
      nextSongs[albumIdx] = updatedAlbum;
      nextSongs.splice(albumIdx, 0, newSingle);
      return nextSongs;
    });

    setCurrentSongId(trackId);
    setActiveParentAlbumId(null);

    persistSongToSupabase(newSingle);
    persistSongToSupabase(updatedAlbum);

    return newSingle;
  };

  const addVersion = (songId: string, duplicateFromActive = true) => {
    setSongs(prev => applyToSongOrTrack(prev, songId, (song) => {
      const versionCount = (song.versions?.length || 0) + 1;
      const timestamp = Date.now();
      const activeVer = song.versions?.find(v => v.id === song.activeVersionId);
      const newKey = duplicateFromActive && activeVer?.key ? activeVer.key : song.key || 'C';
      const newBpm = duplicateFromActive && activeVer?.bpm ? activeVer.bpm : song.bpm || 95;
      const newVersion: LyricVersion = {
        id: `v-${timestamp}`,
        name: `Versi ${versionCount}`,
        content: duplicateFromActive && activeVer ? activeVer.content : `<h3>[Verse 1]</h3><p></p>`,
        key: newKey,
        bpm: newBpm,
        isFinal: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const updatedVersions = [...(song.versions || []), newVersion];
      return {
        ...song,
        versions: updatedVersions,
        activeVersionId: newVersion.id,
        content: newVersion.content,
        updatedAt: timestamp,
      };
    }));
  };

  const setFinalVersion = (songId: string, versionId: string) => {
    const now = Date.now();
    setSongs(prev => applyToSongOrTrack(prev, songId, (song) => {
      const updatedVersions = (song.versions || []).map(v => ({
        ...v,
        isFinal: v.id === versionId,
        updatedAt: v.id === versionId ? now : v.updatedAt,
      }));
      const finalVer = updatedVersions.find(v => v.id === versionId);
      return {
        ...song,
        key: finalVer?.key || song.key,
        bpm: finalVer?.bpm ?? song.bpm,
        versions: updatedVersions,
        updatedAt: now,
      };
    }));
  };

  const switchVersion = (songId: string, versionId: string) => {
    setSongs(prev => applyToSongOrTrack(prev, songId, (song) => {
      const targetVer = song.versions?.find(v => v.id === versionId);
      if (!targetVer) return song;
      return {
        ...song,
        activeVersionId: versionId,
        content: targetVer.content,
        updatedAt: Date.now(),
      };
    }));
  };

  const renameVersion = (songId: string, versionId: string, newName: string) => {
    setSongs(prev => applyToSongOrTrack(prev, songId, (song) => {
      const updatedVersions = (song.versions || []).map(v => v.id === versionId ? { ...v, name: newName, updatedAt: Date.now() } : v);
      return {
        ...song,
        versions: updatedVersions,
        updatedAt: Date.now(),
      };
    }));
  };

  const deleteVersion = (songId: string, versionId: string) => {
    setSongs(prev => applyToSongOrTrack(prev, songId, (song) => {
      if (!song.versions || song.versions.length <= 1) return song;

      const remainingVersions = song.versions.filter(v => v.id !== versionId);
      const hasFinal = remainingVersions.some(v => v.isFinal);
      const finalVersions = hasFinal
        ? remainingVersions
        : remainingVersions.map((v, i) => i === 0 ? { ...v, isFinal: true } : v);

      const nextActive = finalVersions.find(v => v.id === song.activeVersionId) || finalVersions[0];

      return {
        ...song,
        versions: finalVersions,
        activeVersionId: nextActive.id,
        content: nextActive.content,
        updatedAt: Date.now(),
      };
    }));
  };

  // Audio Memo management: 100% instant UI update + background cloud persistence
  const addAudioMemo = (songId: string, memo: AudioMemo, blob: Blob) => {
    // 1. Instantly update UI and song document metadata
    setSongs(prev => applyToSongOrTrack(prev, songId, (song) => {
      const updatedMemos = [...(song.audioMemos || []), memo];
      return {
        ...song,
        audioMemos: updatedMemos,
        updatedAt: Date.now(),
      };
    }));

    // 2. Persist blob to IndexedDB & Supabase Storage in background without blocking UI
    saveAudioBlob(memo.id, blob).catch(err => {
      console.warn('Background audio save warning:', err);
    });
  };

  const renameAudioMemo = (songId: string, memoId: string, newName: string) => {
    setSongs(prev => applyToSongOrTrack(prev, songId, (song) => {
      const updatedMemos = (song.audioMemos || []).map(m => m.id === memoId ? { ...m, name: newName } : m);
      return {
        ...song,
        audioMemos: updatedMemos,
        updatedAt: Date.now(),
      };
    }));
  };

  const deleteAudioMemo = (songId: string, memoId: string) => {
    // 1. Instantly update UI and song document metadata
    setSongs(prev => applyToSongOrTrack(prev, songId, (song) => {
      const updatedMemos = (song.audioMemos || []).filter(m => m.id !== memoId);
      return {
        ...song,
        audioMemos: updatedMemos,
        updatedAt: Date.now(),
      };
    }));

    // 2. Delete blob in background
    deleteAudioBlob(memoId).catch(err => {
      console.warn('Background audio delete warning:', err);
    });
  };

  return {
    songs,
    currentSong,
    currentSongId,
    currentParentAlbum,
    activeParentAlbumId,
    setActiveParentAlbumId,
    findSong,
    updateSong,
    createProject,
    createSong,
    deleteSong,
    selectSong,
    addTrackToProject,
    deleteTrackFromProject,
    moveSingleToAlbum,
    convertTrackToSingle,
    updateProjectConcept,
    addVersion,
    setFinalVersion,
    switchVersion,
    renameVersion,
    deleteVersion,
    addAudioMemo,
    renameAudioMemo,
    deleteAudioMemo,
  };
}
