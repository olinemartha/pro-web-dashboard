/**
 * Authentification locale de démonstration.
 *
 * Elle tient la place de Supabase Auth en attendant la connexion au serveur :
 * comptes et session sont gardés dans le navigateur (localStorage), le mot de passe
 * n'est jamais stocké en clair (empreinte SHA-256). À remplacer par Supabase
 * (signUp, signInWithPassword, signOut) sans changer les écrans.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "./rules";
import type { CompanyProfile } from "./company-data";

export type Role = "etudiant" | "entreprise" | "admin";

export const ROLE_HOME: Record<Role, string> = {
  etudiant: "/",
  entreprise: "/entreprise",
  admin: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  etudiant: "Étudiant",
  entreprise: "Entreprise",
  admin: "Administrateur",
};

/** Réponses de l'entreprise à l'inscription (reprises du questionnaire d'enquête FINCA). */
export type HostingProfile = {
  internTypes: string[];
  frequency: string;
  arrivalInfo: string[];
  deciders: string[];
  criteria: string[];
};

type Account = {
  email: string;
  passwordHash: string;
  role: Role;
  name: string;
  onboarded: boolean;
  /** Profil saisi à l'inscription (étudiant), rechargé à l'ouverture de l'application. */
  profile?: Partial<Profile>;
  /** Fiche et réponses de l'entreprise saisies à l'inscription. */
  company?: { profile: Partial<CompanyProfile>; hosting: HostingProfile };
};

export type Session = {
  email: string;
  role: Role;
  name: string;
  onboarded: boolean;
  /** Compte de démonstration : les données d'exemple restent en place. */
  demo: boolean;
};

/** Comptes de démonstration (données d'exemple de l'application). Mot de passe commun : DEMO_PASSWORD. */
export const DEMO_PASSWORD = "Demo2026!";
export const DEMO_ACCOUNTS: Record<Role, { email: string; name: string }> = {
  etudiant: { email: "grace.mukendi@exemple.cd", name: "Grâce Mukendi" },
  entreprise: { email: "contact@finca.cd", name: "FINCA RDC" },
  admin: { email: "admin@stagemanager.cd", name: "Administrateur StageManager" },
};

async function hash(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

type Result = { ok: true } | { ok: false; error: string; field?: "email" | "password" };

type AuthState = {
  session: Session | null;
  accounts: Account[];
  signIn: (email: string, password: string) => Promise<Result>;
  signInDemo: (role: Role) => void;
  signUp: (input: { role: Exclude<Role, "admin">; email: string; password: string }) => Promise<Result>;
  /** Fin de l'onboarding : nom affiché et, pour l'étudiant, profil de départ. */
  completeOnboarding: (input: {
    name: string;
    profile?: Partial<Profile>;
    company?: { profile: Partial<CompanyProfile>; hosting: HostingProfile };
  }) => void;
  signOut: () => void;
  accountFor: (email: string) => Account | undefined;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      accounts: [],

      signIn: async (email, password) => {
        const key = normalizeEmail(email);
        const demo = (Object.entries(DEMO_ACCOUNTS) as [Role, { email: string; name: string }][]).find(
          ([, account]) => account.email === key
        );
        if (demo) {
          if (password !== DEMO_PASSWORD) return { ok: false, error: "Mot de passe incorrect.", field: "password" };
          get().signInDemo(demo[0]);
          return { ok: true };
        }
        const account = get().accounts.find((entry) => entry.email === key);
        if (!account) return { ok: false, error: "Aucun compte n'utilise cette adresse e-mail.", field: "email" };
        if ((await hash(password)) !== account.passwordHash)
          return { ok: false, error: "Mot de passe incorrect.", field: "password" };
        set({ session: { email: account.email, role: account.role, name: account.name, onboarded: account.onboarded, demo: false } });
        return { ok: true };
      },

      signInDemo: (role) => {
        const account = DEMO_ACCOUNTS[role];
        set({ session: { email: account.email, role, name: account.name, onboarded: true, demo: true } });
      },

      signUp: async ({ role, email, password }) => {
        const key = normalizeEmail(email);
        const taken =
          Object.values(DEMO_ACCOUNTS).some((account) => account.email === key) ||
          get().accounts.some((account) => account.email === key);
        if (taken) return { ok: false, error: "Un compte existe déjà avec cette adresse e-mail.", field: "email" };
        const account: Account = { email: key, passwordHash: await hash(password), role, name: "", onboarded: false };
        set((state) => ({
          accounts: [...state.accounts, account],
          session: { email: key, role, name: "", onboarded: false, demo: false },
        }));
        return { ok: true };
      },

      completeOnboarding: ({ name, profile, company }) => {
        const session = get().session;
        if (!session) return;
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.email === session.email
              ? { ...account, name, onboarded: true, profile: profile ?? account.profile, company: company ?? account.company }
              : account
          ),
          session: { ...session, name, onboarded: true },
        }));
      },

      signOut: () => set({ session: null }),

      accountFor: (email) => get().accounts.find((account) => account.email === normalizeEmail(email)),
    }),
    { name: "sm.auth", partialize: (state) => ({ session: state.session, accounts: state.accounts }) }
  )
);

/** Espace d'une adresse : /admin, /entreprise, sinon l'espace étudiant. */
export function roleForPath(pathname: string): Role {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/entreprise")) return "entreprise";
  return "etudiant";
}

/** Pages accessibles sans être connecté. */
export const PUBLIC_PATHS = ["/connexion", "/inscription"];
export const isPublicPath = (pathname: string) => PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
