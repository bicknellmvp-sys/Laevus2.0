import React, { useState } from 'react';
import { TarotCardData } from '../data/tarotData';

export interface TarotCardProps {
  card: TarotCardData;
  isReversed?: boolean;
  onSelect?: (card: TarotCardData) => void;
}

export const TarotCard: React.FC<TarotCardProps> = ({ card, isReversed = false, onSelect }) => {
  const [flipped, setFlipped] = useState(false);

  const uprightList = card.uprightKeywords && card.uprightKeywords.length > 0 
    ? card.uprightKeywords 
    : (card.keywords && card.keywords.length > 0 ? card.keywords : [card.description]);

  const reversedList = card.reversedKeywords && card.reversedKeywords.length > 0
    ? card.reversedKeywords
    : [card.reversedMeaning || "Blocked energy, internal resistance, shadow integration"];

  const symbolismText = card.symbolism || card.description || card.meaning;

  return (
    <div className="flex flex-col items-center gap-4 max-w-sm mx-auto p-4 select-none">
      {/* Card Body */}
      <div
        onClick={() => {
          setFlipped(!flipped);
          if (onSelect) onSelect(card);
        }}
        className={`relative w-72 h-[480px] bg-[#131313] border-2 border-[#dc143c] rounded-xl p-4 shadow-2xl cursor-pointer transition-transform duration-500 transform ${
          isReversed ? 'rotate-180' : ''
        } hover:scale-[1.02] group`}
      >
        {/* Inner Decorative Border */}
        <div className="w-full h-full border border-[#e0e0e0]/40 rounded-lg flex flex-col justify-between p-4 relative overflow-hidden bg-zinc-950/80">
          
          {/* Top Header: Roman Numeral / Card Number & Astrology/Suit Badge */}
          <div className="flex items-center justify-between z-10">
            <span className="font-['Bodoni_Moda'] text-[#dc143c] tracking-widest text-lg font-bold">
              {card.number}
            </span>
            <span className="text-[10px] uppercase font-['Inter'] tracking-wider text-zinc-400 bg-black/70 px-2 py-0.5 rounded border border-zinc-800">
              {card.arcana === 'major' ? (card.astrology || 'Major Arcana') : (card.suit || 'Minor Arcana')}
            </span>
          </div>

          {/* Central Artwork Display or Symbolism */}
          <div className="flex-1 flex flex-col items-center justify-center text-center my-2 border-y border-[#e0e0e0]/10 py-3 relative overflow-hidden rounded">
            {card.image ? (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded">
                <img
                  src={card.image}
                  alt={card.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <p className="absolute bottom-2 inset-x-2 font-['Inter'] text-[11px] text-[#e0e0e0] italic px-1 drop-shadow-md bg-black/60 py-1 rounded backdrop-blur-xs line-clamp-2">
                  {symbolismText}
                </p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full border border-[#dc143c] flex items-center justify-center mb-3 bg-black/50 shadow-[0_0_15px_rgba(220,20,60,0.2)]">
                  <span className="text-[#dc143c] text-xs font-mono font-bold">
                    {card.arcana === 'major' ? 'ARCANA' : 'SUIT'}
                  </span>
                </div>
                <p className="font-['Inter'] text-xs text-[#e0e0e0]/80 italic px-2">
                  {symbolismText}
                </p>
              </>
            )}
          </div>

          {/* Bottom Footer: Card Title */}
          <div className="text-center pt-2 border-t border-[#dc143c]/50 z-10">
            <h2 className="font-['Bodoni_Moda'] text-[#e0e0e0] font-bold text-lg uppercase tracking-wider">
              {card.name}
            </h2>
            {card.suit && card.suit !== 'major' && (
              <p className="font-['Inter'] text-[11px] text-[#dc143c] tracking-widest uppercase mt-0.5 font-medium">
                Suit of {card.suit}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Meanings & Keywords Display */}
      <div className="w-full bg-[#131313] border border-[#e0e0e0]/20 rounded-lg p-4 font-['Inter'] text-[#e0e0e0] text-sm shadow-lg">
        <div className="mb-3">
          <span className="text-[#dc143c] font-semibold text-xs uppercase tracking-wider block mb-1">
            Upright Meaning & Keywords:
          </span>
          <p className="text-xs text-zinc-300 mb-1.5 leading-relaxed">{card.meaning}</p>
          <p className="text-[#e0e0e0]/90 text-xs font-mono">{uprightList.join(' • ')}</p>
        </div>
        <div className="pt-2 border-t border-zinc-900">
          <span className="text-[#dc143c]/80 font-semibold text-xs uppercase tracking-wider block mb-1">
            Reversed Meaning & Shadow:
          </span>
          <p className="text-xs text-zinc-400 mb-1.5 leading-relaxed">{card.reversedMeaning}</p>
          <p className="text-[#e0e0e0]/60 text-xs font-mono">{reversedList.join(' • ')}</p>
        </div>
      </div>
    </div>
  );
};
export default TarotCard;
