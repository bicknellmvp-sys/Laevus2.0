// Speech-to-Text (STT) Service using Web Speech API

export interface SpeechRecognitionResultHandler {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class SpeechToTextEngine {
  private recognition: any = null;
  private isListeningState: boolean = false;
  private currentHandler: SpeechRecognitionResultHandler | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (this.currentHandler) {
            const combined = finalTranscript || interimTranscript;
            if (combined.trim()) {
              this.currentHandler.onResult(combined, Boolean(finalTranscript));
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          if (this.currentHandler?.onError) {
            this.currentHandler.onError(event.error);
          }
          this.isListeningState = false;
        };

        this.recognition.onend = () => {
          this.isListeningState = false;
          if (this.currentHandler?.onEnd) {
            this.currentHandler.onEnd();
          }
        };
      }
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public isListening(): boolean {
    return this.isListeningState;
  }

  public start(handler: SpeechRecognitionResultHandler): boolean {
    if (!this.recognition) {
      if (handler.onError) {
        handler.onError('Speech recognition is not supported in this browser.');
      }
      return false;
    }

    try {
      this.currentHandler = handler;
      this.recognition.start();
      this.isListeningState = true;
      return true;
    } catch (err: any) {
      // If already started, stop and restart
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListeningState = false;
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListeningState) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListeningState = false;
      if (this.currentHandler?.onEnd) {
        this.currentHandler.onEnd();
      }
    }
  }
}

export const speechToTextEngine = new SpeechToTextEngine();
