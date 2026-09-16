import React, { useState, useEffect, useMemo } from 'react';
import { 
  PastSpreadReading, 
  getPastSpreadReadings, 
  deletePastSpreadReading, 
  clearAllPastSpreadReadings, 
  exportPastSpreadReadings,
  updatePastSpreadReadingNotes 
} from '../services/pastReadingsStorage';
import { voiceEngine, PERSONA_PROFILES } from '../services/voiceSynthesis';

interface PastReadingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReading: (reading: PastSpreadReading) => void;
  currentLoadedReadingId?: string | null;
}

export const PastReadingsSidebar: React.FC<PastReadingsSidebarProps> = ({
  isOpen,
  onClose,
  onSelectReading,
  currentLoadedReadingId
}) => {
  const [readings, setReadings] = useState<PastSpreadReading[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string>('all');
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [expandedReadingId, setExpandedReadingId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Load readings & listen for storage update events
  const refreshReadings = () => {
    const data = getPastSpreadReadings();
    setReadings(data);
  };

  useEffect(() => {
    refreshReadings();

    const handleUpdate = () => {
      refreshReadings();
    };

    window.addEventListener('laevus_past_readings_updated', handleUpdate);
    return () => {
      window.removeEventListener('laevus_past_readings_updated', handleUpdate);
    };
  }, []);

  // Sync voice engine speaking state
  useEffect(() => {
    const unsub = voiceEngine.subscribe((speaking) => {
      if (!speaking) {
        setCurrentlyPlayingId(null);
      }
    });
    return () => unsub();
  }, []);

  // Filtered readings list
  const filteredReadings = useMemo(() => {
    return readings.filter(reading => {
      // Persona filter
      if (selectedPersonaFilter !== 'all') {
        if (selectedPersonaFilter === 'has-question' && !reading.hasQuestion) return false;
        if (selectedPersonaFilter === 'insight-card' && !reading.includeInsightCard) return false;
        if (
          selectedPersonaFilter !== 'has-question' && 
          selectedPersonaFilter !== 'insight-card' && 
          reading.voiceSettings?.persona !== selectedPersonaFilter
        ) {
          return false;
        }
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      const matchesQuestion = reading.question?.toLowerCase().includes(q);
      const matchesText = reading.readingText?.toLowerCase().includes(q);
      const matchesNotes = reading.notes?.toLowerCase().includes(q);
      const matchesPersona = reading.voiceSettings?.persona?.toLowerCase().includes(q);
      const matchesCard = reading.cards?.some(
        c => c.card.name.toLowerCase().includes(q) || c.card.meaning.toLowerCase().includes(q)
      );

      return matchesQuestion || matchesText || matchesNotes || matchesPersona || matchesCard;
    });
  }, [readings, searchQuery, selectedPersonaFilter]);

  // Play audio using original reading voice settings
  const handlePlayOriginalVoice = (reading: PastSpreadReading, e: React.MouseEvent) => {
    e.stopPropagation();

    if (currentlyPlayingId === reading.id) {
      voiceEngine.stop();
      setCurrentlyPlayingId(null);
    } else {
      setCurrentlyPlayingId(reading.id);
      // Play with the exact stored voice persona, pitch, and speed
      voiceEngine.speak(reading.readingText, {
        enabled: true,
        persona: reading.voiceSettings.persona,
        pitch: reading.voiceSettings.pitch,
        speed: reading.voiceSettings.speed
      });
    }
  };

  // Copy reading text to clipboard
  const handleCopyText = (reading: PastSpreadReading, e: React.MouseEvent) => {
    e.stopPropagation();
    const cardsSummary = reading.cards.map(c => `• ${c.positionName}: ${c.card.name}`).join('\n');
    const fullContent = `--- LAEVUS TAROT SPREAD TRANSCRIPT ---\nDate: ${reading.formattedDate}\nVoice Conduit: ${reading.voiceSettings.persona} (Pitch: ${reading.voiceSettings.pitch}, Speed: ${reading.voiceSettings.speed})\n${reading.question ? `Querent Inquiry: "${reading.question}"\n` : ''}\nCards Drawn:\n${cardsSummary}\n\nInterpretation:\n${reading.readingText}\n${reading.notes ? `\nPersonal Reflections:\n${reading.notes}` : ''}`;
    
    navigator.clipboard.writeText(fullContent).then(() => {
      setCopiedId(reading.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Delete reading
  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentlyPlayingId === id) {
      voiceEngine.stop();
    }
    deletePastSpreadReading(id);
    setItemToDelete(null);
    refreshReadings();
  };

  // Save notes
  const handleSaveNotes = (id: string) => {
    updatePastSpreadReadingNotes(id, tempNotes);
    setEditingNotesId(null);
    refreshReadings();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-google-sans select-none animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-xl bg-[#09090b] border-l border-zinc-800 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col z-50 text-zinc-200">
          
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-zinc-850 bg-black/70 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#DC143C]/10 border border-[#DC143C]/40 flex items-center justify-center text-[#DC143C] font-bold">
                ✦
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold font-syne uppercase tracking-wider text-[#F8F7F4]">
                    Past Spread Readings
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-[#DC143C] font-bold">
                    {readings.length}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Revisit archived spreads with their original voice conduits
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {readings.length > 0 && (
                <button
                  onClick={exportPastSpreadReadings}
                  title="Export All Archives as JSON"
                  className="px-2 py-1 text-xs font-mono text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-zinc-800"
                >
                  ↓ Export
                </button>
              )}
              
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-zinc-800 text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-3 sm:p-4 border-b border-zinc-900 bg-zinc-950/60 space-y-2.5 flex-shrink-0">
            {/* Search Input */}
            <div className="relative">
              <span className="text-xs absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">⌕</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search past spreads by card, inquiry, or interpretation..."
                className="w-full bg-black border border-zinc-800 focus:border-[#DC143C] text-xs pl-8 pr-8 py-2 rounded-lg text-zinc-200 placeholder-zinc-600 outline-none transition-colors font-google-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
              <button
                onClick={() => setSelectedPersonaFilter('all')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wider transition-colors cursor-pointer ${
                  selectedPersonaFilter === 'all'
                    ? 'bg-[#DC143C] text-white font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                All ({readings.length})
              </button>

              <button
                onClick={() => setSelectedPersonaFilter('Madame Blavatsky')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedPersonaFilter === 'Madame Blavatsky'
                    ? 'bg-[#DC143C] text-white font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <span>👁️</span>
                <span>Blavatsky</span>
              </button>

              <button
                onClick={() => setSelectedPersonaFilter('Modern Intuitive')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedPersonaFilter === 'Modern Intuitive'
                    ? 'bg-[#DC143C] text-white font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <span>⚡</span>
                <span>Intuitive</span>
              </button>

              <button
                onClick={() => setSelectedPersonaFilter('Arcane Scholar')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedPersonaFilter === 'Arcane Scholar'
                    ? 'bg-[#DC143C] text-white font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <span>📜</span>
                <span>Scholar</span>
              </button>

              <button
                onClick={() => setSelectedPersonaFilter('Mystic Echo')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedPersonaFilter === 'Mystic Echo'
                    ? 'bg-[#DC143C] text-white font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <span>✨</span>
                <span>Mystic</span>
              </button>

              <button
                onClick={() => setSelectedPersonaFilter('has-question')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wider transition-colors cursor-pointer ${
                  selectedPersonaFilter === 'has-question'
                    ? 'bg-[#DC143C] text-white font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                With Inquiries
              </button>
            </div>
          </div>

          {/* Readings Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
            {filteredReadings.length === 0 ? (
              <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
                <div className="w-14 h-14 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 text-2xl">
                  🕯️
                </div>
                <h3 className="text-sm font-bold font-syne uppercase text-zinc-400 tracking-wider">
                  {searchQuery || selectedPersonaFilter !== 'all' 
                    ? 'No matching spread records found' 
                    : 'No Past Spreads Yet'}
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {searchQuery || selectedPersonaFilter !== 'all'
                    ? 'Try adjusting your search terms or clearing the active filters.'
                    : 'Transcribe cards pulled in the physical realm and synthesize interpretations to build your metaphysical archives.'}
                </p>
                {(searchQuery || selectedPersonaFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedPersonaFilter('all');
                    }}
                    className="text-xs text-[#DC143C] font-mono underline hover:text-white pt-2 cursor-pointer"
                  >
                    Reset Search Filters
                  </button>
                )}
              </div>
            ) : (
              filteredReadings.map((reading) => {
                const isPlaying = currentlyPlayingId === reading.id;
                const isExpanded = expandedReadingId === reading.id;
                const isLoaded = currentLoadedReadingId === reading.id;
                const personaProfile = PERSONA_PROFILES[reading.voiceSettings?.persona] || PERSONA_PROFILES['Madame Blavatsky'];

                return (
                  <div
                    key={reading.id}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      isLoaded
                        ? 'bg-zinc-950 border-[#DC143C] shadow-[0_0_25px_rgba(220,20,60,0.15)] ring-1 ring-[#DC143C]'
                        : 'bg-black border-zinc-850 hover:border-zinc-700 hover:bg-zinc-950/60'
                    }`}
                  >
                    {/* Reading Top Header */}
                    <div className="p-3.5 space-y-2.5">
                      
                      {/* Date & Action Badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-xs">⏱</span>
                          <span className="text-[10.5px] font-mono text-zinc-400">
                            {reading.formattedDate}
                          </span>
                          {isLoaded && (
                            <span className="px-2 py-0.5 rounded bg-[#DC143C] text-white text-[9px] font-mono font-extrabold uppercase tracking-wider">
                              ● On Altar
                            </span>
                          )}
                        </div>

                        {/* Voice Persona Conduit Badge */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                          <span>{personaProfile.avatar}</span>
                          <span className="font-bold text-zinc-200">
                            {reading.voiceSettings?.persona}
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            ({reading.voiceSettings?.pitch}p / {reading.voiceSettings?.speed}x)
                          </span>
                        </div>
                      </div>

                      {/* Attached Question / Inquiry Preview */}
                      {reading.question && (
                        <div className="p-2 rounded bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 italic flex items-start gap-2">
                          <span className="text-[#DC143C] font-mono font-bold text-xs">“</span>
                          <span className="line-clamp-2">{reading.question}</span>
                          <span className="text-[#DC143C] font-mono font-bold text-xs">”</span>
                        </div>
                      )}

                      {/* Tarot Cards Horizontal Thumbnails Row */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                        {reading.cards.map((slotItem, idx) => (
                          <div
                            key={idx}
                            className="p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex flex-col items-center text-center space-y-1 relative group"
                          >
                            <div className="w-full aspect-[2/3] rounded overflow-hidden bg-black relative border border-zinc-800/80">
                              <img
                                src={slotItem.card.image}
                                alt={slotItem.card.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                              <span className="absolute bottom-1 right-1 text-xs">{slotItem.card.symbol}</span>
                            </div>
                            <span className="text-[9px] font-bold font-syne text-zinc-200 uppercase tracking-tight line-clamp-1">
                              {slotItem.card.name}
                            </span>
                            <span className="text-[7.5px] font-mono text-zinc-500 line-clamp-1">
                              {slotItem.positionName.split('/')[0]}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Quick Summary / Snippet */}
                      <div className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 pl-2 border-l-2 border-[#DC143C]/60">
                        {reading.readingText}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900/80">
                        
                        {/* Play Voice with Original Voice Settings */}
                        <button
                          onClick={(e) => handlePlayOriginalVoice(reading, e)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                            isPlaying
                              ? 'bg-[#DC143C] text-white font-bold animate-pulse'
                              : 'bg-zinc-900 text-zinc-300 hover:bg-[#DC143C]/20 hover:text-[#DC143C] border border-zinc-800'
                          }`}
                          title={`Listen with ${reading.voiceSettings.persona} original settings`}
                        >
                          {isPlaying ? (
                            <span>Mute</span>
                          ) : (
                            <span>Play Voice</span>
                          )}
                        </button>

                        {/* Revisit / Load to Main View */}
                        <div className="flex items-center gap-1.5">
                          {/* Toggle Expand Interpretation */}
                          <button
                            onClick={() => setExpandedReadingId(isExpanded ? null : reading.id)}
                            className="px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer font-mono"
                            title="Expand full reading"
                          >
                            <span className={isExpanded ? 'text-[#DC143C]' : ''}>
                              {isExpanded ? '▲ Less' : '▼ Details'}
                            </span>
                          </button>

                          {/* Delete Item */}
                          {itemToDelete === reading.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleDeleteItem(reading.id, e)}
                                className="px-2 py-1 bg-[#DC143C] text-white text-[9px] font-mono font-bold rounded cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToDelete(null);
                                }}
                                className="px-1.5 py-1 bg-zinc-900 text-zinc-400 text-[9px] font-mono rounded cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToDelete(reading.id);
                              }}
                              className="px-2 py-1 text-xs text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer font-mono"
                              title="Delete past spread"
                            >
                              ✕
                            </button>
                          )}

                          {/* Main Revisit Button */}
                          <button
                            onClick={() => {
                              onSelectReading(reading);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-[#DC143C] hover:bg-[#B81132] text-white text-xs font-bold font-syne uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <span>Revisit →</span>
                          </button>

                        </div>

                      </div>

                    </div>

                    {/* Expandable Section: Full Text Interpretation & Notes */}
                    {isExpanded && (
                      <div className="p-4 bg-black/90 border-t border-zinc-900 space-y-3 animate-fadeIn">
                        
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#DC143C] font-bold">
                              Full Metaphysical Synthesis:
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500">
                              Voice: {reading.voiceSettings.persona}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-300 leading-relaxed font-google-sans whitespace-pre-wrap pl-2.5 border-l-2 border-[#DC143C] select-text cursor-text">
                            {reading.readingText}
                          </div>
                        </div>

                        {/* Personal Reflections / Notes */}
                        <div className="pt-2 border-t border-zinc-900">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                              <span>✎</span>
                              Personal Notes / Altar Log:
                            </span>
                            {editingNotesId !== reading.id && (
                              <button
                                onClick={() => {
                                  setEditingNotesId(reading.id);
                                  setTempNotes(reading.notes || '');
                                }}
                                className="text-[10px] text-[#DC143C] hover:underline font-mono cursor-pointer"
                              >
                                {reading.notes ? 'Edit Notes' : '+ Add Note'}
                              </button>
                            )}
                          </div>

                          {editingNotesId === reading.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                placeholder="Log your physical altar reflections, querent state, incense used, or subsequent real-world synchronicities..."
                                rows={3}
                                className="w-full bg-zinc-950 border border-zinc-800 text-xs p-2 rounded text-zinc-200 placeholder-zinc-700 outline-none focus:border-[#DC143C] font-google-sans"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingNotesId(null)}
                                  className="px-2.5 py-1 bg-zinc-900 text-zinc-400 text-xs rounded hover:text-white cursor-pointer font-mono"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveNotes(reading.id)}
                                  className="px-3 py-1 bg-[#DC143C] text-white text-xs font-bold rounded hover:bg-[#B81132] cursor-pointer font-mono"
                                >
                                  Save Note
                                </button>
                              </div>
                            </div>
                          ) : (
                            reading.notes ? (
                              <p className="text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded border border-zinc-900 italic">
                                {reading.notes}
                              </p>
                            ) : (
                              <p className="text-[10px] text-zinc-600 italic">
                                No notes recorded for this spread.
                              </p>
                            )
                          )}
                        </div>

                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

          {/* Footer Toolbar */}
          {readings.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-zinc-900 bg-black/80 flex items-center justify-between flex-shrink-0">
              <div className="text-[10px] font-mono text-zinc-500">
                {readings.length} spread{readings.length === 1 ? '' : 's'} archived in browser storage
              </div>

              {confirmClearAll ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-red-400">Clear all archives?</span>
                  <button
                    onClick={() => {
                      clearAllPastSpreadReadings();
                      setConfirmClearAll(false);
                      refreshReadings();
                    }}
                    className="px-2.5 py-1 bg-[#DC143C] text-white font-mono text-[10px] font-bold rounded cursor-pointer hover:bg-[#B81132]"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2 py-1 bg-zinc-900 text-zinc-400 font-mono text-[10px] rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="text-[10px] font-mono text-zinc-500 hover:text-[#DC143C] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>✕</span>
                  <span>Clear All Archives</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
