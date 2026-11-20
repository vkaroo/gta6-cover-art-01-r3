// Sunset Cover Studio — colour grades.
//
// Each grade is one look for the whole cover: a photo filter applied to
// every panel, a warm wash over the art, a sun glow, and the lettering
// colours. The four grades are Sunset (golden hour), Neon (pink night),
// Palm (teal daylight) and Noir (black-and-white).
export const GRADES = {
  sunset: {
    label: 'Sunset',
    photoFilter: 'saturate(1.28) contrast(1.07) sepia(0.20)',
    washTop: 'rgba(255, 122, 26, 0.20)',
    washBottom: 'rgba(120, 20, 80, 0.28)',
    glowColor: 'rgba(255, 190, 90, 0.55)',
    accent: '#ffb347',
    title: '#ffffff',
    titleEdge: 'rgba(40, 8, 30, 0.9)',
  },
  neon: {
    label: 'Neon',
    photoFilter: 'saturate(1.65) contrast(1.12) hue-rotate(-10deg)',
    washTop: 'rgba(255, 45, 149, 0.20)',
    washBottom: 'rgba(20, 10, 70, 0.34)',
    glowColor: 'rgba(255, 80, 200, 0.5)',
    accent: '#ff5db1',
    title: '#ffffff',
    titleEdge: 'rgba(30, 0, 40, 0.9)',
  },
  palm: {
    label: 'Palm',
    photoFilter: 'saturate(1.18) contrast(1.03) sepia(0.08)',
    washTop: 'rgba(64, 224, 208, 0.16)',
    washBottom: 'rgba(10, 60, 60, 0.26)',
    glowColor: 'rgba(255, 240, 170, 0.5)',
    accent: '#5eead4',
    title: '#ffffff',
    titleEdge: 'rgba(0, 40, 40, 0.9)',
  },
  noir: {
    label: 'Noir',
    photoFilter: 'grayscale(1) contrast(1.18) brightness(0.94)',
    washTop: 'rgba(255, 255, 255, 0.10)',
    washBottom: 'rgba(0, 0, 0, 0.34)',
    glowColor: 'rgba(255, 255, 255, 0.35)',
    accent: '#e5e5e5',
    title: '#ffffff',
    titleEdge: 'rgba(0, 0, 0, 0.95)',
  },
};

export const GRADE_IDS = Object.keys(GRADES);
