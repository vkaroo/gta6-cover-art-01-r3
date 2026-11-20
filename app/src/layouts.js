// Sunset Cover Studio — cover layouts.
//
// A layout is a set of panel rectangles, each as fractions [x, y, w, h] of
// the cover, in draw order. Vice is the classic GTA poster: one hero panel
// across the top and two smaller panels below it. Streets is a 2x2 grid.
// Solo is a single full-bleed photo.
export const LAYOUTS = {
  vice: {
    label: 'Vice',
    panels: [
      [0, 0, 1, 0.62],
      [0, 0.62, 0.5, 0.38],
      [0.5, 0.62, 0.5, 0.38],
    ],
  },
  streets: {
    label: 'Streets',
    panels: [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
  },
  solo: {
    label: 'Solo',
    panels: [[0, 0, 1, 1]],
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

/** Pixel rectangles for a layout at a given cover size. */
export function layoutRects(layoutId, width, height) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.vice;
  return layout.panels.map(([fx, fy, fw, fh]) => ({
    x: Math.round(fx * width),
    y: Math.round(fy * height),
    w: Math.round(fw * width),
    h: Math.round(fh * height),
  }));
}
