'use client';

// Sound for the landing-page samples: a tap turns it on (browsers only allow
// audio after a tap), and only one sample talks at a time. Lines are spoken by
// the reels' voice chain: server voice → browser voice → silent timer.

import { useCallback, useEffect, useRef, useState } from 'react';
import { SceneVoice, unlockReelAudio } from '@/components/shorts/reel-player';
import { getSynth, getTtsStatus, pickVoices, voiceLangs } from '@/components/explainer-player';
import { estimateSeconds } from '@/lib/explainer';

const SOLO = 'vidya-preview-sound';

export function usePreviewVoice(id: string) {
  const [soundOn, setSoundOn] = useState(false);
  const on = useRef(false);
  const voice = useRef<SceneVoice | null>(null);

  const set = useCallback((v: boolean) => {
    on.current = v;
    setSoundOn(v);
    if (!v) voice.current?.stop();
  }, []);

  // another sample started talking: go quiet
  useEffect(() => {
    const quiet = (e: Event) => { if ((e as CustomEvent<string>).detail !== id) set(false); };
    window.addEventListener(SOLO, quiet);
    return () => { window.removeEventListener(SOLO, quiet); voice.current?.stop(); };
  }, [id, set]);

  const toggle = useCallback(() => {
    unlockReelAudio();
    if (!on.current) window.dispatchEvent(new CustomEvent(SOLO, { detail: id }));
    set(!on.current);
  }, [id, set]);

  /** Speak one line in `language` (a LANGUAGES name); onEnd fires when it is done (or fails). */
  const speak = useCallback(async (text: string, language: string, onProgress: (f: number) => void, onEnd: () => void) => {
    const status = await getTtsStatus();
    if (!on.current) return;
    const langs = voiceLangs(language, text);
    const served = status.enabled ? status.languages.map(l => l.toLowerCase()) : [];
    const serverLang = langs.find(l => served.includes(l.toLowerCase())) ?? null;
    const synth = getSynth();
    (voice.current ??= new SceneVoice()).play(text, {
      serverLang, speechLang: langs[0] ?? 'en-IN', voices: synth ? pickVoices(synth.getVoices(), langs) : [],
      muted: false, seconds: estimateSeconds(text, language), onProgress, onEnd,
    });
  }, []);

  const stop = useCallback(() => voice.current?.stop(), []);
  return { soundOn, toggle, setSound: set, speak, stop };
}
