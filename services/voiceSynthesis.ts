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
  sampleQuotes: {
    subtle: string;
    balanced: string;
    pronounced: string;
    immersion: string;
  };
}

export interface VoiceSettings {
  enabled: boolean;
  persona: PersonaId;
  pitch: number;
  speed: number;
  affectIntensity: number; // 0.20 to 1.00 (Affect: How much the persona stands out)
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
    systemPromptDirective: 'Speak with an accentuated Russian accent and a grounded, perceptive tone.',
    sampleQuotes: {
      subtle: 'Wisdom does not shout. It listens quietly to the patterns beneath the surface.',
      balanced: 'Look closely, my friend. In truth, the mind weaves illusions until quiet observation dissolves them.',
      pronounced: 'Listen to me, my dear friend. What you call chance is merely the hidden hand of karmic law. Let us peer through the veil.',
      immersion: 'Aha! Look deeply into the ether, my friend. The intellect alone is clumsy, like hands grasping at smoke. In truth, the spiritual architecture reveals all.'
    }
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
    systemPromptDirective: 'Speak with an authoritative, polished Southern American accent and gentlemanly composure.',
    sampleQuotes: {
      subtle: 'Good evening. Let us examine your question with discernment and steady resolve.',
      balanced: 'Well now, let us take the measure of this situation with proper decorum and a clear head.',
      pronounced: 'Well now, my good friend, if you will permit me an observation: a gentleman never rushes to a conclusion before surveying the ground.',
      immersion: 'Well now, sir or madam, let us set our cards squarely on the table. In my years, I have learned that haste is the enemy of prosperity. Let us attend to the heart of this matter with unflappable resolve.'
    }
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
    systemPromptDirective: 'Speak with a deep, commanding historical Central Asian and Mongolian timbre.',
    sampleQuotes: {
      subtle: 'Look directly at your obstacles. Strength is forged through discipline and clear intent.',
      balanced: 'A warrior does not quarrel with the wind; he turns his horse and advances. What is your true aim?',
      pronounced: 'Strip away the excuses that weaken your sight. In battle and in life, victory belongs to the one who conquers self-doubt first.',
      immersion: 'Steel is only forged in fire! Speak plainly and without fear. If you hesitate before the mountain, the mountain will crush you. Stand firm, choose your path, and strike with absolute certainty.'
    }
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
    systemPromptDirective: 'Speak with a classical French accent, articulate, poised, and elegant.',
    sampleQuotes: {
      subtle: "Bonjour. Let us see what is true and what can be understood with clarity.",
      balanced: "Ah, let us illuminate this question with poise and reason, n'est-ce pas? Beauty and truth walk together.",
      pronounced: "Ah, mais oui! Let us look upon your question with lucid discernment. There is an art to separating sentiment from true destiny.",
      immersion: "Ah, mon cher ami, look closely! Why clutter the spirit with doubt when reason and delicate intuition can illuminate the whole garden? C'est magnifique when one sees through the mist with absolute poise."
    }
  }
};

const STORAGE_KEY = 'laevus_voice_settings_v3';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  persona: 'Madame Blavatsky',
  pitch: 0.85,
  speed: 0.90,
  affectIntensity: 0.85,
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
      affectIntensity: typeof parsed.affectIntensity === 'number' ? Math.max(0.2, Math.min(1.0, parsed.affectIntensity)) : DEFAULT_VOICE_SETTINGS.affectIntensity,
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
    
    // Apply affect intensity modulation to make character accents and presence stand out
    const affect = typeof settings.affectIntensity === 'number' ? settings.affectIntensity : 0.85;
    let effectivePitch = settings.pitch;
    let effectiveRate = settings.speed;

    if (settings.persona === 'Khan') {
      // Khan deepens and slows with higher affect for commanding authority
      effectivePitch = Math.max(0.55, settings.pitch - (affect - 0.5) * 0.16);
      effectiveRate = Math.max(0.75, settings.speed - (affect - 0.5) * 0.12);
    } else if (settings.persona === 'Marie') {
      // Marie gains elevated pitch and French melodic cadence
      effectivePitch = Math.min(1.4, settings.pitch + (affect - 0.5) * 0.14);
      effectiveRate = Math.max(0.85, settings.speed - (affect - 0.5) * 0.08);
    } else if (settings.persona === 'Sophisticated Gentleman') {
      // Southern cadence takes a measured, distinguished drawl
      effectiveRate = Math.max(0.80, settings.speed - (affect - 0.5) * 0.14);
    } else if (settings.persona === 'Madame Blavatsky') {
      // Grounded resonance and contemplative pacing
      effectivePitch = Math.max(0.65, settings.pitch - (affect - 0.5) * 0.10);
      effectiveRate = Math.max(0.78, settings.speed - (affect - 0.5) * 0.10);
    }

    utterance.pitch = Math.max(0.5, Math.min(1.8, effectivePitch));
    utterance.rate = Math.max(0.5, Math.min(1.8, effectiveRate));

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

  public testVoice(settings: VoiceSettings, customPhrase?: string): void {
    const profile = PERSONA_PROFILES[settings.persona] || PERSONA_PROFILES['Madame Blavatsky'];
    if (customPhrase) {
      this.speak(customPhrase, settings);
      return;
    }

    const affect = typeof settings.affectIntensity === 'number' ? settings.affectIntensity : 0.85;
    let phrase = profile.testPhrase;
    if (profile.sampleQuotes) {
      if (affect >= 0.86) {
        phrase = profile.sampleQuotes.immersion;
      } else if (affect >= 0.66) {
        phrase = profile.sampleQuotes.pronounced;
      } else if (affect >= 0.40) {
        phrase = profile.sampleQuotes.balanced;
      } else {
        phrase = profile.sampleQuotes.subtle;
      }
    }
    this.speak(phrase, settings);
  }
}

export const voiceEngine = new VoiceEngine();
