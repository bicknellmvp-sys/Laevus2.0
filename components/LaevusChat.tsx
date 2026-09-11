import React, { useState, useEffect, useRef, useMemo } from 'react';
import { metaphysicalConsultation } from '../services/gemini';
import { voiceEngine } from '../services/voiceSynthesis';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { TarotEncyclopedia } from './TarotEncyclopedia';
import { DivinationHub } from './DivinationHub';
import { AccountHub, TranscriptRecord } from './AccountHub';
import { SocialShareModal, ShareContent } from './SocialShareModal';
import { TAROT_DATABASE, TarotCardData as UniversalTarotCardData } from '../data/tarotCards';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  mode?: 'laevus' | 'tarot' | 'tarot-persona' | 'tarot-physical';
}

interface TarotCard {
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

// Helper: Typing/Typewriter Effect for Snappy & Cinematic responses
interface Particle {
  id: number;
  char: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛉ", "ᛋ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];

const RunicSigilOverlay: React.FC<{ text: string; isDone: boolean }> = ({ text, isDone }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastLen = useRef(0);
  const particleId = useRef(0);

  useEffect(() => {
    const currentLen = text.length;
    if (currentLen > lastLen.current && !isDone) {
      const count = Math.min(2, currentLen - lastLen.current);
      const newParticles: Particle[] = [];
      
      for (let i = 0; i < count; i++) {
        const randomRune = RUNES[Math.floor(Math.random() * RUNES.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 45;
        const x = 100 + Math.cos(angle) * dist;
        const y = 100 + Math.sin(angle) * dist;
        
        newParticles.push({
          id: particleId.current++,
          char: randomRune,
          x,
          y,
          scale: 0.6 + Math.random() * 0.5,
          rotation: Math.random() * 360,
        });
      }
      
      setParticles(prev => [...prev, ...newParticles].slice(-12));
    }
    lastLen.current = currentLen;
  }, [text, isDone]);

  useEffect(() => {
    if (isDone) {
      const timer = setTimeout(() => {
        setParticles([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDone]);

  const getSigilPoints = () => {
    const points: { x: number; y: number }[] = [];
    const maxPoints = 8;
    const radius = 52;
    const cx = 100;
    const cy = 100;

    const sampleText = text.slice(-16);
    if (!sampleText) return points;

    for (let i = 0; i < Math.min(sampleText.length, maxPoints); i++) {
      const charCode = sampleText.charCodeAt(i) || 0;
      const angle = ((charCode % 12) / 12) * Math.PI * 2 + (i / maxPoints) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      points.push({ x, y });
    }
    return points;
  };

  const points = getSigilPoints();
  
  let pathD = '';
  if (points.length > 1) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
  }

  const ringRunes: { char: string; x: number; y: number; angle: number }[] = [];
  const numRingRunes = 16;
  const ringRadius = 72;
  for (let i = 0; i < numRingRunes; i++) {
    const angle = (i / numRingRunes) * Math.PI * 2;
    const x = 100 + Math.cos(angle) * ringRadius;
    const y = 100 + Math.sin(angle) * ringRadius;
    const runeIndex = (i + text.length) % RUNES.length;
    ringRunes.push({ 
      char: RUNES[runeIndex], 
      x, 
      y, 
      angle: (angle * 180) / Math.PI + 90 
    });
  }

  return (
    <div className={`absolute -right-2 -bottom-2 w-24 h-24 sm:w-28 sm:h-28 pointer-events-none transition-opacity duration-1000 select-none z-0 ${
      isDone ? 'opacity-[0.06] hover:opacity-[0.15]' : 'opacity-35 animate-pulse-slow'
    }`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.03); }
        }
        @keyframes rune-float {
          0% {
            transform: translateY(12px) scale(0.5);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateY(-35px) scale(1.2);
            opacity: 0;
          }
        }

        .animate-spin-slow {
          animation: spin-slow 22s linear infinite;
          transform-origin: 100px 100px;
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 26s linear infinite;
          transform-origin: 100px 100px;
        }
        .animate-spin-extremely-slow {
          animation: spin-slow 85s linear infinite;
          transform-origin: 100px 100px;
        }
        .animate-spin-extremely-slow-reverse {
          animation: spin-slow-reverse 105s linear infinite;
          transform-origin: 100px 100px;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3.5s ease-in-out infinite;
        }
        .animate-rune-float {
          animation: rune-float 1.3s ease-out forwards;
        }
      `}} />

      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full text-[#DC143C]"
        style={{ filter: 'drop-shadow(0 0 5px rgba(220,20,60,0.45))' }}
      >
        <defs>
          <filter id="sigil-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle 
          cx="100" 
          cy="100" 
          r="80" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.75" 
          strokeDasharray="4 6" 
          className={isDone ? 'animate-spin-extremely-slow' : 'animate-spin-slow'}
        />
        <circle 
          cx="100" 
          cy="100" 
          r="64" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.5" 
          strokeDasharray="12 4 2 4"
          className={isDone ? 'animate-spin-extremely-slow-reverse' : 'animate-spin-slow-reverse'}
        />
        <circle 
          cx="100" 
          cy="100" 
          r="42" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.5" 
          strokeOpacity="0.4"
        />

        <g className={isDone ? 'animate-spin-extremely-slow' : 'animate-spin-slow'}>
          {ringRunes.map((r, idx) => (
            <text
              key={idx}
              x={r.x}
              y={r.y}
              transform={`rotate(${r.angle}, ${r.x}, ${r.y})`}
              className="text-[8px] font-mono font-bold fill-current"
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={0.75}
            >
              {r.char}
            </text>
          ))}
        </g>

        {pathD && (
          <path 
            d={pathD} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.2" 
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#sigil-glow)"
            className="transition-all duration-300"
            opacity={0.9}
          />
        )}

        {points.map((p, idx) => (
          <line
            key={idx}
            x1="100"
            y1="100"
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="1 3"
            opacity={0.5}
          />
        ))}

        <g transform="translate(100, 100) scale(0.65)" opacity={0.85}>
          <path 
            d="M -18,0 C -9,-10 9,-10 18,0 C 9,10 -9,10 -18,0 Z" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1" 
          />
          <circle 
            cx="0" 
            cy="0" 
            r="4.5" 
            fill="currentColor" 
            filter="url(#sigil-glow)" 
          />
        </g>

        {particles.map((p) => (
          <text
            key={p.id}
            x={p.x}
            y={p.y}
            transform={`rotate(${p.rotation}, ${p.x}, ${p.y}) scale(${p.scale})`}
            className="text-[9px] font-mono fill-current animate-rune-float"
            textAnchor="middle"
            dominantBaseline="middle"
            filter="url(#sigil-glow)"
          >
            {p.char}
          </text>
        ))}
      </svg>
    </div>
  );
};

const autoLinkSupplies = (inputText: string): string => {
  let result = inputText;
  
  const replacements = [
    {
      pattern: /(?<!\[)(?:the )?cyber-spiritual scrying deck(?!\])/gi,
      replacement: '[The Cyber-Spiritual Scrying Deck](https://theleft.one/products/scrying-deck)'
    },
    {
      pattern: /(?<!\[)(?:the )?left-hand portal mirror(?!\])/gi,
      replacement: '[The Left-Hand Portal Mirror](https://theleft.one/products/portal-mirror)'
    },
    {
      pattern: /(?<!\[)sovereign aura cleanser(?!\])/gi,
      replacement: '[Sovereign Aura Cleanser](https://theleft.one/products/aura-cleanser)'
    },
    {
      pattern: /(?<!\[)obsidian keyboard talisman(?!\])/gi,
      replacement: '[Obsidian Keyboard Talisman](https://theleft.one/products/keyboard-talisman)'
    },
    {
      pattern: /(?<!\[)metaphysical circuit board patch(?!\])/gi,
      replacement: '[Metaphysical Circuit Board Patch](https://theleft.one/products/circuit-board-patch)'
    },
    {
      pattern: /(?<!\[)(?:the )?digital seance candle(?!\])/gi,
      replacement: '[The Digital Seance Candle](https://theleft.one/products/seance-candle)'
    },
    {
      pattern: /(?<!\[)seance candle(?!\])/gi,
      replacement: '[The Digital Seance Candle](https://theleft.one/products/seance-candle)'
    },
    {
      pattern: /(?<!\[)portal mirror(?!\])/gi,
      replacement: '[The Left-Hand Portal Mirror](https://theleft.one/products/portal-mirror)'
    },
    {
      pattern: /(?<!\[)aura cleanser(?!\])/gi,
      replacement: '[Sovereign Aura Cleanser](https://theleft.one/products/aura-cleanser)'
    },
    {
      pattern: /(?<!\[)keyboard talisman(?!\])/gi,
      replacement: '[Obsidian Keyboard Talisman](https://theleft.one/products/keyboard-talisman)'
    },
    {
      pattern: /(?<!\[)scrying deck(?!\])/gi,
      replacement: '[The Cyber-Spiritual Scrying Deck](https://theleft.one/products/scrying-deck)'
    },
    {
      pattern: /(?<!\[)circuit board patch(?!\])/gi,
      replacement: '[Metaphysical Circuit Board Patch](https://theleft.one/products/circuit-board-patch)'
    },
    {
      pattern: /(?<!\[)theleft\.one(?!\])/gi,
      replacement: '[theleft.one](https://theleft.one)'
    }
  ];

  for (const r of replacements) {
    result = result.replace(r.pattern, r.replacement);
  }

  return result;
};

interface TextToken {
  type: 'text' | 'link';
  text: string;
  url?: string;
}

const parseTokens = (text: string): TextToken[] => {
  const tokens: TextToken[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)|(https?:\/\/[^\s\),]+)/g;
  let match;
  let lastIndex = 0;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', text: text.substring(lastIndex, match.index) });
    }
    if (match[1] && match[2]) {
      tokens.push({ type: 'link', text: match[1], url: match[2] });
    } else if (match[3]) {
      let rawUrl = match[3];
      let trailing = '';
      if (/[.,;!?]$/.test(rawUrl)) {
        trailing = rawUrl.slice(-1);
        rawUrl = rawUrl.slice(0, -1);
      }
      tokens.push({ type: 'link', text: rawUrl, url: rawUrl });
      if (trailing) {
        tokens.push({ type: 'text', text: trailing });
      }
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', text: text.substring(lastIndex) });
  }
  return tokens;
};

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const processedText = useMemo(() => autoLinkSupplies(text), [text]);
  const tokens = useMemo(() => parseTokens(processedText), [processedText]);

  const renderedElements = useMemo(() => {
    return tokens.map((token, idx) => {
      if (token.type === 'link') {
        return (
          <a 
            key={`typewriter-link-${idx}`} 
            href={token.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[#DC143C] hover:underline font-bold transition-all relative z-20 inline-flex items-center gap-0.5"
          >
            {token.text}
          </a>
        );
      } else {
        return <span key={`typewriter-text-${idx}`}>{token.text}</span>;
      }
    });
  }, [tokens]);

  return (
    <div className="relative group flex flex-col w-full pr-10">
      <RunicSigilOverlay text={processedText} isDone={true} />
      <p className="whitespace-pre-wrap font-google-sans leading-relaxed relative z-10">{renderedElements}</p>
    </div>
  );
};

interface LaevusChatProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isPremium: boolean;
  setIsPremium: React.Dispatch<React.SetStateAction<boolean>>;
  freeQuestionsCount: number;
  setFreeQuestionsCount: React.Dispatch<React.SetStateAction<number>>;
  showUpgradeModal: boolean;
  setShowUpgradeModal: React.Dispatch<React.SetStateAction<boolean>>;
  onRegisterClearHistory?: (handler: () => void) => void;
  currentUser: User | null;
  onOpenAuth: (registerMode: boolean) => void;
}

export const LaevusChat: React.FC<LaevusChatProps> = ({
  activeView,
  setActiveView,
  onRegisterClearHistory,
  currentUser,
  onOpenAuth
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [readingCount, setReadingCount] = useState<number>(0);
  
  const [activeTarotPersona, setActiveTarotPersona] = useState<string | null>(null);
  
  // Tarot State
  const [tarotQuestion, setTarotQuestion] = useState('');
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [flippedCount, setFlippedCount] = useState(0);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [tarotMode, setTarotMode] = useState<'digital' | 'physical'>('digital');
  const [physicalPastCard, setPhysicalPastCard] = useState<string>('');
  const [physicalPresentCard, setPhysicalPresentCard] = useState<string>('');
  const [physicalFutureCard, setPhysicalFutureCard] = useState<string>('');

  // Stats / Streak states
  const [streakCount, setStreakCount] = useState(1);
  const [daysRegistered, setDaysRegistered] = useState(1);

  // Sentiment Analysis and Transcripts state
  const [sentimentScores, setSentimentScores] = useState<number[]>([35, 45, 40, 60, 50]);
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);

  // Social Share & Copy state
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareContent, setShareContent] = useState<ShareContent | null>(null);

  const handleCopyText = async (text: string, id?: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      if (id) {
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
      }
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleShareOracleMessage = (text: string) => {
    setShareContent({
      title: 'Oracle Guidance • LAEVUS',
      text: `Oracle Reflection from LAEVUS:\n"${text.length > 280 ? text.substring(0, 280) + '...' : text}"`,
      category: 'oracle'
    });
    setShareModalOpen(true);
  };

  const handleShareTarotReading = (question: string, cards: TarotCard[]) => {
    const cardsSummary = cards.map(c => `${c.position}: ${c.name}`).join(' | ');
    setShareContent({
      title: 'Tarot Divination • LAEVUS',
      text: `My Tarot Reading on LAEVUS:\nQuestion: "${question || 'Personal guidance'}"\nCards: ${cardsSummary}`,
      category: 'tarot'
    });
    setShareModalOpen(true);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentUserRef = useRef<User | null>(null);
  const activeTarotPersonaRef = useRef<string | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    activeTarotPersonaRef.current = activeTarotPersona;
  }, [activeTarotPersona]);

  // Mount logic: Load statistics, streak, and default welcome phrases
  useEffect(() => {
    const savedReadings = localStorage.getItem('laevus_readings_count_v1');
    if (savedReadings) {
      setReadingCount(parseInt(savedReadings, 10) || 0);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let joinedDateStr = localStorage.getItem('laevus_vessel_joined_date');
    if (!joinedDateStr) {
      joinedDateStr = new Date().toISOString();
      localStorage.setItem('laevus_vessel_joined_date', joinedDateStr);
    }

    const joinedDate = new Date(joinedDateStr);
    const todayDate = new Date(todayStr);
    const diffTime = Math.abs(todayDate.getTime() - joinedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    setDaysRegistered(diffDays);

    const lastActive = localStorage.getItem('laevus_vessel_last_active_date');
    let currentStreak = parseInt(localStorage.getItem('laevus_vessel_streak_count') || '1', 10);

    if (lastActive) {
      const lastActiveDate = new Date(lastActive);
      const diffSinceLastActive = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffSinceLastActive === 1) {
        currentStreak += 1;
        localStorage.setItem('laevus_vessel_streak_count', currentStreak.toString());
      } else if (diffSinceLastActive > 1) {
        currentStreak = 1;
        localStorage.setItem('laevus_vessel_streak_count', '1');
      }
    } else {
      localStorage.setItem('laevus_vessel_streak_count', '1');
    }
    setStreakCount(currentStreak);
    localStorage.setItem('laevus_vessel_last_active_date', todayStr);

    const savedSentiment = localStorage.getItem('laevus_sentiment_timeline');
    if (savedSentiment) {
      try {
        setSentimentScores(JSON.parse(savedSentiment));
      } catch (e) {}
    }

    const savedTranscripts = localStorage.getItem('laevus_transcripts_v1');
    if (savedTranscripts) {
      try {
        setTranscripts(JSON.parse(savedTranscripts));
      } catch (e) {}
    }

    const savedChat = localStorage.getItem('laevus_chat_history_v3');
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (e) {
        loadDefaultWelcome();
      }
    } else {
      loadDefaultWelcome();
    }
  }, []);

  // Sync with Firestore on user login
  useEffect(() => {
    const syncUserHistory = async () => {
      if (!currentUser) return;
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          if (cloudData.messages && cloudData.messages.length > 0) {
            setMessages(cloudData.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })));
          }
          if (cloudData.transcripts && cloudData.transcripts.length > 0) {
            setTranscripts(cloudData.transcripts);
            localStorage.setItem('laevus_transcripts_v1', JSON.stringify(cloudData.transcripts));
          }
          if (cloudData.sentimentScores && cloudData.sentimentScores.length > 0) {
            setSentimentScores(cloudData.sentimentScores);
            localStorage.setItem('laevus_sentiment_timeline', JSON.stringify(cloudData.sentimentScores));
          }
        } else {
          const savedLocal = localStorage.getItem('laevus_chat_history_v3');
          const savedTransLocal = localStorage.getItem('laevus_transcripts_v1');
          const savedSentimentLocal = localStorage.getItem('laevus_sentiment_timeline');

          let initialMessages: any[] = [];
          let initialTranscripts: any[] = [];
          let initialSentiment: number[] = [35, 45, 40, 60, 50];

          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              initialMessages = parsed.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp).toISOString()
              }));
            } catch (e) {}
          }

          if (savedTransLocal) {
            try {
              initialTranscripts = JSON.parse(savedTransLocal);
            } catch (e) {}
          }

          if (savedSentimentLocal) {
            try {
              initialSentiment = JSON.parse(savedSentimentLocal);
            } catch (e) {}
          }

          await setDoc(userDocRef, {
            email: currentUser.email,
            uid: currentUser.uid,
            messages: initialMessages,
            transcripts: initialTranscripts,
            sentimentScores: initialSentiment,
            lastLoginAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (err) {
        console.error("Firestore sync failed:", err);
      }
    };

    syncUserHistory();
  }, [currentUser]);

  // Sync transcripts with Firestore when active
  useEffect(() => {
    if (currentUser && transcripts.length > 0) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      setDoc(userDocRef, { transcripts }, { merge: true }).catch(err => {
        console.error("Failed to mirror transcripts to cloud:", err);
      });
    }
  }, [transcripts, currentUser]);

  // Sync sentiment scores with Firestore when active
  useEffect(() => {
    if (currentUser && sentimentScores.length > 0) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      setDoc(userDocRef, { sentimentScores }, { merge: true }).catch(err => {
        console.error("Failed to mirror sentiment scores to cloud:", err);
      });
    }
  }, [sentimentScores, currentUser]);

  // Register the clear history callback so parent dropdown can trigger it
  useEffect(() => {
    if (onRegisterClearHistory) {
      onRegisterClearHistory(async () => {
        localStorage.removeItem('laevus_chat_history_v3');
        localStorage.removeItem('laevus_transcripts_v1');
        localStorage.removeItem('laevus_sentiment_timeline');
        setTranscripts([]);
        setSentimentScores([35, 45, 40, 60, 50]);
        const currUser = currentUserRef.current;
        if (currUser) {
          try {
            const userDocRef = doc(db, 'users', currUser.uid);
            await setDoc(userDocRef, { messages: [], transcripts: [], sentimentScores: [] }, { merge: true });
          } catch (err) {
            console.error("Failed to clear Firestore history:", err);
          }
        }
        loadDefaultWelcome();
      });
    }
  }, [onRegisterClearHistory]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('laevus_chat_history_v3', JSON.stringify(messages));
      
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const serialized = messages.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString()
        }));
        setDoc(userDocRef, { messages: serialized }, { merge: true }).catch(err => {
          console.error("Failed to mirror messages to Firestore:", err);
        });
      }
    }
  }, [messages, currentUser]);

  useEffect(() => {
    if (activeView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, activeView]);

  const loadDefaultWelcome = () => {
    const WELCOME_PHRASES = [
      "Welcome. Take a breath and make yourself comfortable. What's on your mind today?",
      "Good to see you. Pull up a chair and let me know what you'd like clarity or insight on.",
      "Welcome to LAEVUS. Whether you have questions about personal growth, work, relationships, or decisions ahead, I'm here to listen and help you talk it through. What are you working through right now?",
      "Welcome back. Take your time, clear your head, and let's explore whatever questions or thoughts you've brought with you today."
    ];

    let indexStr = sessionStorage.getItem('laevus_welcome_index');
    let idx = 0;
    if (indexStr === null) {
      idx = Math.floor(Math.random() * WELCOME_PHRASES.length);
      sessionStorage.setItem('laevus_welcome_index', idx.toString());
    } else {
      idx = parseInt(indexStr, 10);
      if (isNaN(idx) || idx < 0 || idx >= WELCOME_PHRASES.length) {
        idx = 0;
      }
    }

    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: WELCOME_PHRASES[idx],
        timestamp: new Date()
      }
    ]);
  };

  const computeSentiment = (text: string): number => {
    const positiveWords = ['love', 'light', 'peace', 'happy', 'healing', 'harmony', 'growth', 'joy', 'blessed', 'wisdom', 'angels', 'serene', 'elevate', 'spirit', 'revelation', 'guide', 'future'];
    const negativeWords = ['sad', 'dark', 'pain', 'anger', 'hate', 'death', 'fear', 'broken', 'lost', 'shadow', 'trapped', 'bound', 'chaos', 'tower', 'devil', 'hell', 'suffering'];
    
    let score = 50;
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(w => {
      const cleanWord = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      if (positiveWords.includes(cleanWord)) score += 12;
      if (negativeWords.includes(cleanWord)) score -= 12;
    });
    return Math.max(15, Math.min(85, score));
  };

  const addTranscriptRecord = (
    category: 'tarot' | 'madam',
    title: string,
    content: string,
    extraFields?: {
      querentPrompt?: string;
      drawnCards?: TarotCard[];
      madamBlavatskyReply?: string;
    }
  ) => {
    const newRecord: TranscriptRecord = {
      id: crypto.randomUUID(),
      category,
      title,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      content,
      ...extraFields
    };
    const updated = [newRecord, ...transcripts];
    setTranscripts(updated);
    localStorage.setItem('laevus_transcripts_v1', JSON.stringify(updated));
  };

  const handleSend = async (textToSend: string, forceMode?: 'laevus' | 'tarot' | 'tarot-persona' | 'tarot-physical', customCards?: TarotCard[]) => {
    if (!textToSend.trim() && !customCards) return;
    if (isTyping) return;

    let currentMode = forceMode || (activeTarotPersona ? 'tarot-persona' : 'laevus');
    let trimmedText = textToSend.trim();

    // Support auto-detecting [MODE 1] Card: <Name>. User Question: <Question>
    const mode1Match = trimmedText.match(/^\[MODE\s*1\]\s*Card:\s*(.+?)\.\s*User\s*Question:\s*(.+)$/i);
    if (mode1Match && !forceMode) {
      const parsedCardName = mode1Match[1].trim();
      const questionText = mode1Match[2].trim();

      const cardExists = TAROT_DECK.some(c => c.name.toLowerCase() === parsedCardName.toLowerCase());
      const normalizedCardName = cardExists 
        ? (TAROT_DECK.find(c => c.name.toLowerCase() === parsedCardName.toLowerCase())?.name || parsedCardName)
        : parsedCardName;

      setActiveTarotPersona(normalizedCardName);
      currentMode = 'tarot-persona';
      trimmedText = questionText;

      const summonMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: `[ Embodied the live archetype of ${normalizedCardName.toUpperCase()} ]\n\nI have aligned my energy with this physical layer. Ask me of my secrets or seek my guidance.`,
        timestamp: new Date(),
        mode: 'tarot-persona'
      };

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        text: questionText,
        timestamp: new Date(),
        mode: 'tarot-persona'
      };

      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `You have crossed the threshold. Speak directly to the living soul of ${normalizedCardName}.`,
          timestamp: new Date(),
          mode: 'tarot-persona'
        },
        summonMsg,
        userMsg
      ]);
      setInput('');
      setIsTyping(true);

      const nextCount = readingCount + 1;
      setReadingCount(nextCount);
      localStorage.setItem('laevus_readings_count_v1', nextCount.toString());

      const score = computeSentiment(questionText);
      const newScores = [...sentimentScores, score];
      setSentimentScores(newScores);
      localStorage.setItem('laevus_sentiment_timeline', JSON.stringify(newScores));

      try {
        const reply = await metaphysicalConsultation(
          questionText,
          [],
          {
            mode: 'tarot-persona',
            personaCardName: normalizedCardName,
            readingCount: nextCount
          }
        );

        const modelMsg: Message = {
          id: crypto.randomUUID(),
          role: 'model',
          text: reply,
          timestamp: new Date(),
          mode: 'tarot-persona'
        };

        setMessages(prev => [...prev, modelMsg]);
        voiceEngine.speak(reply);

        addTranscriptRecord(
          'madam',
          `Conversed with ${normalizedCardName}`,
          `User: ${questionText}\n\n${normalizedCardName}: ${reply}`,
          {
            querentPrompt: questionText,
            madamBlavatskyReply: reply
          }
        );
      } catch (err) {
        console.error(err);
        const errText = "An error occurred with the AI service. Please verify that your GEMINI_API_KEY environment variable is configured correctly.";
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'model',
          text: errText,
          timestamp: new Date()
        }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    const nextCount = readingCount + 1;
    setReadingCount(nextCount);
    localStorage.setItem('laevus_readings_count_v1', nextCount.toString());

    const score = computeSentiment(trimmedText);
    const newScores = [...sentimentScores, score];
    setSentimentScores(newScores);
    localStorage.setItem('laevus_sentiment_timeline', JSON.stringify(newScores));

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmedText || (currentMode === 'tarot-physical' ? `Synthesize Tarot: "${tarotQuestion || "General alignment"}"` : `Draw Tarot: "${tarotQuestion || "General life alignment"}"`),
      timestamp: new Date(),
      mode: currentMode
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const formattedHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      let reply = "";
      if (currentMode === 'tarot' && customCards) {
        reply = await metaphysicalConsultation(
          `Tailor a 3-card reading for my question: "${tarotQuestion || "My spiritual destiny"}"`,
          formattedHistory,
          {
            mode: 'tarot',
            tarotCards: customCards,
            tarotQuestion: tarotQuestion || "General alignment",
            readingCount: nextCount
          }
        );
      } else if (currentMode === 'tarot-physical' && customCards) {
        reply = await metaphysicalConsultation(
          `Synthesize a Physical Realm Three-Card reading for my question: "${tarotQuestion || "General life alignment"}"`,
          formattedHistory,
          {
            mode: 'tarot-physical',
            tarotCards: customCards,
            tarotQuestion: tarotQuestion || "General alignment",
            readingCount: nextCount
          }
        );
      } else if (currentMode === 'tarot-persona' && activeTarotPersona) {
        reply = await metaphysicalConsultation(
          trimmedText,
          formattedHistory,
          {
            mode: 'tarot-persona',
            personaCardName: activeTarotPersona,
            readingCount: nextCount
          }
        );
      } else {
        reply = await metaphysicalConsultation(
          trimmedText,
          formattedHistory,
          {
            mode: 'laevus',
            readingCount: nextCount
          }
        );
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      const modelMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: reply,
        timestamp: new Date(),
        mode: currentMode
      };

      setMessages(prev => [...prev, modelMsg]);
      voiceEngine.speak(reply);

      // Save to transcripts
      if ((currentMode === 'tarot' || currentMode === 'tarot-physical') && customCards) {
        const cardsDesc = customCards.map(c => `[${c.position}] ${c.symbol} ${c.name} - ${c.meaning}`).join('\n');
        addTranscriptRecord(
          'tarot',
          `${currentMode === 'tarot-physical' ? 'Physical Synthesis' : 'Digital Draw'}: ${tarotQuestion || 'Life Alignment'}`,
          `Question: ${tarotQuestion}\n\nCards Drawn:\n${cardsDesc}\n\nInterpretation:\n${reply}`,
          {
            querentPrompt: tarotQuestion || "General alignment",
            drawnCards: customCards,
            madamBlavatskyReply: reply
          }
        );
      } else if (currentMode === 'tarot-persona' && activeTarotPersona) {
        addTranscriptRecord(
          'madam',
          `Conversed with ${activeTarotPersona}`,
          `User: ${trimmedText}\n\n${activeTarotPersona}: ${reply}`,
          {
            querentPrompt: trimmedText,
            madamBlavatskyReply: reply
          }
        );
      } else {
        addTranscriptRecord(
          'madam',
          `Consultation with Madame Blavatsky`,
          `User: ${trimmedText}\n\nBlavatsky: ${reply}`,
          {
            querentPrompt: trimmedText,
            madamBlavatskyReply: reply
          }
        );
      }

    } catch (err) {
      console.error(err);
      const errText = "An error occurred with the AI service. Please verify that your GEMINI_API_KEY environment variable is configured correctly.";
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        text: errText,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cardParam = params.get('card');
    const questionParam = params.get('question');
    
    if (cardParam && questionParam) {
      const timer = setTimeout(() => {
        handleSend(`Card: ${cardParam}. User Question: ${questionParam}`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSummonTarotPersona = (cardName: string) => {
    setActiveTarotPersona(cardName);
    const summonMsg: Message = {
      id: crypto.randomUUID(),
      role: 'model',
      text: `[ Embodied the live archetype of ${cardName.toUpperCase()} ]\n\nI have aligned my energy with this physical layer. Ask me of my secrets or seek my guidance.`,
      timestamp: new Date(),
      mode: 'tarot-persona'
    };
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: `You have crossed the threshold. Speak directly to the living soul of ${cardName}.`,
        timestamp: new Date(),
        mode: 'tarot-persona'
      },
      summonMsg
    ]);
    setActiveView('chat');
  };

  const handleReleaseTarotPersona = () => {
    if (!activeTarotPersona) return;
    const releaseMsg: Message = {
      id: crypto.randomUUID(),
      role: 'model',
      text: `[ Ended session with ${activeTarotPersona}. LAEVUS returns as your primary guide. ]`,
      timestamp: new Date(),
      mode: 'laevus'
    };
    setActiveTarotPersona(null);
    setMessages(prev => [...prev, releaseMsg]);
  };

  const handleStartEncyclopediaConversation = (cardName: string, questionText: string) => {
    handleSummonTarotPersona(cardName);
    if (questionText.trim()) {
      setTimeout(() => {
        handleSend(questionText, 'tarot-persona');
      }, 500);
    }
  };

  const handleDrawTarot = async () => {
    if (!tarotQuestion.trim()) {
      alert("Please define the question you wish the cards to answer.");
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
      await new Promise(res => setTimeout(res, 600));
      setFlippedCount(i);
    }

    await new Promise(res => setTimeout(res, 400));
    setIsDrawing(false);
    setActiveView('chat');
    
    handleSend(`Perform a tailored Tarot reading regarding: "${tarotQuestion}"`, 'tarot', drawn);
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
    setFlippedCount(0);
    setDrawnCards([]);

    setDrawnCards(physicalCards);

    for (let i = 1; i <= 3; i++) {
      await new Promise(res => setTimeout(res, 500));
      setFlippedCount(i);
    }

    await new Promise(res => setTimeout(res, 400));
    setIsDrawing(false);
    setActiveView('chat');

    handleSend(`Perform a Physical Realm Synthesis reading regarding: "${tarotQuestion}"`, 'tarot-physical', physicalCards);
    setTarotQuestion('');
    setPhysicalPastCard('');
    setPhysicalPresentCard('');
    setPhysicalFutureCard('');
  };

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-1 flex-1 min-h-0 h-full flex flex-col relative font-google-sans text-zinc-300 overflow-hidden">

      {/* VIEW: PRIMARY ORACLE CHAT */}
      {activeView === 'chat' && (
        <div className="flex-1 min-h-0 flex flex-col p-1 mb-2 relative animate-fadeIn w-full max-w-3xl mx-auto overflow-hidden font-google-sans">
          
          {/* Active Tarot Persona Banner */}
          {activeTarotPersona && (
            <div className="px-4 py-2 bg-zinc-950 flex items-center justify-between text-xs mb-2 rounded-lg border border-amber-500/25 flex-shrink-0 font-google-sans text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.04)]">
              <div className="flex items-center gap-3">
                <span className="text-sm">🃏</span>
                <div className="font-google-sans text-left">
                  <div className="flex items-center">
                    <span className="font-bold text-zinc-200 font-google-sans">{activeTarotPersona} Persona</span>
                    <span className="mx-2 text-zinc-700">|</span>
                    <span className="text-zinc-500 text-[10px] font-google-sans">Living archetype of the Major Arcana</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleReleaseTarotPersona}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 text-amber-400 text-[9px] uppercase hover:bg-amber-500/10 transition-colors cursor-pointer border border-transparent font-google-sans"
              >
                ✕
                <span className="font-google-sans">Depart</span>
              </button>
            </div>
          )}

          {/* Messages Ledger */}
          <div className="flex-1 py-2 overflow-y-auto space-y-3 border-b border-zinc-900/40 min-h-0">
            {messages.map((m) => {
               const isUser = m.role === 'user';
               return (
                 <div 
                   key={m.id}
                   className={`flex flex-col ${isUser ? 'max-w-[85%] ml-auto items-end' : 'w-full mr-auto items-start'}`}
                 >
                   <span className="text-[8px] text-zinc-500 mb-1 px-1 tracking-wider uppercase font-google-sans">
                     {isUser ? 'YOU' : activeTarotPersona ? activeTarotPersona.toUpperCase() : 'MADAME BLAVATSKY'} • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                   <div className={`px-4 py-3 rounded-xl leading-relaxed text-xs select-text ${
                     isUser 
                       ? 'bg-zinc-900 text-[#F8F7F4]' 
                       : 'bg-zinc-950 text-[#F8F7F4] w-full border border-zinc-900/50'
                   }`}>
                     {isUser ? (
                       <p className="whitespace-pre-wrap font-google-sans">{m.text}</p>
                     ) : (
                       <TypewriterText text={m.text} />
                     )}
                   </div>

                   {/* Action buttons: Copy & Share */}
                   <div className="flex items-center gap-1.5 mt-1 px-1 opacity-80 hover:opacity-100 transition-opacity">
                     <button
                       onClick={() => handleCopyText(m.text, m.id)}
                       className="text-[9px] font-mono text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800"
                       title="Copy text to clipboard"
                     >
                       <span>{copiedMessageId === m.id ? '✓' : '📋'}</span>
                       <span>{copiedMessageId === m.id ? 'Copied' : 'Copy'}</span>
                     </button>
                     <button
                       onClick={() => handleShareOracleMessage(m.text)}
                       className="text-[9px] font-mono text-zinc-500 hover:text-[#DC143C] transition-colors cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800"
                       title="Share to social media"
                     >
                       <span>↗</span>
                       <span>Share</span>
                     </button>
                   </div>
                 </div>
               );
            })}
            
            {isTyping && (
              <div className="flex items-center gap-2 mr-auto bg-zinc-950 px-4 py-3 rounded-xl w-full border border-zinc-900/50">
                <span className="w-2 h-2 rounded-full bg-[#DC143C] animate-ping" />
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest animate-pulse font-google-sans">Reflecting on your thoughts...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input block */}
          <div className="pt-2 bg-transparent">
            {/* Single word mode indicator without box */}
            <div className="flex items-center justify-between pb-1 px-3 select-none">
              <span className="text-[10px] tracking-[0.2em] font-mono font-medium text-zinc-500 uppercase ml-2">
                {activeTarotPersona || activeView === 'divination' || activeView === 'tarot' || activeView === 'encyclopedia' ? 'DIVINATION' : 'ORACLE'}
              </span>
              {activeTarotPersona && (
                <button
                  onClick={handleReleaseTarotPersona}
                  className="text-[9px] tracking-widest uppercase font-mono text-zinc-500 hover:text-amber-400 hover:underline cursor-pointer"
                  title="Return to Oracle"
                >
                  Exit
                </button>
              )}
            </div>
            
            {/* Text input form */}
            <div className="relative flex items-center rounded-lg bg-zinc-950 focus-within:ring-1 focus-within:ring-[#DC143C]/40 transition-all p-1.5">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                disabled={isTyping}
                placeholder="Type your message here..."
                rows={2}
                className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none px-2.5 py-1.5 resize-none font-google-sans"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className={`p-2.5 rounded-lg transition-all ${
                  input.trim() && !isTyping
                    ? 'bg-[#DC143C] hover:bg-[#B81132] text-white cursor-pointer font-bold text-xs'
                    : 'bg-zinc-900 text-zinc-700 cursor-not-allowed text-xs'
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CONSOLIDATED DIVINATION HUB */}
      {activeView === 'divination' && (
        <DivinationHub
          onReturnToChat={() => setActiveView('chat')}
          onStartSeanceWithCard={handleStartEncyclopediaConversation}
          onLaunchThreeCardDraw={() => setActiveView('tarot')}
        />
      )}

      {/* VIEW: CONSOLIDATED ACCOUNT & INSIGHTS HUB */}
      {(activeView === 'account' || activeView === 'inner-work' || activeView === 'transcripts') && (
        <AccountHub
          initialTab={activeView === 'inner-work' ? 'inner-work' : activeView === 'transcripts' ? 'transcripts' : 'account'}
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
          onReturnToChat={() => setActiveView('chat')}
          streakCount={streakCount}
          daysRegistered={daysRegistered}
          sentimentScores={sentimentScores}
          transcripts={transcripts}
        />
      )}

      {/* VIEW: TAROT ENCYCLOPEDIA */}
      {activeView === 'encyclopedia' && (
        <TarotEncyclopedia 
          onStartSeanceWithCard={handleStartEncyclopediaConversation} 
          onReturnToChat={() => setActiveView('chat')}
        />
      )}

      {/* VIEW: 3-CARD TAROT ORACLE */}
      {activeView === 'tarot' && (
        <div className="p-3 sm:p-4 mb-2 pt-2 sm:pt-4 relative animate-fadeIn space-y-4 w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center min-h-0">
          <div className="border-b border-zinc-900/40 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[#DC143C] font-bold block font-google-sans">Tarot Sanctuary</span>
                <button
                  onClick={() => setActiveView('chat')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[9px] font-mono transition-colors uppercase cursor-pointer border border-zinc-800"
                >
                  <span className="text-[#DC143C]">←</span>
                  <span>Oracle Chat</span>
                </button>
              </div>
              <span className="text-xs text-zinc-500 block mt-0.5 font-google-sans">Invoke the guidance of the Major Arcana using digital draws or physical cards.</span>
            </div>
            
            {/* Mode Tabs */}
            <div className="flex gap-2.5 self-start bg-zinc-950 p-1 rounded-lg border border-zinc-900">
              <button
                onClick={() => setTarotMode('digital')}
                disabled={isDrawing}
                className={`px-3 py-1 text-[9px] uppercase tracking-wider font-bold rounded-md transition-all ${
                  tarotMode === 'digital'
                    ? 'bg-[#DC143C] text-white shadow-md'
                    : 'text-zinc-500 hover:text-zinc-300 cursor-pointer'
                }`}
              >
                Digital Oracle
              </button>
              <button
                onClick={() => setTarotMode('physical')}
                disabled={isDrawing}
                className={`px-3 py-1 text-[9px] uppercase tracking-wider font-bold rounded-md transition-all ${
                  tarotMode === 'physical'
                    ? 'bg-[#DC143C] text-white shadow-md'
                    : 'text-zinc-500 hover:text-zinc-300 cursor-pointer'
                }`}
              >
                Physical Realm Catalyst
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold mb-1 font-google-sans">Enter your query / question:</label>
              <input 
                type="text"
                value={tarotQuestion}
                onChange={(e) => setTarotQuestion(e.target.value)}
                disabled={isDrawing}
                placeholder="e.g. What secrets await my journey in this upcoming eclipse?"
                className="w-full bg-zinc-950 border border-zinc-900 focus:border-[#DC143C] text-xs px-3 py-2.5 rounded-lg text-zinc-300 outline-none font-google-sans placeholder-zinc-850 shadow-md"
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
                          className="w-full max-w-[145px] sm:max-w-[165px] mx-auto"
                        >
                          {isFlipped ? (
                            <div className="relative overflow-hidden aspect-[2/3.1] rounded-xl border border-zinc-800/60 flex flex-col justify-between items-center bg-black group hover:scale-[1.05] transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.8)] hover:border-[#DC143C]/40">
                              <img 
                                src={card.image} 
                                alt={card.name} 
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute inset-1.5 border border-amber-500/20 rounded-lg pointer-events-none z-10 shadow-[inset_0_0_12px_rgba(0,0,0,0.6)] group-hover:border-amber-500/40 transition-colors" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 z-10 pointer-events-none" />
                              <div className="relative z-20 pt-2.5 flex flex-col items-center">
                                <span className="text-[7px] text-[#DC143C] uppercase font-mono tracking-widest font-bold bg-black/85 border border-[#DC143C]/30 px-2 py-0.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
                                  {card.position}
                                </span>
                              </div>
                              <div className="relative z-20 w-full px-2 pb-2 text-center">
                                <div className="bg-black/80 backdrop-blur-sm border border-zinc-900/60 px-1.5 py-1 rounded-md max-w-full shadow-lg">
                                  <span className="text-[8px] sm:text-[9px] font-bold text-zinc-100 leading-none block font-google-sans uppercase tracking-wider truncate">
                                    {card.name}
                                  </span>
                                  <span className="text-[6.5px] sm:text-[7px] text-zinc-400 font-mono block mt-0.5 leading-none truncate">
                                    {card.description}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="relative overflow-hidden aspect-[2/3.1] rounded-xl border border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center p-3 text-center cursor-pointer group hover:border-[#DC143C]/50 hover:shadow-[0_0_20px_rgba(220,20,60,0.15)] transition-all duration-300 shadow-[inset_0_1px_4px_rgba(255,255,255,0.01)]">
                              <div className="absolute inset-1.5 border border-zinc-800/40 rounded-lg pointer-events-none" />
                              <div className="absolute inset-0 bg-[radial-gradient(#DC143C_1px,transparent_1px)] bg-[size:7px_7px] opacity-[0.18] rounded-lg group-hover:opacity-[0.3] transition-opacity" />
                              <div className="absolute w-12 h-12 rounded-full border border-dashed border-zinc-800/50 animate-[spin_15s_linear_infinite]" />
                              <div className="absolute w-16 h-16 rounded-full border border-dotted border-zinc-900/80 animate-[spin_30s_linear_infinite] pointer-events-none" />
                              <div className="w-9 h-9 rounded-full border border-zinc-850 flex items-center justify-center text-zinc-400 group-hover:text-[#DC143C] group-hover:border-[#DC143C]/40 transition-all shadow-[inset_0_1px_3px_rgba(255,255,255,0.01)] text-base relative z-10 bg-zinc-950">
                                👁️
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {drawnCards.length === 3 && flippedCount === 3 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 animate-fadeIn">
                    <button
                      onClick={() => handleShareTarotReading(tarotQuestion, drawnCards)}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-black border border-zinc-800 hover:border-[#DC143C]/50 text-xs font-mono uppercase text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Share reading on social media"
                    >
                      <span>↗</span>
                      <span>Share Reading</span>
                    </button>
                    <button
                      onClick={() => {
                        const summary = `Three-Card Tarot Reading on LAEVUS:\nQuestion: "${tarotQuestion || 'Personal guidance'}"\n` + drawnCards.map(c => `${c.position}: ${c.name} - ${c.description}`).join('\n');
                        handleCopyText(summary, 'tarot-reading-summary');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-black border border-zinc-800 hover:border-[#DC143C]/50 text-xs font-mono uppercase text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Copy reading summary"
                    >
                      <span>{copiedMessageId === 'tarot-reading-summary' ? '✓' : '📋'}</span>
                      <span>{copiedMessageId === 'tarot-reading-summary' ? 'Copied' : 'Copy Summary'}</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={handleDrawTarot}
                  disabled={isDrawing || !tarotQuestion.trim()}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer font-google-sans ${
                    tarotQuestion.trim() && !isDrawing
                      ? 'bg-[#DC143C] text-white hover:bg-[#B81132]'
                      : 'bg-zinc-950 text-zinc-800 cursor-not-allowed border border-zinc-900/50'
                  }`}
                >
                  {isDrawing ? "DRAWING CARDS..." : "DRAW 3 CARDS"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="flex flex-col text-left space-y-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">1. Past Energy</span>
                    <select
                      value={physicalPastCard}
                      onChange={(e) => setPhysicalPastCard(e.target.value)}
                      disabled={isDrawing}
                      className="bg-zinc-950 border border-zinc-900 text-zinc-300 text-xs rounded-lg px-3 py-2.5 outline-none w-full font-google-sans focus:border-[#DC143C] cursor-pointer"
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
                    <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">2. Present Moment</span>
                    <select
                      value={physicalPresentCard}
                      onChange={(e) => setPhysicalPresentCard(e.target.value)}
                      disabled={isDrawing}
                      className="bg-zinc-950 border border-zinc-900 text-zinc-300 text-xs rounded-lg px-3 py-2.5 outline-none w-full font-google-sans focus:border-[#DC143C] cursor-pointer"
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
                    <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">3. Future Trajectory</span>
                    <select
                      value={physicalFutureCard}
                      onChange={(e) => setPhysicalFutureCard(e.target.value)}
                      disabled={isDrawing}
                      className="bg-zinc-950 border border-zinc-900 text-zinc-300 text-xs rounded-lg px-3 py-2.5 outline-none w-full font-google-sans focus:border-[#DC143C] cursor-pointer"
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
                  className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer font-google-sans ${
                    tarotQuestion.trim() && !isDrawing && physicalPastCard && physicalPresentCard && physicalFutureCard
                      ? 'bg-amber-500 text-black hover:bg-amber-600 shadow-[0_2px_15px_rgba(245,158,11,0.2)]'
                      : 'bg-zinc-950 text-zinc-800 cursor-not-allowed border border-zinc-900/50'
                  }`}
                >
                  {isDrawing ? "SYNTHESIZING REALMS..." : "Synthesize Physical Reading (Mode 2)"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MINIMAL FOOTER */}
      <footer className="w-full border-t border-[#F8F7F4]/5 pt-2 pb-1 mt-3 flex flex-col justify-between items-center text-[9px] tracking-[0.15em] font-mono text-zinc-600 uppercase shrink-0 gap-2">
        <div className="flex flex-col sm:flex-row justify-center items-center w-full gap-2">
          <button 
            onClick={() => setShowAboutModal(true)}
            className="hover:text-[#DC143C] text-center transition-colors duration-300 focus:outline-none cursor-pointer border-b border-transparent hover:border-[#DC143C]/40 pb-0.5 font-bold bg-zinc-950 px-3 py-1.5 rounded font-google-sans"
          >
            All rights reserved "Left Hand Products LLC" 2026
          </button>
        </div>
      </footer>

      {/* ESOTERIC ABOUT US MODAL */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 select-text animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 relative shadow-2xl text-center font-google-sans">
            
            <button 
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-zinc-600 hover:text-[#DC143C] transition-colors cursor-pointer text-base font-bold"
            >
              ✕
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/30 flex items-center justify-center text-xl text-[#DC143C]">
                👁️
              </div>
            </div>

            <h3 className="font-google-sans text-sm sm:text-base font-extrabold uppercase tracking-[0.1em] text-[#F8F7F4] mb-3">
              ✦ ABOUT ME ✦
            </h3>
            
            <div className="text-left font-google-sans text-xs sm:text-[12px] text-zinc-300 leading-relaxed space-y-3.5 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin select-text">
              <p>
                Hi, I'm <span className="text-[#F8F7F4] font-bold">Andrew Bicknell</span>, founder of <a href="https://theleft.one" target="_blank" rel="noopener noreferrer" className="font-syne font-bold text-xs sm:text-sm text-zinc-200 hover:text-white inline-flex items-center gap-0.5 transition-colors mx-1">the<span className="text-[#DC143C]">left</span>.one</a> and <span className="text-[#F8F7F4] font-bold">Left Hand Products, LLC</span>.
              </p>
              
              <p>
                My background is in business and entrepreneurship. Over the years, I taught myself to code and embraced modern AI technologies so I could build the software ideas and creative platforms I'm passionate about from the ground up.
              </p>
              
              <p>
                Outside of building software, I have a genuine appreciation for diverse traditions. I enjoy celebrating holidays like Christmas and Easter with family just as much as observing the natural turning of the seasons and Pagan holidays. To me, celebrating life and connection doesn't require boxing yourself into just one tradition.
              </p>

              <p>
                I've also spent years reading and exploring esoteric philosophy, hermetic traditions, and unconventional ideas. I don't subscribe rigidly to any one dogma—I just have an open mind and a deep curiosity for history, symbolism, and how people throughout history have sought meaning.
              </p>

              <p>
                Today, I live on our family's property in Fountain, Colorado, enjoying life alongside my sister Candace, my nephew Noah, and my cat Tiger Lily Woods.
              </p>

              <p className="border-t border-zinc-800/50 pt-3 text-[9px] text-zinc-600 italic">
                "As above, so below; as within, so without. The left hand holds the secret of the first division."
              </p>
            </div>

            <div className="mt-6 font-google-sans">
              <button
                onClick={() => setShowAboutModal(false)}
                className="w-full py-2.5 bg-[#DC143C] hover:bg-[#B81132] text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer font-google-sans"
              >
                RETURN TO CHAT
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Social Media Sharing Modal */}
      <SocialShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        content={shareContent}
      />

    </div>
  );
};
