import { create } from "zustand";
import type { Profile, Application } from "./rules";
import { profileCompletion, confirmOffer } from "./rules";
import { demoProfile, demoApplications, demoSaved, demoNotifications, demoActivity } from "./mock-data";

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtRel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

interface AppState {
  profile: Profile;
  applications: Application[];
  saved: string[];
  notifications: typeof demoNotifications;
  activity: typeof demoActivity;
  completion: number;
  confirmed: boolean;
  updateProfile: (p: Partial<Profile>) => void;
  setProfile: (p: Profile) => void;
  addApplication: (a: Application) => void;
  toggleSave: (offerId: string) => void;
  confirm: (appId: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  profile: demoProfile,
  applications: demoApplications,
  saved: demoSaved,
  notifications: demoNotifications,
  activity: demoActivity,
  completion: profileCompletion(demoProfile),
  confirmed: false,

  updateProfile: (p) => {
    const profile = { ...get().profile, ...p };
    set({ profile, completion: profileCompletion(profile) });
  },

  setProfile: (p) => set({ profile: p, completion: profileCompletion(p) }),

  addApplication: (a) =>
    set((state) => ({ applications: [...state.applications, a] })),

  toggleSave: (offerId) =>
    set((state) => ({
      saved: state.saved.includes(offerId)
        ? state.saved.filter((id) => id !== offerId)
        : [...state.saved, offerId],
    })),

  confirm: (appId) => {
    const apps = confirmOffer(get().applications, appId);
    set({ applications: apps, confirmed: true });
  },
}));
