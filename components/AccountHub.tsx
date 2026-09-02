import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Activity, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Sparkles, 
  Search, 
  Trash2,
  Calendar,
  Flame,
  Clock
} from 'lucide-react';
import { User } from 'firebase/auth';

export interface TranscriptRecord {
  id: string;
  category: 'tarot' | 'madam' | string;
  title: string;
  date: string;
  content: string;
  querentPrompt?: string;
  drawnCards?: any[];
  madamBlavatskyReply?: string;
}

interface AccountHubProps {
  initialTab?: 'account' | 'inner-work' | 'transcripts';
  currentUser: User | null;
  onOpenAuth: (registerMode: boolean) => void;
  onReturnToChat: () => void;
  streakCount: number;
  daysRegistered: number;
  sentimentScores: number[];
  transcripts: TranscriptRecord[];
}

export const AccountHub: React.FC<AccountHubProps> = ({
  initialTab = 'account',
  currentUser,
  onOpenAuth,
  onReturnToChat,
  streakCount,
  daysRegistered,
  sentimentScores,
  transcripts
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'inner-work' | 'transcripts'>(initialTab);
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute sentiment trajectory metrics
  const averageSentiment = sentimentScores.length > 0 
    ? Math.round(sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length)
    : 50;

  const getPastAdvice = () => {
    if (averageSentiment > 52) {
      return "Your communication history shows navigating trials with resilient grace, focusing on positive energy and alignment.";
    } else if (averageSentiment < 48) {
      return "Your logs indicate heavy pressure or complex challenges in previous seasons, requiring deep reflection.";
    } else {
      return "You have walked a path of quiet contemplation, balancing different perspectives and integrating internal thoughts.";
    }
  };

  const getFutureAdvice = () => {
    if (averageSentiment > 52) {
      return "A widening horizon suggests positive outcomes and opportunities for personal self-realization.";
    } else if (averageSentiment < 48) {
      return "A productive transition is approaching. Focus on stability and positive restoration.";
    } else {
      return "A blank canvas awaits. Trust your focus and prepare to establish fresh goals.";
    }
  };

  const handleCopyTranscript = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTranscripts = transcripts.filter(t => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q) || t.date.toLowerCase().includes(q);
  });

  return (
    <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0 relative font-google-sans text-zinc-300 animate-fadeIn p-2 sm:p-4">
      
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900/60 pb-3 mb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToChat}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors uppercase cursor-pointer border border-zinc-800"
            title="Return to Oracle Chat"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#E60026]" />
            <span>Chat</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-syne font-extrabold text-[#F8F7F4] tracking-tight uppercase flex items-center gap-2">
              <span>Account & Insights Hub</span>
              <span className="text-[10px] font-mono font-bold text-[#E60026] bg-[#E60026]/10 px-2 py-0.5 rounded border border-[#E60026]/20">
                SOVEREIGN VESSEL
              </span>
            </h2>
          </div>
        </div>

        {/* Tab Selection Switcher */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900/80 shadow-inner self-start sm:self-auto gap-1">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-[#E60026] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile & Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('inner-work')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'inner-work'
                ? 'bg-[#E60026] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>The Inner Work</span>
          </button>

          <button
            onClick={() => setActiveTab('transcripts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'transcripts'
                ? 'bg-[#E60026] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Transcripts ({transcripts.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE & STATS */}
      {activeTab === 'account' && (
        <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto w-full">
          
          {/* Telemetry Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Active Streak */}
            <div className="p-5 bg-zinc-950 border border-zinc-900/70 rounded-xl space-y-2 text-center relative overflow-hidden group hover:border-[#E60026]/30 transition-all">
              <div className="absolute top-3 right-3 text-amber-500/20 group-hover:text-amber-500/40 transition-colors">
                <Flame className="w-8 h-8" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block font-mono">
                CONSECUTIVE DAYS ACTIVE
              </span>
              <span className="text-4xl sm:text-5xl font-extrabold text-[#E60026] block font-syne">
                {streakCount}
              </span>
              <span className="text-[11px] text-zinc-400 block font-google-sans">
                Consecutive daily sessions logged
              </span>
            </div>

            {/* Total Registered Days */}
            <div className="p-5 bg-zinc-950 border border-zinc-900/70 rounded-xl space-y-2 text-center relative overflow-hidden group hover:border-zinc-700 transition-all">
              <div className="absolute top-3 right-3 text-zinc-700/20 group-hover:text-zinc-500/30 transition-colors">
                <Clock className="w-8 h-8" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block font-mono">
                TOTAL TIME REGISTERED
              </span>
              <span className="text-4xl sm:text-5xl font-extrabold text-zinc-200 block font-syne">
                {daysRegistered}
              </span>
              <span className="text-[11px] text-zinc-400 block font-google-sans">
                Days since your initial vessel initiation
              </span>
            </div>

          </div>

          {/* User Account Card */}
          <div className="p-6 bg-zinc-950 border border-zinc-900/80 rounded-xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-900/60 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl text-[#E60026] shadow-inner">
                  👤
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block font-mono">
                    IDENTITY STATUS
                  </span>
                  <span className="text-sm text-zinc-100 font-bold font-google-sans">
                    {currentUser ? currentUser.email : 'GUEST VESSEL (ANONYMOUS)'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {currentUser ? 'Verified Account • Cloud Synced' : 'Local storage mode • Sign in to enable cross-device sync'}
                  </span>
                </div>
              </div>

              {!currentUser ? (
                <button
                  onClick={() => onOpenAuth(false)}
                  className="px-4 py-2 bg-[#E60026] hover:bg-[#ff334b] text-black font-bold rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Sign In / Register
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuth(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer border border-zinc-800"
                >
                  Manage Account
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-zinc-500">
                Data is encrypted locally and in secure Firestore partitions.
              </div>

              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to reset all your local data and chat history?")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/40 text-red-400 hover:bg-[#E60026]/15 hover:text-[#E60026] rounded-md text-xs font-bold transition-colors uppercase cursor-pointer border border-red-900/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Local Storage</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: THE INNER WORK (SENTIMENT TRAJECTORY) */}
      {activeTab === 'inner-work' && (
        <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto w-full">
          
          <div className="bg-zinc-950 border border-zinc-900/80 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900/60 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#E60026] font-bold block font-mono">
                  CONVERSATIONAL TRAJECTORY
                </span>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Real-time sentiment telemetry tracking harmonic balance and emotional shifts across sessions.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-zinc-500 uppercase font-mono block">Harmonic Index</span>
                <span className="text-base font-bold text-zinc-200 font-syne">{averageSentiment}%</span>
              </div>
            </div>

            {/* Plot Container */}
            <div className="w-full h-64 bg-black/60 rounded-xl relative overflow-hidden flex flex-col justify-between p-4 border border-zinc-900">
              
              {/* Coordinate Grid */}
              <div className="absolute inset-0 z-0 p-4 opacity-15 pointer-events-none">
                <div className="w-full h-full border-t border-b border-zinc-700 flex flex-col justify-between">
                  <div className="w-full border-b border-dashed border-zinc-700 h-1/2"></div>
                </div>
              </div>

              {/* Real SVG plot line and nodes */}
              <svg className="w-full h-full absolute inset-0 z-10 p-6" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Horizontal Baseline (Neutral) */}
                <line x1="0" y1="100" x2="500" y2="100" stroke="#E60026" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                
                {/* Plot line connecting nodes */}
                <path
                  d={sentimentScores.map((score, idx) => {
                    const x = (idx / (sentimentScores.length - 1 || 1)) * 500;
                    const y = 200 - ((score / 100) * 200);
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#E60026"
                  strokeWidth="2"
                  opacity="0.85"
                />

                {/* Markers */}
                {sentimentScores.map((score, idx) => {
                  const x = (idx / (sentimentScores.length - 1 || 1)) * 500;
                  const y = 200 - ((score / 100) * 200);
                  const isPositive = score > 50;
                  const isNegative = score < 50;
                  const color = isPositive ? '#22c55e' : isNegative ? '#ef4444' : '#a1a1aa';
                  const glowColor = isPositive ? 'rgba(34, 197, 94, 0.4)' : isNegative ? 'rgba(239, 68, 68, 0.4)' : 'rgba(161, 161, 170, 0.2)';

                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="8" fill={glowColor} />
                      <circle cx={x} cy={y} r="4" fill={color} />
                    </g>
                  );
                })}
              </svg>

              {/* Labels inside the Graph */}
              <div className="z-20 w-full flex justify-between text-[8px] text-zinc-500 font-bold uppercase tracking-widest font-mono">
                <span>POSITIVE ALIGNMENT</span>
                <span>NEUTRAL HORIZON</span>
                <span>DEEP REFLECTION</span>
              </div>
              
              <div className="z-20 w-full flex justify-between text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-auto font-mono">
                <span>EARLIER SESSIONS</span>
                <span>TIMELINE EVOLUTION</span>
                <span>LATEST PROMPTS</span>
              </div>
            </div>

            {/* PAST & FUTURE REFLECTION ARROW PANELS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Past Reflection */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-900 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-[#E60026]">
                    <ChevronLeft className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold font-mono">
                    PAST SENTIMENT
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic font-google-sans pl-1">
                  "{getPastAdvice()}"
                </p>
              </div>

              {/* Future Outlook */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-900 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold font-mono">
                    FUTURE OUTLOOK
                  </span>
                  <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-[#E60026]">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic font-google-sans pl-1">
                  "{getFutureAdvice()}"
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 3: TRANSCRIPTS & SAVED LOGS */}
      {activeTab === 'transcripts' && (
        <div className="space-y-4 animate-fadeIn max-w-3xl mx-auto w-full">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search transcript logs by topic, question, or date..."
              className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#E60026]"
            />
          </div>

          {/* Transcripts List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredTranscripts.length === 0 ? (
              <div className="text-center py-16 bg-zinc-950 border border-zinc-900/50 rounded-xl space-y-2">
                <BookOpen className="w-8 h-8 text-zinc-700 mx-auto" />
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold font-mono">
                  No transcripts recorded yet
                </p>
                <p className="text-[11px] text-zinc-600">
                  Transcripts and divination results are automatically archived here after consultations.
                </p>
              </div>
            ) : (
              filteredTranscripts.map((record) => (
                <div 
                  key={record.id} 
                  className="p-4 bg-zinc-950 border border-zinc-900/80 rounded-xl space-y-3 hover:border-zinc-800 transition-colors"
                >
                  <div className="flex justify-between items-center text-[10px] border-b border-zinc-900/50 pb-2 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[#E60026] font-bold uppercase tracking-wider">
                        {record.title}
                      </span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-zinc-400">{record.category.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500">{record.date}</span>
                      <button
                        onClick={() => handleCopyTranscript(record.content, record.id)}
                        className="text-zinc-500 hover:text-white p-1 rounded transition-colors cursor-pointer"
                        title="Copy Transcript"
                      >
                        {copiedId === record.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-google-sans">
                    {record.content}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
};
