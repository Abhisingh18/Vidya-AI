'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './ui';

export interface TeacherDoc<T> {
  id: string; type: string; title: string; topic: string; grade: string; language: string; content: T;
}

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error';

/** Loads a teacher doc and autosaves edits (debounced) back to the server. */
export function useDoc<T>(id: string) {
  const [doc, setDoc] = useState<TeacherDoc<T> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const pending = useRef<{ title?: string; content?: T }>({});

  useEffect(() => {
    api<{ doc: TeacherDoc<T> }>(`/api/teacher/docs/${id}`).then(d => setDoc(d.doc)).catch(e => setLoadError(e.message));
  }, [id]);

  const flush = useCallback(async () => {
    const body = pending.current;
    pending.current = {};
    if (body.title === undefined && body.content === undefined) return;
    setSaveState('saving');
    try {
      await api(`/api/teacher/docs/${id}`, { method: 'PATCH', json: body });
      setSaveState(s => (s === 'saving' ? 'saved' : s));
    } catch {
      setSaveState('error');
    }
  }, [id]);

  const schedule = useCallback(() => {
    setSaveState('unsaved');
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  }, [flush]);

  const setContent = useCallback((update: (c: T) => T) => {
    setDoc(d => {
      if (!d) return d;
      const content = update(d.content);
      pending.current.content = content;
      return { ...d, content };
    });
    schedule();
  }, [schedule]);

  const setTitle = useCallback((title: string) => {
    setDoc(d => (d ? { ...d, title } : d));
    pending.current.title = title;
    schedule();
  }, [schedule]);

  // Save anything pending when leaving the page.
  useEffect(() => () => { clearTimeout(timer.current); void flush(); }, [flush]);

  return { doc, loadError, saveState, setContent, setTitle };
}
