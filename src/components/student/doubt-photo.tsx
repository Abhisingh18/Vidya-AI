'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, RefreshCw, X } from 'lucide-react';

// Photo of a question: camera (phones), file upload, drag & drop or paste.
// The photo is resized/compressed in the browser (JPEG, ≤ 1280 px, ~≤ 400 KB)
// so uploads are quick on mobile data and stay under the API's 1.5 MB limit.

export interface PhotoData {
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
}

const MAX_SIDE = 1280;
const TARGET_BYTES = 400 * 1024;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

const dataUrlBytes = (u: string) => {
  const b64 = u.slice(u.indexOf(',') + 1);
  return Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
};

async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch { /* fall back to <img> */ }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Couldn't open that photo — please use a JPG or PNG (iPhone: Settings → Camera → Formats → Most Compatible).");
  }
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
}

/** Resizes to ≤ 1280 px and re-encodes as JPEG, lowering quality/size until ≤ ~400 KB. */
export async function compressImage(file: Blob): Promise<PhotoData> {
  if (file.type && !file.type.startsWith('image/')) throw new Error('Please choose a photo (JPG or PNG).');
  if (file.size > MAX_INPUT_BYTES) throw new Error('That file is too large — please choose a photo under 25 MB.');
  const img = await decode(file);
  try {
    if (!img.width || !img.height) throw new Error("Couldn't open that photo — please try another one.");
    let scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    let best: PhotoData | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Your browser could not process the photo.');
      ctx.fillStyle = '#fff'; // transparent PNGs → white paper, not black
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img.source, 0, 0, width, height);
      for (const q of [0.85, 0.75, 0.65, 0.55]) {
        const dataUrl = canvas.toDataURL('image/jpeg', q);
        const bytes = dataUrlBytes(dataUrl);
        best = { dataUrl, bytes, width, height };
        if (bytes <= TARGET_BYTES) return best;
      }
      scale *= 0.8;
    }
    return best!;
  } finally {
    img.close();
  }
}

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export default function DoubtPhoto({ photo, onChange, disabled }: {
  photo: PhotoData | null;
  onChange: (photo: PhotoData | null) => void;
  disabled?: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const take = useCallback(async (file: Blob | null | undefined) => {
    if (!file || disabled) return;
    setError(null);
    setWorking(true);
    try {
      onChange(await compressImage(file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setWorking(false);
    }
  }, [disabled, onChange]);

  // Paste a screenshot/photo anywhere on the page (desktop).
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find(f => f.type.startsWith('image/'));
      if (!file) return;
      e.preventDefault();
      take(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [take]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    take(e.target.files?.[0]);
    e.target.value = '';
  };

  const inputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} aria-label="Take a photo of the question" />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={pick} aria-label="Upload a photo of the question" />
    </>
  );

  if (photo) {
    return (
      <div>
        {inputs}
        <div className="relative rounded-2xl overflow-hidden border border-card-border dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
          <img src={photo.dataUrl} alt="Your question photo" className="w-full max-h-80 object-contain" />
          <button type="button" onClick={() => onChange(null)} disabled={disabled}
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-navy/70 text-white flex items-center justify-center hover:bg-navy disabled:opacity-50"
            aria-label="Remove photo" title="Remove photo">
            <X className="w-4 h-4" />
          </button>
          {working && (
            <div className="absolute inset-0 bg-white/70 dark:bg-dark-bg/70 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-saffron" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-2 text-xs text-muted">
          <span>{photo.width}×{photo.height} · {kb(photo.bytes)}</span>
          <button type="button" onClick={() => cameraRef.current?.click()} disabled={disabled || working}
            className="inline-flex items-center gap-1 font-semibold text-saffron hover:underline disabled:opacity-50">
            <RefreshCw className="w-3.5 h-3.5" /> Retake
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      {inputs}
      <div
        onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          take(Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/')) ?? e.dataTransfer.files[0]);
        }}
        className={`rounded-2xl border-2 border-dashed p-5 sm:p-6 text-center transition-colors ${
          dragging ? 'border-saffron bg-saffron/5' : 'border-card-border dark:border-dark-border bg-off-white/60 dark:bg-dark-bg/40'
        }`}
      >
        <div className="w-12 h-12 mx-auto rounded-2xl bg-saffron/10 text-saffron flex items-center justify-center mb-3">
          {working ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
        </div>
        <p className="font-heading font-semibold text-navy dark:text-dark-text">Snap a photo of the question</p>
        <p className="text-xs text-muted mt-1">From your textbook, notebook or worksheet — one question at a time works best.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 max-w-sm mx-auto">
          <button type="button" onClick={() => cameraRef.current?.click()} disabled={disabled || working}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-saffron text-white font-heading font-semibold text-sm hover:bg-saffron-500 disabled:opacity-60">
            <Camera className="w-4 h-4" /> Take photo
          </button>
          <button type="button" onClick={() => uploadRef.current?.click()} disabled={disabled || working}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-card-border dark:border-dark-border text-navy dark:text-dark-text font-heading font-semibold text-sm hover:border-saffron hover:text-saffron disabled:opacity-60">
            <ImagePlus className="w-4 h-4" /> Upload
          </button>
        </div>
        <p className="hidden sm:block text-xs text-muted mt-3">or drag &amp; drop an image here, or paste a screenshot (Ctrl/⌘ + V)</p>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
