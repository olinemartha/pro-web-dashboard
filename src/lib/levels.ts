/**
 * Niveaux d'études en RDC. Deux systèmes coexistent :
 * - l'ancien système : graduat (G1 à G3), puis licence en deux ans (L1, L2) ;
 * - le système LMD : licence en trois ans (L1 à L3), puis master (M1, M2).
 * « L1 » ou « L2 » ne veut donc rien dire sans le système : il est toujours précisé.
 *
 * Seules les années où l'on peut faire un stage sont proposées à l'étudiant :
 * G2, G3 et L2 (ancien système), L3, M1 et M2 (nouveau système).
 */
export const LEVEL_GROUPS = [
  {
    label: "Ancien système",
    levels: ["Graduat (G2)", "Graduat (G3)", "Licence ancien système (L2)"],
  },
  {
    label: "Nouveau système (LMD)",
    levels: ["Licence LMD (L3)", "Master (M1)", "Master (M2)"],
  },
];

export const STUDY_LEVELS = LEVEL_GROUPS.flatMap((group) => group.levels);

/**
 * Années d'études après le diplôme d'État, pour comparer les deux systèmes :
 * G1 = L1 LMD = 1, G2 = L2 LMD = 2, G3 = L3 LMD = 3, L1 ancien système = M1 = 4,
 * L2 ancien système = M2 = 5. Une licence sans système précisé est lue en LMD. Inconnu : -1.
 */
export function studyYears(value: string): number {
  const text = value.toUpperCase();
  const match = text.match(/\b([GLM])\s*([1-3])\b/);
  if (!match) return -1;
  const year = Number(match[2]);
  if (match[1] === "G") return year;
  if (match[1] === "M") return year <= 2 ? 3 + year : -1;
  if (text.includes("ANCIEN")) return year <= 2 ? 3 + year : -1;
  return year;
}
