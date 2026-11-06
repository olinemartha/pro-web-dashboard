// Pure business rules for the student space (kept framework-free so they can be tested).

export type AppStatus =
  | "envoyee"
  | "examen"
  | "preselectionnee"
  | "entretien"
  | "acceptee"
  | "refusee"
  | "declinee"
  | "confirmee";

export interface Profile {
  nom: string;
  postnom: string;
  prenom: string;
  adresse: string;
  email: string;
  telephone: string;
  photo: string | null;
  universite: string;
  faculte: string;
  filiere: string;
  niveau: string;
  competences: string[];
  experiences: string;
  projets: string;
  infos: string;
  cv: { name: string; size: number; date: string } | null;
  visible: boolean;
}

export interface Application {
  id: string;
  offerId: string;
  date: string;
  status: AppStatus;
}

/** Fields counted in the completion rate. */
export const COMPLETION_FIELDS: { key: keyof Profile; label: string }[] = [
  { key: "nom", label: "Nom" },
  { key: "postnom", label: "Postnom" },
  { key: "prenom", label: "Prénom" },
  { key: "adresse", label: "Adresse" },
  { key: "email", label: "Email" },
  { key: "telephone", label: "Téléphone" },
  { key: "photo", label: "Photo de profil" },
  { key: "universite", label: "Université" },
  { key: "faculte", label: "Faculté" },
  { key: "filiere", label: "Filière" },
  { key: "niveau", label: "Niveau d'études" },
  { key: "competences", label: "Compétences" },
  { key: "experiences", label: "Expériences" },
  { key: "cv", label: "CV" },
];

/** Required before any application can be submitted. */
export const ESSENTIAL_FIELDS: (keyof Profile)[] = [
  "nom", "prenom", "email", "telephone", "universite", "filiere", "niveau", "cv",
];

function filled(v: unknown) {
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  return v !== null && v !== undefined;
}

export function profileCompletion(p: Profile): number {
  const done = COMPLETION_FIELDS.filter((f) => filled(p[f.key])).length;
  return Math.round((done / COMPLETION_FIELDS.length) * 100);
}

export function missingFields(p: Profile) {
  return COMPLETION_FIELDS.filter((f) => !filled(p[f.key]));
}

export function missingEssentials(p: Profile) {
  return ESSENTIAL_FIELDS.filter((k) => !filled(p[k]));
}

export function canApply(p: Profile, apps: Application[], offerId: string) {
  if (missingEssentials(p).length) return { ok: false as const, reason: "profil" };
  if (apps.some((a) => a.offerId === offerId)) return { ok: false as const, reason: "deja" };
  return { ok: true as const };
}

/** Confirm one accepted offer: it becomes "confirmee", other accepted ones become "declinee". */
export function confirmOffer(apps: Application[], appId: string): Application[] {
  const target = apps.find((a) => a.id === appId);
  if (!target || target.status !== "acceptee") return apps;
  if (apps.some((a) => a.status === "confirmee")) return apps;
  return apps.map((a) =>
    a.id === appId ? { ...a, status: "confirmee" } : a.status === "acceptee" ? { ...a, status: "declinee" } : a,
  );
}
