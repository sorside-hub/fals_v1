import { useState, useEffect, useRef } from 'react';
import { SongDraft, LyricVersion, AudioMemo, ProjectType, SongStatus } from '../types';
import { saveAudioBlob, deleteAudioBlob } from '../utils/audioStorage';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/firestoreErrors';

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

// Clean object from any undefined values before Firestore persistence
function sanitizeSongForFirestore(song: SongDraft, userId: string) {
  return {
    id: song.id,
    userId: userId,
    title: song.title || '',
    projectType: song.projectType || 'single',
    status: song.status || 'draft',
    key: song.key || 'C',
    bpm: Number(song.bpm) || 95,
    timeSignature: song.timeSignature || '4/4',
    content: song.content || '',
    concept: song.concept || '',
    activeVersionId: song.activeVersionId || '',
    versions: (song.versions || []).map(v => ({
      id: v.id,
      name: v.name || '',
      content: v.content || '',
      key: v.key || 'C',
      bpm: Number(v.bpm) || 95,
      isFinal: Boolean(v.isFinal),
      createdAt: v.createdAt || Date.now(),
      updatedAt: v.updatedAt || Date.now(),
    })),
    tracks: (song.tracks || []).map(t => ({
      id: t.id,
      title: t.title || '',
      projectType: 'single',
      status: t.status || 'draft',
      key: t.key || 'C',
      bpm: Number(t.bpm) || 95,
      timeSignature: t.timeSignature || '4/4',
      content: t.content || '',
      concept: t.concept || '',
      activeVersionId: t.activeVersionId || '',
      versions: (t.versions || []).map(v => ({
        id: v.id,
        name: v.name || '',
        content: v.content || '',
        key: v.key || 'C',
        bpm: Number(v.bpm) || 95,
        isFinal: Boolean(v.isFinal),
        createdAt: v.createdAt || Date.now(),
        updatedAt: v.updatedAt || Date.now(),
      })),
      audioMemos: (t.audioMemos || []).map(m => ({
        id: m.id,
        name: m.name || '',
        duration: Number(m.duration) || 0,
        createdAt: m.createdAt || Date.now(),
      })),
      createdAt: t.createdAt || Date.now(),
      updatedAt: t.updatedAt || Date.now(),
    })),
    audioMemos: (song.audioMemos || []).map(m => ({
      id: m.id,
      name: m.name || '',
      duration: Number(m.duration) || 0,
      createdAt: m.createdAt || Date.now(),
    })),
    createdAt: song.createdAt || Date.now(),
    updatedAt: song.updatedAt || Date.now(),
  };
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
  const userRef = useRef(auth.currentUser);

  // Sync to LocalStorage as instant offline fallback
  useEffect(() => {
    try {
      localStorage.setItem('fals_songs', JSON.stringify(songs));
    } catch (e) {
      console.error('Failed to save songs to localStorage', e);
    }
  }, [songs]);

  // Firestore Real-Time Sync when authenticated
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      userRef.current = currentUser;

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!currentUser) return;

      const userSongsCol = collection(db, 'users', currentUser.uid, 'songs');

      unsubscribeSnapshot = onSnapshot(
        userSongsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteSongs: SongDraft[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as SongDraft;
              if (!DUMMY_SONG_IDS.has(data.id)) {
                remoteSongs.push(ensureSongVersions(data));
              }
            });
            remoteSongs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            setSongs(remoteSongs);
          } else {
            // First time login with empty Firestore: upload local songs if any non-dummy exist
            const localSaved = localStorage.getItem('fals_songs');
            if (localSaved) {
              const itemsToUpload = JSON.parse(localSaved);
              const nonDummy = itemsToUpload.filter((s: SongDraft) => !DUMMY_SONG_IDS.has(s.id));
              if (nonDummy.length > 0) {
                const batch = writeBatch(db);
                nonDummy.forEach((s: SongDraft) => {
                  const songDoc = doc(db, 'users', currentUser.uid, 'songs', s.id);
                  batch.set(songDoc, sanitizeSongForFirestore(ensureSongVersions(s), currentUser.uid));
                });
                batch.commit().catch(err => {
                  console.warn('Initial cloud migration deferred:', err);
                });
              }
            }
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, `users/${currentUser.uid}/songs`, currentUser);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Helper to persist single song or track change to Firestore
  const persistSongToFirestore = async (song: SongDraft) => {
    const user = userRef.current;
    if (!user) return;
    try {
      const path = `users/${user.uid}/songs/${song.id}`;
      const songDoc = doc(db, 'users', user.uid, 'songs', song.id);
      await setDoc(songDoc, sanitizeSongForFirestore(song, user.uid));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/songs/${song.id}`, user);
    }
  };

  const deleteSongFromFirestore = async (songId: string) => {
    const user = userRef.current;
    if (!user) return;
    try {
      const songDoc = doc(db, 'users', user.uid, 'songs', songId);
      await deleteDoc(songDoc);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/songs/${songId}`, user);
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
      persistSongToFirestore(affectedDirect);
    } else if (affectedParent) {
      persistSongToFirestore(affectedParent);
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
      persistSongToFirestore(newSong);
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
    persistSongToFirestore(newProject);
    return newProject;
  };

  const createSong = (title: string, key: string, status: 'draft' | 'proses' | 'release' = 'draft') => {
    return createProject('single', title, { key, status });
  };

  const deleteSong = (id: string) => {
    if (songs.length <= 1) return;
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
    deleteSongFromFirestore(id);
    if (currentSongId === id) {
      setCurrentSongId(remaining[0].id);
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
      persistSongToFirestore(updatedProj);
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
      persistSongToFirestore(updatedProj);
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
      persistSongToFirestore(updatedProj);
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

    deleteSongFromFirestore(singleId);
    persistSongToFirestore(updatedAlbum);

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

    persistSongToFirestore(newSingle);
    persistSongToFirestore(updatedAlbum);

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

  const addAudioMemo = async (songId: string, memo: AudioMemo, blob: Blob) => {
    await saveAudioBlob(memo.id, blob);
    setSongs(prev => applyToSongOrTrack(prev, songId, (song) => {
      const updatedMemos = [...(song.audioMemos || []), memo];
      return {
        ...song,
        audioMemos: updatedMemos,
        updatedAt: Date.now(),
      };
    }));
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

  const deleteAudioMemo = async (songId: string, memoId: string) => {
    await deleteAudioBlob(memoId);
    setSongs(prev => applyToSongOrTrack(prev, songId, (song) => {
      const updatedMemos = (song.audioMemos || []).filter(m => m.id !== memoId);
      return {
        ...song,
        audioMemos: updatedMemos,
        updatedAt: Date.now(),
      };
    }));
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
