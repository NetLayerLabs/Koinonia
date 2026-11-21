import { useEffect, useRef, useState } from 'react';
import type { LangCode, TraditionId } from '../shared/languages';

/**
 * Read public text aloud (homily, Bible passage, service steps) in a native voice.
 * The phone asks the Koinonia server, which calls ElevenLabs with the church's key and
 * caches the audio, so the whole room shares one generation. If the server has no voice
 * (no key, no credit, an error), it falls back to the browser's built-in voice.
 * Never use this for prayer requests or replies: those are private.
 */

const BROWSER_LANG: Record<LangCode, string> = {
  en: 'en-US',
  it: 'it-IT',
  es: 'es-ES',
  fr: 'fr-FR',
  zh: 'zh-CN',
  ar: 'ar-SA',
  sw: 'sw-KE',
  pt: 'pt-BR',
  pl: 'pl-PL',
  ko: 'ko-KR',
  vi: 'vi-VN',
  uk: 'uk-UA',
};

export type ReadAloudState = 'idle' | 'loading' | 'playing';

// A tiny silent WAV. Playing it inside the tap "unlocks" the audio element on iPhones, which
// otherwise refuse audio started after a network request.
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export function useReadAloud() {
  const [state, setState] = useState<ReadAloudState>('idle');
  const [voice, setVoice] = useState<'native' | 'browser' | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const url = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const stop = () => {
    abort.current?.abort();
    abort.current = null;
    if (audio.current) {
      audio.current.pause();
      audio.current = null;
    }
    if (url.current) {
      URL.revokeObjectURL(url.current);
      url.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setState('idle');
  };

  useEffect(() => stop, []);

  const browserSpeak = (text: string, lang: LangCode) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setState('idle');
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = BROWSER_LANG[lang] ?? 'en-US';
    u.onend = () => setState('idle');
    u.onerror = () => setState('idle');
    setVoice('browser');
    setState('playing');
    window.speechSynthesis.speak(u);
  };

  /** Start reading; calling it again while reading stops. */
  const toggle = async (input: { tradition: TraditionId; lang: LangCode; text: string }) => {
    if (state !== 'idle') {
      stop();
      return;
    }
    setState('loading');
    const ctrl = new AbortController();
    abort.current = ctrl;
    // Create and unlock the player now, while we are still inside the user's tap.
    const a = new Audio();
    a.src = SILENCE;
    a.play().catch(() => undefined);
    audio.current = a;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
        signal: ctrl.signal,
      });
      if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('audio/')) throw new Error('no voice');
      const blob = await res.blob();
      if (ctrl.signal.aborted) return;
      url.current = URL.createObjectURL(blob);
      a.pause();
      a.src = url.current;
      a.onended = () => stop();
      a.onerror = () => stop();
      setVoice('native');
      setState('playing');
      await a.play();
    } catch (e) {
      if (ctrl.signal.aborted) return;
      browserSpeak(input.text, input.lang);
    }
  };

  return { state, voice, toggle, stop };
}
