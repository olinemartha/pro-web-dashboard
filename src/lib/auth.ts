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
import { READ_ONLY_MESSAGE, useViewAs } from "./view-as";

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
  /** Session de consultation : l'administrateur ouvre l'espace d'un autre compte, en lecture seule. */
  viewing?: boolean;
};

type Result =
  | { ok: true; needsConfirmation?: boolean; reactivated?: boolean }
  | { ok: false; error: string; field?: "email" | "password" };

const WRONG_CREDENTIALS = "E-mail ou mot de passe incorrect.";

/** Une personne = un compte : messages de refus (la base les impose aussi, par index uniques). */
export const ACCOUNT_EXISTS = "Un compte existe déjà avec cette adresse e-mail. Une personne ne peut avoir qu'un seul compte : connectez-vous.";
export const PHONE_TAKEN = "Ce numéro est déjà celui d'un autre compte. Une personne ne peut avoir qu'un seul compte : connectez-vous avec celui-ci.";
export const COMPANY_TAKEN = "Cette entreprise a déjà un compte sur StageManager. Contactez son responsable ou l'administrateur de la plateforme.";

/** Donnée d'identité déjà prise par un autre compte ? (téléphone d'étudiant, nom d'entreprise) */
export async function identityTaken(kind: "telephone" | "entreprise", value: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("identity_taken", { kind, value });
  return !error && data === true;
}

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
  /** Le titulaire désactive son compte : profil masqué, session fermée. Se reconnecter le réactive. */
  deactivate: () => Promise<Result>;
  /** Suppression définitive (compte étudiant) : compte, profil et candidatures effacés ; l'adresse redevient libre. */
  deleteAccount: () => Promise<Result>;
  refresh: () => Promise<void>;
};

/** Messages Supabase → français. */
function translate(message: string): { error: string; field?: "email" | "password" } {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return { error: WRONG_CREDENTIALS, field: "password" };
  if (m.includes("email not confirmed")) return { error: "Confirmez d'abord votre adresse e-mail (lien reçu par e-mail).", field: "email" };
  if (m.includes("already registered") || m.includes("already exists")) return { error: ACCOUNT_EXISTS, field: "email" };
  if (m.includes("student_profiles_phone_unique")) return { error: PHONE_TAKEN };
  if (m.includes("companies_name_unique")) return { error: COMPANY_TAKEN };
  if (m.includes("password should be") || m.includes("weak password")) return { error: "Mot de passe trop faible : 8 caractères minimum.", field: "password" };
  if (m.includes("email rate limit")) return { error: "L'e-mail de confirmation ne peut pas être envoyé pour le moment (limite d'envoi atteinte). Réessayez dans une heure.", field: "email" };
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
  // Étudiant marqué inscrit sans profil enregistré : on reprend l'inscription plutôt qu'ouvrir un espace vide.
  let onboarded = data.onboarded;
  if (onboarded && data.role === "etudiant") {
    const { count } = await supabase.from("student_profiles").select("id", { count: "exact", head: true }).eq("id", userId);
    onboarded = (count ?? 0) > 0;
  }
  return {
    userId,
    email: data.email || email,
    role: data.role as Role,
    name: data.full_name,
    onboarded,
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
      if (event === "SIGNED_OUT") {
        useViewAs.getState().close();
        set({ session: null });
      }
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
    // Compte désactivé par son titulaire : se reconnecter le réactive (comme annoncé à la désactivation).
    const { data: row } = await supabase.from("profiles").select("deactivated_at").eq("id", session.userId).maybeSingle();
    const reactivated = Boolean(row?.deactivated_at);
    if (reactivated) {
      await supabase.from("profiles").update({ deactivated_at: null }).eq("id", session.userId);
      if (session.role === "etudiant") await supabase.from("student_profiles").update({ visible: true }).eq("id", session.userId);
    }
    set({ session });
    return { ok: true, reactivated };
  },

  signUp: async ({ role, email, password }) => {
    // Une personne = un compte : une adresse déjà inscrite est refusée ; on se connecte depuis « Connexion »
    // (qui réactive aussi un compte désactivé).
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      // Le lien de confirmation ramène à la connexion de ce site (adresse à autoriser dans Supabase).
      options: { data: { role }, emailRedirectTo: `${window.location.origin}/connexion` },
    });
    if (error) return { ok: false, ...translate(error.message) };
    // Supabase renvoie un utilisateur sans identités si l'adresse est déjà prise (protection anti-énumération).
    if (data.user && data.user.identities && data.user.identities.length === 0) return { ok: false, error: ACCOUNT_EXISTS, field: "email" };
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
    useViewAs.getState().close();
    await supabase.auth.signOut();
    set({ session: null });
  },

  deactivate: async () => {
    const session = get().session;
    if (!session) return { ok: false, error: "Session expirée : reconnectez-vous." };
    if (useViewAs.getState().target) return { ok: false, error: READ_ONLY_MESSAGE };
    const { error } = await supabase.from("profiles").update({ deactivated_at: new Date().toISOString() }).eq("id", session.userId);
    if (error) return { ok: false, ...translate(error.message) };
    if (session.role === "etudiant") {
      const { error: hideError } = await supabase.from("student_profiles").update({ visible: false }).eq("id", session.userId);
      if (hideError) return { ok: false, ...translate(hideError.message) };
    }
    await supabase.auth.signOut();
    set({ session: null });
    return { ok: true };
  },

  deleteAccount: async () => {
    if (!get().session) return { ok: false, error: "Session expirée : reconnectez-vous." };
    if (useViewAs.getState().target) return { ok: false, error: READ_ONLY_MESSAGE };
    const { error } = await supabase.rpc("delete_my_account");
    if (error) return { ok: false, ...translate(error.message) };
    // Le compte n'existe plus côté serveur : on efface seulement la session de ce navigateur.
    await supabase.auth.signOut({ scope: "local" });
    set({ session: null });
    return { ok: true };
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
