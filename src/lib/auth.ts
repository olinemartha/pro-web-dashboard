/**
 * Authentification : Supabase Auth.
 *
 * Le compte (e-mail, mot de passe) est géré par Supabase ; le rôle, le nom et l'état
 * de l'inscription sont dans la table `profiles`, créée par le serveur à l'inscription.
 * Le rôle administrateur n'est jamais accordé par l'inscription publique.
 */
import { create } from "zustand";
import type { Profile } from "./rules";
import type { CompanyProfile } from "./company-data";
import { supabase } from "./supabase";

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

export type Session = {
  userId: string;
  email: string;
  role: Role;
  name: string;
  onboarded: boolean;
  companyId: string | null;
  /** Conservé pour compatibilité : il n'y a plus de compte de démonstration local. */
  demo: false;
};

type Result = { ok: true; needsConfirmation?: boolean } | { ok: false; error: string; field?: "email" | "password" };

type AuthState = {
  session: Session | null;
  /** Vrai une fois la session Supabase lue (évite une redirection prématurée). */
  ready: boolean;
  init: () => void;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (input: { role: Exclude<Role, "admin">; email: string; password: string }) => Promise<Result>;
  /** Fin de l'onboarding : profil étudiant ou fiche entreprise enregistrés en base. */
  completeOnboarding: (input: {
    name: string;
    profile?: Partial<Profile>;
    company?: { profile: Partial<CompanyProfile>; hosting: HostingProfile };
  }) => Promise<Result>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

/** Messages Supabase → français. */
function translate(message: string): { error: string; field?: "email" | "password" } {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return { error: "E-mail ou mot de passe incorrect.", field: "password" };
  if (m.includes("email not confirmed")) return { error: "Confirmez d'abord votre adresse e-mail (lien reçu par e-mail).", field: "email" };
  if (m.includes("already registered") || m.includes("already exists")) return { error: "Un compte existe déjà avec cette adresse e-mail.", field: "email" };
  if (m.includes("password should be") || m.includes("weak password")) return { error: "Mot de passe trop faible : 8 caractères minimum.", field: "password" };
  if (m.includes("rate limit")) return { error: "Trop de tentatives. Patientez quelques minutes avant de réessayer." };
  if (m.includes("invalid") && m.includes("email")) return { error: "Adresse e-mail invalide.", field: "email" };
  if (m.includes("failed to fetch") || m.includes("network")) return { error: "Connexion au serveur impossible. Vérifiez votre accès à Internet." };
  return { error: message };
}

let initialized = false;

/** Lit le profil (rôle, nom, entreprise) du compte connecté. */
async function loadProfile(userId: string, email: string): Promise<Session | "suspended" | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  if (data.suspended) return "suspended";
  return {
    userId,
    email: data.email || email,
    role: data.role as Role,
    name: data.full_name,
    onboarded: data.onboarded,
    companyId: data.company_id,
    demo: false,
  };
}

export const useAuth = create<AuthState>()((set, get) => ({
  session: null,
  ready: false,

  init: () => {
    if (initialized) return;
    initialized = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      const session = user ? await loadProfile(user.id, user.email ?? "") : null;
      if (session === "suspended") await supabase.auth.signOut();
      set({ session: session && session !== "suspended" ? session : null, ready: true });
    });
    supabase.auth.onAuthStateChange((event, authSession) => {
      if (event === "SIGNED_OUT") set({ session: null });
      // La connexion elle-même charge le profil (signIn) ; ici, seulement le renouvellement du jeton.
      if (event === "TOKEN_REFRESHED" && authSession?.user && !get().session) {
        void loadProfile(authSession.user.id, authSession.user.email ?? "").then((session) => {
          if (session && session !== "suspended") set({ session });
        });
      }
    });
  },

  refresh: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return set({ session: null });
    const session = await loadProfile(data.user.id, data.user.email ?? "");
    set({ session: session && session !== "suspended" ? session : null });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user) return { ok: false, ...translate(error?.message ?? "Connexion impossible.") };
    const session = await loadProfile(data.user.id, data.user.email ?? "");
    if (session === "suspended") {
      await supabase.auth.signOut();
      return { ok: false, error: "Ce compte est suspendu. Contactez l'administrateur de la plateforme.", field: "email" };
    }
    if (!session) {
      await supabase.auth.signOut();
      return { ok: false, error: "Profil introuvable pour ce compte. Contactez l'administrateur de la plateforme." };
    }
    set({ session });
    return { ok: true };
  },

  signUp: async ({ role, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      // Le lien de confirmation ramène à la connexion de ce site (adresse à autoriser dans Supabase).
      options: { data: { role }, emailRedirectTo: `${window.location.origin}/connexion` },
    });
    if (error) return { ok: false, ...translate(error.message) };
    // Supabase renvoie un utilisateur sans identités si l'adresse est déjà prise (protection anti-énumération).
    if (data.user && data.user.identities && data.user.identities.length === 0)
      return { ok: false, error: "Un compte existe déjà avec cette adresse e-mail.", field: "email" };
    if (!data.session) return { ok: true, needsConfirmation: true };
    const session = await loadProfile(data.user!.id, data.user!.email ?? "");
    if (session && session !== "suspended") set({ session });
    return { ok: true };
  },

  completeOnboarding: async ({ name, profile, company }) => {
    const session = get().session;
    if (!session) return { ok: false, error: "Session expirée : reconnectez-vous." };

    if (session.role === "etudiant" && profile) {
      const { error } = await supabase.from("student_profiles").upsert({
        id: session.userId,
        nom: profile.nom ?? "",
        postnom: profile.postnom ?? "",
        prenom: profile.prenom ?? "",
        telephone: profile.telephone ?? "",
        universite: profile.universite ?? "",
        faculte: profile.faculte ?? "",
        filiere: profile.filiere ?? "",
        niveau: profile.niveau ?? "",
        competences: profile.competences ?? [],
      });
      if (error) return { ok: false, ...translate(error.message) };
      const { error: profileError } = await supabase.from("profiles").update({ full_name: name, onboarded: true }).eq("id", session.userId);
      if (profileError) return { ok: false, ...translate(profileError.message) };
      set({ session: { ...session, name, onboarded: true } });
      return { ok: true };
    }

    if (session.role === "entreprise" && company) {
      const { data: companyId, error } = await supabase.rpc("complete_company_onboarding", {
        company: { ...company.profile, hosting: company.hosting },
      });
      if (error) return { ok: false, ...translate(error.message) };
      set({ session: { ...session, name, onboarded: true, companyId: companyId ?? session.companyId } });
      return { ok: true };
    }
    return { ok: false, error: "Informations d'inscription incomplètes." };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));

/** Espace d'une adresse : /admin, /entreprise, sinon l'espace étudiant. */
export function roleForPath(pathname: string): Role {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/entreprise")) return "entreprise";
  return "etudiant";
}

/** Pages accessibles sans être connecté. */
export const PUBLIC_PATHS = ["/connexion", "/inscription"];
export const isPublicPath = (pathname: string) => PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
