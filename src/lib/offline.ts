/**
 * Mode hors ligne (secours sans internet, par exemple pendant une soutenance).
 *
 * Lancé avec `npm run hors-ligne` (mode Vite « offline ») : aucune requête vers Supabase.
 * Les comptes et toutes les données restent dans ce navigateur (localStorage) ; la version
 * en ligne n'est pas concernée et garde ses données dans Supabase.
 */
import { toast } from "sonner";
import type { Role } from "./auth";
import { useAdminStore, type AdminUser } from "./admin-store";
import { useCompanyStore } from "./company-store";
import { useStore } from "./store";
import { READ_ONLY_MESSAGE } from "./view-as";

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

/** Identifiant de l'entreprise hors ligne (celui de ses offres d'exemple). */
export const OFFLINE_COMPANY_ID = "finca";

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

type StudentDossier = { profile?: { filiere?: string; niveau?: string; universite?: string } };

/** Comptes étudiants créés sur cet ordinateur, tels que l'administratrice les voit. */
function offlineStudents(): AdminUser[] {
  const accounts = read<{ email: string; role: Role; name: string; onboarded: boolean }[]>("sm.offline.accounts") ?? [];
  const suspended = useAdminStore.getState().suspended;
  return accounts
    .filter((account) => account.role === "etudiant" && account.onboarded)
    .map((account) => {
      const profile = read<StudentDossier>(KEY.student(account.email))?.profile;
      return {
        id: account.email,
        email: account.email,
        role: "etudiant",
        name: account.name,
        companyId: null,
        suspended: suspended.includes(account.email),
        onboarded: true,
        createdAt: "",
        filiere: profile?.filiere ?? "",
        niveau: profile?.niveau ?? "",
        universite: profile?.universite ?? "",
      };
    });
}

const COMPANY_KEYS = ["profile", "spaceActive", "hosting", "offers", "candidates", "interviews", "services", "supervisors", "interns", "expertRuns", "expertRules", "decisions", "attendance"] as const;
const STUDENT_KEYS = ["profile", "applications", "notifications"] as const;

/**
 * Consultation par l'administratrice, hors ligne : comme en ligne, rien n'est enregistré au nom
 * du titulaire. Une modification tentée est signalée puis annulée.
 */
function offlineReadOnly(): () => void {
  const company = dataOf(useCompanyStore.getState());
  const student = dataOf(useStore.getState());
  let restoring = false;
  const refuse = (restore: () => void) => {
    restoring = true;
    restore();
    restoring = false;
    // Le message de réussite de la page part juste après : on le remplace.
    setTimeout(() => {
      toast.dismiss();
      toast.info("Modification non enregistrée", { id: "lecture-seule", description: READ_ONLY_MESSAGE });
    }, 60);
  };
  const stops = [
    useCompanyStore.subscribe((next, prev) => {
      if (!restoring && COMPANY_KEYS.some((key) => next[key] !== prev[key])) refuse(() => useCompanyStore.setState(company));
    }),
    useStore.subscribe((next, prev) => {
      if (!restoring && STUDENT_KEYS.some((key) => next[key] !== prev[key])) refuse(() => useStore.setState(student));
    }),
  ];
  return () => stops.forEach((stop) => stop());
}

/**
 * Ouvre les données hors ligne du compte : l'espace entreprise (FINCA) est commun à tous les comptes,
 * chaque étudiant garde son propre dossier. Toute modification est aussitôt enregistrée sur l'ordinateur,
 * sauf en consultation par l'administratrice (lecture seule).
 */
export function startOffline(email: string, role: Role, viewing = false): () => void {
  const company = read<object>(KEY.company);
  if (company) useCompanyStore.setState(company);
  const admin = read<object>(KEY.admin);
  if (admin) useAdminStore.setState(admin);
  if (role === "etudiant") {
    // Son propre dossier ; à défaut, celui de l'étudiante de démonstration (jamais celui d'un autre compte).
    useStore.setState(read<object>(KEY.student(email)) ?? STUDENT_DEMO);
  }
  if (viewing) return offlineReadOnly();
  if (role === "admin") useAdminStore.setState({ users: offlineStudents() });

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
