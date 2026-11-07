import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2, Disc, Save, FolderOpen, Trash2, Plus, Check, ChevronDown, X, Music2 } from 'lucide-react';
import { bandlabEngine, SOUND_PRESETS, InstrumentCategory, SavedBandLabProject, BandLabChannel } from '../../utils/bandlabEngine';

export const CustomDrumBuilderView: React.FC = () => {
  const [state, setState] = useState(bandlabEngine.getState());
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [projectName, setProjectName] = useState<string>('Project Beat 1');
  const [savedProjects, setSavedProjects] = useState<SavedBandLabProject[]>(() => {
    try {
      const stored = localStorage.getItem('fals_bandlab_projects');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'default-bandlab',
        name: 'Trap 808 Groove',
        bpm: 130,
        totalSteps: 32,
        channels: bandlabEngine.getState().channels,
        updatedAt: Date.now(),
      },
    ];
  });

  // Modals state
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategoryToAdd, setSelectedCategoryToAdd] = useState<InstrumentCategory>('kick');
  const [selectedSoundToAdd, setSelectedSoundToAdd] = useState<string>('sub808');

  // Custom Sound Dropdown Modal per Channel
  const [activeSoundPickerChannelId, setActiveSoundPickerChannelId] = useState<string | null>(null);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    const unsubState = bandlabEngine.subscribe(() => {
      setState(bandlabEngine.getState());
    });
    const unsubStep = bandlabEngine.subscribeStep((step) => {
      setActiveStep(step);
    });
    return () => {
      unsubState();
      unsubStep();
    };
  }, []);

  const handleSaveProject = () => {
    const newProj: SavedBandLabProject = {
      id: `proj-${Date.now()}`,
      name: projectName.trim() || 'Tanpa Judul',
      bpm: state.bpm,
      totalSteps: state.totalSteps,
      channels: state.channels,
      updatedAt: Date.now(),
    };

    const updated = [newProj, ...savedProjects];
    setSavedProjects(updated);
    try {
      localStorage.setItem('fals_bandlab_projects', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedProjects.filter((p) => p.id !== id);
    setSavedProjects(filtered);
    try {
      localStorage.setItem('fals_bandlab_projects', JSON.stringify(filtered));
    } catch {
      // ignore
    }
  };

  const handleAddChannelSubmit = () => {
    bandlabEngine.addChannel(selectedCategoryToAdd, selectedSoundToAdd);
    setIsAddModalOpen(false);
  };

  const categories: { id: InstrumentCategory; label: string; icon: string }[] = [
    { id: 'kick', label: 'Kick', icon: '🎛️' },
    { id: 'snare', label: 'Snare / Clap', icon: '🥁' },
    { id: 'hihat', label: 'Hi-Hat', icon: '🧢' },
    { id: 'perc', label: 'Percussion', icon: '🪵' },
  ];

  const availableSoundsForCategory = SOUND_PRESETS.filter(
    (p) => p.category === selectedCategoryToAdd
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-20 animate-fade-in select-none">
      {/* Header Card */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2">
          <Disc className="w-4 h-4 text-[#1C1917]" />
          <div>
            <span className="text-base font-bold text-[#1C1917] tracking-tight block leading-tight">
              Drum Sequencer Builder (BandLab Style)
            </span>
            <span className="text-[10px] font-mono text-[#78716C] leading-none">
              Rancang ritme drum vertikal, tambah instrumen per kategori, dan kustomisasi sound
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSavedModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-xs font-mono font-bold text-[#1C1917] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Project ({savedProjects.length})</span>
          </button>
        </div>
      </div>

      {/* Main BandLab Workspace Card */}
      <div className="w-full bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Top Control Bar: Length, BPM, Play Button */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-[#F0EFEA] pb-4 font-mono text-xs">
          {/* Grid Length Selector (Bar) */}
          <div className="space-y-1">
            <label className="block text-[10px] text-[#78716C] uppercase font-bold">
              Panjang Grid (Bar):
            </label>
            <div className="flex items-center bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl p-0.5 h-10">
              {[32, 64, 128].map((sCount) => {
                const barNum = sCount / 16;
                const isSelected = state.totalSteps === sCount;
                return (
                  <button
                    key={sCount}
                    type="button"
                    onClick={() => bandlabEngine.setTotalSteps(sCount)}
                    className={`flex-1 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#1C1917] text-[#FAF9F5]'
                        : 'text-[#78716C] hover:text-[#1C1917]'
                    }`}
                  >
                    {barNum} Bar
                  </button>
                );
              })}
            </div>
          </div>

          {/* BPM Stepper */}
          <div className="space-y-1">
            <label className="block text-[10px] text-[#78716C] uppercase font-bold">
              Tempo (BPM):
            </label>
            <div className="flex items-center bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl px-2 h-10 justify-between">
              <button
                type="button"
                onClick={() => bandlabEngine.setBpm(state.bpm - 5)}
                className="w-7 h-7 flex items-center justify-center text-[#1C1917] hover:bg-[#E5E4DE] font-bold rounded-lg bg-[#FFFFFF] border border-[#E5E4DE] cursor-pointer"
              >
                -
              </button>
              <span className="font-bold text-[#1C1917] text-xs">
                {state.bpm} <span className="text-[10px] text-[#78716C]">BPM</span>
              </span>
              <button
                type="button"
                onClick={() => bandlabEngine.setBpm(state.bpm + 5)}
                className="w-7 h-7 flex items-center justify-center text-[#1C1917] hover:bg-[#E5E4DE] font-bold rounded-lg bg-[#FFFFFF] border border-[#E5E4DE] cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Master Play / Stop Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => bandlabEngine.togglePlay()}
              className={`w-full h-10 rounded-xl font-mono font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-xs ${
                state.isPlaying
                  ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-[#FAF9F5] ring-2 ring-[#DC2626]/30'
                  : 'bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5]'
              }`}
            >
              {state.isPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-current animate-pulse" />
                  <span>Stop Beat</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Beat</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Unified Responsive Container */}
        <div className="w-full overflow-x-auto pb-3 [scrollbar-width:thin]">
          <div className="w-full space-y-2 min-w-[560px]">
            {state.channels.map((ch) => {
              const currentPreset = SOUND_PRESETS.find((p) => p.id === ch.soundId) || SOUND_PRESETS[0];

              return (
                <div key={ch.id} className="flex items-center gap-1.5 sm:gap-2 bg-[#FAF9F5] p-2 sm:p-2.5 rounded-xl border border-[#E5E4DE] shadow-2xs">
                  {/* Channel Controls (Left Sidebar) */}
                  <div className="w-44 sm:w-52 flex flex-col gap-1.5 shrink-0 pr-1.5 sm:pr-2 border-r border-[#E5E4DE]">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={ch.name}
                        onChange={(e) => bandlabEngine.updateChannel(ch.id, { name: e.target.value })}
                        className="font-mono font-bold text-xs text-[#1C1917] bg-transparent border-b border-transparent hover:border-[#D6D3D1] focus:border-[#1C1917] focus:outline-none truncate w-28 sm:w-32"
                      />
                      <div className="flex items-center justify-end">
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => bandlabEngine.removeChannel(ch.id)}
                          className="w-6 h-6 rounded-lg bg-[#FAF9F5] hover:bg-red-50 text-[#78716C] hover:text-red-600 border border-[#E5E4DE] flex items-center justify-center cursor-pointer transition"
                          title="Hapus Channel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Custom Sound Selector Trigger */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSoundPickerChannelId(ch.id)}
                        className="flex-1 h-7 px-2 bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg font-mono text-[10px] font-semibold text-[#1C1917] flex items-center justify-between cursor-pointer transition"
                      >
                        <span className="truncate">{currentPreset.name}</span>
                        <ChevronDown className="w-3 h-3 text-[#78716C] shrink-0" />
                      </button>

                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={ch.volume}
                        onChange={(e) => bandlabEngine.updateChannel(ch.id, { volume: parseFloat(e.target.value) })}
                        className="w-12 sm:w-14 accent-[#1C1917] cursor-pointer"
                        title={`Volume: ${Math.round(ch.volume * 100)}%`}
                      />
                    </div>
                  </div>

                  {/* Step Sequencer Grid (Flexible Auto-Fitting Flex Items) */}
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-1">
                    {ch.steps.map((isActive, sIdx) => {
                      const isCurrentPlayingStep = state.isPlaying && activeStep === sIdx;
                      const isBarBoundary = sIdx % 4 === 0;

                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => bandlabEngine.toggleStep(ch.id, sIdx)}
                          className={`flex-1 h-7 sm:h-8 rounded-md transition-all cursor-pointer border shrink-0 min-w-[14px] sm:min-w-[18px] ${
                            isBarBoundary ? 'ml-0.5 sm:ml-1' : ''
                          } ${
                            isActive
                              ? isCurrentPlayingStep
                                ? 'bg-[#10B981] border-[#059669] shadow-sm'
                                : 'bg-[#1C1917] border-[#1C1917] text-[#FAF9F5]'
                              : isCurrentPlayingStep
                              ? 'bg-[#E5E4DE] border-[#A8A29E]'
                              : (Math.floor(sIdx / 4)) % 2 === 0
                              ? 'bg-[#FFFFFF] border-[#E5E4DE] hover:border-[#D6D3D1]'
                              : 'bg-[#F5F4EE] border-[#E5E4DE] hover:border-[#D6D3D1]'
                          }`}
                          title={`Step ${sIdx + 1}`}
                        >
                          <span className="sr-only">Step {sIdx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Channel Button */}
        <div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-[#D6D3D1] hover:border-[#1C1917] bg-[#FAF9F5] hover:bg-[#F5F4EE] text-[#1C1917] font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Channel Instrumen Baru</span>
          </button>
        </div>

        {/* Bottom Save Row */}
        <div className="pt-3 border-t border-[#F0EFEA] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Nama Project Pattern..."
              className="h-10 px-3 bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl font-bold text-[#1C1917] w-full sm:w-60 focus:outline-none focus:border-[#1C1917]"
            />
            <button
              type="button"
              onClick={handleSaveProject}
              className="h-10 px-4 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-[#FAF9F5] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Project</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Project berhasil disimpan!</span>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM SOUND PICKER MODAL (Per Channel) */}
      {activeSoundPickerChannelId && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 select-none"
          onClick={() => setActiveSoundPickerChannelId(null)}
        >
          <div
            className="bg-[#24211F] text-[#FAF9F5] border border-[#44403C] rounded-2xl p-4 sm:p-5 w-full max-w-sm shadow-2xl space-y-3 font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#383533] pb-2">
              <span className="font-black text-xs uppercase tracking-wide">Pilih Sound Instrumen</span>
              <button
                type="button"
                onClick={() => setActiveSoundPickerChannelId(null)}
                className="w-6 h-6 rounded-lg bg-[#383533] hover:bg-[#57534E] flex items-center justify-center text-[#FAF9F5] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 pt-1 max-h-64 overflow-y-auto [scrollbar-width:thin]">
              {(() => {
                const currentCh = state.channels.find((c) => c.id === activeSoundPickerChannelId);
                const filteredPresets = SOUND_PRESETS.filter((p) => !currentCh || p.category === currentCh.category);

                return filteredPresets.map((preset) => {
                  const isSelected = currentCh?.soundId === preset.id;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        bandlabEngine.updateChannel(activeSoundPickerChannelId!, {
                          soundId: preset.id,
                          name: preset.name,
                          category: preset.category,
                        });
                        setActiveSoundPickerChannelId(null);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#D97706] border-[#D97706] text-[#FAF9F5]'
                          : 'bg-[#1C1917] border-[#383533] hover:border-[#57534E] text-[#D6D3D1]'
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">{preset.name}</span>
                        <span className="text-[10px] text-[#A8A29E]">{preset.description}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#FAF9F5]" />}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ADD CHANNEL MODAL (Category Based) */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 select-none"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-[#24211F] text-[#FAF9F5] border border-[#44403C] rounded-2xl p-4 sm:p-5 w-full max-w-sm shadow-2xl space-y-3 font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#383533] pb-2">
              <span className="font-black text-xs uppercase tracking-wide">Tambah Channel Instrumen</span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-6 h-6 rounded-lg bg-[#383533] hover:bg-[#57534E] flex items-center justify-center text-[#FAF9F5] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {/* Category Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] text-[#A8A29E] uppercase font-bold">Pilih Kategori:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryToAdd(cat.id);
                        const firstSound = SOUND_PRESETS.find((p) => p.category === cat.id);
                        if (firstSound) setSelectedSoundToAdd(firstSound.id);
                      }}
                      className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedCategoryToAdd === cat.id
                          ? 'bg-[#D97706] border-[#D97706] text-[#FAF9F5]'
                          : 'bg-[#1C1917] border-[#383533] text-[#A8A29E] hover:text-[#FAF9F5]'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Selector within Category */}
              <div className="space-y-1">
                <label className="block text-[10px] text-[#A8A29E] uppercase font-bold">Pilih Sound Awal:</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto [scrollbar-width:thin]">
                  {availableSoundsForCategory.map((snd) => (
                    <button
                      key={snd.id}
                      type="button"
                      onClick={() => setSelectedSoundToAdd(snd.id)}
                      className={`w-full p-2 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                        selectedSoundToAdd === snd.id
                          ? 'bg-[#383533] border-[#D97706] text-[#FAF9F5]'
                          : 'bg-[#1C1917] border-[#383533] text-[#A8A29E] hover:text-[#FAF9F5]'
                      }`}
                    >
                      <span className="font-bold">{snd.name}</span>
                      {selectedSoundToAdd === snd.id && <Check className="w-3.5 h-3.5 text-[#D97706]" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddChannelSubmit}
                className="w-full py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-[#FAF9F5] font-bold transition cursor-pointer shadow-md"
              >
                Tambah ke Channel Rack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED PROJECTS MODAL */}
      {isSavedModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 select-none"
          onClick={() => setIsSavedModalOpen(false)}
        >
          <div
            className="bg-[#24211F] text-[#FAF9F5] border border-[#44403C] rounded-2xl p-4 sm:p-5 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl space-y-3 font-mono text-xs [scrollbar-width:thin]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#383533] pb-2.5">
              <span className="font-black text-xs sm:text-sm uppercase tracking-wide">
                Daftar Project Tersimpan
              </span>
              <button
                type="button"
                onClick={() => setIsSavedModalOpen(false)}
                className="w-6 h-6 rounded-lg bg-[#383533] hover:bg-[#57534E] flex items-center justify-center text-[#FAF9F5] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {savedProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    bandlabEngine.loadProject(proj);
                    setProjectName(proj.name);
                    setIsSavedModalOpen(false);
                  }}
                  className="p-3 rounded-xl bg-[#1C1917] hover:bg-[#292524] border border-[#383533] cursor-pointer transition flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-[#FAF9F5] block">{proj.name}</span>
                    <span className="text-[10px] text-[#A8A29E] block">
                      {proj.totalSteps / 16} Bar • {proj.bpm} BPM • {proj.channels.length} Channels
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteProject(proj.id, e)}
                    className="w-7 h-7 rounded-lg bg-[#383533] hover:bg-red-600 text-[#A8A29E] hover:text-[#FAF9F5] flex items-center justify-center transition cursor-pointer"
                    title="Hapus Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
