import React, { useState, useEffect, useRef, useMemo } from 'react';
import { metaphysicalConsultation } from '../services/gemini';
import { voiceEngine, getSavedVoiceSettings } from '../services/voiceSynthesis';
import { speechToTextEngine } from '../services/speechToText';
import { exportToWordDoc, exportToPdf, exportToAudioMp3 } from '../services/exportService';
import { EsotericWisdomFooter } from './EsotericWisdomFooter';
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
  symbol: card.symbol || (card.arcana === 'major' ? 'Major' : 'Minor'),
  description: card.description || card.symbolism || card.keywords.slice(0, 3).join(', '),
  meaning: card.meaning,
  image: card.image
}));

// Helper: Typing/Typewriter Effect for Snappy & Cinematic responses
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
    <div className="relative group flex flex-col w-full">
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

  // Voice Input (STT) & Export states
  const [isListening, setIsListening] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const activePersonaName = getSavedVoiceSettings().persona;

  const handleToggleVoiceInput = () => {
    if (isListening) {
      speechToTextEngine.stop();
      setIsListening(false);
    } else {
      const started = speechToTextEngine.start({
        onResult: (text, isFinal) => {
          setInput(text);
          const currentSettings = getSavedVoiceSettings();
          if (isFinal && currentSettings.autoSendVoice && text.trim()) {
            handleSend(text);
            speechToTextEngine.stop();
            setIsListening(false);
          }
        },
        onError: (err) => {
          console.warn('Voice recognition:', err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        }
      });
      setIsListening(started);
    }
  };

  const handleExportConversationDoc = () => {
    exportToWordDoc({
      title: `Conversation with ${activeTarotPersona || activePersonaName}`,
      persona: activeTarotPersona || activePersonaName,
      messages: messages.map(m => ({
        role: m.role,
        text: m.text,
        timestamp: m.timestamp
      }))
    });
  };

  const handleExportConversationPdf = () => {
    exportToPdf({
      title: `Conversation with ${activeTarotPersona || activePersonaName}`,
      persona: activeTarotPersona || activePersonaName,
      messages: messages.map(m => ({
        role: m.role,
        text: m.text,
        timestamp: m.timestamp
      }))
    });
  };

  const handleExportConversationMp3 = async () => {
    setExportNotice('Exporting MP3 audio...');
    const voiceSettings = getSavedVoiceSettings();
    await exportToAudioMp3(
      {
        title: `Conversation with ${activeTarotPersona || activePersonaName}`,
        persona: activeTarotPersona || activePersonaName,
        userVoiceMode: voiceSettings.userVoiceMode,
        messages: messages.map(m => ({
          role: m.role,
          text: m.text,
          timestamp: m.timestamp
        }))
      },
      (_, status) => setExportNotice(status)
    );
    setTimeout(() => setExportNotice(null), 2500);
  };

  const handleExportSingleMessage = (text: string, sender: string) => {
    exportToWordDoc({
      title: `Oracle Message from ${sender}`,
      persona: sender,
      messages: [
        {
          role: sender.toLowerCase() === 'user' ? 'user' : 'model',
          text,
          timestamp: new Date()
        }
      ]
    });
  };

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
        const currentVoiceSettings = getSavedVoiceSettings();
        const reply = await metaphysicalConsultation(
          questionText,
          [],
          {
            mode: 'tarot-persona',
            personaCardName: normalizedCardName,
            readingCount: nextCount,
            persona: currentVoiceSettings.persona,
            affectIntensity: currentVoiceSettings.affectIntensity
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

      const currentVoiceSettings = getSavedVoiceSettings();
      let reply = "";
      if (currentMode === 'tarot' && customCards) {
        reply = await metaphysicalConsultation(
          `Tailor a 3-card reading for my question: "${tarotQuestion || "My spiritual destiny"}"`,
          formattedHistory,
          {
            mode: 'tarot',
            tarotCards: customCards,
            tarotQuestion: tarotQuestion || "General alignment",
            readingCount: nextCount,
            persona: currentVoiceSettings.persona,
            affectIntensity: currentVoiceSettings.affectIntensity
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
            readingCount: nextCount,
            persona: currentVoiceSettings.persona,
            affectIntensity: currentVoiceSettings.affectIntensity
          }
        );
      } else if (currentMode === 'tarot-persona' && activeTarotPersona) {
        reply = await metaphysicalConsultation(
          trimmedText,
          formattedHistory,
          {
            mode: 'tarot-persona',
            personaCardName: activeTarotPersona,
            readingCount: nextCount,
            persona: currentVoiceSettings.persona,
            affectIntensity: currentVoiceSettings.affectIntensity
          }
        );
      } else {
        reply = await metaphysicalConsultation(
          trimmedText,
          formattedHistory,
          {
            mode: 'laevus',
            readingCount: nextCount,
            persona: currentVoiceSettings.persona,
            affectIntensity: currentVoiceSettings.affectIntensity
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
          `Consultation with ${currentVoiceSettings.persona}`,
          `User: ${trimmedText}\n\n${currentVoiceSettings.persona}: ${reply}`,
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
            <div className="px-4 py-2 bg-zinc-950 flex items-center justify-between text-xs mb-2 rounded-lg border border-amber-500/25 flex-shrink-0 font-google-sans text-amber-300">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">Archetype</span>
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
                className="px-2.5 py-1 rounded bg-zinc-900 text-amber-400 text-[9px] uppercase hover:bg-amber-500/10 transition-colors cursor-pointer border border-transparent font-google-sans"
              >
                Depart
              </button>
            </div>
          )}

          {/* Conversation Actions & Status Bar */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-900/60 text-[10px] font-mono text-zinc-500 select-none">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="uppercase tracking-widest text-zinc-400 font-medium">
                {exportNotice || 'Dialogue Ledger'}
              </span>
              <span className="text-zinc-700 hidden sm:inline">•</span>
              <button 
                onClick={() => setActiveView('voice-settings')}
                className="hidden sm:inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-zinc-400 hover:text-[#DC143C] transition-colors cursor-pointer"
                title="Configure Persona Voice & Affect Intensity"
              >
                <span>Voice: {activePersonaName}</span>
                <span className="text-[#DC143C] font-semibold">({Math.round((voiceSettings.affectIntensity ?? 0.85) * 100)}% Affect)</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportConversationMp3}
                className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer uppercase text-[9px]"
                title="Export voice dialogue as MP3"
              >
                Export MP3
              </button>
              <button
                onClick={handleExportConversationDoc}
                className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer uppercase text-[9px]"
                title="Export dialogue as Word Document"
              >
                Export DOC
              </button>
              <button
                onClick={handleExportConversationPdf}
                className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer uppercase text-[9px]"
                title="Export dialogue as PDF"
              >
                Export PDF
              </button>
            </div>
          </div>

          {/* Messages Ledger */}
          <div className="flex-1 py-2 overflow-y-auto space-y-3 border-b border-zinc-900/40 min-h-0">
            {messages.map((m) => {
               const isUser = m.role === 'user';
               return (
                 <div 
                   key={m.id}
                   className={`flex flex-col ${isUser ? 'max-w-[85%] ml-auto items-end' : 'w-full mr-auto items-start'}`}
                 >
                   <div className="w-full flex items-center justify-between text-[9px] font-mono text-zinc-500 mb-1 px-1 tracking-wider uppercase font-google-sans">
                     <span>
                       {isUser 
                         ? 'YOU' 
                         : activeTarotPersona 
                         ? activeTarotPersona.toUpperCase() 
                         : `${activePersonaName.toUpperCase()} (${Math.round((voiceSettings.affectIntensity ?? 0.85) * 100)}% AFFECT)`} • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                     {!isUser && (
                       <span className="font-bold text-zinc-400 tracking-widest">ORACLE</span>
                     )}
                   </div>
                   <div className={`px-4 py-3 rounded-xl leading-relaxed text-xs select-text cursor-text selection:bg-purple-900/50 selection:text-purple-200 ${
                     isUser 
                       ? 'bg-zinc-900 text-[#F8F7F4]' 
                       : 'bg-zinc-950 text-[#F8F7F4] w-full border border-zinc-900/50'
                   }`}>
                     {isUser ? (
                       <p className="whitespace-pre-wrap font-google-sans select-text cursor-text">{m.text}</p>
                     ) : (
                       <TypewriterText text={m.text} />
                     )}
                   </div>

                   {/* Action buttons: Share & Export */}
                   <div className="flex items-center gap-1.5 mt-1 px-1 opacity-80 hover:opacity-100 transition-opacity">
                     <button
                       onClick={() => handleShareOracleMessage(m.text)}
                       className="text-[9px] font-mono text-zinc-500 hover:text-[#DC143C] transition-colors cursor-pointer px-2 py-0.5 rounded bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 uppercase"
                       title="Share reflection"
                     >
                       Share
                     </button>
                     <button
                       onClick={() => handleExportSingleMessage(m.text, isUser ? 'User' : activePersonaName)}
                       className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer px-2 py-0.5 rounded bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 uppercase"
                       title="Export text document"
                     >
                       Export DOC
                     </button>
                   </div>
                 </div>
               );
            })}
            
            {isTyping && (
              <div className="w-full mr-auto flex flex-col">
                <div className="w-full flex items-center justify-between text-[9px] font-mono text-zinc-500 mb-1 px-1 tracking-wider uppercase font-google-sans">
                  <span>{activeTarotPersona ? activeTarotPersona.toUpperCase() : activePersonaName.toUpperCase()}</span>
                  <span className="font-bold text-zinc-400 tracking-widest">ORACLE</span>
                </div>
                <div className="flex items-center gap-2 bg-zinc-950 px-4 py-3 rounded-xl w-full border border-zinc-900/50">
                  <span className="w-2 h-2 rounded-full bg-[#DC143C] animate-ping" />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest animate-pulse font-google-sans">Reflecting on your thoughts...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input block */}
          <div className="pt-2 bg-transparent">
            {/* Text input form */}
            <div className="relative flex items-center rounded-lg bg-zinc-950 focus-within:ring-1 focus-within:ring-[#DC143C]/40 transition-all p-1.5 gap-2">
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
                type="button"
                onClick={handleToggleVoiceInput}
                className={`px-3 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer border ${
                  isListening
                    ? 'bg-[#DC143C] text-white border-[#DC143C] animate-pulse'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
                title="Dictate with voice"
              >
                {isListening ? 'Stop' : 'Voice'}
              </button>
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className={`px-4 py-2.5 rounded-lg transition-all ${
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
      {(activeView === 'divination' || activeView === 'tarot') && (
        <DivinationHub
          initialTab="oracle"
          onReturnToChat={() => setActiveView('chat')}
          onStartSeanceWithCard={handleStartEncyclopediaConversation}
          onStartReading={(prompt, mode, cards) => {
            setActiveView('chat');
            handleSend(prompt, mode, cards);
          }}
          onShareTarotReading={handleShareTarotReading}
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
        <DivinationHub
          initialTab="encyclopedia"
          onReturnToChat={() => setActiveView('chat')}
          onStartSeanceWithCard={handleStartEncyclopediaConversation}
          onStartReading={(prompt, mode, cards) => {
            setActiveView('chat');
            handleSend(prompt, mode, cards);
          }}
          onShareTarotReading={handleShareTarotReading}
        />
      )}

      {/* ESOTERIC WISDOM FOOTER WITH QUOTE ROTATION */}
      <EsotericWisdomFooter onOpenAbout={() => setShowAboutModal(true)} />

      {/* ESOTERIC ABOUT US MODAL */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 select-text animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 relative shadow-2xl text-center font-google-sans">
            
            <button 
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-[#DC143C] transition-colors cursor-pointer text-xs font-mono uppercase tracking-wider"
            >
              Close
            </button>

            <h3 className="font-google-sans text-sm sm:text-base font-extrabold uppercase tracking-[0.1em] text-[#F8F7F4] mb-3 mt-2">
              ABOUT ME
            </h3>
            
            <div className="text-left font-google-sans text-xs sm:text-[12px] text-zinc-300 leading-relaxed space-y-3.5 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin select-text">
              <p>
                Hi, I'm <span className="text-[#F8F7F4] font-bold">Andrew Bicknell</span>, founder of <a href="https://theleft.one" target="_blank" rel="noopener noreferrer" className="font-ruthie text-2xl sm:text-3xl text-zinc-200 hover:text-white inline-flex items-center gap-0.5 transition-colors mx-1 leading-none align-middle">the<span className="text-[#DC143C]">left</span>.one</a> and <span className="text-[#F8F7F4] font-bold">Left Hand Products, LLC</span>.
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
