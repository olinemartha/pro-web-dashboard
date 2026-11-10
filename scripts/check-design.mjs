#!/usr/bin/env node
/**
 * Contrôle du système de design (voir DESIGN.md et CLAUDE.md).
 *
 * Parcourt src/ et signale ce qui contourne les règles du tableau de bord :
 * couleurs Tailwind brutes ou hexadécimales au lieu des jetons, courbes
 * d'animation par défaut au lieu de --ease-soft, graisses hors échelle,
 * flou décoratif, émojis à la place des icônes.
 *
 *   npm run check:design            → échoue s'il y a un écart
 *   npm run check:design -- --all   → inclut aussi les fichiers « à migrer »
 *
 * Une ligne peut être exemptée volontairement avec le commentaire
 * `design-ok: <raison>` sur la même ligne ou la ligne au-dessus.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const includeLegacy = process.argv.includes("--all");

/**
 * Pages de l'espace étudiant pas encore refaites : elles seront migrées au
 * design system lors de leur redesign. Retirez une ligne dès qu'une page est
 * refaite ; ne rajoutez jamais de nouvelle page ici.
 */
const LEGACY = new Set([]);

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const RULES = [
  {
    id: "couleur-tailwind-brute",
    test: new RegExp(
      `\\b(?:bg|text|border|ring|ring-offset|from|via|to|fill|stroke|outline|divide|decoration|caret|accent|shadow|placeholder)-(?:${PALETTE})-\\d{2,3}\\b`
    ),
    message:
      "Couleur Tailwind brute : utilisez les jetons (primary, accent, muted, success, warning, destructive, border…).",
  },
  {
    id: "couleur-hex",
    test: /(?<![\w&])#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b(?![\w-])/,
    message: "Couleur hexadécimale dans un composant : utilisez hsl(var(--jeton)) ou une classe de jeton.",
    skipLine: (line) => /^\s*(\/\/|\*|\/\*)/.test(line) || /href=|to=|#\w+-/.test(line),
  },
  {
    id: "courbe-par-defaut",
    test: /\bease-(?:linear|in|out|in-out)\b/,
    message: "Courbe d'animation par défaut : utilisez [transition-timing-function:var(--ease-soft)].",
  },
  {
    id: "graisse-hors-echelle",
    test: /\bfont-(?:bold|extrabold|black|light|thin|extralight)\b/,
    message: "Graisse hors échelle : 400, 500 (font-medium) ou 600 (font-semibold) uniquement.",
  },
  {
    id: "flou-decoratif",
    test: /\bbackdrop-blur/,
    message: "Flou décoratif : les panneaux sont opaques (bg-popover). Seul le voile des fenêtres est flouté.",
  },
  {
    id: "emoji",
    test: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
    message: "Émoji dans l'interface : utilisez une icône lucide-react nue.",
  },
];

/** Exceptions documentées du système lui-même. */
const ALLOW = [
  { file: "src/components/company/ui.tsx", rule: "flou-decoratif" }, // voile des fenêtres
  { file: "src/components/shell/topbar-widgets.tsx", rule: "flou-decoratif" }, // cloche translucide choisie
  { file: "src/components/shell/space-shell.tsx", rule: "flou-decoratif" }, // barres collantes et voile du tiroir mobile
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(tsx|ts)$/.test(name)) files.push(path);
  }
  return files;
}

const isLegacy = (rel) => [...LEGACY].some((entry) => rel === entry || rel.startsWith(`${entry}/`));

const findings = [];
let skippedLegacy = 0;

for (const path of walk(SRC)) {
  const rel = relative(ROOT, path).split(sep).join("/");
  if (rel.endsWith("routeTree.gen.ts")) continue;
  if (!includeLegacy && isLegacy(rel)) {
    skippedLegacy++;
    continue;
  }
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/design-ok:/.test(line) || /design-ok:/.test(lines[index - 1] ?? "")) return;
    for (const rule of RULES) {
      if (ALLOW.some((allow) => allow.file === rel && allow.rule === rule.id)) continue;
      if (rule.skipLine?.(line)) continue;
      if (rule.test.test(line)) {
        findings.push({ rel, line: index + 1, rule, snippet: line.trim().slice(0, 110) });
      }
    }
  });
}

if (findings.length === 0) {
  console.log(
    `✓ Système de design respecté.${skippedLegacy ? ` (${skippedLegacy} fichier(s) « à migrer » ignorés, voir --all)` : ""}`
  );
  process.exit(0);
}

for (const finding of findings) {
  console.log(`${finding.rel}:${finding.line}  [${finding.rule.id}]  ${finding.rule.message}`);
  console.log(`    ${finding.snippet}`);
}
console.log(`\n✗ ${findings.length} écart(s) au système de design. Voir DESIGN.md.`);
process.exit(1);
