// Voice Synthesis & Persona Configuration Service for LAEVUS

export type PersonaId = 'Madame Blavatsky' | 'Sophisticated Gentleman' | 'Khan' | 'Marie';

export interface PersonaProfile {
  id: PersonaId;
  title: string;
  accent: string;
  tone: string;
  description: string;
  defaultPitch: number;
  defaultSpeed: number;
  voiceGender: 'female' | 'male' | 'neutral';
  preferredLang?: string;
  testPhrase: string;
  systemPromptDirective: string;
}

export interface VoiceSettings {
  enabled: boolean;
  persona: PersonaId;
  pitch: number;
  speed: number;
  // User Voice Cloning & Input Configurations
  sttEnabled: boolean;
  userVoiceMode: 'actual' | 'cloned' | 'default';
  clonedPitch: number;
  clonedSpeed: number;
  autoSendVoice: boolean;
  preferredExportFormat: 'doc' | 'pdf' | 'mp3';
}

export const PERSONA_PROFILES: Record<PersonaId, PersonaProfile> = {
  'Madame Blavatsky': {
    id: 'Madame Blavatsky',
    title: 'Madame Blavatsky',
    accent: 'Accentuated Russian accent, grounded tone',
    tone: 'Russian Accent / Grounded',
    description: 'Accentuated Russian accent with a grounded, contemplative delivery.',
    defaultPitch: 0.85,
    defaultSpeed: 0.90,
    voiceGender: 'female',
    preferredLang: 'ru-RU',
    testPhrase: 'Wisdom does not shout. It listens quietly to the patterns beneath the surface.',
    systemPromptDirective: 'Speak with an accentuated Russian accent and a grounded, perceptive tone.'
  },
  'Sophisticated Gentleman': {
    id: 'Sophisticated Gentleman',
    title: 'Sophisticated Gentleman',
    accent: 'Authoritative, polished Southern American accent',
    tone: 'Southern American / Polished',
    description: 'Authoritative and polished Southern American cadence with measured composure.',
    defaultPitch: 0.95,
    defaultSpeed: 0.95,
    voiceGender: 'male',
    preferredLang: 'en-US',
    testPhrase: 'Good evening. Let us examine your question with discernment and steady resolve.',
    systemPromptDirective: 'Speak with an authoritative, polished Southern American accent and gentlemanly composure.'
  },
  'Khan': {
    id: 'Khan',
    title: 'Khan',
    accent: 'Deep, commanding historical Central Asian/Mongolian timbre',
    tone: 'Central Asian / Commanding',
    description: 'Deep, commanding historical Central Asian and Mongolian timbre.',
    defaultPitch: 0.70,
    defaultSpeed: 0.88,
    voiceGender: 'male',
    preferredLang: 'en-US',
    testPhrase: 'Look directly at your obstacles. Strength is forged through discipline and clear intent.',
    systemPromptDirective: 'Speak with a deep, commanding historical Central Asian and Mongolian timbre.'
  },
  'Marie': {
    id: 'Marie',
    title: 'Marie',
    accent: 'Classical French accent',
    tone: 'Classical French / Elegant',
    description: 'Articulate classical French accent with elegance and lucid clarity.',
    defaultPitch: 1.10,
    defaultSpeed: 0.95,
    voiceGender: 'female',
    preferredLang: 'fr-FR',
    testPhrase: 'Bonjour. Let us see what is true and what can be understood with clarity.',
    systemPromptDirective: 'Speak with a classical French accent, articulate, poised, and elegant.'
  }
};

const STORAGE_KEY = 'laevus_voice_settings_v3';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  persona: 'Madame Blavatsky',
  pitch: 0.85,
  speed: 0.90,
  sttEnabled: true,
  userVoiceMode: 'cloned',
  clonedPitch: 1.0,
  clonedSpeed: 1.0,
  autoSendVoice: false,
  preferredExportFormat: 'mp3'
};

export const getSavedVoiceSettings = (): VoiceSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    const parsed = JSON.parse(raw);
    const persona: PersonaId = PERSONA_PROFILES[parsed.persona as PersonaId]
      ? (parsed.persona as PersonaId)
      : DEFAULT_VOICE_SETTINGS.persona;

    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_VOICE_SETTINGS.enabled,
      persona,
      pitch: typeof parsed.pitch === 'number' ? Math.max(0.5, Math.min(1.8, parsed.pitch)) : PERSONA_PROFILES[persona].defaultPitch,
      speed: typeof parsed.speed === 'number' ? Math.max(0.5, Math.min(1.8, parsed.speed)) : PERSONA_PROFILES[persona].defaultSpeed,
      sttEnabled: typeof parsed.sttEnabled === 'boolean' ? parsed.sttEnabled : DEFAULT_VOICE_SETTINGS.sttEnabled,
      userVoiceMode: ['actual', 'cloned', 'default'].includes(parsed.userVoiceMode) ? parsed.userVoiceMode : DEFAULT_VOICE_SETTINGS.userVoiceMode,
      clonedPitch: typeof parsed.clonedPitch === 'number' ? parsed.clonedPitch : DEFAULT_VOICE_SETTINGS.clonedPitch,
      clonedSpeed: typeof parsed.clonedSpeed === 'number' ? parsed.clonedSpeed : DEFAULT_VOICE_SETTINGS.clonedSpeed,
      autoSendVoice: typeof parsed.autoSendVoice === 'boolean' ? parsed.autoSendVoice : DEFAULT_VOICE_SETTINGS.autoSendVoice,
      preferredExportFormat: ['doc', 'pdf', 'mp3'].includes(parsed.preferredExportFormat) ? parsed.preferredExportFormat : DEFAULT_VOICE_SETTINGS.preferredExportFormat,
    };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
};

export const saveVoiceSettings = (settings: VoiceSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save voice settings:', err);
  }
};

// Global Speech Synthesis Controller
class VoiceEngine {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
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
    this.listeners.forEach((fn) => fn(this.isSpeakingState));
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
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[MODE \d+\][^\n]*/gi, '')
      .replace(/\[Connected with [^\]]+\]/gi, '')
      .replace(/\[Embodied [^\]]+\]/gi, '')
      .replace(/\[\s*Ended session[^\]]*\]/gi, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/--+/g, ' ')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private selectVoice(persona: PersonaId): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const profile = PERSONA_PROFILES[persona];

    // Check language preference first
    if (profile.preferredLang) {
      const langMatches = voices.filter((v) => v.lang.startsWith(profile.preferredLang!.slice(0, 2)));
      if (langMatches.length > 0) return langMatches[0];
    }

    const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    if (profile.voiceGender === 'female') {
      const femaleMatches = pool.filter((v) =>
        /female|zira|samantha|victoria|karen|moira|fiona|serena|stephanie|helena|kate/i.test(v.name)
      );
      if (femaleMatches.length > 0) return femaleMatches[0];
    } else if (profile.voiceGender === 'male') {
      const maleMatches = pool.filter((v) =>
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
      console.warn('Speech synthesis notice:', e);
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
