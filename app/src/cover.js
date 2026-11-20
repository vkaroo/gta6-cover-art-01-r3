// Sunset Cover Studio — cover renderer.
//
// Draws the multi-panel poster onto any canvas: photos cover-fit inside
// their panels (per-panel zoom and pan), the grade's filter, wash and sun
// glow, diagonal light streaks, a vignette, and the caption lettering
// (Anton title, Bebas Neue subtitle). Pure canvas 2D, no network.
import { GRADES } from './grades.js';
import { layoutRects } from './layouts.js';

/** Cover-fit draw of one photo inside a panel, with zoom and pan offsets. */
function drawPanelPhoto(ctx, img, rect, zoom, panX, panY) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  // Pan offsets are fractions of the panel; clamp so the photo always
  // covers the whole panel.
  const maxX = Math.max(0, (dw - rect.w) / 2);
  const maxY = Math.max(0, (dh - rect.h) / 2);
  const ox = Math.max(-maxX, Math.min(maxX, panX * rect.w));
  const oy = Math.max(-maxY, Math.min(maxY, panY * rect.h));
  ctx.drawImage(img, rect.x + (rect.w - dw) / 2 + ox, rect.y + (rect.h - dh) / 2 + oy, dw, dh);
}

function fitFont(ctx, text, family, weight, startPx, maxWidth) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

/**
 * Draw the cover described by `state` onto `canvas` at its own size.
 * state: { layout, grade, title, subtitle, panels: [{ img, zoom, panX, panY }] }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const rects = layoutRects(state.layout, W, H);
  const gutter = Math.max(2, Math.round(Math.min(W, H) * 0.008));

  ctx.save();
  ctx.fillStyle = '#0b0714';
  ctx.fillRect(0, 0, W, H);

  // Panels: photo, grade filter, wash, glow.
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    const panel = state.panels[i] ?? {};
    const x = r.x + (i % 2 === 0 && r.x > 0 ? gutter / 2 : 0);
    const inset = {
      x: r.x + gutter / 2,
      y: r.y + gutter / 2,
      w: r.w - gutter,
      h: r.h - gutter,
    };
    if (inset.w <= 0 || inset.h <= 0) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(inset.x, inset.y, inset.w, inset.h);
    ctx.clip();
    if (panel.img) {
      ctx.filter = grade.photoFilter;
      drawPanelPhoto(ctx, panel.img, inset, panel.zoom ?? 1, panel.panX ?? 0, panel.panY ?? 0);
      ctx.filter = 'none';
    } else {
      const empty = ctx.createLinearGradient(inset.x, inset.y, inset.x, inset.y + inset.h);
      empty.addColorStop(0, '#3a2340');
      empty.addColorStop(1, '#160d24');
      ctx.fillStyle = empty;
      ctx.fillRect(inset.x, inset.y, inset.w, inset.h);
    }
    const wash = ctx.createLinearGradient(inset.x, inset.y, inset.x, inset.y + inset.h);
    wash.addColorStop(0, grade.washTop);
    wash.addColorStop(1, grade.washBottom);
    ctx.fillStyle = wash;
    ctx.fillRect(inset.x, inset.y, inset.w, inset.h);
    ctx.restore();
  }

  // Sun glow over the whole cover, top right.
  const glowR = Math.min(W, H) * 0.62;
  const glow = ctx.createRadialGradient(W * 0.8, H * 0.14, 0, W * 0.8, H * 0.14, glowR);
  glow.addColorStop(0, grade.glowColor);
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Diagonal light streaks, the poster shine.
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#ffffff';
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.32);
  ctx.fillRect(-W, -H * 0.02, W * 2, H * 0.02);
  ctx.fillRect(-W, H * 0.05, W * 2, H * 0.012);
  ctx.restore();

  // Vignette.
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Caption: bottom fade, subtitle, then the big title.
  const pad = Math.round(W * 0.045);
  const fade = ctx.createLinearGradient(0, H * 0.6, 0, H);
  fade.addColorStop(0, 'rgba(5, 2, 10, 0)');
  fade.addColorStop(1, 'rgba(5, 2, 10, 0.82)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);

  const title = (state.title || '').toUpperCase();
  const subtitle = (state.subtitle || '').toUpperCase();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  const titlePx = fitFont(ctx, title, 'Anton, sans-serif', 400, Math.round(W * 0.115), W - pad * 2);
  const subPx = Math.max(14, Math.round(titlePx * 0.32));
  const titleY = H - pad;
  const subY = titleY - titlePx * 1.08;

  ctx.save();
  ctx.font = `${subPx}px "Bebas Neue", sans-serif`;
  try { ctx.letterSpacing = `${Math.round(subPx * 0.42)}px`; } catch { /* older canvas */ }
  ctx.fillStyle = grade.accent;
  ctx.fillText(subtitle, pad, subY);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  ctx.restore();

  ctx.save();
  ctx.font = `400 ${titlePx}px Anton, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, Math.round(titlePx * 0.07));
  ctx.strokeStyle = grade.titleEdge;
  ctx.strokeText(title, pad, titleY);
  ctx.fillStyle = grade.title;
  ctx.fillText(title, pad, titleY);
  ctx.restore();

  ctx.restore();
}

/** Render a fresh canvas at exactly w x h and return it. */
export function renderCover(width, height, state) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  return canvas;
}
