/**
 * Mode hors ligne (secours sans internet, par exemple pendant une soutenance).
 *
 * Lancé avec `npm run hors-ligne` (mode Vite « offline ») : aucune requête vers Supabase.
 * Les comptes et toutes les données restent dans ce navigateur (localStorage) ; la version
 * en ligne n'est pas concernée et garde ses données dans Supabase.
 */
import type { Role } from "./auth";
import { useAdminStore } from "./admin-store";
import { useCompanyStore } from "./company-store";
import { useStore } from "./store";

export const OFFLINE = import.meta.env.MODE === "offline";

/**
 * Comptes reconnus hors ligne : les mêmes adresses que dans la version en ligne.
 * Rien n'est affiché sur la page de connexion. L'adresse de l'administratrice vient de
 * `.env.offline.local` (fichier local, jamais envoyé sur GitHub).
 * Le mot de passe est choisi à la première connexion sur cet ordinateur (seule son empreinte est gardée).
 */
export const OFFLINE_ACCOUNTS: { email: string; role: Role; name: string }[] = [
  { email: (import.meta.env.VITE_OFFLINE_ADMIN_EMAIL ?? "admin@stagemanager.local").trim().toLowerCase(), role: "admin", name: "Administratrice StageManager" },
  { email: "sm1@example.com", role: "entreprise", name: "FINCA RDC" },
];

/** Clé de l'empreinte du mot de passe d'un compte reconnu. */
export const offlinePasswordKey = (email: string) => `sm.offline.password.${email}`;

const KEY = {
  company: "sm.offline.company",
  admin: "sm.offline.admin",
  student: (email: string) => `sm.offline.student.${email}`,
};

const read = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage plein ou bloqué : les changements valent pour la session */
  }
};

/** Garde seulement les données d'un état (pas les fonctions). */
const dataOf = (state: object) => Object.fromEntries(Object.entries(state).filter(([, value]) => typeof value !== "function"));

/** Dossier d'exemple de l'étudiante de démonstration, tel qu'au premier lancement. */
const STUDENT_DEMO = dataOf(useStore.getState());

/** Enregistre tout de suite le dossier de l'étudiant connecté (fin d'inscription hors ligne). */
export function saveOfflineStudent(email: string) {
  write(KEY.student(email), dataOf(useStore.getState()));
}

/**
 * Ouvre les données hors ligne du compte : l'espace entreprise (FINCA) est commun à tous les comptes,
 * chaque étudiant garde son propre dossier. Toute modification est aussitôt enregistrée sur l'ordinateur.
 */
export function startOffline(email: string, role: Role): () => void {
  const company = read<object>(KEY.company);
  if (company) useCompanyStore.setState(company);
  const admin = read<object>(KEY.admin);
  if (admin) useAdminStore.setState(admin);
  if (role === "etudiant") {
    // Son propre dossier ; à défaut, celui de l'étudiante de démonstration (jamais celui d'un autre compte).
    useStore.setState(read<object>(KEY.student(email)) ?? STUDENT_DEMO);
  }

  const stops = [
    useCompanyStore.subscribe((state) => write(KEY.company, dataOf(state))),
    useAdminStore.subscribe((state) => write(KEY.admin, { suspended: state.suspended, actions: state.actions, readNotices: state.readNotices })),
    ...(role === "etudiant" ? [useStore.subscribe((state) => write(KEY.student(email), dataOf(state)))] : []),
  ];
  return () => stops.forEach((stop) => stop());
}

/** Efface le dossier hors ligne d'un étudiant (suppression de son compte). */
export function forgetOfflineStudent(email: string) {
  try {
    localStorage.removeItem(KEY.student(email));
  } catch {
    /* rien à effacer */
  }
}
