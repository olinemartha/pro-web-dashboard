/**
 * Espace administrateur : ses propres décisions (suspensions, retraits d'offres) et
 * le journal de ces actions. Les données de la plateforme viennent des autres stores.
 * Le PRD exige que chaque action d'administration soit tracée et motivée.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { localIsoDateTime } from "./dates";

export type AdminAction = {
  id: string;
  date: string;
  kind: "suspension" | "reactivation" | "retrait_offre";
  target: string;
  reason: string;
};

type AdminState = {
  /** Adresses e-mail des comptes suspendus. */
  suspended: string[];
  actions: AdminAction[];
  readNotices: string[];
  suspend: (email: string, target: string, reason: string) => void;
  reactivate: (email: string, target: string) => void;
  logOfferWithdrawal: (target: string, reason: string) => void;
  markNoticesRead: (ids: string[]) => void;
};

const now = () => localIsoDateTime();

export const useAdminStore = create<AdminState>()(persist((set) => ({
  suspended: [],
  actions: [],
  readNotices: [],
  suspend: (email, target, reason) =>
    set((state) => ({
      suspended: [...new Set([...state.suspended, email])],
      actions: [{ id: `ad-${Date.now()}`, date: now(), kind: "suspension", target, reason }, ...state.actions],
    })),
  reactivate: (email, target) =>
    set((state) => ({
      suspended: state.suspended.filter((entry) => entry !== email),
      actions: [{ id: `ad-${Date.now()}`, date: now(), kind: "reactivation", target, reason: "" }, ...state.actions],
    })),
  logOfferWithdrawal: (target, reason) =>
    set((state) => ({
      actions: [{ id: `ad-${Date.now()}`, date: now(), kind: "retrait_offre", target, reason }, ...state.actions],
    })),
  markNoticesRead: (ids) => set((state) => ({ readNotices: [...new Set([...state.readNotices, ...ids])] })),
}), { name: "sm.admin" }));
