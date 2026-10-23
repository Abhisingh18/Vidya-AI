import type PptxGenJS from 'pptxgenjs';
import {
  SLIDE_THEMES, type DiagramItem, type Slide, type SlideDiagram, type SlideImage, type SlidesContent,
} from '@/lib/teacher-docs';

// Editable .pptx (PowerPoint / Google Slides / Keynote) following the Visual contract in
// teacher-docs.ts: Commons images are embedded with attribution, diagrams are native shapes,
// and every slide fades in. Runs in the browser.

type PSlide = PptxGenJS.Slide;
type TextOpts = PptxGenJS.TextPropsOptions;
interface Box { x: number; y: number; w: number; h: number }
interface Theme { bg: string; fg: string; accent: string; muted: string; tint: string; hairline: string; dark: boolean }
/** A fetched image as a data URL plus its real pixel size. */
interface Picture { data: string; w: number; h: number }
/** One paragraph; `pt` is the size before shrink-to-fit scaling. */
interface Para { text: string; pt: number; color: string; bold?: boolean; emoji?: boolean; after?: number; bullet?: TextOpts['bullet'] }

const H = 7.5;                        // LAYOUT_WIDE is 13.33 x 7.5 in
const X0 = 0.8, CW = 11.75;           // content column (accent bar on the left)
const FONT = 'Arial';                 // PowerPoint falls back to an Indic font for Devanagari etc.
const EMOJI_FONT = 'Segoe UI Emoji';  // colour emoji on Windows; Mac/Keynote fall back to Apple Color Emoji
const IMAGE_TIMEOUT_MS = 12_000;
const EMBEDDABLE = ['image/jpeg', 'image/png', 'image/gif'];
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const TRANSITION = '<p:transition spd="med"><p:fade/></p:transition>';

/** Build and download an editable .pptx (PowerPoint / Google Slides / Keynote). */
export async function exportPptx(title: string, content: SlidesContent) {
  const [{ default: PptxGenJS }, { default: JSZip }, pictures] = await Promise.all([
    import('pptxgenjs'),
    import('jszip'),
    Promise.all(content.slides.map(s => (showsImage(s) && s.image ? loadPicture(s.image) : null))),
  ]);
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = title;
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };
  const t = palette(content.theme);

  content.slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: t.bg };
    slide.addShape('rect', { x: 0, y: 0, w: 0.16, h: H, fill: { color: t.accent }, line: { color: t.accent } });
    drawSlide(slide, s, pictures[i], t);
    const notes = speakerNotes(s, pictures[i]);
    if (notes) slide.addNotes(notes);
  });

  // pptxgenjs has no transition API: patch the slide XML before zipping it up again.
  const zip = await new JSZip().loadAsync((await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer);
  await Promise.all(Object.keys(zip.files).map(async name => {
    const patch = /^ppt\/slides\/slide\d+\.xml$/.test(name) ? addTransition
      : /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name) ? splitNoteLines : null;
    if (patch) zip.file(name, patch(await zip.files[name].async('string')));
  }));
  const blob = await zip.generateAsync({ type: 'blob', mimeType: PPTX_MIME, compression: 'DEFLATE' });
  download(blob, `${fileName(title)}.pptx`);
}

// ── Layouts ──────────────────────────────────────────────────────────

function drawSlide(slide: PSlide, s: Slide, pic: Picture | null, t: Theme) {
  const bullets = s.bullets.filter(Boolean);
  const vis = !!pic || !!s.emoji; // something to show beside the text

  if (s.layout === 'title') {
    const w = vis ? 6.4 : 11.3;
    if (pic && s.emoji) slide.addText(s.emoji, { x: 1, y: 1, w: 1.6, h: 1.1, fontFace: EMOJI_FONT, fontSize: 56, margin: 0, valign: 'bottom' });
    const tb = { x: 1, y: 2.2, w, h: 2 };
    slide.addText(s.title, { ...tb, ...plain(t.fg), fontSize: fitPt(s.title, tb, 46, 26, true), bold: true, valign: 'bottom' });
    slide.addShape('rect', { x: 1, y: 4.4, w: 1.6, h: 0.09, fill: { color: t.accent }, line: { color: t.accent } });
    if (s.subtitle) {
      const sb = { x: 1, y: 4.65, w, h: 1.5 };
      slide.addText(s.subtitle, { ...sb, ...plain(t.muted), fontSize: fitPt(s.subtitle, sb, 24, 14), valign: 'top' });
    }
    if (vis) visual(slide, s, pic, { x: 7.85, y: 0.85, w: 4.7, h: 5.5 }, t);
    return;
  }

  if (s.layout === 'quote') {
    const w = vis ? 6.9 : CW;
    const quote = s.subtitle || bullets[0] || '';
    const rest = s.subtitle ? bullets : bullets.slice(1);
    const head = { x: X0 + 0.35, y: 1.2, w: w - 0.35, h: 0.6 };
    slide.addText(s.title.toUpperCase(), { ...head, ...plain(t.accent), fontSize: fitPt(s.title, head, 18, 12, true), bold: true, charSpacing: 1 });
    const qb = { x: X0 + 0.35, y: 1.95, w: w - 0.35, h: rest.length ? 3 : 4.4 };
    slide.addShape('rect', { x: X0, y: qb.y + 0.1, w: 0.09, h: qb.h - 0.2, fill: { color: t.accent }, line: { color: t.accent } });
    if (quote) slide.addText(`“${quote}”`, { ...qb, ...plain(t.fg), fontSize: fitPt(`“${quote}”`, qb, 36, 18, true), bold: true, valign: 'middle' });
    if (rest.length) {
      const rb = { x: qb.x, y: qb.y + qb.h + 0.25, w: qb.w, h: 6.95 - (qb.y + qb.h + 0.25) };
      const paras = rest.map(text => ({ text, pt: 20, color: t.muted, after: 6 }));
      slide.addText(runs(paras, fitScale([{ paras, w: rb.w, h: rb.h }], 0.6)), { ...rb, ...plain(t.muted), valign: 'top' });
    }
    if (vis) visual(slide, s, pic, { x: 8.1, y: 1.2, w: 4.45, h: 5.4 }, t);
    return;
  }

  const top = header(slide, s, t);

  if (s.layout === 'two-column') {
    const cols = [bullets, s.right.filter(Boolean)].map(items => bulletParas(items, 24, t));
    const w = (CW - 0.35) / 2, h = 6.95 - top, m = 14 / 72;
    const sc = fitScale(cols.map(paras => ({ paras, w: w - 2 * m, h: h - 2 * m })), 0.55);
    const ph = Math.min(h, Math.max(3.2, ...cols.map(p => blockHeight(p, w - 2 * m, sc) + 2 * m + 0.3)));
    cols.forEach((paras, i) => panel(slide, paras, { x: X0 + i * (w + 0.35), y: top + 0.1, w, h: ph }, t, { s: sc, h: ph }));
    return;
  }

  if (s.layout === 'diagram') {
    const caption = bullets.slice(0, 2);
    const bottom = caption.length ? 6.1 : 7;
    const area = { x: X0, y: top + 0.1, w: CW, h: bottom - top - 0.1 };
    if (s.diagram && s.diagram.items.some(hasContent)) drawDiagram(slide, s.diagram, area, t);
    else if (s.emoji) emojiBadge(slide, s.emoji, area, t);
    if (caption.length) {
      const cb = { x: X0, y: bottom + 0.15, w: CW, h: 6.95 - bottom - 0.15 };
      const paras = caption.map(text => ({ text, pt: 18, color: t.fg, after: 2 }));
      slide.addText(runs(paras, fitScale([{ paras, w: cb.w, h: cb.h }], 0.65)), { ...cb, ...plain(t.fg), align: 'center', valign: 'middle' });
    }
    return;
  }

  if (s.layout === 'image') {
    if (!vis) { bulletText(slide, bulletParas(bullets, 26, t), { x: X0, y: top, w: CW, h: 6.95 - top }, 'top'); return; }
    const heroW = bullets.length ? 7.6 : CW;
    visual(slide, s, pic, { x: X0, y: top, w: heroW, h: 6.6 - top }, t);
    if (bullets.length) panel(slide, bulletParas(bullets, 22, t), { x: X0 + heroW + 0.35, y: top, w: CW - heroW - 0.35, h: 6.6 - top }, t);
    return;
  }

  // bullets / summary
  const paras = bulletParas(bullets, 26, t, s.layout === 'summary');
  bulletText(slide, paras, { x: X0, y: top, w: vis ? 7 : CW, h: 6.95 - top }, vis ? 'middle' : 'top');
  if (vis) visual(slide, s, pic, { x: 8.1, y: top, w: 4.45, h: 6.6 - top }, t);
}

/** Title + optional subtitle across the top; returns where the content starts. */
function header(slide: PSlide, s: Slide, t: Theme): number {
  const tb = { x: X0, y: 0.35, w: CW, h: 0.95 };
  slide.addText(s.title, { ...tb, ...plain(t.fg), fontSize: fitPt(s.title, tb, 32, 20, true), bold: true, valign: 'middle' });
  if (!s.subtitle) return 1.5;
  const sb = { x: X0, y: 1.25, w: CW, h: 0.5 };
  slide.addText(s.subtitle, { ...sb, ...plain(t.muted), fontSize: fitPt(s.subtitle, sb, 18, 12), valign: 'top' });
  return 1.9;
}

function bulletParas(items: string[], pt: number, t: Theme, check = false): Para[] {
  return items.map(text => ({ text, pt, color: t.fg, after: 10, bullet: check ? { code: '2713' } : true }));
}

/** Bullets straight on the slide background (centred beside a picture, otherwise from the top). */
function bulletText(slide: PSlide, paras: Para[], box: Box, valign: 'top' | 'middle') {
  if (!paras.length) return;
  const m = 4 / 72;
  slide.addText(runs(paras, fitScale([{ paras, w: box.w - 2 * m, h: box.h - 2 * m }], 0.55)), { ...box, ...plain(''), margin: 4, valign });
}

/** Text in a tinted rounded panel, shrunk to fit and vertically centred in `box`. */
function panel(slide: PSlide, paras: Para[], box: Box, t: Theme, o: { s?: number; h?: number } = {}) {
  if (!paras.length) return;
  const m = 14 / 72;
  const s = o.s ?? fitScale([{ paras, w: box.w - 2 * m, h: box.h - 2 * m }], 0.55);
  const h = o.h ?? Math.min(box.h, Math.max(1.2, blockHeight(paras, box.w - 2 * m, s) + 2 * m + 0.3));
  slide.addText(runs(paras, s), {
    x: box.x, y: box.y + (box.h - h) / 2, w: box.w, h, ...plain(t.fg), margin: 14, valign: 'middle',
    shape: 'roundRect', rectRadius: 0.15, fill: { color: t.tint }, line: { color: t.tint },
  });
}

// ── Pictures ─────────────────────────────────────────────────────────

/** The image beside the text, or the slide emoji when there is no (loadable) image. */
function visual(slide: PSlide, s: Slide, pic: Picture | null, box: Box, t: Theme) {
  if (pic && s.image) picture(slide, s.image, pic, box, t);
  else if (s.emoji) emojiBadge(slide, s.emoji, box, t);
}

/** Image fitted inside `box` on a white card (transparent diagrams stay readable on dark themes), credit underneath. */
function picture(slide: PSlide, img: SlideImage, pic: Picture, box: Box, t: Theme) {
  const pad = 0.1;
  const k = Math.min((box.w - 2 * pad) / pic.w, (box.h - 2 * pad) / pic.h);
  const w = pic.w * k, h = pic.h * k;
  const x = box.x + (box.w - w) / 2, y = box.y + (box.h - h) / 2;
  slide.addShape('roundRect', {
    x: x - pad, y: y - pad, w: w + 2 * pad, h: h + 2 * pad, rectRadius: 0.12,
    fill: { color: 'FFFFFF' }, line: { color: t.dark ? 'FFFFFF' : t.hairline, width: 0.75 },
    shadow: { type: 'outer', blur: 8, offset: 2, angle: 90, color: '000000', opacity: t.dark ? 0.45 : 0.15 },
  });
  slide.addImage({ data: pic.data, x, y, w, h, altText: img.title });
  const credit = attribution({ ...img, credit: img.credit.length > 60 ? `${img.credit.slice(0, 59)}…` : img.credit });
  const cb = { x: box.x, y: y + h + pad + 0.04, w: box.w, h: 0.3 };
  slide.addText(credit, { ...cb, ...plain(t.muted), fontSize: fitPt(credit, cb, 9, 7), align: 'center', valign: 'top' });
}

function emojiBadge(slide: PSlide, emoji: string, box: Box, t: Theme) {
  const d = Math.min(box.w, box.h, 3.6);
  slide.addText(emoji, {
    x: box.x + (box.w - d) / 2, y: box.y + (box.h - d) / 2, w: d, h: d, shape: 'ellipse',
    fill: { color: t.tint }, line: { color: t.tint }, fontFace: EMOJI_FONT, fontSize: Math.round(d * 72 * 0.45),
    align: 'center', valign: 'middle', margin: 0,
  });
}

const showsImage = (s: Slide) => !!s.image && s.layout !== 'two-column' && s.layout !== 'diagram';
const attribution = (img: SlideImage) => [img.credit, img.license, 'Wikimedia Commons'].filter(Boolean).join(' · ');

/** Fetch a Commons thumbnail (CORS-enabled) as a data URL; null on any failure or timeout. */
async function loadPicture(img: SlideImage): Promise<Picture | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), IMAGE_TIMEOUT_MS);
  let bitmap: ImageBitmap | null = null;
  try {
    const res = await fetch(img.url, { signal: ctrl.signal, credentials: 'omit' });
    if (!res.ok) return null;
    const blob = await res.blob();
    let w = img.width, h = img.height;
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(blob); // also proves the bytes are a decodable image
      w = bitmap.width;
      h = bitmap.height;
    }
    if (!w || !h) return null;
    if (EMBEDDABLE.includes(blob.type.split(';')[0])) return { data: await dataUrl(blob), w, h };
    if (!bitmap) return null;
    // e.g. WebP: re-encode as PNG, which every PowerPoint version can show
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
    return { data: canvas.toDataURL('image/png'), w, h };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    bitmap?.close();
  }
}

const dataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

// ── Diagrams (native, editable shapes) ───────────────────────────────

const hasContent = (i: DiagramItem) => !!(i.label || i.emoji || i.detail);

function drawDiagram(slide: PSlide, d: SlideDiagram, area: Box, t: Theme) {
  const items = d.items.filter(hasContent);
  if (d.kind === 'cycle') cycle(slide, items, area, t);
  else if (d.kind === 'cards') cards(slide, items, area, t);
  else flow(slide, items, area, t);
}

function itemParas(it: DiagramItem, t: Theme, emojiPt = 0): Para[] {
  const out: Para[] = [];
  if (it.emoji && emojiPt) out.push({ text: it.emoji, pt: emojiPt, color: t.fg, emoji: true, after: 6 });
  if (it.label) out.push({ text: it.label, pt: 24, color: t.fg, bold: true, after: 4 });
  if (it.detail) out.push({ text: it.detail, pt: 16, color: t.muted });
  return out;
}

const CARD_M = 8; // inner margin, pt

function card(slide: PSlide, paras: Para[], s: number, box: Box, t: Theme, extra: TextOpts = {}) {
  slide.addText(runs(paras, s), {
    ...box, ...plain(t.fg), margin: CARD_M, align: 'center', valign: 'middle',
    shape: 'roundRect', rectRadius: 0.15, fill: { color: t.tint }, line: { color: t.accent, width: 1.5 }, ...extra,
  });
}

/** Steps left → right with block arrows between them. */
function flow(slide: PSlide, items: DiagramItem[], area: Box, t: Theme) {
  const n = items.length, pad = (2 * CARD_M) / 72;
  const gap = n <= 3 ? 0.8 : n === 4 ? 0.6 : 0.45;
  const w = Math.min(3.4, (area.w - (n - 1) * gap) / n);
  const paras = items.map(it => itemParas(it, t, Math.min(60, Math.round(w * 72 * 0.3))));
  const s = fitScale(paras.map(p => ({ paras: p, w: w - pad, h: area.h - pad })), 0.45);
  const h = clampH(paras, w - pad, s, pad, 2.6, area.h);
  const x0 = area.x + (area.w - (n * w + (n - 1) * gap)) / 2, y = area.y + (area.h - h) / 2;
  paras.forEach((p, i) => {
    const x = x0 + i * (w + gap);
    card(slide, p, s, { x, y, w, h }, t);
    if (i < n - 1) arrow(slide, [x + w + 0.07, y + h / 2], [x + w + gap - 0.07, y + h / 2], t, Math.min(0.5, gap * 0.8));
  });
}

/** Concept cards in a grid, at most 3 per row (4 → 2 x 2). */
function cards(slide: PSlide, items: DiagramItem[], area: Box, t: Theme) {
  const n = items.length, pad = (2 * CARD_M) / 72, gap = 0.35;
  const cols = n === 4 ? 2 : Math.min(3, n), rows = Math.ceil(n / cols);
  const w = Math.min(cols === 2 ? 4.6 : 3.6, (area.w - (cols - 1) * gap) / cols);
  const maxH = (area.h - (rows - 1) * gap) / rows;
  const paras = items.map(it => itemParas(it, t, Math.min(60, Math.round(Math.min(w, maxH) * 72 * 0.3))));
  const s = fitScale(paras.map(p => ({ paras: p, w: w - pad, h: maxH - pad })), 0.45);
  const h = clampH(paras, w - pad, s, pad, rows > 1 ? 1.8 : 2.6, maxH);
  const y0 = area.y + (area.h - (rows * h + (rows - 1) * gap)) / 2;
  paras.forEach((p, i) => {
    const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, n - r * cols);
    const x = area.x + (area.w - (inRow * w + (inRow - 1) * gap)) / 2 + c * (w + gap);
    card(slide, p, s, { x, y: y0 + r * (h + gap), w, h }, t);
  });
}

/** Items around an ellipse, each with an arrow to the next, closing the loop. */
function cycle(slide: PSlide, items: DiagramItem[], area: Box, t: Theme) {
  const n = items.length, pad = (2 * CARD_M) / 72;
  const w = n <= 4 ? 3.1 : 2.8;
  // Keep vertically stacked neighbours (5–6 items) at least ~0.55in apart for their arrow.
  const stackLimit = n === 6 ? (area.h / 2 - 0.55) / 1.5 : n === 5 ? (0.559 * area.h - 0.55) / 1.559 : Infinity;
  const hMax = Math.max(1, Math.min(n <= 4 ? 1.7 : 1.5, stackLimit));
  const ew = Math.min(0.95, hMax * 0.75); // emoji column on the card's left
  const paras = items.map(it => itemParas(it, t));
  const tw = w - ew - pad - 0.08;
  const s = fitScale(paras.map(p => ({ paras: p, w: tw, h: hMax - pad })), 0.45);
  const h = clampH(paras, tw, s, pad, 1.1, hMax);
  const cx = area.x + area.w / 2, cy = area.y + area.h / 2;
  const rx = Math.min(n === 2 ? 3.3 : 4.4, (area.w - w) / 2), ry = (area.h - h) / 2;
  const start = n === 2 ? 180 : -90; // 2 items side by side, otherwise clockwise from the top
  const centers = items.map((_, i): [number, number] => {
    const a = ((start + (i * 360) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });

  centers.forEach(([x, y], i) => {
    const it = items[i];
    const box = { x: x - w / 2, y: y - h / 2, w, h };
    card(slide, paras[i], s, box, t, it.emoji ? { align: 'left', margin: [(ew + 0.08) * 72, CARD_M, CARD_M, CARD_M] } : {});
    if (it.emoji) slide.addText(it.emoji, {
      x: box.x + 0.06, y: box.y, w: ew, h, fontFace: EMOJI_FONT, fontSize: Math.round(ew * 72 * 0.55),
      align: 'center', valign: 'middle', margin: 0,
    });
  });
  // Arrows run between card edges; the two arrows of a 2-item loop sit above/below each other.
  const exit = (ux: number, uy: number) => Math.min(ux ? w / 2 / Math.abs(ux) : Infinity, uy ? h / 2 / Math.abs(uy) : Infinity);
  centers.forEach(([ax, ay], i) => {
    const [bx, by] = centers[(i + 1) % n];
    const len = Math.hypot(bx - ax, by - ay);
    const ux = (bx - ax) / len, uy = (by - ay) / len;
    const e = exit(ux, uy) + 0.08, off = n === 2 ? 0.38 : 0;
    const ox = uy * off, oy = -ux * off; // outward normal for clockwise travel
    arrow(slide, [ax + ux * e + ox, ay + uy * e + oy], [bx - ux * e + ox, by - uy * e + oy], t, 0.36);
  });
  if (n >= 3) {
    const d = Math.min(1.1, ry * 0.6);
    slide.addText('🔄', {
      x: cx - d / 2, y: cy - d / 2, w: d, h: d, shape: 'ellipse', fill: { color: t.tint }, line: { color: t.tint },
      fontFace: EMOJI_FONT, fontSize: Math.round(d * 72 * 0.45), align: 'center', valign: 'middle', margin: 0,
    });
  }
}

/** Card height: content plus padding, between `min` and `max`. */
function clampH(paras: Para[][], w: number, s: number, pad: number, min: number, max: number) {
  const content = Math.max(...paras.map(p => blockHeight(p, w, s)));
  return Math.min(max, Math.max(Math.min(min, max), content + pad + 0.3));
}

/** Block arrow from `a` to `b` (rotated `rightArrow`, so it stays one editable shape). */
function arrow(slide: PSlide, a: [number, number], b: [number, number], t: Theme, thick: number) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (len < 0.15) return;
  const th = Math.min(thick, len * 0.9);
  const deg = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  slide.addShape('rightArrow', {
    x: (a[0] + b[0]) / 2 - len / 2, y: (a[1] + b[1]) / 2 - th / 2, w: len, h: th,
    rotate: Math.round(((deg % 360) + 360) % 360), fill: { color: t.accent }, line: { color: t.accent },
  });
}

// ── Text fitting ─────────────────────────────────────────────────────
// PowerPoint only applies "shrink on overflow" after an edit, so pick sizes that fit up front.

const plain = (color: string): TextOpts => ({ fontFace: FONT, color: color || undefined, margin: 0, fit: 'shrink' });

function runs(paras: Para[], s: number): PptxGenJS.TextProps[] {
  if (!paras.length) return [{ text: '' }];
  return paras.map((p, i) => ({
    text: p.text,
    options: {
      fontFace: p.emoji ? EMOJI_FONT : FONT, fontSize: Math.max(8, Math.floor(p.pt * s)), color: p.color,
      bold: !!p.bold, bullet: p.bullet, paraSpaceAfter: p.after ? Math.round(p.after * s) : 0,
      breakLine: i < paras.length - 1,
    },
  }));
}

/** Largest single-paragraph font size (pt) that fits `box`. */
function fitPt(text: string, box: Box, max: number, min: number, bold = false): number {
  const paras = [{ text, pt: max, color: '', bold }];
  return Math.max(min, Math.floor(max * fitScale([{ paras, w: box.w, h: box.h }], min / max)));
}

/** Largest scale (≤ 1, ≥ min) at which every block's paragraphs fit its w × h (inches). */
function fitScale(blocks: { paras: Para[]; w: number; h: number }[], min: number): number {
  for (let s = 1; s > min; s -= 0.04) if (blocks.every(b => blockHeight(b.paras, b.w, s) <= b.h)) return s;
  return min;
}

const INDIC = /[ऀ-෿]/; // Devanagari … Sinhala: taller lines than Latin

function blockHeight(paras: Para[], w: number, s: number): number {
  return paras.reduce((sum, p) => {
    const pt = Math.max(8, Math.floor(p.pt * s));
    const lineH = (pt * (p.emoji ? 1.25 : INDIC.test(p.text) ? 1.5 : 1.2)) / 72;
    const width = w - (p.bullet ? 0.4 : 0);
    return sum + lineCount(p.text, pt, !!p.bold, width) * lineH + ((p.after ?? 0) * s) / 72;
  }, 0);
}

let measureCtx: CanvasRenderingContext2D | null | undefined;

/** Text width in inches (canvas measurement, with a rough fallback). */
function textWidth(text: string, pt: number, bold: boolean): number {
  if (measureCtx === undefined) measureCtx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  if (!measureCtx) return (text.length * pt * 0.55) / 72;
  measureCtx.font = `${bold ? 'bold ' : ''}${pt}px ${FONT}, sans-serif`;
  return measureCtx.measureText(text).width / 72;
}

/** Greedy word wrap; 8% slack for font differences between the browser and PowerPoint. */
function lineCount(text: string, pt: number, bold: boolean, width: number): number {
  const max = Math.max(0.1, width / 1.08);
  const space = textWidth(' ', pt, bold);
  let lines = 1, cur = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const ww = textWidth(word, pt, bold);
    if (cur > 0 && cur + space + ww > max) { lines++; cur = 0; }
    if (ww > max) { lines += Math.ceil(ww / max) - 1; cur = ww % max; }
    else cur += (cur > 0 ? space : 0) + ww;
  }
  return lines;
}

// ── Theme ────────────────────────────────────────────────────────────

function palette(name: SlidesContent['theme']): Theme {
  const c = SLIDE_THEMES[name] ?? SLIDE_THEMES.saffron;
  const dark = luminance(c.bg) < 0.4;
  return { ...c, dark, tint: mix(c.accent, c.bg, dark ? 0.2 : 0.1), hairline: mix(c.fg, c.bg, 0.15) };
}

const rgb = (hex: string) => [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
const luminance = (hex: string) => rgb(hex).reduce((sum, v, i) => sum + v * [0.299, 0.587, 0.114][i], 0) / 255;

/** `a` blended over `b` with weight `wa`. */
function mix(a: string, b: string, wa: number): string {
  const [ca, cb] = [rgb(a), rgb(b)];
  return ca.map((v, i) => Math.round(v * wa + cb[i] * (1 - wa)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ── Notes, transitions, download ─────────────────────────────────────

function speakerNotes(s: Slide, pic: Picture | null): string {
  const img = showsImage(s) ? s.image : null;
  const credit = img && (pic
    ? `Image: ${img.title} — ${attribution(img)}${img.page ? ` — ${img.page}` : ''}`
    : `Suggested image (could not be downloaded): ${img.page || img.url}`);
  const meta = [s.visual && `Visual: ${s.visual}`, credit].filter(Boolean).join('\n');
  return [s.notes, meta].filter(Boolean).join('\n\n');
}

/** <p:transition> goes after <p:cSld>/<p:clrMapOvr> and before <p:timing>/<p:extLst> (PresentationML order). */
function addTransition(xml: string): string {
  if (xml.includes('<p:transition')) return xml;
  const m = /<p:clrMapOvr\b[^>]*\/>|<\/p:clrMapOvr>/.exec(xml) ?? /<\/p:cSld>/.exec(xml);
  if (!m) return xml;
  const at = m.index + m[0].length;
  return xml.slice(0, at) + TRANSITION + xml.slice(at);
}

/** pptxgenjs writes the notes as one run with raw line breaks; give each line its own paragraph. */
function splitNoteLines(xml: string): string {
  return xml.replace(
    /<a:p><a:r>(<a:rPr[^>]*\/>)<a:t>([^<]*)<\/a:t><\/a:r>(<a:endParaRPr[^>]*\/>)<\/a:p>/,
    (all, rPr: string, text: string, end: string) => {
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return all;
      return lines.map(l => (l ? `<a:p><a:r>${rPr}<a:t>${l}</a:t></a:r></a:p>` : `<a:p>${end}</a:p>`)).join('');
    },
  );
}

/** Keep the title (incl. Hindi etc.), dropping only characters file systems reject. */
function fileName(title: string): string {
  const safe = Array.from(title, c => (c < ' ' || '\\/:*?"<>|'.includes(c) ? ' ' : c)).join('');
  return safe.replace(/\s+/g, ' ').trim().replace(/^\.+/, '').slice(0, 120) || 'slides';
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
