/**
 * Connexion hors ligne : mêmes écrans, comptes gardés dans ce navigateur.
 * Le mot de passe n'est jamais stocké en clair (empreinte SHA-256).
 */
import type { StateCreator } from "zustand";
import type { AuthState, Role, Session } from "./auth";
import { useAdminStore } from "./admin-store";
import { OFFLINE_ACCOUNTS, forgetOfflineStudent, offlinePasswordKey, saveOfflineStudent } from "./offline";
import { useStore } from "./store";
import { READ_ONLY_MESSAGE, useViewAs } from "./view-as";

type LocalAccount = { email: string; passwordHash: string; role: Role; name: string; onboarded: boolean };

const ACCOUNTS_KEY = "sm.offline.accounts";
const SESSION_KEY = "sm.offline.session";
const UNAVAILABLE = "Indisponible hors ligne : utilisez la version en ligne de StageManager.";

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: unknown) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible */
  }
};

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const normalize = (email: string) => email.trim().toLowerCase();
const knownAccount = (email: string) => OFFLINE_ACCOUNTS.find((account) => account.email === email);
const accounts = () => load<LocalAccount[]>(ACCOUNTS_KEY, []);
const sessionFor = (email: string, role: Role, name: string, onboarded: boolean): Session => ({
  userId: email,
  email,
  role,
  name,
  onboarded,
  companyId: null,
  demo: false,
});

export const createOfflineAuth: StateCreator<AuthState> = (set, get) => {
  const open = (session: Session | null) => {
    save(SESSION_KEY, session);
    set({ session });
  };

  return {
    session: null,
    ready: false,

    init: () => set({ session: load<Session | null>(SESSION_KEY, null), ready: true }),

    refresh: async () => undefined,

    signIn: async (email, password) => {
      const key = normalize(email);
      if (useAdminStore.getState().suspended.includes(key))
        return { ok: false, error: "Ce compte est suspendu. Contactez l'administrateur de la plateforme.", field: "email" };
      // Comptes de la version en ligne (administratrice, FINCA) : leur mot de passe est enregistré
      // à la première connexion sur cet ordinateur, puis exigé à chaque fois.
      const known = knownAccount(key);
      if (known) {
        const stored = load<string | null>(offlinePasswordKey(key), null);
        if (!stored) {
          if (password.length < 8) return { ok: false, error: "E-mail ou mot de passe incorrect.", field: "password" };
          save(offlinePasswordKey(key), await hash(password));
        } else if ((await hash(password)) !== stored) return { ok: false, error: "E-mail ou mot de passe incorrect.", field: "password" };
        open(sessionFor(known.email, known.role, known.name, true));
        return { ok: true };
      }
      const account = accounts().find((entry) => entry.email === key);
      if (!account || (await hash(password)) !== account.passwordHash)
        return { ok: false, error: "E-mail ou mot de passe incorrect.", field: "password" };
      open(sessionFor(account.email, account.role, account.name, account.onboarded));
      return { ok: true };
    },

    signUp: async ({ role, email, password }) => {
      // Hors ligne, l'espace entreprise est celui de FINCA RDC (compte de démonstration).
      if (role === "entreprise")
        return { ok: false, error: "Hors ligne, l'espace entreprise est celui de FINCA RDC : connectez-vous avec son compte.", field: "email" };
      const key = normalize(email);
      if (knownAccount(key) || accounts().some((entry) => entry.email === key))
        return { ok: false, error: "Un compte existe déjà avec cette adresse e-mail. Une personne ne peut avoir qu'un seul compte : connectez-vous.", field: "email" };
      save(ACCOUNTS_KEY, [...accounts(), { email: key, passwordHash: await hash(password), role, name: "", onboarded: false }]);
      open(sessionFor(key, role, "", false));
      return { ok: true };
    },

    completeOnboarding: async ({ name, profile }) => {
      const session = get().session;
      if (!session) return { ok: false, error: "Session expirée : reconnectez-vous." };
      if (session.role === "etudiant" && profile) {
        useStore.getState().startFresh({ ...profile, email: session.email });
        saveOfflineStudent(session.email);
      }
      save(ACCOUNTS_KEY, accounts().map((entry) => (entry.email === session.email ? { ...entry, name, onboarded: true } : entry)));
      open({ ...session, name, onboarded: true });
      return { ok: true };
    },

    signOut: async () => {
      useViewAs.getState().close();
      open(null);
    },

    deactivate: async () => {
      if (useViewAs.getState().target) return { ok: false, error: READ_ONLY_MESSAGE };
      open(null);
      return { ok: true };
    },

    deleteAccount: async () => {
      const session = get().session;
      if (!session) return { ok: false, error: "Session expirée : reconnectez-vous." };
      if (useViewAs.getState().target) return { ok: false, error: READ_ONLY_MESSAGE };
      if (knownAccount(session.email)) return { ok: false, error: "Hors ligne, ce compte ne peut pas être supprimé : faites-le depuis la version en ligne." };
      save(ACCOUNTS_KEY, accounts().filter((entry) => entry.email !== session.email));
      forgetOfflineStudent(session.email);
      open(null);
      return { ok: true };
    },

    requestPasswordReset: async () => ({ ok: false, error: UNAVAILABLE, field: "email" }),

    updatePassword: async () => ({ ok: false, error: UNAVAILABLE }),

    changePassword: async (current, next) => {
      const session = get().session;
      if (!session) return { ok: false, error: "Session expirée : reconnectez-vous." };
      if (useViewAs.getState().target) return { ok: false, error: READ_ONLY_MESSAGE, field: "current" };
      if (knownAccount(session.email)) {
        const stored = load<string | null>(offlinePasswordKey(session.email), null);
        if (!stored || (await hash(current)) !== stored) return { ok: false, error: "Mot de passe actuel incorrect.", field: "current" };
        save(offlinePasswordKey(session.email), await hash(next));
        return { ok: true };
      }
      const list = accounts();
      const account = list.find((entry) => entry.email === session.email);
      if (!account || (await hash(current)) !== account.passwordHash) return { ok: false, error: "Mot de passe actuel incorrect.", field: "current" };
      const passwordHash = await hash(next);
      save(ACCOUNTS_KEY, list.map((entry) => (entry.email === session.email ? { ...entry, passwordHash } : entry)));
      return { ok: true };
    },
  };
};
