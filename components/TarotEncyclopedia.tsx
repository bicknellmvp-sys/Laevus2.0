import React, { useState, useMemo } from 'react';
import { 
  TAROT_DATABASE, 
  TarotCardData, 
  getMajorArcana, 
  getMinorArcana
} from '../data/tarotCards';

interface TarotEncyclopediaProps {
  onStartSeanceWithCard?: (cardName: string, query: string) => void;
  initialArcanaTab?: 'major' | 'minor' | 'all';
  isEmbedMode?: boolean;
  onReturnToChat?: () => void;
}

export const TarotEncyclopedia: React.FC<TarotEncyclopediaProps> = ({
  onStartSeanceWithCard,
  initialArcanaTab = 'major',
  onReturnToChat
}) => {
  // Primary Arcana Tab State: 'major' | 'minor' | 'all'
  const [arcanaTab, setArcanaTab] = useState<'major' | 'minor' | 'all'>(initialArcanaTab);

  // Minor Arcana Suit Sub-Filter State: 'all' | 'wands' | 'cups' | 'swords' | 'pentacles'
  const [suitFilter, setSuitFilter] = useState<'all' | 'wands' | 'cups' | 'swords' | 'pentacles'>('all');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Card for deep esoteric detail view & seance
  const [selectedCard, setSelectedCard] = useState<TarotCardData | null>(null);
  const [archetypeQuery, setArchetypeQuery] = useState('');

  // Filtered Cards Memo
  const filteredCards = useMemo(() => {
    let list = TAROT_DATABASE;

    // 1. Primary Arcana Tab Filter
    if (arcanaTab === 'major') {
      list = list.filter(c => c.arcana === 'major');
    } else if (arcanaTab === 'minor') {
      list = list.filter(c => c.arcana === 'minor');
      // 2. Suit Sub-Filter within Minor Arcana
      if (suitFilter !== 'all') {
        list = list.filter(c => c.suit === suitFilter);
      }
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        c.astrology.toLowerCase().includes(q) ||
        c.element.toLowerCase().includes(q) ||
        c.keywords.some(k => k.toLowerCase().includes(q))
      );
    }

    return list;
  }, [arcanaTab, suitFilter, searchQuery]);

  const majorCount = useMemo(() => getMajorArcana().length, []);
  const minorCount = useMemo(() => getMinorArcana().length, []);

  const handleStartConsultation = () => {
    if (!selectedCard || !archetypeQuery.trim()) return;
    if (onStartSeanceWithCard) {
      onStartSeanceWithCard(selectedCard.name, archetypeQuery.trim());
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1 sm:p-2 mb-2 pt-2 sm:pt-4 relative animate-fadeIn w-full max-w-5xl mx-auto font-google-sans text-zinc-200">
      
      {/* Top Banner / Navigation Header */}
      <div className="border-b border-zinc-900 pb-4 mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/30 text-[#DC143C] text-[10px] font-mono font-bold uppercase tracking-widest">
              Living Grimoire
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              78 Cosmic Archetypes
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-syne text-[#F8F7F4] uppercase tracking-tight mt-1">
            Tarot Encyclopedia & Living Archetypes
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl">
            Explore the mysteries of the Tarot. Delve into the core esoteric symbolism, elemental rulers, and upright & reversed interpretations, or converse directly with any living card archetype.
          </p>
        </div>

        {onReturnToChat && (
          <button
            onClick={onReturnToChat}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-[#DC143C]/50 text-zinc-300 hover:text-white text-xs font-mono transition-all self-start md:self-center cursor-pointer shadow-md group"
          >
            <span className="text-[#DC143C] font-bold">←</span>
            <span className="font-bold uppercase tracking-wider text-[10px]">Return to Oracle Chat</span>
          </button>
        )}
      </div>

      {/* PRIMARY 2 TABS: MAJOR ARCANA vs MINOR ARCANA */}
      {!selectedCard && (
        <div className="space-y-4 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950 p-2 rounded-2xl border border-zinc-900 shadow-md">
            
            {/* Primary Arcana Switcher Tabs */}
            <div className="flex items-center gap-1.5 bg-black p-1 rounded-xl border border-zinc-850">
              <button
                onClick={() => {
                  setArcanaTab('major');
                  setSuitFilter('all');
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-mono uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  arcanaTab === 'major'
                    ? 'bg-[#DC143C] text-black shadow-[0_2px_10px_rgba(220,20,60,0.3)]'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                <span>Major Arcana</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  arcanaTab === 'major' ? 'bg-black/30 text-black' : 'bg-zinc-900 text-zinc-400'
                }`}>
                  {majorCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setArcanaTab('minor');
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-mono uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  arcanaTab === 'minor'
                    ? 'bg-[#DC143C] text-black shadow-[0_2px_10px_rgba(220,20,60,0.3)]'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                <span>Minor Arcana</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  arcanaTab === 'minor' ? 'bg-black/30 text-black' : 'bg-zinc-900 text-zinc-400'
                }`}>
                  {minorCount}
                </span>
              </button>

              <button
                onClick={() => setArcanaTab('all')}
                className={`hidden md:flex px-3 py-2 rounded-lg text-xs font-mono uppercase font-bold tracking-wider transition-all items-center gap-1.5 cursor-pointer ${
                  arcanaTab === 'all'
                    ? 'bg-[#DC143C] text-black shadow-[0_2px_10px_rgba(220,20,60,0.3)]'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <span>All 78</span>
              </button>
            </div>

            {/* Real-time Search Box */}
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by card name, keyword, zodiac..."
                className="w-full bg-black border border-zinc-850 rounded-xl px-4 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#DC143C] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

          </div>

          {/* SUIT SUB-TABS (When viewing Minor Arcana) */}
          {arcanaTab === 'minor' && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-950/70 border border-zinc-900 rounded-xl animate-fadeIn">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 px-2">
                Filter by Suit:
              </span>

              {[
                { id: 'all', label: 'All Suits (56)' },
                { id: 'wands', label: 'Wands (14)' },
                { id: 'cups', label: 'Cups (14)' },
                { id: 'swords', label: 'Swords (14)' },
                { id: 'pentacles', label: 'Pentacles (14)' }
              ].map((s) => {
                const isSelected = suitFilter === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSuitFilter(s.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 text-[#F8F7F4] border border-[#DC143C]/50 font-bold shadow-sm'
                        : 'bg-black text-zinc-400 hover:text-zinc-200 border border-zinc-900'
                    }`}
                  >
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CARD DETAIL VIEW & SEANCE DIALOGUE */}
      {selectedCard ? (
        <div className="bg-zinc-950 border border-zinc-900/80 rounded-2xl p-4 sm:p-6 shadow-[0_15px_50px_rgba(0,0,0,0.8)] flex flex-col md:flex-row gap-6 animate-fadeIn relative">
          
          {/* Back Button */}
          <button
            onClick={() => setSelectedCard(null)}
            className="absolute top-4 right-4 text-xs font-mono text-zinc-400 hover:text-[#DC143C] flex items-center gap-1 transition-colors cursor-pointer z-20"
          >
            <span>✕</span>
            <span className="hidden sm:inline">Close Card</span>
          </button>

          {/* Left Column: High-Resolution Card Display */}
          <div className="w-full md:w-2/5 flex flex-col items-center flex-shrink-0">
            <div className="w-full max-w-[220px] aspect-[2/3.2] rounded-xl bg-black border-2 border-amber-500/30 overflow-hidden relative shadow-[0_10px_35px_rgba(0,0,0,0.9)] group">
              <img
                src={selectedCard.image}
                alt={selectedCard.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/80 border border-[#DC143C]/40 text-[#DC143C] text-[9px] font-mono uppercase font-bold tracking-widest">
                {selectedCard.arcana} Arcana
              </div>
              <span className="absolute bottom-3 right-3 text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {selectedCard.symbol}
              </span>
            </div>

            {/* Element & Astrology Badges */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-[220px] mt-4 font-mono text-[10px]">
              <div className="bg-black border border-zinc-850 p-2 rounded-lg text-center">
                <span className="text-zinc-500 block uppercase">Element</span>
                <span className="text-zinc-200 font-bold">{selectedCard.element}</span>
              </div>
              <div className="bg-black border border-zinc-850 p-2 rounded-lg text-center">
                <span className="text-zinc-500 block uppercase">Astrology</span>
                <span className="text-amber-400 font-bold truncate block">{selectedCard.astrology}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCard(null)}
              className="mt-4 text-[11px] font-mono uppercase font-bold tracking-widest text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="text-[#DC143C] font-bold">←</span>
              <span>Back to Deck Grid</span>
            </button>
          </div>

          {/* Right Column: Deep Esoteric Wisdom & Seance */}
          <div className="flex-1 flex flex-col space-y-4 text-left">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold font-syne text-amber-400 tracking-wide uppercase">
                  {selectedCard.name}
                </h2>
                <span className="text-xl">{selectedCard.symbol}</span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                  {selectedCard.number}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium tracking-wide mt-1 uppercase font-mono">
                {selectedCard.description}
              </p>
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap gap-1.5">
              {selectedCard.keywords.map((kw, i) => (
                <span 
                  key={i}
                  className="px-2.5 py-0.5 rounded-full bg-black border border-zinc-800 text-zinc-300 text-[10px] font-mono"
                >
                  #{kw}
                </span>
              ))}
            </div>

            {/* Upright vs. Reversed Meanings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-black/60 border border-emerald-900/30 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                  <span>▲ Upright Meaning</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-google-sans">
                  {selectedCard.meaning}
                </p>
              </div>

              <div className="bg-black/60 border border-rose-900/30 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                  <span>▼ Reversed / Shadow Aspect</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-google-sans">
                  {selectedCard.reversedMeaning}
                </p>
              </div>
            </div>

            {/* Seance Dialogue Channel */}
            <div className="border-t border-zinc-900 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-mono uppercase font-bold tracking-widest text-[#DC143C] flex items-center gap-1.5">
                    Converse with Living Archetype
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-google-sans">
                    Ask a direct question. LAEVUS will channel the persona and energetic vibration of {selectedCard.name}.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <textarea
                  value={archetypeQuery}
                  onChange={(e) => setArchetypeQuery(e.target.value)}
                  placeholder={`Pose your question to the soul of ${selectedCard.name}... (e.g. "What hidden blockage must I release to harness your power?")`}
                  className="w-full bg-black border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-[#DC143C] resize-none h-20 font-google-sans transition-colors"
                />

                <button
                  onClick={handleStartConsultation}
                  disabled={!archetypeQuery.trim()}
                  className={`py-2.5 px-4 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    archetypeQuery.trim()
                      ? 'bg-[#DC143C] hover:bg-[#B81132] text-white cursor-pointer shadow-[0_4px_15px_rgba(220,20,60,0.25)]'
                      : 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-850'
                  }`}
                >
                  <span>Initiate Dialogue with {selectedCard.name}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* GRID OF CARDS */
        <div>
          {filteredCards.length === 0 ? (
            <div className="p-12 text-center bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold font-mono uppercase text-zinc-400">No Arcana Matches Found</h3>
              <p className="text-xs text-zinc-600 font-google-sans">
                No cards match your search filter &ldquo;{searchQuery}&rdquo;. Try clearing filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSuitFilter('all');
                  setArcanaTab('major');
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredCards.map((card) => (
                <div
                  key={card.name}
                  onClick={() => {
                    setSelectedCard(card);
                    setArchetypeQuery('');
                  }}
                  className="group bg-zinc-950 border border-zinc-900 rounded-xl p-3 hover:border-amber-500/40 hover:bg-black transition-all duration-300 cursor-pointer flex flex-col items-center text-center shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.08)] hover:-translate-y-1 relative"
                >
                  {/* Arcana Type badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold bg-black/80 border border-zinc-800 text-zinc-400 group-hover:border-[#DC143C]/40 group-hover:text-[#DC143C] transition-colors">
                      {card.arcana === 'major' ? card.number : card.suit}
                    </span>
                  </div>

                  {/* Card Artwork */}
                  <div className="w-full aspect-[2/3] rounded-lg bg-zinc-900 border border-zinc-800/80 overflow-hidden relative mb-2.5">
                    {card.image ? (
                      <img
                        src={card.image}
                        alt={card.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-40 bg-zinc-900 font-mono">
                        🃏
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />
                    <span className="absolute bottom-2 right-2 text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {card.symbol}
                    </span>
                  </div>

                  {/* Card Title & Info */}
                  <h3 className="font-bold text-xs text-zinc-200 group-hover:text-amber-400 transition-colors uppercase tracking-wider leading-tight">
                    {card.name}
                  </h3>
                  <span className="text-[9px] text-zinc-500 mt-1 line-clamp-1 group-hover:text-zinc-400 transition-colors font-google-sans">
                    {card.description}
                  </span>
                  
                  <div className="mt-2 pt-2 border-t border-zinc-900/60 w-full flex items-center justify-between text-[9px] font-mono text-zinc-600 group-hover:text-zinc-400">
                    <span>{card.element}</span>
                    <span className="text-amber-500/70">{card.astrology}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
