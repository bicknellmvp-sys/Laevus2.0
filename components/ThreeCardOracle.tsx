import React, { useState } from 'react';
import { TAROT_DATABASE } from '../data/tarotCards';

export interface TarotCard {
  name: string;
  position: 'Past' | 'Present' | 'Future' | 'Follow-up' | string;
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
  onStartReading: (
    prompt: string, 
    mode: 'tarot' | 'tarot-physical', 
    cards: TarotCard[],
    extra?: { followUpQuestion?: string; primaryQuestion?: string }
  ) => void;
  onShareTarotReading?: (question: string, cards: TarotCard[]) => void;
  onSelectEncyclopedia?: () => void;
}

export const ThreeCardOracle: React.FC<ThreeCardOracleProps> = ({
  onStartReading,
  onShareTarotReading,
  onSelectEncyclopedia
}) => {
  const [tarotMode, setTarotMode] = useState<'digital' | 'physical'>('digital');
  const [enableInquiry, setEnableInquiry] = useState(false);
  const [tarotQuestion, setTarotQuestion] = useState('');
  const [enableFollowUp, setEnableFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [flippedCount, setFlippedCount] = useState(0);

  // Physical spread state
  const [physicalPastCard, setPhysicalPastCard] = useState('');
  const [physicalPresentCard, setPhysicalPresentCard] = useState('');
  const [physicalFutureCard, setPhysicalFutureCard] = useState('');
  const [physicalFollowUpCard, setPhysicalFollowUpCard] = useState('');

  const handleDrawTarot = async () => {
    if (enableInquiry && !tarotQuestion.trim()) {
      alert("Please define your inquiry, or uncheck 'Enable Inquiry' for open guidance.");
      return;
    }
    if (enableFollowUp && !followUpQuestion.trim()) {
      alert("Please enter your follow-up question to be answered by the 4th card.");
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

    if (enableFollowUp) {
      drawn.push({ ...shuffled[3], position: 'Follow-up' });
    }

    setDrawnCards(drawn);

    const totalToFlip = drawn.length;
    for (let i = 1; i <= totalToFlip; i++) {
      await new Promise(res => setTimeout(res, 450));
      setFlippedCount(i);
    }

    await new Promise(res => setTimeout(res, 400));
    setIsDrawing(false);

    const effectiveQuestion = enableInquiry && tarotQuestion.trim() ? tarotQuestion.trim() : "General life alignment & open wisdom";
    const effectiveFollowUp = enableFollowUp && followUpQuestion.trim() ? followUpQuestion.trim() : undefined;

    const promptText = effectiveFollowUp
      ? `Perform a 4-card tailored Tarot reading. Primary Inquiry: "${effectiveQuestion}". Follow-up Question: "${effectiveFollowUp}". First 3 cards represent Past, Present, Future. The 4th card answers the follow-up question using the primary inquiry and initial cards as context.`
      : `Perform a tailored Tarot reading regarding: "${effectiveQuestion}"`;

    onStartReading(promptText, 'tarot', drawn, {
      primaryQuestion: effectiveQuestion,
      followUpQuestion: effectiveFollowUp
    });
    setTarotQuestion('');
    setFollowUpQuestion('');
  };

  const handlePhysicalSynthesis = async () => {
    if (enableInquiry && !tarotQuestion.trim()) {
      alert("Please define the question you wish the cards to answer, or uncheck 'Enable Inquiry'.");
      return;
    }
    if (enableFollowUp && !followUpQuestion.trim()) {
      alert("Please enter your follow-up question to be answered by the 4th card.");
      return;
    }
    if (!physicalPastCard || !physicalPresentCard || !physicalFutureCard) {
      alert("Please select cards for Past, Present, and Future positions.");
      return;
    }
    if (enableFollowUp && !physicalFollowUpCard) {
      alert("Please select a card for the 4th Follow-up position.");
      return;
    }

    const pastObj = TAROT_DECK.find(c => c.name === physicalPastCard);
    const presentObj = TAROT_DECK.find(c => c.name === physicalPresentCard);
    const futureObj = TAROT_DECK.find(c => c.name === physicalFutureCard);
    const followUpObj = enableFollowUp ? TAROT_DECK.find(c => c.name === physicalFollowUpCard) : undefined;

    if (!pastObj || !presentObj || !futureObj || (enableFollowUp && !followUpObj)) {
      alert("An error occurred. Please select valid cards.");
      return;
    }

    const physicalCards: TarotCard[] = [
      { ...pastObj, position: 'Past' },
      { ...presentObj, position: 'Present' },
      { ...futureObj, position: 'Future' }
    ];

    if (enableFollowUp && followUpObj) {
      physicalCards.push({ ...followUpObj, position: 'Follow-up' });
    }

    setIsDrawing(true);
    await new Promise(res => setTimeout(res, 400));
    setIsDrawing(false);

    const effectiveQuestion = enableInquiry && tarotQuestion.trim() ? tarotQuestion.trim() : "General life alignment & open wisdom";
    const effectiveFollowUp = enableFollowUp && followUpQuestion.trim() ? followUpQuestion.trim() : undefined;

    const promptText = effectiveFollowUp
      ? `Synthesize a 4-card Tarot reading for inquiry: "${effectiveQuestion}". Past: ${pastObj.name}, Present: ${presentObj.name}, Future: ${futureObj.name}. Follow-up Question: "${effectiveFollowUp}" answered by 4th Card: ${followUpObj?.name}.`
      : `Synthesize Tarot spread reading for question: "${effectiveQuestion}". Past: ${pastObj.name}, Present: ${presentObj.name}, Future: ${futureObj.name}`;

    onStartReading(promptText, 'tarot-physical', physicalCards, {
      primaryQuestion: effectiveQuestion,
      followUpQuestion: effectiveFollowUp
    });
    setTarotQuestion('');
    setFollowUpQuestion('');
  };

  const isDigitalReady = !isDrawing && (!enableInquiry || tarotQuestion.trim().length > 0) && (!enableFollowUp || followUpQuestion.trim().length > 0);
  const isPhysicalCardsSelected = Boolean(physicalPastCard && physicalPresentCard && physicalFutureCard && (!enableFollowUp || physicalFollowUpCard));
  const isPhysicalReady = !isDrawing && isPhysicalCardsSelected && (!enableInquiry || tarotQuestion.trim().length > 0) && (!enableFollowUp || followUpQuestion.trim().length > 0);

  return (
    <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center min-h-0 relative animate-fadeIn space-y-4 select-text">
      
      {/* Mode Switcher: LAEVUS vs. PERSONAL PULL */}
      <div className="border-b border-zinc-900/60 pb-3 flex items-center justify-between gap-2">
        <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-900 shadow-inner">
          <button
            onClick={() => setTarotMode('digital')}
            disabled={isDrawing}
            className={`px-3.5 py-1 text-[12px] uppercase tracking-wider font-bold rounded-lg transition-all duration-200 cursor-pointer border ${
              tarotMode === 'digital'
                ? 'bg-black text-[#DC143C] border-transparent shadow-[0_0_12px_rgba(220,20,60,0.25)]'
                : 'bg-black text-zinc-400 border-transparent hover:text-[#DC143C] active:text-[#DC143C] focus:outline-none'
            }`}
          >
            LAEVUS
          </button>
          <button
            onClick={() => setTarotMode('physical')}
            disabled={isDrawing}
            className={`px-3.5 py-1 text-[12px] uppercase tracking-wider font-bold rounded-lg transition-all duration-200 cursor-pointer border ${
              tarotMode === 'physical'
                ? 'bg-black text-[#DC143C] border-transparent shadow-[0_0_12px_rgba(220,20,60,0.25)]'
                : 'bg-black text-zinc-400 border-transparent hover:text-[#DC143C] active:text-[#DC143C] focus:outline-none'
            }`}
          >
            OFFLINE
          </button>
        </div>
      </div>

      {/* Query input field with Enable Checkbox & Follow-up Checkbox on top */}
      <div className="space-y-2.5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold font-google-sans">
              INQUIRY OR FOCUS
            </label>
            <div className="flex items-center gap-3">
              {/* Checkbox 1: Enable inquiry box */}
              <label className="group flex items-center gap-1 cursor-pointer text-[8.5px] uppercase font-bold tracking-wider text-zinc-400 hover:text-[#DC143C] active:text-[#DC143C] select-none transition-colors">
                <input
                  type="checkbox"
                  checked={enableInquiry}
                  onChange={(e) => {
                    setEnableInquiry(e.target.checked);
                    if (!e.target.checked) {
                      setTarotQuestion('');
                    }
                  }}
                  disabled={isDrawing}
                  className="accent-[#DC143C] w-3 h-3 rounded cursor-pointer transition-all duration-150 hover:brightness-125 focus:ring-2 focus:ring-[#DC143C] focus:ring-offset-1 focus:ring-offset-black active:scale-95"
                />
                <span className={`transition-colors group-hover:text-[#DC143C] ${enableInquiry ? 'text-[#DC143C]' : 'text-zinc-500'}`}>
                  Enable Inquiry
                </span>
              </label>

              {/* Checkbox 2: Follow-up question & 4th card */}
              <label className="group flex items-center gap-1 cursor-pointer text-[8.5px] uppercase font-bold tracking-wider text-zinc-400 hover:text-[#DC143C] active:text-[#DC143C] select-none transition-colors">
                <input
                  type="checkbox"
                  checked={enableFollowUp}
                  onChange={(e) => {
                    setEnableFollowUp(e.target.checked);
                    if (!e.target.checked) {
                      setFollowUpQuestion('');
                      setPhysicalFollowUpCard('');
                    }
                  }}
                  disabled={isDrawing}
                  className="accent-[#DC143C] w-3 h-3 rounded cursor-pointer transition-all duration-150 hover:brightness-125 focus:ring-2 focus:ring-[#DC143C] focus:ring-offset-1 focus:ring-offset-black active:scale-95"
                />
                <span className={`transition-colors group-hover:text-[#DC143C] ${enableFollowUp ? 'text-[#DC143C] font-bold' : 'text-zinc-500'}`}>
                  FOLLOW-UP QUESTION
                </span>
              </label>
            </div>
          </div>

          <input 
            type="text"
            value={tarotQuestion}
            onChange={(e) => setTarotQuestion(e.target.value)}
            disabled={isDrawing || !enableInquiry}
            placeholder="Inquiries welcomed but not necessary..."
            className={`w-full text-[10.5px] px-3 py-2 rounded-lg outline-none font-google-sans transition-all duration-200 select-text ${
              enableInquiry
                ? 'bg-zinc-950 border border-zinc-800 focus:border-[#DC143C] text-zinc-200 placeholder-zinc-500 shadow-inner cursor-text'
                : 'bg-zinc-950/40 border border-zinc-900/60 text-zinc-600 placeholder-zinc-700 cursor-not-allowed opacity-50'
            }`}
          />
        </div>

        {/* Follow-up question input when checkbox is checked */}
        {enableFollowUp && (
          <div className="animate-fadeIn space-y-1 pt-0.5">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold font-google-sans">
              OUTCOME &amp; RESOLUTIONS
            </label>
            <input 
              type="text"
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              disabled={isDrawing}
              placeholder="Draw a fourth card for additional insight."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#DC143C] text-[10.5px] px-3 py-2 rounded-lg text-zinc-200 outline-none font-google-sans placeholder-zinc-500 shadow-inner select-text cursor-text"
            />
          </div>
        )}

        {tarotMode === 'digital' ? (
          <div className="space-y-4">
            {drawnCards.length > 0 && (
              <div className={`grid gap-3 pt-2 ${drawnCards.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                {drawnCards.map((card, idx) => {
                  const isFlipped = flippedCount > idx;
                  return (
                    <div 
                      key={`${card.name}-${idx}`}
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
                            <span className={`text-[8px] uppercase font-mono tracking-widest font-bold bg-black/85 border px-2 py-0.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.5)] ${
                              card.position === 'Follow-up' 
                                ? 'text-amber-400 border-amber-500/40' 
                                : 'text-[#DC143C] border-[#DC143C]/30'
                            }`}>
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
            {drawnCards.length > 0 && flippedCount === drawnCards.length && onShareTarotReading && (
              <div className="flex items-center justify-center gap-2 pt-1 animate-fadeIn">
                <button
                  onClick={() => onShareTarotReading(tarotQuestion || "General Reading", drawnCards)}
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
              disabled={!isDigitalReady}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 font-google-sans border ${
                isDigitalReady
                  ? 'bg-black text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10 shadow-[0_0_15px_rgba(220,20,60,0.25)] hover:shadow-[0_0_22px_rgba(220,20,60,0.4)] cursor-pointer'
                  : 'bg-zinc-950 text-zinc-700 cursor-not-allowed border-zinc-900'
              }`}
            >
              {isDrawing ? "Drawing..." : enableFollowUp ? "DRAW (4 CARDS)" : "DRAW"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`grid gap-3 ${enableFollowUp ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
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

              {enableFollowUp && (
                <div className="flex flex-col text-left space-y-1 animate-fadeIn">
                  <span className="text-[8.5px] uppercase tracking-widest font-bold text-zinc-400 font-google-sans">OUTCOME &amp; RESOLUTIONS</span>
                  <select
                    value={physicalFollowUpCard}
                    onChange={(e) => setPhysicalFollowUpCard(e.target.value)}
                    disabled={isDrawing}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 outline-none w-full font-google-sans focus:border-[#DC143C] cursor-pointer"
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
              )}
            </div>

            <button
              onClick={handlePhysicalSynthesis}
              disabled={!isPhysicalReady}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 font-google-sans border ${
                isPhysicalReady
                  ? 'bg-black text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10 shadow-[0_0_15px_rgba(220,20,60,0.25)] hover:shadow-[0_0_22px_rgba(220,20,60,0.4)] cursor-pointer'
                  : 'bg-zinc-950 text-zinc-700 cursor-not-allowed border-zinc-900'
              }`}
            >
              {isDrawing ? "Synthesizing Reading..." : enableFollowUp ? "Synthesize 4-Card Spread" : "Synthesize Spread"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

