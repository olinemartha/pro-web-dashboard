/**
 * Espace administrateur : ses propres décisions (suspensions, retraits d'offres) et
 * le journal de ces actions. Le PRD exige que chaque action d'administration soit tracée et motivée.
 *
 * Connecté à Supabase, les comptes et le journal viennent de la base et chaque action y est
 * enregistrée (la suspension bloque réellement la connexion).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { localIsoDateTime } from "./dates";
import { remoteState } from "./remote-flag";
import { supabase } from "./supabase";

export type AdminAction = {
  id: string;
  date: string;
  kind: "suspension" | "reactivation" | "retrait_offre";
  target: string;
  reason: string;
};

/** Compte de la plateforme, tel que lu dans la base. */
export type AdminUser = {
  id: string;
  email: string;
  role: "etudiant" | "entreprise" | "admin";
  name: string;
  companyId: string | null;
  suspended: boolean;
  onboarded: boolean;
  createdAt: string;
  filiere: string;
  niveau: string;
  universite: string;
};

export type AdminCompany = { id: string; name: string; initials: string; sector: string; city: string; email: string };

type AdminState = {
  /** Adresses e-mail des comptes suspendus. */
  suspended: string[];
  actions: AdminAction[];
  readNotices: string[];
  users: AdminUser[];
  companies: AdminCompany[];
  suspend: (email: string, target: string, reason: string) => void;
  reactivate: (email: string, target: string) => void;
  logOfferWithdrawal: (target: string, reason: string, offerId?: string) => void;
  markNoticesRead: (ids: string[]) => void;
};

const now = () => localIsoDateTime();

/** Enregistre en base ; en cas d'échec, prévient (l'affichage local reste celui de l'action). */
async function record(run: () => PromiseLike<{ error: { message: string } | null }>[]) {
  if (!remoteState.active) return;
  const results = await Promise.all(run());
  const failed = results.find((result) => result.error);
  if (failed?.error) toast.error("Enregistrement impossible", { description: failed.error.message });
}

const log = (kind: AdminAction["kind"], target: string, reason: string) =>
  supabase.from("admin_actions").insert({ kind, target, reason });

/** Compte d'une adresse ; une entreprise est suspendue à travers les comptes de ses membres. */
const accountsFor = (users: AdminUser[], companies: AdminCompany[], email: string) => {
  const company = companies.find((c) => c.email === email);
  return users.filter((u) => u.email === email || (company && u.companyId === company.id && u.role === "entreprise"));
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      suspended: [],
      actions: [],
      readNotices: [],
      users: [],
      companies: [],
      suspend: (email, target, reason) => {
        const ids = accountsFor(get().users, get().companies, email).map((u) => u.id);
        set((state) => ({
          suspended: [...new Set([...state.suspended, email])],
          users: state.users.map((u) => (ids.includes(u.id) ? { ...u, suspended: true } : u)),
          actions: [{ id: `ad-${Date.now()}`, date: now(), kind: "suspension", target, reason }, ...state.actions],
        }));
        void record(() => [...ids.map((id) => supabase.from("profiles").update({ suspended: true }).eq("id", id)), log("suspension", target, reason)]);
      },
      reactivate: (email, target) => {
        const ids = accountsFor(get().users, get().companies, email).map((u) => u.id);
        set((state) => ({
          suspended: state.suspended.filter((entry) => entry !== email),
          users: state.users.map((u) => (ids.includes(u.id) ? { ...u, suspended: false } : u)),
          actions: [{ id: `ad-${Date.now()}`, date: now(), kind: "reactivation", target, reason: "" }, ...state.actions],
        }));
        void record(() => [...ids.map((id) => supabase.from("profiles").update({ suspended: false }).eq("id", id)), log("reactivation", target, "")]);
      },
      logOfferWithdrawal: (target, reason, offerId) => {
        set((state) => ({
          actions: [{ id: `ad-${Date.now()}`, date: now(), kind: "retrait_offre", target, reason }, ...state.actions],
        }));
        void record(() => [
          ...(offerId ? [supabase.from("offers").update({ status: "desactivee" }).eq("id", offerId)] : []),
          log("retrait_offre", target, reason),
        ]);
      },
      markNoticesRead: (ids) => set((state) => ({ readNotices: [...new Set([...state.readNotices, ...ids])] })),
    }),
    // Les comptes viennent de la base à chaque connexion : seules les préférences locales sont gardées.
    { name: "sm.admin", partialize: (state) => ({ readNotices: state.readNotices }) }
  )
);
