import React, { useState, useEffect, useMemo } from 'react';
import { TabType, SongDraft, ProjectType, SongStatus } from './types';
import { BottomNav } from './components/BottomNav';
import { LyricListView } from './components/lyrics/LyricListView';
import { LyricEditor } from './components/LyricEditor';
import { ConceptEditor } from './components/lyrics/ConceptEditor';
import { AlbumProjectView } from './components/lyrics/AlbumProjectView';
import { BankBar } from './components/BankBar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useSongs } from './hooks/useSongs';
import { useBarBank } from './hooks/useBarBank';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useVirtualKeyboard } from './hooks/useVirtualKeyboard';

export default function App() {
  // Native History, Hash Routing, and Scroll Retention Engine
  const { route, navigate, goBack } = useAppNavigation();

  // Centralized Virtual Keyboard Hook for Mobile Ergonomics
  const { isKeyboardVisible } = useVirtualKeyboard();

  // Modular state management with custom hooks
  const {
    songs,
    currentSong,
    currentSongId,
    currentParentAlbum,
    findSong,
    updateSong,
    createProject,
    deleteSong,
    selectSong,
    addTrackToProject,
    deleteTrackFromProject,
    moveSingleToAlbum,
    convertTrackToSingle,
    addVersion,
    setFinalVersion,
    switchVersion,
    renameVersion,
    deleteVersion,
    addAudioMemo,
    renameAudioMemo,
    deleteAudioMemo,
  } = useSongs();

  const {
    barItems,
    addBar,
    updateBar,
    deleteBar,
  } = useBarBank();

  // Modal and insertion states
  const [insertedBarText, setInsertedBarText] = useState<string | null>(null);
  const [lastActiveSongId, setLastActiveSongId] = useState<string | null>(currentSongId);
  const [lastLyricSubView, setLastLyricSubView] = useState<'list' | 'editor'>('list');
  const [lastActiveBarId, setLastActiveBarId] = useState<string | null>(null);
  const [lastBankSubView, setLastBankSubView] = useState<'list' | 'editor'>('list');

  // Track active subView and sync current song/bar when navigating in tabs
  useEffect(() => {
    if (route.tab === 'lyrics') {
      if (route.subView === 'editor' || route.subView === 'concept') {
        setLastLyricSubView('editor');
        if (route.id) {
          setLastActiveSongId(route.id);
          const found = findSong(route.id);
          if (found && found.song.id !== currentSongId) {
            selectSong(found.song, found.parentAlbum);
          }
        }
      } else {
        setLastLyricSubView('list');
      }
    } else if (route.tab === 'bank') {
      if (route.subView === 'editor') {
        setLastBankSubView('editor');
        if (route.id) {
          setLastActiveBarId(route.id);
        }
      } else {
        setLastBankSubView('list');
      }
    }
  }, [route, findSong, currentSongId, selectSong]);

  // Tab switching via hash router
  const handleSelectTab = (tab: TabType) => {
    if (tab === 'lyrics') {
      if (route.tab === 'lyrics') {
        // If currently ALREADY in lyrics tab and on editor/concept/album: clicking lyrics tab toggles back to list view
        if (route.subView === 'editor' || route.subView === 'concept' || route.subView === 'album') {
          setLastLyricSubView('list');
          navigate('#lyrics');
        } else {
          // Already on list view
          navigate('#lyrics');
        }
      } else {
        // Switching from ANOTHER tab (learn/bank/tools) back to lyrics tab:
        if (lastLyricSubView === 'editor') {
          const activeSongId = lastActiveSongId || currentSongId;
          const found = activeSongId ? findSong(activeSongId) : null;
          if (found) {
            navigate(`#lyrics/editor/${activeSongId}`);
          } else {
            navigate('#lyrics');
          }
        } else {
          navigate('#lyrics');
        }
      }
    } else if (tab === 'bank') {
      if (route.tab === 'bank') {
        // If currently ALREADY in bank tab and in editor: clicking bank tab toggles back to list view
        if (route.subView === 'editor') {
          setLastBankSubView('list');
          navigate('#bank');
        } else {
          navigate('#bank');
        }
      } else {
        // Switching from ANOTHER tab back to bank:
        if (lastBankSubView === 'editor') {
          const activeBarId = lastActiveBarId;
          const found = activeBarId && activeBarId !== 'new' ? barItems.find(b => b.id === activeBarId) : null;
          if (found) {
            navigate(`#bank/editor/${activeBarId}`);
          } else if (activeBarId === 'new') {
            navigate('#bank/editor/new');
          } else {
            navigate('#bank');
          }
        } else {
          navigate('#bank');
        }
      }
    }
  };

  // Lyric navigation
  const handleSelectSongFromList = (song: SongDraft) => {
    if (song.projectType === 'ep' || song.projectType === 'album') {
      navigate(`#lyrics/album/${song.id}`);
    } else {
      selectSong(song);
      setLastActiveSongId(song.id);
      setLastLyricSubView('editor');
      navigate(`#lyrics/editor/${song.id}`);
    }
  };

  const handleCreateProject = (
    type: ProjectType,
    title: string,
    options?: {
      key?: string;
      concept?: string;
      trackCount?: number;
      status?: SongStatus;
    }
  ) => {
    const created = createProject(type, title, options);
    if (created) {
      if (created.projectType === 'ep' || created.projectType === 'album') {
        navigate(`#lyrics/album/${created.id}`);
      } else {
        selectSong(created);
        setLastActiveSongId(created.id);
        setLastLyricSubView('editor');
        navigate(`#lyrics/editor/${created.id}`);
      }
    }
  };

  // Send bar directly to active lyric editor
  const handleSendToLyric = (text: string) => {
    setInsertedBarText(text);
    setLastLyricSubView('editor');
    navigate(`#lyrics/editor/${currentSong.id}`);
  };

  // Available EP and Album projects for moving singles
  const albumProjects = useMemo(() => {
    return songs.filter(s => s.projectType === 'ep' || s.projectType === 'album');
  }, [songs]);

  const handleMoveSingleToAlbum = (singleId: string, targetAlbumId: string) => {
    const result = moveSingleToAlbum(singleId, targetAlbumId);
    if (result.movedTrack && result.targetAlbum) {
      selectSong(result.movedTrack, result.targetAlbum);
      setLastActiveSongId(result.movedTrack.id);
      setLastLyricSubView('editor');
      navigate(`#lyrics/editor/${result.movedTrack.id}`);
    }
  };

  const handleCreateAlbumAndMove = (title: string, type: ProjectType) => {
    const created = createProject(type, title, { trackCount: 0 });
    if (created) {
      handleMoveSingleToAlbum(currentSong.id, created.id);
    }
  };

  const handleConvertTrackToSingle = (trackId: string, parentAlbumId: string) => {
    const converted = convertTrackToSingle(trackId, parentAlbumId);
    if (converted) {
      selectSong(converted);
      setLastActiveSongId(converted.id);
      if (isAlbumOpen) {
        // Track list in album view automatically reflects the removal
      } else {
        setLastLyricSubView('editor');
        navigate(`#lyrics/editor/${converted.id}`);
      }
    }
  };

  const isLyricEditorOpen = route.tab === 'lyrics' && route.subView === 'editor';
  const isLyricConceptOpen = route.tab === 'lyrics' && route.subView === 'concept';
  const isAlbumOpen = route.tab === 'lyrics' && route.subView === 'album';
  const isBarEditorOpen = route.tab === 'bank' && route.subView === 'editor';
  const isFullScreenEditor = isLyricEditorOpen || isLyricConceptOpen || isBarEditorOpen;

  // Active album project if in album subView
  const currentAlbumProject = isAlbumOpen ? songs.find(s => s.id === route.id) : null;

  // Hide bottom navbar on mobile when keyboard is open in editors
  const shouldHideBottomNavOnMobile = isFullScreenEditor && isKeyboardVisible;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#1C1917] selection:bg-[#EAE8DF]">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Main Responsive Content Workspace */}
      <main
        className={`flex-1 w-full mx-auto pb-14 md:pb-16 ${
          isLyricEditorOpen || isLyricConceptOpen || isAlbumOpen
            ? 'max-w-6xl px-0 sm:px-6 md:px-8 pt-1 sm:pt-3'
            : isBarEditorOpen
            ? 'max-w-6xl px-3 sm:px-6 md:px-8 pt-2 sm:pt-3'
            : 'max-w-7xl px-3 sm:px-6 md:px-8 pt-3 sm:pt-6'
        }`}
      >
        {/* Tab Lirik: Multi-View (List View ➔ Album View ➔ Full Bleed Canvas Editor / Concept Editor) */}
        {route.tab === 'lyrics' && (
          <div className="animate-fade-in w-full">
            {isLyricConceptOpen ? (
              <ConceptEditor
                currentSong={currentSong}
                onUpdateSong={updateSong}
                onBack={goBack}
              />
            ) : isLyricEditorOpen ? (
              <LyricEditor
                currentSong={currentSong}
                parentAlbum={currentParentAlbum}
                albumProjects={albumProjects}
                onUpdateSong={updateSong}
                barItems={barItems}
                onOpenConceptEditor={() => navigate(`#lyrics/concept/${currentSong.id}`)}
                onAddVersion={(dup) => addVersion(currentSong.id, dup)}
                onSetFinalVersion={(vId) => setFinalVersion(currentSong.id, vId)}
                onSwitchVersion={(vId) => switchVersion(currentSong.id, vId)}
                onRenameVersion={(vId, name) => renameVersion(currentSong.id, vId, name)}
                onDeleteVersion={(vId) => deleteVersion(currentSong.id, vId)}
                onAddAudioMemo={(name, duration, blob) => {
                  const newMemo = {
                    id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    name,
                    duration,
                    createdAt: Date.now(),
                  };
                  addAudioMemo(currentSong.id, newMemo, blob);
                }}
                onRenameAudioMemo={(memoId, name) => renameAudioMemo(currentSong.id, memoId, name)}
                onDeleteAudioMemo={(memoId) => deleteAudioMemo(currentSong.id, memoId)}
                onMoveSingleToAlbum={handleMoveSingleToAlbum}
                onConvertTrackToSingle={handleConvertTrackToSingle}
                onCreateAlbumAndMove={handleCreateAlbumAndMove}
                insertedBarText={insertedBarText}
                onClearInsertedBar={() => setInsertedBarText(null)}
                onBack={() => {
                  if (currentParentAlbum) {
                    navigate(`#lyrics/album/${currentParentAlbum.id}`);
                  } else {
                    navigate('#lyrics');
                  }
                }}
              />
            ) : isAlbumOpen && currentAlbumProject ? (
              <AlbumProjectView
                project={currentAlbumProject}
                onBackToStudio={() => navigate('#lyrics')}
                onOpenConceptEditor={() => {
                  selectSong(currentAlbumProject);
                  navigate(`#lyrics/concept/${currentAlbumProject.id}`);
                }}
                onSelectTrack={(track) => {
                  selectSong(track, currentAlbumProject);
                  setLastActiveSongId(track.id);
                  setLastLyricSubView('editor');
                  navigate(`#lyrics/editor/${track.id}`);
                }}
                onAddTrack={addTrackToProject}
                onDeleteTrack={deleteTrackFromProject}
                onConvertTrackToSingle={handleConvertTrackToSingle}
                onUpdateProject={updateSong}
              />
            ) : (
              <div className="max-w-5xl mx-auto">
                <LyricListView
                  songs={songs}
                  onSelectSong={handleSelectSongFromList}
                  onCreateProject={handleCreateProject}
                  onDeleteSong={deleteSong}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab Bank Bar: Two-Step (List View ➔ Full Bleed Bar Editor) */}
        {route.tab === 'bank' && (
          <div className="animate-fade-in w-full">
            <BankBar
              barItems={barItems}
              onAddBar={addBar}
              onUpdateBar={updateBar}
              onDeleteBar={deleteBar}
              onSendToLyric={handleSendToLyric}
              isEditorActive={isBarEditorOpen}
              activeBarId={route.id}
              onNavigateToEditor={(barId) => {
                setLastActiveBarId(barId);
                setLastBankSubView('editor');
                navigate(`#bank/editor/${barId}`);
              }}
              onBackFromEditor={() => {
                setLastBankSubView('list');
                navigate('#bank');
              }}
            />
          </div>
        )}
      </main>

      {/* Persistent Bottom Navigation (Auto-hidden on mobile when keyboard is open in editors) */}
      <div className={shouldHideBottomNavOnMobile ? 'hidden md:block' : 'block'}>
        <BottomNav
          currentTab={route.tab}
          onSelectTab={handleSelectTab}
          bankBarCount={barItems.length}
        />
      </div>
    </div>
  );
}
