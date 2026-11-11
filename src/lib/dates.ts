/**
 * Dates de l'application : une seule source pour tous les espaces.
 * Les dates sont des chaînes AAAA-MM-JJ, lues en heure locale (Kinshasa),
 * jamais en UTC. Formats français : « 28 nov. 2026 », « il y a 4 jours ».
 */

export const DAY_MS = 86_400_000;

/** AAAA-MM-JJTHH:MM:SS en heure locale (horodatage des notifications et du journal). */
export function localIsoDateTime(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${localIsoDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** AAAA-MM-JJ en heure locale. */
export function localIsoDate(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** « 28 nov. 2026 » (ou « 28 nov. » sans l'année). Tiret long si vide. */
export function fmtDate(value: string, withYear = true) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

/** Nombre de jours entre aujourd'hui et la date (négatif si passée). */
export function daysFromToday(value: string) {
  const today = new Date(`${localIsoDate()}T00:00:00`);
  return Math.round((new Date(`${value}T00:00:00`).getTime() - today.getTime()) / DAY_MS);
}

/** « aujourd'hui », « hier », « demain », « dans 3 jours », « il y a 2 semaines ». */
export function relativeDay(value: string) {
  const days = -daysFromToday(value);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days === -1) return "demain";
  if (days < 0) return `dans ${-days} jours`;
  if (days < 14) return `il y a ${days} jours`;
  if (days < 60) return `il y a ${Math.round(days / 7)} semaines`;
  return fmtDate(value, false);
}

/** Date courte pour une colonne étroite : « auj. », « hier », « 4 j », « 2 sem. ». */
export function shortDay(value: string) {
  const days = -daysFromToday(value);
  if (days <= 0) return "auj.";
  if (days === 1) return "hier";
  if (days < 14) return `${days} j`;
  if (days < 60) return `${Math.round(days / 7)} sem.`;
  return fmtDate(value, false);
}
