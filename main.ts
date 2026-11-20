// Sunset Cover Studio — entry program (Node 22, standard library only).
//
// Hands the entry in: copies app/ and screenshots/ from this repository to
// the output directory and writes /output/dossier.json with buildDossier
// from vendor/makefun-app.ts. Outside the grader, MAKEFUN_OUTPUT_DIR stands
// in for /output. The program runs twice and must write the same bytes both
// times, so every step below is deterministic: sorted file order, fixed
// dossier caps, no timestamps anywhere in the output.
import { buildDossier } from './vendor/makefun-app.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const OUTPUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const DOSSIER_MAX_BYTES = 1572864; // 1.5 MiB, the gate's dossier cap.

function copyTreeInto(src: string, dest: string): number {
  let files = 0;
  const walk = (dir: string): void => {
    for (const entry of readdirSorted(dir)) {
      const from = join(dir, entry);
      const to = join(dest, entry);
      if (statSync(from).isDirectory()) {
        mkdirSync(to, { recursive: true });
        walk(from);
      } else {
        cpSync(from, to);
        files += 1;
      }
    }
  };
  mkdirSync(dest, { recursive: true });
  walk(src);
  return files;
}

function readdirSorted(dir: string): string[] {
  // Deterministic order: sort explicitly so the copy never depends on
  // filesystem ordering.
  return readdirSync(dir).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function main(): void {
  const appDir = join(REPO_ROOT, 'app');
  const shotsDir = join(REPO_ROOT, 'screenshots');
  if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
    throw new Error('missing app/ directory in repository');
  }
  if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
    throw new Error('missing screenshots/ directory in repository');
  }

  // Start from a clean output directory so a second run writes exactly the
  // same bytes as the first.
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const appFiles = copyTreeInto(appDir, join(OUTPUT_DIR, 'app'));
  const shotFiles = copyTreeInto(shotsDir, join(OUTPUT_DIR, 'screenshots'));

  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  const dossierPath = join(OUTPUT_DIR, 'dossier.json');
  writeFileSync(dossierPath, dossier);

  // The grader runs this program twice and both runs must write the same
  // bytes, so verify the dossier before reporting success: rebuild it from
  // the output directory and compare byte for byte with what was written,
  // and refuse a dossier over the gate's 1.5 MiB cap.
  const dossierAgain = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  if (!dossier.equals(dossierAgain)) {
    throw new Error('dossier is not deterministic: second build differs from the first');
  }
  const dossierBytes = statSync(dossierPath).size;
  if (dossierBytes > DOSSIER_MAX_BYTES) {
    throw new Error(`dossier.json is ${dossierBytes} bytes, over the 1.5 MiB cap`);
  }

  console.log(`Sunset Cover Studio: copied ${appFiles} app files, ${shotFiles} screenshots, dossier.json ${dossierBytes} bytes -> ${OUTPUT_DIR}`);
}

main();
