import { LEVEL_GROUPS, STUDY_LEVELS } from "@/lib/levels";

/**
 * Options du choix « Niveau d'études », rangées par système (ancien système, LMD).
 * Un niveau déjà enregistré dans l'ancienne liste (ex. « Licence (L2) ») reste affiché tel quel.
 */
export function LevelOptions({ current }: { current?: string }) {
  const legacy = current && !STUDY_LEVELS.includes(current) ? current : null;
  return (
    <>
      {legacy && <option value={legacy}>{legacy}</option>}
      {LEVEL_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.levels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
