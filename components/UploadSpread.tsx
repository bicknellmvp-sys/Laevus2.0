import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  X, 
  Check, 
  Plus, 
  Layers, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Loader2, 
  RotateCcw,
  Eye,
  History,
  ArrowRight,
  BookOpen,
  ChevronLeft
} from 'lucide-react';
import { metaphysicalConsultation } from '../services/gemini';
import { voiceEngine, getSavedVoiceSettings, VoiceSettings } from '../services/voiceSynthesis';
import { PastReadingsSidebar } from './PastReadingsSidebar';
import { 
  savePastSpreadReading, 
  getPastSpreadReadings, 
  PastSpreadReading, 
  PastSpreadSlotCard 
} from '../services/pastReadingsStorage';
import { TAROT_DATABASE } from '../data/tarotCards';

export interface SpreadCard {
  name: string;
  symbol: string;
  description: string;
  meaning: string;
  image: string;
}

const FULL_TAROT_DECK: SpreadCard[] = TAROT_DATABASE.map(c => ({
  name: c.name,
  symbol: c.symbol,
  description: c.description,
  meaning: c.meaning,
  image: c.image
}));

type SlotKey = 'slotA' | 'slotB' | 'slotC' | 'slotD';

interface UploadSpreadProps {
  onCompleteReading?: (readingData: {
    cards: Array<{ position: string; name: string; symbol: string; meaning: string; description: string; image: string }>;
    question: string;
    readingText: string;
  }) => void;
  onReturnToChat?: () => void;
}

export const UploadSpread: React.FC<UploadSpreadProps> = ({ onCompleteReading, onReturnToChat }) => {
  // Slots state
  const [slots, setSlots] = useState<{
    slotA: SpreadCard | null;
    slotB: SpreadCard | null;
    slotC: SpreadCard | null;
    slotD: SpreadCard | null;
  }>({
    slotA: null,
    slotB: null,
    slotC: null,
    slotD: null,
  });

  // Current active slot target (defaults to slotA)
  const [activeSlot, setActiveSlot] = useState<SlotKey>('slotA');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dynamic feature checkboxes
  const [attachQuestion, setAttachQuestion] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');

  const [includeInsightCard, setIncludeInsightCard] = useState(false);

  // Reading synthesis pipeline state
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [generatedReading, setGeneratedReading] = useState<string | null>(null);
  const [isAudioSpeaking, setIsAudioSpeaking] = useState(false);

  // Past Readings Sidebar & Original Voice Persistence State
  const [isPastReadingsSidebarOpen, setIsPastReadingsSidebarOpen] = useState(false);
  const [pastReadingsCount, setPastReadingsCount] = useState<number>(() => getPastSpreadReadings().length);
  const [activeArchivedReading, setActiveArchivedReading] = useState<PastSpreadReading | null>(null);
  const [activeReadingVoiceSettings, setActiveReadingVoiceSettings] = useState<VoiceSettings | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Sync audio speaking state and past readings count
  useEffect(() => {
    const unsub = voiceEngine.subscribe((speaking) => {
      setIsAudioSpeaking(speaking);
    });

    const updateCount = () => {
      setPastReadingsCount(getPastSpreadReadings().length);
    };

    window.addEventListener('laevus_past_readings_updated', updateCount);

    return () => {
      unsub();
      window.removeEventListener('laevus_past_readings_updated', updateCount);
      voiceEngine.stop();
    };
  }, []);

  // Filtered cards matching search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return FULL_TAROT_DECK.slice(0, 10);
    const q = searchQuery.toLowerCase().trim();
    return FULL_TAROT_DECK.filter(
      card => card.name.toLowerCase().includes(q) || card.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Workflow: Select a card into active slot & auto-advance red indicator
  const handleSelectCard = (card: SpreadCard) => {
    setSlots(prev => ({
      ...prev,
      [activeSlot]: card
    }));

    // Auto-advance red target indicator
    if (activeSlot === 'slotA') {
      setActiveSlot('slotB');
    } else if (activeSlot === 'slotB') {
      setActiveSlot('slotC');
    } else if (activeSlot === 'slotC') {
      if (includeInsightCard) {
        setActiveSlot('slotD');
      }
    }

    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleClearSlot = (slotKey: SlotKey, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlots(prev => ({ ...prev, [slotKey]: null }));
    setActiveSlot(slotKey);
  };

  const handleResetAll = () => {
    setSlots({ slotA: null, slotB: null, slotC: null, slotD: null });
    setActiveSlot('slotA');
    setCustomQuestion('');
    setGeneratedReading(null);
    setActiveArchivedReading(null);
    setActiveReadingVoiceSettings(null);
    voiceEngine.stop();
  };

  // Revisit & load a historical spread reading from the Past Readings Sidebar
  const handleSelectPastReading = (reading: PastSpreadReading) => {
    const slotAMatch = reading.cards.find(c => c.slot === 'slotA')?.card || null;
    const slotBMatch = reading.cards.find(c => c.slot === 'slotB')?.card || null;
    const slotCMatch = reading.cards.find(c => c.slot === 'slotC')?.card || null;
    const slotDMatch = reading.cards.find(c => c.slot === 'slotD')?.card || null;

    setSlots({
      slotA: slotAMatch,
      slotB: slotBMatch,
      slotC: slotCMatch,
      slotD: slotDMatch,
    });

    const hasInsight = reading.includeInsightCard || Boolean(slotDMatch);
    setIncludeInsightCard(hasInsight);
    setAttachQuestion(reading.hasQuestion || Boolean(reading.question));
    setCustomQuestion(reading.question || '');
    setGeneratedReading(reading.readingText);
    setActiveArchivedReading(reading);
    setActiveReadingVoiceSettings(reading.voiceSettings);
    voiceEngine.stop();
  };

  // Check if minimum required slots are filled (Slot A, B, C)
  const isReadyToProceed = Boolean(slots.slotA && slots.slotB && slots.slotC && (!includeInsightCard || slots.slotD));

  // Execute the full storytelling synthesis pipeline
  const handleProceedToReading = async () => {
    if (!slots.slotA || !slots.slotB || !slots.slotC) return;
    if (includeInsightCard && !slots.slotD) return;

    setIsSynthesizing(true);
    setGeneratedReading(null);
    voiceEngine.stop();

    try {
      const drawnCards = [
        {
          position: 'Past / Foundation' as const,
          name: slots.slotA.name,
          symbol: slots.slotA.symbol,
          description: slots.slotA.description,
          meaning: slots.slotA.meaning,
          image: slots.slotA.image
        },
        {
          position: 'Present / Catalyst' as const,
          name: slots.slotB.name,
          symbol: slots.slotB.symbol,
          description: slots.slotB.description,
          meaning: slots.slotB.meaning,
          image: slots.slotB.image
        },
        {
          position: 'Future / Potential' as const,
          name: slots.slotC.name,
          symbol: slots.slotC.symbol,
          description: slots.slotC.description,
          meaning: slots.slotC.meaning,
          image: slots.slotC.image
        }
      ];

      if (includeInsightCard && slots.slotD) {
        drawnCards.push({
          position: '4th Dimension / Hidden Insight' as any,
          name: slots.slotD.name,
          symbol: slots.slotD.symbol,
          description: slots.slotD.description,
          meaning: slots.slotD.meaning,
          image: slots.slotD.image
        });
      }

      const queryPrompt = attachQuestion && customQuestion.trim()
        ? customQuestion.trim()
        : "Synthesize the deep esoteric trajectory and weave a narrative tapestry for these physical realm cards.";

      const reply = await metaphysicalConsultation(
        `Synthesize this physical realm Tarot spread: "${queryPrompt}"`,
        [],
        {
          mode: 'tarot-physical',
          tarotCards: drawnCards,
          tarotQuestion: queryPrompt,
          readingCount: 1
        }
      );

      setGeneratedReading(reply);

      // Capture voice settings active at time of synthesis
      const currentVoiceSettings = getSavedVoiceSettings();
      setActiveReadingVoiceSettings(currentVoiceSettings);

      // Persist to Past Spread Readings storage
      const slotCards: PastSpreadSlotCard[] = [
        { slot: 'slotA', positionName: 'Past / Foundation', card: slots.slotA },
        { slot: 'slotB', positionName: 'Present / Catalyst', card: slots.slotB },
        { slot: 'slotC', positionName: 'Future / Potential', card: slots.slotC },
      ];
      if (includeInsightCard && slots.slotD) {
        slotCards.push({ slot: 'slotD', positionName: '4th Dimension / Hidden Insight', card: slots.slotD });
      }

      const savedEntry = savePastSpreadReading({
        cards: slotCards,
        question: attachQuestion && customQuestion.trim() ? customQuestion.trim() : '',
        hasQuestion: attachQuestion && Boolean(customQuestion.trim()),
        includeInsightCard: Boolean(includeInsightCard && slots.slotD),
        readingText: reply,
        voiceSettings: currentVoiceSettings
      });

      setActiveArchivedReading(savedEntry);

      // Trigger voice synthesis if audio enabled
      if (currentVoiceSettings.enabled) {
        voiceEngine.speak(reply, currentVoiceSettings);
      }

      if (onCompleteReading) {
        onCompleteReading({
          cards: drawnCards,
          question: queryPrompt,
          readingText: reply
        });
      }

    } catch (err) {
      console.error("Spread reading synthesis error:", err);
      setGeneratedReading("An error occurred during metaphysical synthesis. Please check your connection and try again.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleToggleVoicePlayback = () => {
    if (!generatedReading) return;
    if (isAudioSpeaking) {
      voiceEngine.stop();
    } else {
      // Use original voice settings of loaded reading if viewing an archived spread, or current active settings
      const settingsToUse = activeReadingVoiceSettings || getSavedVoiceSettings();
      voiceEngine.speak(generatedReading, settingsToUse);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 my-2 animate-fadeIn font-google-sans text-zinc-200">
      
      {/* Top Header */}
      <div className="border-b border-zinc-900 pb-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E60026]/10 border border-[#E60026]/30 text-[#E60026] text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5">
            <Layers className="w-3 h-3" />
            Physical Realm Spread Upload
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-syne text-[#F8F7F4] tracking-tight uppercase">
            Manual Tarot Spread Transcriber
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            Log physical cards pulled from your material altar. Search and populate your spread sequentially across the energetic slots.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {onReturnToChat && (
            <button
              onClick={onReturnToChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-[#E60026]/50 text-zinc-300 hover:text-white text-xs font-mono transition-all cursor-pointer shadow-md group"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#E60026] group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-bold uppercase tracking-wider text-[10px]">Return to Oracle Chat</span>
            </button>
          )}

          {/* Past Readings Sidebar Trigger */}
          <button
            onClick={() => setIsPastReadingsSidebarOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-[#E60026] text-xs font-mono transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)] group flex-shrink-0"
            title="Open Past Spreads Sidebar to view historical interpretations"
          >
            <History className="w-3.5 h-3.5 text-[#E60026] group-hover:rotate-[-20deg] transition-transform" />
            <span className="font-bold uppercase tracking-wider text-[11px]">Past Spreads</span>
            <span className="px-2 py-0.5 rounded-full bg-[#E60026] text-black text-[10px] font-extrabold font-mono">
              {pastReadingsCount}
            </span>
          </button>
        </div>
      </div>

      {/* CENTRAL SEARCH COMPONENT (Positioned centrally above the 3 card slots) */}
      <div className="max-w-xl mx-auto mb-8 relative z-30">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-zinc-400 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#E60026]" />
            Search to Fill Active Target:
            <span className="text-[#E60026] font-bold">
              {activeSlot === 'slotA' && 'CARD SLOT A (Past)'}
              {activeSlot === 'slotB' && 'CARD SLOT B (Present)'}
              {activeSlot === 'slotC' && 'CARD SLOT C (Future)'}
              {activeSlot === 'slotD' && 'CARD SLOT D (Insight)'}
            </span>
          </span>
          <span className="text-[9px] font-mono text-zinc-500">
            {FULL_TAROT_DECK.length} Deck Keys
          </span>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Type card name (e.g., The Moon, The Empress, High Priestess, Fool)..."
            className="w-full bg-black border-2 border-zinc-850 focus:border-[#E60026] text-xs sm:text-sm px-4 py-3 rounded-xl text-zinc-100 placeholder-zinc-600 outline-none transition-all shadow-[0_4px_20px_rgba(0,0,0,0.8)] font-google-sans"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
              ⏎
            </div>
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setIsSearchOpen(false)} />
            <div
              ref={searchDropdownRef}
              className="absolute left-0 right-0 top-full mt-2 bg-black border border-zinc-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.95)] max-h-72 overflow-y-auto z-30 p-2 border-t-2 border-t-[#E60026] animate-fadeIn"
            >
              <div className="px-2.5 py-1 text-[9px] font-mono text-zinc-500 uppercase tracking-wider border-b border-zinc-900 mb-1 flex justify-between">
                <span>Matching Deck Entities</span>
                <span>Click Card or 'Select'</span>
              </div>

              {filteredCards.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 font-mono">
                  No matching card archetypes found.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCards.map((card) => (
                    <button
                      key={card.name}
                      onClick={() => handleSelectCard(card)}
                      className="w-full p-2 rounded-lg hover:bg-zinc-950 flex items-center justify-between text-left transition-colors group cursor-pointer border border-transparent hover:border-zinc-850"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-10 rounded bg-zinc-900 overflow-hidden border border-zinc-800 flex-shrink-0 relative">
                          <img
                            src={card.image}
                            alt={card.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-[#E60026] transition-colors uppercase tracking-wider font-google-sans">
                              {card.name}
                            </span>
                            <span className="text-xs">{card.symbol}</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 line-clamp-1 group-hover:text-zinc-400">
                            {card.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-2.5 py-1 rounded bg-zinc-900 group-hover:bg-[#E60026] text-zinc-400 group-hover:text-black text-[10px] font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-1">
                        <span>Select</span>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* HORIZONTAL CARD SLOTS CONTAINERS (Card Slot A, B, C + Optional D) */}
      <div className={`grid gap-4 mb-8 ${includeInsightCard ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
        
        {/* SLOT A: PAST / FOUNDATION */}
        <div
          onClick={() => setActiveSlot('slotA')}
          className={`relative rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between min-h-[310px] group ${
            activeSlot === 'slotA'
              ? 'bg-zinc-950 border-2 border-[#E60026] shadow-[0_0_30px_rgba(230,0,38,0.25)] ring-1 ring-[#E60026]'
              : 'bg-black border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/40'
          }`}
        >
          {/* Active Target Indicator Badge */}
          <div className="w-full flex items-center justify-between mb-2">
            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              activeSlot === 'slotA'
                ? 'bg-[#E60026] text-black font-extrabold shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}>
              {activeSlot === 'slotA' ? '● Active Target' : 'Card Slot A'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">PAST / ROOT</span>
          </div>

          {/* Slot Content Preview */}
          {slots.slotA ? (
            <div className="w-full flex flex-col items-center animate-fadeIn">
              <div className="w-full max-w-[140px] aspect-[2/3.1] rounded-xl overflow-hidden relative border border-zinc-800 shadow-[0_8px_25px_rgba(0,0,0,0.8)] mb-3 group-hover:border-[#E60026]/40 transition-colors">
                <img
                  src={slots.slotA.image}
                  alt={slots.slotA.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 right-2 text-xl drop-shadow-md">{slots.slotA.symbol}</span>
                
                <button
                  onClick={(e) => handleClearSlot('slotA', e)}
                  className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-[#E60026] text-white hover:text-black rounded-full transition-colors cursor-pointer"
                  title="Clear card"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <h3 className="text-xs font-bold font-syne uppercase tracking-wider text-zinc-100 text-center">
                {slots.slotA.name}
              </h3>
              <p className="text-[9.5px] text-zinc-400 text-center mt-1 line-clamp-2 px-1">
                {slots.slotA.meaning}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 my-6 text-center space-y-3">
              <div className={`w-14 h-14 rounded-full border border-dashed flex items-center justify-center text-xl transition-all ${
                activeSlot === 'slotA'
                  ? 'border-[#E60026] text-[#E60026] bg-[#E60026]/10 animate-pulse'
                  : 'border-zinc-800 text-zinc-700'
              }`}>
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-300 block uppercase tracking-wide">
                  Card Slot A Empty
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Search above to assign card
                </span>
              </div>
            </div>
          )}

          <div className="w-full pt-3 border-t border-zinc-900/60 text-center text-[9px] font-mono text-zinc-500">
            {slots.slotA ? '✓ Assigned' : 'Awaiting Selection'}
          </div>
        </div>

        {/* SLOT B: PRESENT / CATALYST */}
        <div
          onClick={() => setActiveSlot('slotB')}
          className={`relative rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between min-h-[310px] group ${
            activeSlot === 'slotB'
              ? 'bg-zinc-950 border-2 border-[#E60026] shadow-[0_0_30px_rgba(230,0,38,0.25)] ring-1 ring-[#E60026]'
              : 'bg-black border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/40'
          }`}
        >
          <div className="w-full flex items-center justify-between mb-2">
            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              activeSlot === 'slotB'
                ? 'bg-[#E60026] text-black font-extrabold shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}>
              {activeSlot === 'slotB' ? '● Active Target' : 'Card Slot B'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">PRESENT / CATALYST</span>
          </div>

          {slots.slotB ? (
            <div className="w-full flex flex-col items-center animate-fadeIn">
              <div className="w-full max-w-[140px] aspect-[2/3.1] rounded-xl overflow-hidden relative border border-zinc-800 shadow-[0_8px_25px_rgba(0,0,0,0.8)] mb-3 group-hover:border-[#E60026]/40 transition-colors">
                <img
                  src={slots.slotB.image}
                  alt={slots.slotB.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 right-2 text-xl drop-shadow-md">{slots.slotB.symbol}</span>
                
                <button
                  onClick={(e) => handleClearSlot('slotB', e)}
                  className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-[#E60026] text-white hover:text-black rounded-full transition-colors cursor-pointer"
                  title="Clear card"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <h3 className="text-xs font-bold font-syne uppercase tracking-wider text-zinc-100 text-center">
                {slots.slotB.name}
              </h3>
              <p className="text-[9.5px] text-zinc-400 text-center mt-1 line-clamp-2 px-1">
                {slots.slotB.meaning}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 my-6 text-center space-y-3">
              <div className={`w-14 h-14 rounded-full border border-dashed flex items-center justify-center text-xl transition-all ${
                activeSlot === 'slotB'
                  ? 'border-[#E60026] text-[#E60026] bg-[#E60026]/10 animate-pulse'
                  : 'border-zinc-800 text-zinc-700'
              }`}>
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-300 block uppercase tracking-wide">
                  Card Slot B Empty
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Search above to assign card
                </span>
              </div>
            </div>
          )}

          <div className="w-full pt-3 border-t border-zinc-900/60 text-center text-[9px] font-mono text-zinc-500">
            {slots.slotB ? '✓ Assigned' : 'Awaiting Selection'}
          </div>
        </div>

        {/* SLOT C: FUTURE / POTENTIAL */}
        <div
          onClick={() => setActiveSlot('slotC')}
          className={`relative rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between min-h-[310px] group ${
            activeSlot === 'slotC'
              ? 'bg-zinc-950 border-2 border-[#E60026] shadow-[0_0_30px_rgba(230,0,38,0.25)] ring-1 ring-[#E60026]'
              : 'bg-black border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/40'
          }`}
        >
          <div className="w-full flex items-center justify-between mb-2">
            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              activeSlot === 'slotC'
                ? 'bg-[#E60026] text-black font-extrabold shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}>
              {activeSlot === 'slotC' ? '● Active Target' : 'Card Slot C'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">FUTURE / OUTCOME</span>
          </div>

          {slots.slotC ? (
            <div className="w-full flex flex-col items-center animate-fadeIn">
              <div className="w-full max-w-[140px] aspect-[2/3.1] rounded-xl overflow-hidden relative border border-zinc-800 shadow-[0_8px_25px_rgba(0,0,0,0.8)] mb-3 group-hover:border-[#E60026]/40 transition-colors">
                <img
                  src={slots.slotC.image}
                  alt={slots.slotC.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 right-2 text-xl drop-shadow-md">{slots.slotC.symbol}</span>
                
                <button
                  onClick={(e) => handleClearSlot('slotC', e)}
                  className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-[#E60026] text-white hover:text-black rounded-full transition-colors cursor-pointer"
                  title="Clear card"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <h3 className="text-xs font-bold font-syne uppercase tracking-wider text-zinc-100 text-center">
                {slots.slotC.name}
              </h3>
              <p className="text-[9.5px] text-zinc-400 text-center mt-1 line-clamp-2 px-1">
                {slots.slotC.meaning}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 my-6 text-center space-y-3">
              <div className={`w-14 h-14 rounded-full border border-dashed flex items-center justify-center text-xl transition-all ${
                activeSlot === 'slotC'
                  ? 'border-[#E60026] text-[#E60026] bg-[#E60026]/10 animate-pulse'
                  : 'border-zinc-800 text-zinc-700'
              }`}>
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-300 block uppercase tracking-wide">
                  Card Slot C Empty
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Search above to assign card
                </span>
              </div>
            </div>
          )}

          <div className="w-full pt-3 border-t border-zinc-900/60 text-center text-[9px] font-mono text-zinc-500">
            {slots.slotC ? '✓ Assigned' : 'Awaiting Selection'}
          </div>
        </div>

        {/* OPTIONAL SLOT D: 4TH INSIGHT CARD */}
        {includeInsightCard && (
          <div
            onClick={() => setActiveSlot('slotD')}
            className={`relative rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between min-h-[310px] group animate-fadeIn ${
              activeSlot === 'slotD'
                ? 'bg-zinc-950 border-2 border-[#E60026] shadow-[0_0_30px_rgba(230,0,38,0.25)] ring-1 ring-[#E60026]'
                : 'bg-black border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/40'
            }`}
          >
            <div className="w-full flex items-center justify-between mb-2">
              <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                activeSlot === 'slotD'
                  ? 'bg-[#E60026] text-black font-extrabold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}>
                {activeSlot === 'slotD' ? '● Active Target' : 'Card Slot D'}
              </span>
              <span className="text-[10px] font-mono text-amber-500">INSIGHT / SHADOW</span>
            </div>

            {slots.slotD ? (
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <div className="w-full max-w-[140px] aspect-[2/3.1] rounded-xl overflow-hidden relative border border-zinc-800 shadow-[0_8px_25px_rgba(0,0,0,0.8)] mb-3 group-hover:border-[#E60026]/40 transition-colors">
                  <img
                    src={slots.slotD.image}
                    alt={slots.slotD.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-2 right-2 text-xl drop-shadow-md">{slots.slotD.symbol}</span>
                  
                  <button
                    onClick={(e) => handleClearSlot('slotD', e)}
                    className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-[#E60026] text-white hover:text-black rounded-full transition-colors cursor-pointer"
                    title="Clear card"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <h3 className="text-xs font-bold font-syne uppercase tracking-wider text-zinc-100 text-center">
                  {slots.slotD.name}
                </h3>
                <p className="text-[9.5px] text-zinc-400 text-center mt-1 line-clamp-2 px-1">
                  {slots.slotD.meaning}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 my-6 text-center space-y-3">
                <div className={`w-14 h-14 rounded-full border border-dashed flex items-center justify-center text-xl transition-all ${
                  activeSlot === 'slotD'
                    ? 'border-[#E60026] text-[#E60026] bg-[#E60026]/10 animate-pulse'
                    : 'border-zinc-800 text-zinc-700'
                }`}>
                  <Sparkles className="w-6 h-6 text-amber-500/80" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-300 block uppercase tracking-wide">
                    Insight Slot Empty
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Search above to assign card
                  </span>
                </div>
              </div>
            )}

            <div className="w-full pt-3 border-t border-zinc-900/60 text-center text-[9px] font-mono text-amber-500/80">
              {slots.slotD ? '✓ 4th Dimension Key Assigned' : 'Awaiting Insight Card'}
            </div>
          </div>
        )}

      </div>

      {/* DYNAMIC CHECKBOXES & OPTIONS (Below Card Slots) */}
      <div className="bg-black border border-zinc-900 rounded-2xl p-5 mb-8 space-y-4 shadow-xl">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Checkbox 1: Attach Specific Question */}
          <div 
            onClick={() => setAttachQuestion(!attachQuestion)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              attachQuestion 
                ? 'bg-zinc-950 border-[#E60026]/50 shadow-[0_0_15px_rgba(230,0,38,0.1)]' 
                : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
            }`}
          >
            <div className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-all ${
              attachQuestion 
                ? 'bg-[#E60026] border-[#E60026] text-black' 
                : 'border-zinc-700 bg-zinc-900'
            }`}>
              {attachQuestion && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-google-sans">
                Attach Specific Question
              </h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Imbue the reading with a specific inquiry or focus topic you held while shuffling.
              </p>
            </div>
          </div>

          {/* Checkbox 2: 4th Insight Card */}
          <div 
            onClick={() => {
              const next = !includeInsightCard;
              setIncludeInsightCard(next);
              if (next && !slots.slotD) {
                setActiveSlot('slotD');
              }
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              includeInsightCard 
                ? 'bg-zinc-950 border-[#E60026]/50 shadow-[0_0_15px_rgba(230,0,38,0.1)]' 
                : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
            }`}
          >
            <div className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-all ${
              includeInsightCard 
                ? 'bg-[#E60026] border-[#E60026] text-black' 
                : 'border-zinc-700 bg-zinc-900'
            }`}>
              {includeInsightCard && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-google-sans">
                4th Insight Card (Deep Dimension)
              </h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Expands spread to four keys, factoring hidden astral shadow currents.
              </p>
            </div>
          </div>

        </div>

        {/* Dynamic Revealed Input for Question */}
        {attachQuestion && (
          <div className="pt-2 animate-fadeIn">
            <label className="text-[10px] uppercase font-mono tracking-widest text-[#E60026] font-bold block mb-1.5">
              Specify Querent Inquiry:
            </label>
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="e.g. What unseen karmic obstacles surround my creative or romantic endeavor?"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#E60026] text-xs px-3.5 py-2.5 rounded-lg text-zinc-200 outline-none font-google-sans placeholder-zinc-700 shadow-inner"
            />
          </div>
        )}

      </div>

      {/* ACTION BAR: PROCEED TO SYNTHESIS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <button
          onClick={handleResetAll}
          className="text-xs font-mono uppercase text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer self-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear Spread Slots
        </button>

        <button
          onClick={handleProceedToReading}
          disabled={!isReadyToProceed || isSynthesizing}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer font-syne ${
            isReadyToProceed && !isSynthesizing
              ? 'bg-[#E60026] hover:bg-[#ff334b] text-black shadow-[0_4px_25px_rgba(230,0,38,0.3)] hover:scale-[1.02]'
              : 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-850'
          }`}
        >
          {isSynthesizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Weaving Metaphysical Tapestry...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Proceed with Spread Reading (Mode 2)</span>
            </>
          )}
        </button>
      </div>

      {/* GENERATED READING DISPLAY */}
      {generatedReading && (
        <div className="bg-zinc-950 border-2 border-[#E60026]/40 rounded-2xl p-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative animate-fadeIn space-y-4">
          
          {/* Active Archived Reading Badge / Voice Conductor info */}
          {activeArchivedReading && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-black border border-[#E60026]/40 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E60026] animate-ping" />
                <span className="text-[#E60026] font-bold">
                  Viewing Archived Spread: {activeArchivedReading.formattedDate}
                </span>
              </div>

              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-zinc-500">Original Voice Conduit:</span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[#F8F7F4] font-bold">
                  {activeArchivedReading.voiceSettings.persona}
                </span>
                <span className="text-[10px] text-zinc-500">
                  ({activeArchivedReading.voiceSettings.pitch} pitch / {activeArchivedReading.voiceSettings.speed}x speed)
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🕯️</span>
              <div>
                <h3 className="text-base font-bold font-syne uppercase tracking-wider text-[#F8F7F4]">
                  Physical Realm Reading Synthesis
                </h3>
                <span className="text-[9px] font-mono text-[#E60026]">
                  {activeArchivedReading 
                    ? 'Archived Interpretation with Original Vocal Modulation' 
                    : 'Full Narrative Tapestry Generated'}
                </span>
              </div>
            </div>

            {/* Audio Voice Playback Control (Plays using original voice settings) */}
            <button
              onClick={handleToggleVoicePlayback}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                isAudioSpeaking
                  ? 'bg-[#E60026] text-black border-[#E60026] font-bold shadow-md animate-pulse'
                  : 'bg-black text-zinc-300 border-zinc-800 hover:border-[#E60026]/40'
              }`}
              title={activeArchivedReading ? `Listen with ${activeArchivedReading.voiceSettings.persona} original settings` : 'Listen to voice synthesis'}
            >
              {isAudioSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Mute Voice</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#E60026]" />
                  <span>
                    {activeArchivedReading 
                      ? `Listen (${activeArchivedReading.voiceSettings.persona.split(' ')[0]})` 
                      : 'Listen to Voice'}
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-google-sans whitespace-pre-wrap pl-2 border-l-2 border-[#E60026]">
            {generatedReading}
          </div>

          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <button
              onClick={() => setIsPastReadingsSidebarOpen(true)}
              className="text-[#E60026] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <History className="w-3 h-3" />
              <span>Browse All {pastReadingsCount} Past Spreads in Sidebar →</span>
            </button>

            <span>
              Persisted in Metaphysical Archives
            </span>
          </div>

        </div>
      )}

      {/* Past Readings Slide-over Sidebar Component */}
      <PastReadingsSidebar
        isOpen={isPastReadingsSidebarOpen}
        onClose={() => setIsPastReadingsSidebarOpen(false)}
        onSelectReading={handleSelectPastReading}
        currentLoadedReadingId={activeArchivedReading?.id || null}
      />

    </div>
  );
};
