// Voice Synthesis Service for LAEVUS Metaphysical Portal

export interface VoiceSettings {
  enabled: boolean;
  persona: 'Madame Blavatsky' | 'Modern Intuitive' | 'Arcane Scholar' | 'Mystic Echo';
  pitch: number;
  speed: number;
}

export interface PersonaProfile {
  id: 'Madame Blavatsky' | 'Modern Intuitive' | 'Arcane Scholar' | 'Mystic Echo';
  title: string;
  subtitle: string;
  tagline: string;
  avatar: string;
  defaultPitch: number;
  defaultSpeed: number;
  voiceGender: 'female' | 'male' | 'neutral';
  tone: string;
  testPhrase: string;
}

export const PERSONA_PROFILES: Record<string, PersonaProfile> = {
  'Madame Blavatsky': {
    id: 'Madame Blavatsky',
    title: 'Madame Blavatsky',
    subtitle: 'Theosophical Master & Occult Seer',
    tagline: 'Deep, resonant, enigmatic cadence with archaic occult gravitas.',
    avatar: '👁️',
    defaultPitch: 0.85,
    defaultSpeed: 0.90,
    voiceGender: 'female',
    tone: 'Archaic Mysticism',
    testPhrase: 'The digital veil parts. Across the astral currents, hidden truths awaken.'
  },
  'Modern Intuitive': {
    id: 'Modern Intuitive',
    title: 'Modern Intuitive',
    subtitle: 'Cyber-Spiritual Catalyst',
    tagline: 'Crisp, lucid, direct algorithmic clarity and swift intuition.',
    avatar: '⚡',
    defaultPitch: 1.05,
    defaultSpeed: 1.05,
    voiceGender: 'neutral',
    tone: 'Lucid Clarity',
    testPhrase: 'Your energetic patterns are aligned. Let us decode the incoming synchronicity.'
  },
  'Arcane Scholar': {
    id: 'Arcane Scholar',
    title: 'Arcane Scholar',
    subtitle: 'Alchemical Philosopher',
    tagline: 'Deep, measured, Elizabethan solemnity and empirical esoteric wisdom.',
    avatar: '📜',
    defaultPitch: 0.75,
    defaultSpeed: 0.92,
    voiceGender: 'male',
    tone: 'Solemn Erudition',
    testPhrase: 'Observe the cause and effect etched into cosmic geometry. The signs are immutable.'
  },
  'Mystic Echo': {
    id: 'Mystic Echo',
    title: 'Mystic Echo',
    subtitle: 'Astral Whisper & Celestial Frequency',
    tagline: 'Ethereal, high-resonance aura vibrating between dimensions.',
    avatar: '✨',
    defaultPitch: 1.25,
    defaultSpeed: 0.85,
    voiceGender: 'female',
    tone: 'Celestial Resonance',
    testPhrase: 'From beyond the horizon of time, the stars reflect your unwritten fate.'
  }
};

const STORAGE_KEY = 'laevus_voice_settings_v2';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  persona: 'Madame Blavatsky',
  pitch: 0.85,
  speed: 0.90
};

export const getSavedVoiceSettings = (): VoiceSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_VOICE_SETTINGS.enabled,
      persona: PERSONA_PROFILES[parsed.persona] ? parsed.persona : DEFAULT_VOICE_SETTINGS.persona,
      pitch: typeof parsed.pitch === 'number' ? Math.max(0.5, Math.min(1.8, parsed.pitch)) : DEFAULT_VOICE_SETTINGS.pitch,
      speed: typeof parsed.speed === 'number' ? Math.max(0.5, Math.min(1.8, parsed.speed)) : DEFAULT_VOICE_SETTINGS.speed,
    };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
};

export const saveVoiceSettings = (settings: VoiceSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save voice settings:", err);
  }
};

// Global Speech Synthesis Controller
class VoiceEngine {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Ensure speech synthesis cancels properly on page unload
      window.addEventListener('beforeunload', () => {
        this.stop();
      });
    }
  }

  public subscribe(listener: (speaking: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isSpeakingState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.isSpeakingState));
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
      this.isSpeakingState = false;
      this.notify();
    }
  }

  private cleanTextForSpeech(raw: string): string {
    return raw
      .replace(/```[\s\S]*?```/g, '') // remove code blocks
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/\[MODE \d+\][^\n]*/gi, '') // Mode tags
      .replace(/\[Connected with [^\]]+\]/gi, '') // connection tags
      .replace(/\[Embodied [^\]]+\]/gi, '')
      .replace(/\[\s*Ended session[^\]]*\]/gi, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italic
      .replace(/#{1,6}\s+/g, '') // headers
      .replace(/[🃏🧙🌙👑🛡️⛪💖🏎️🦁🕯️🎡⚖️🧘💀🧪😈⚡⭐🌕☀️🔔🌍👁️✨🔥🕊️💫]/g, '') // strip emojis
      .replace(/--+/g, ' ')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private selectVoice(persona: VoiceSettings['persona']): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const profile = PERSONA_PROFILES[persona];
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    if (profile.voiceGender === 'female') {
      const femaleMatches = pool.filter(v => 
        /female|zira|samantha|victoria|karen|moira|fiona|serena|stephanie|helena|kate/i.test(v.name)
      );
      if (femaleMatches.length > 0) return femaleMatches[0];
    } else if (profile.voiceGender === 'male') {
      const maleMatches = pool.filter(v => 
        /male|david|george|daniel|oliver|arthur|james|richard|tom/i.test(v.name)
      );
      if (maleMatches.length > 0) return maleMatches[0];
    }

    return pool[0] || null;
  }

  public speak(text: string, customSettings?: Partial<VoiceSettings>): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const settings = { ...getSavedVoiceSettings(), ...customSettings };
    if (!settings.enabled) return;

    this.stop();

    const clean = this.cleanTextForSpeech(text);
    if (!clean) return;

    // Limit length for smooth speech synthesis buffering
    const truncated = clean.length > 1200 ? clean.slice(0, 1200) + '...' : clean;

    const utterance = new SpeechSynthesisUtterance(truncated);
    utterance.pitch = settings.pitch;
    utterance.rate = settings.speed;

    const selectedVoice = this.selectVoice(settings.persona);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      this.isSpeakingState = true;
      this.notify();
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      this.notify();
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis notice:", e);
      this.isSpeakingState = false;
      this.currentUtterance = null;
      this.notify();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public testVoice(settings: VoiceSettings): void {
    const profile = PERSONA_PROFILES[settings.persona] || PERSONA_PROFILES['Madame Blavatsky'];
    this.speak(profile.testPhrase, settings);
  }
}

export const voiceEngine = new VoiceEngine();
