// Sunset Cover Studio — app controller.
//
// Owns the editor state, the controls, photo uploads and sample photos,
// drag-to-pan and zoom per panel, the live preview, PNG export at the three
// post sizes, and the ?shot= scenes the screenshot driver uses.
import { GRADES, GRADE_IDS } from './grades.js';
import { LAYOUTS, LAYOUT_IDS, layoutRects } from './layouts.js';
import { drawCover, renderCover } from './cover.js';

const SIZES = [
  { id: '1080x1080', w: 1080, h: 1080, label: '1080 × 1080' },
  { id: '1080x1350', w: 1080, h: 1350, label: '1080 × 1350' },
  { id: '1920x1080', w: 1920, h: 1080, label: '1920 × 1080' },
];

const SAMPLES = [
  { id: 'beach', label: 'Sample: Beach sunset', src: 'samples/beach.jpg' },
  { id: 'skyline', label: 'Sample: Sunset skyline', src: 'samples/skyline.jpg' },
];

const state = {
  layout: 'vice',
  grade: 'sunset',
  title: 'SUNSET HEIST',
  subtitle: 'NEON NIGHTS',
  size: SIZES[1],
  selected: 0,
  panels: [0, 1, 2, 3].map(() => ({ img: null, zoom: 1, panX: 0, panY: 0, label: '' })),
};

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const previewCtx = preview.getContext('2d');

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('400 40px Anton'),
      document.fonts.load('400 40px "Bebas Neue"'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fall back to system sans if the bundled fonts fail to load.
  }
}

function renderPreview() {
  preview.width = state.size.w;
  preview.height = state.size.h;
  drawCover(preview, state);
}

function refreshControls() {
  document.querySelectorAll('[data-layout]').forEach((b) =>
    b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) =>
    b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) =>
    b.classList.toggle('active', b.dataset.size === state.size.id));
  document.querySelectorAll('[data-panel]').forEach((b) =>
    b.classList.toggle('active', Number(b.dataset.panel) === state.selected));
  const panel = state.panels[state.selected];
  $('zoom').value = String(Math.round(panel.zoom * 100));
  $('zoomVal').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('panelLabel').textContent = `Photo — Panel ${state.selected + 1} of ${layoutRects(state.layout, 1, 1).length}`;
}

function setPanelPhoto(index, img, label) {
  state.panels[index] = { img, zoom: 1, panX: 0, panY: 0, label };
  renderPreview();
  refreshControls();
}

async function loadSample(id) {
  const sample = SAMPLES.find((s) => s.id === id);
  if (!sample) return;
  const img = await loadImage(sample.src);
  setPanelPhoto(state.selected, img, sample.label);
}

function fillAllPanels() {
  const src = state.panels[state.selected];
  if (!src.img) return;
  for (let i = 0; i < state.panels.length; i++) {
    state.panels[i] = { img: src.img, zoom: src.zoom, panX: src.panX, panY: src.panY, label: src.label };
  }
  renderPreview();
}

function downloadPng(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

function exportPng(width, height) {
  const canvas = renderCover(width, height, state);
  downloadPng(canvas, `sunset-cover-${width}x${height}.png`);
  return canvas;
}

function exportPngDataUrl(width, height) {
  return renderCover(width, height, state).toDataURL('image/png');
}

function exportAllSizes() {
  // One click, all three post sizes, staggered so the browser accepts each
  // download instead of blocking the later ones as duplicates.
  SIZES.forEach((size, i) => {
    setTimeout(() => exportPng(size.w, size.h), i * 350);
  });
}

// Exposed for the screenshot driver: exact-size export without a download.
window.__cover = { exportPngDataUrl };

function bindControls() {
  $('upload').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const img = await loadImage(String(reader.result));
        setPanelPhoto(state.selected, img, file.name);
      } catch { /* keep the old photo on a bad file */ }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  for (const sample of SAMPLES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = sample.label;
    b.addEventListener('click', () => loadSample(sample.id));
    $('samples').appendChild(b);
  }
  $('fillAll').addEventListener('click', fillAllPanels);
  $('zoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value) / 100;
    renderPreview();
    refreshControls();
  });
  $('resetPos').addEventListener('click', () => {
    const p = state.panels[state.selected];
    p.zoom = 1; p.panX = 0; p.panY = 0;
    renderPreview();
    refreshControls();
  });
  document.querySelectorAll('[data-panel]').forEach((b) =>
    b.addEventListener('click', () => { state.selected = Number(b.dataset.panel); renderPreview(); refreshControls(); }));
  document.querySelectorAll('[data-layout]').forEach((b) =>
    b.addEventListener('click', () => {
      state.layout = b.dataset.layout;
      state.selected = 0;
      renderPreview();
      refreshControls();
    }));
  document.querySelectorAll('[data-grade]').forEach((b) =>
    b.addEventListener('click', () => { state.grade = b.dataset.grade; renderPreview(); refreshControls(); }));
  document.querySelectorAll('[data-size]').forEach((b) =>
    b.addEventListener('click', () => {
      state.size = SIZES.find((s) => s.id === b.dataset.size) ?? SIZES[1];
      renderPreview();
      refreshControls();
    }));
  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; renderPreview(); });
  $('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; renderPreview(); });
  document.querySelectorAll('[data-export]').forEach((b) =>
    b.addEventListener('click', () => {
      const size = SIZES.find((s) => s.id === b.dataset.export);
      if (size) exportPng(size.w, size.h);
    }));
  $('exportAll').addEventListener('click', exportAllSizes);

  // Drag to pan the selected panel's photo.
  let drag = null;
  preview.addEventListener('pointerdown', (e) => {
    const rect = preview.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const rects = layoutRects(state.layout, 1, 1);
    const hit = rects.findIndex((r) => fx >= r.x && fx < r.x + r.w && fy >= r.y && fy < r.y + r.h);
    if (hit >= 0) {
      state.selected = hit;
      refreshControls();
      drag = { x: e.clientX, y: e.clientY, panX: state.panels[hit].panX, panY: state.panels[hit].panY, rect: rects[hit] };
      preview.setPointerCapture(e.pointerId);
    }
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = preview.getBoundingClientRect();
    const p = state.panels[state.selected];
    p.panX = drag.panX + ((e.clientX - drag.x) / rect.width) / drag.rect.w;
    p.panY = drag.panY + ((e.clientY - drag.y) / rect.height) / drag.rect.h;
    renderPreview();
  });
  preview.addEventListener('pointerup', () => { drag = null; });
}

/** ?shot= scenes for screenshots: editor (app with a photo loaded) and cover (exported cover, full frame). */
async function runShotScene(params) {
  const scene = params.get('shot') ?? 'editor';
  const title = params.get('title');
  const sub = params.get('sub');
  const layout = params.get('layout');
  const grade = params.get('grade');
  if (title) { state.title = title; $('titleInput').value = title; }
  if (sub) { state.subtitle = sub; $('subtitleInput').value = sub; }
  if (layout && LAYOUTS[layout]) state.layout = layout;
  if (grade && GRADES[grade]) state.grade = grade;

  if (scene === 'cover') {
    document.body.classList.add('shot-cover');
    const [w, h] = (params.get('size') ?? '1920x1080').split('x').map(Number);
    const beach = await loadImage('samples/beach.jpg');
    const sky = await loadImage('samples/skyline.jpg');
    const photos = state.layout === 'solo' ? [beach] : state.layout === 'streets' ? [sky, beach, beach, sky] : [beach, sky, beach];
    photos.forEach((img, i) => { state.panels[i] = { img, zoom: 1, panX: 0, panY: 0, label: 'sample' }; });
    await loadFonts();
    const canvas = renderCover(w, h, state);
    const holder = $('shotCanvas');
    holder.width = w;
    holder.height = h;
    holder.getContext('2d').drawImage(canvas, 0, 0);
    window.__shotReady = true;
    return;
  }

  // editor scene: beach in panel 1, skyline in panel 2, beach again in
  // panel 3, so no panel of the Vice layout sits empty in the screenshot.
  const beach = await loadImage('samples/beach.jpg');
  const sky = await loadImage('samples/skyline.jpg');
  setPanelPhoto(0, beach, 'Sample: Beach sunset');
  setPanelPhoto(1, sky, 'Sample: Sunset skyline');
  setPanelPhoto(2, beach, 'Sample: Beach sunset');
  await loadFonts();
  renderPreview();
  refreshControls();
  window.__shotReady = true;
}

async function boot() {
  bindControls();
  refreshControls();
  const params = new URLSearchParams(location.search);
  if (params.has('shot')) {
    await runShotScene(params);
  } else {
    await loadFonts();
    renderPreview();
  }
}

boot();
