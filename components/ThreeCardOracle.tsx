import React, { useState } from 'react';
import { TAROT_DATABASE } from '../data/tarotCards';

export interface TarotCard {
  name: string;
  position: 'Past' | 'Present' | 'Future';
  description: string;
  symbol: string;
  meaning: string;
  image: string;
}

const TAROT_DECK: Omit<TarotCard, 'position'>[] = TAROT_DATABASE.map(card => ({
  name: card.name,
  symbol: card.symbol || (card.arcana === 'major' ? '🃏' : '✨'),
  description: card.description || card.symbolism || card.keywords.slice(0, 3).join(', '),
  meaning: card.meaning,
  image: card.image
}));

interface ThreeCardOracleProps {
  onStartReading: (prompt: string, mode: 'tarot' | 'tarot-physical', cards: TarotCard[]) => void;
  onShareTarotReading?: (question: string, cards: TarotCard[]) => void;
}

export const ThreeCardOracle: React.FC<ThreeCardOracleProps> = ({
  onStartReading,
  onShareTarotReading
}) => {
  const [tarotMode, setTarotMode] = useState<'digital' | 'physical'>('digital');
  const [tarotQuestion, setTarotQuestion] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [flippedCount, setFlippedCount] = useState(0);

  // Physical spread state
  const [physicalPastCard, setPhysicalPastCard] = useState('');
  const [physicalPresentCard, setPhysicalPresentCard] = useState('');
  const [physicalFutureCard, setPhysicalFutureCard] = useState('');

  const handleDrawTarot = async () => {
    if (!tarotQuestion.trim()) {
      alert("Please define the query or question you wish to explore.");
      return;
    }

    setIsDrawing(true);
    setFlippedCount(0);
    setDrawnCards([]);

    const shuffled = [...TAROT_DECK].sort(() => 0.5 - Math.random());
    const drawn: TarotCard[] = [
      { ...shuffled[0], position: 'Past' },
      { ...shuffled[1], position: 'Present' },
      { ...shuffled[2], position: 'Future' }
    ];

    setDrawnCards(drawn);

    for (let i = 1; i <= 3; i++) {
      await new Promise(res => setTimeout(res, 500));
      setFlippedCount(i);
    }

    await new Promise(res => setTimeout(res, 400));
    setIsDrawing(false);

    onStartReading(`Perform a tailored Tarot reading regarding: "${tarotQuestion}"`, 'tarot', drawn);
    setTarotQuestion('');
  };

  const handlePhysicalSynthesis = async () => {
    if (!tarotQuestion.trim()) {
      alert("Please define the question you wish the cards to answer.");
      return;
    }
    if (!physicalPastCard || !physicalPresentCard || !physicalFutureCard) {
      alert("Please select cards for all three positions (Past, Present, and Future).");
      return;
    }

    const pastObj = TAROT_DECK.find(c => c.name === physicalPastCard);
    const presentObj = TAROT_DECK.find(c => c.name === physicalPresentCard);
    const futureObj = TAROT_DECK.find(c => c.name === physicalFutureCard);

    if (!pastObj || !presentObj || !futureObj) {
      alert("An error occurred. Please select valid cards.");
      return;
    }

    const physicalCards: TarotCard[] = [
      { ...pastObj, position: 'Past' },
      { ...presentObj, position: 'Present' },
      { ...futureObj, position: 'Future' }
    ];

    setIsDrawing(true);
    await new Promise(res => setTimeout(res, 400));
    setIsDrawing(false);

    onStartReading(
      `Synthesize Tarot spread reading for question: "${tarotQuestion}". Past: ${pastObj.name}, Present: ${presentObj.name}, Future: ${futureObj.name}`,
      'tarot-physical',
      physicalCards
    );
    setTarotQuestion('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center min-h-0 relative animate-fadeIn space-y-4 select-text">
      
      {/* Mode Switcher: Oracle vs. Offline Spread */}
      <div className="border-b border-zinc-900/60 pb-3 flex items-center justify-between gap-2">
        <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-900 shadow-inner">
          <button
            onClick={() => setTarotMode('digital')}
            disabled={isDrawing}
            className={`px-3 py-1 text-xs uppercase tracking-wider font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              tarotMode === 'digital'
                ? 'bg-[#DC143C] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            Oracle
          </button>
          <button
            onClick={() => setTarotMode('physical')}
            disabled={isDrawing}
            className={`px-3 py-1 text-xs uppercase tracking-wider font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              tarotMode === 'physical'
                ? 'bg-[#DC143C] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            Offline Spread
          </button>
        </div>
      </div>

      {/* Query input field */}
      <div className="space-y-3.5">
        <div>
          <label className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold mb-1.5 font-google-sans">
            Enter your inquiry or focus:
          </label>
          <input 
            type="text"
            value={tarotQuestion}
            onChange={(e) => setTarotQuestion(e.target.value)}
            disabled={isDrawing}
            placeholder="e.g. What unseen currents shape my path ahead?"
            className="w-full bg-zinc-950 border border-zinc-850 focus:border-[#DC143C] text-xs px-3.5 py-2.5 rounded-xl text-zinc-200 outline-none font-google-sans placeholder-zinc-700 shadow-inner select-text cursor-text"
          />
        </div>

        {tarotMode === 'digital' ? (
          <div className="space-y-4">
            {drawnCards.length > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                {drawnCards.map((card, idx) => {
                  const isFlipped = flippedCount > idx;
                  return (
                    <div 
                      key={card.name}
                      className="w-full max-w-[145px] sm:max-w-[165px] mx-auto select-text cursor-text"
                    >
                      {isFlipped ? (
                        <div className="relative overflow-hidden aspect-[2/3.1] rounded-xl border border-zinc-800/60 flex flex-col justify-between items-center bg-black group hover:scale-[1.03] transition-all duration-200 shadow-[0_8px_30px_rgba(0,0,0,0.8)] hover:border-[#DC143C]/40 select-text">
                          <img 
                            src={card.image} 
                            alt={card.name} 
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-1.5 border border-amber-500/20 rounded-lg pointer-events-none z-10 shadow-[inset_0_0_12px_rgba(0,0,0,0.6)] group-hover:border-amber-500/40 transition-colors" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 z-10 pointer-events-none" />
                          <div className="relative z-20 pt-2.5 flex flex-col items-center">
                            <span className="text-[8px] text-[#DC143C] uppercase font-mono tracking-widest font-bold bg-black/85 border border-[#DC143C]/30 px-2 py-0.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
                              {card.position}
                            </span>
                          </div>
                          <div className="relative z-20 w-full px-2 pb-2 text-center">
                            <div className="bg-black/85 backdrop-blur-sm border border-zinc-900/60 px-2 py-1 rounded-lg max-w-full shadow-lg">
                              <span className="text-[9px] font-bold text-zinc-100 leading-none block font-google-sans uppercase tracking-wider truncate select-text cursor-text">
                                {card.name}
                              </span>
                              <span className="text-[7px] text-zinc-400 font-mono block mt-0.5 leading-none truncate select-text cursor-text">
                                {card.description}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative overflow-hidden aspect-[2/3.1] rounded-xl border border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center p-3 text-center cursor-pointer group hover:border-[#DC143C]/50 transition-all duration-200 shadow-md">
                          <div className="absolute inset-1.5 border border-zinc-800/40 rounded-lg pointer-events-none" />
                          <div className="absolute inset-0 bg-[radial-gradient(#DC143C_1px,transparent_1px)] bg-[size:7px_7px] opacity-[0.18] rounded-lg group-hover:opacity-[0.3] transition-opacity" />
                          <div className="w-9 h-9 rounded-full border border-zinc-850 flex items-center justify-center text-zinc-400 group-hover:text-[#DC143C] group-hover:border-[#DC143C]/40 transition-all text-base relative z-10 bg-zinc-950">
                            👁️
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reading Actions: Share Reading only (No dedicated Copy button) */}
            {drawnCards.length === 3 && flippedCount === 3 && onShareTarotReading && (
              <div className="flex items-center justify-center gap-2 pt-1 animate-fadeIn">
                <button
                  onClick={() => onShareTarotReading(tarotQuestion, drawnCards)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-black border border-zinc-800 hover:border-[#DC143C]/50 text-xs font-mono uppercase text-zinc-300 hover:text-white transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Share reading"
                >
                  <span>↗</span>
                  <span>Share Reading</span>
                </button>
              </div>
            )}

            <button
              onClick={handleDrawTarot}
              disabled={isDrawing || !tarotQuestion.trim()}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer font-google-sans ${
                tarotQuestion.trim() && !isDrawing
                  ? 'bg-[#DC143C] text-black hover:bg-[#B81132] hover:text-white shadow-md'
                  : 'bg-zinc-950 text-zinc-700 cursor-not-allowed border border-zinc-900'
              }`}
            >
              {isDrawing ? "Drawing Cards..." : "Draw 3 Cards"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col text-left space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 font-google-sans">1. Past Energy</span>
                <select
                  value={physicalPastCard}
                  onChange={(e) => setPhysicalPastCard(e.target.value)}
                  disabled={isDrawing}
                  className="bg-zinc-950 border border-zinc-850 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none w-full font-google-sans focus:border-[#DC143C] cursor-pointer"
                >
                  <option value="">Select Card...</option>
                  <optgroup label="── Major Arcana ──">
                    {TAROT_DATABASE.filter(c => c.arcana === 'major').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Wands (Fire) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'wands').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Cups (Water) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'cups').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Swords (Air) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'swords').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Pentacles (Earth) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'pentacles').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                </select>
              </div>

              <div className="flex flex-col text-left space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 font-google-sans">2. Present Moment</span>
                <select
                  value={physicalPresentCard}
                  onChange={(e) => setPhysicalPresentCard(e.target.value)}
                  disabled={isDrawing}
                  className="bg-zinc-950 border border-zinc-850 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none w-full font-google-sans focus:border-[#DC143C] cursor-pointer"
                >
                  <option value="">Select Card...</option>
                  <optgroup label="── Major Arcana ──">
                    {TAROT_DATABASE.filter(c => c.arcana === 'major').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Wands (Fire) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'wands').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Cups (Water) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'cups').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Swords (Air) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'swords').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Pentacles (Earth) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'pentacles').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                </select>
              </div>

              <div className="flex flex-col text-left space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 font-google-sans">3. Future Trajectory</span>
                <select
                  value={physicalFutureCard}
                  onChange={(e) => setPhysicalFutureCard(e.target.value)}
                  disabled={isDrawing}
                  className="bg-zinc-950 border border-zinc-850 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none w-full font-google-sans focus:border-[#DC143C] cursor-pointer"
                >
                  <option value="">Select Card...</option>
                  <optgroup label="── Major Arcana ──">
                    {TAROT_DATABASE.filter(c => c.arcana === 'major').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Wands (Fire) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'wands').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Cups (Water) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'cups').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Swords (Air) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'swords').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                  <optgroup label="── Suit of Pentacles (Earth) ──">
                    {TAROT_DATABASE.filter(c => c.suit === 'pentacles').map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                  </optgroup>
                </select>
              </div>
            </div>

            <button
              onClick={handlePhysicalSynthesis}
              disabled={isDrawing || !tarotQuestion.trim() || !physicalPastCard || !physicalPresentCard || !physicalFutureCard}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer font-google-sans ${
                tarotQuestion.trim() && !isDrawing && physicalPastCard && physicalPresentCard && physicalFutureCard
                  ? 'bg-amber-500 text-black hover:bg-amber-600 shadow-md'
                  : 'bg-zinc-950 text-zinc-700 cursor-not-allowed border border-zinc-900'
              }`}
            >
              {isDrawing ? "Synthesizing Reading..." : "Synthesize Spread"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
