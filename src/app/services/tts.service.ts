import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface QueueTtsPlugin {
  speak(options: { text: string; lang?: string; rate?: number; pitch?: number }): Promise<{ supported: boolean }>;
  stop(): Promise<void>;
}

const QueueTts = registerPlugin<QueueTtsPlugin>('QueueTts');

@Injectable({ providedIn: 'root' })
export class TtsService {
  async speak(text: string, rate = 0.92): Promise<void> {
    const clean = text.trim();
    if (!clean) return;

    if (Capacitor.isNativePlatform()) {
      try {
        await QueueTts.speak({ text: clean, lang: 'th-TH', rate, pitch: 1.0 });
        return;
      } catch (error) {
        console.warn('Native TTS unavailable, using browser fallback', error);
      }
    }

    if ('speechSynthesis' in window) {
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = 'th-TH';
        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });
    }
  }

  async stop(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try { await QueueTts.stop(); } catch { /* no-op */ }
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
}
