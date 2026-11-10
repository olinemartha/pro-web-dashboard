import { create } from "zustand";
import type { Profile, Application } from "./rules";
import { profileCompletion, confirmOffer, withdrawApplication } from "./rules";
import { demoProfile, demoApplications, demoSaved, demoNotifications, demoActivity } from "./mock-data";

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
  /** Retire une candidature en cours (statut « Retirée »). */
  withdraw: (appId: string) => void;
  /** Marque des notifications comme lues. */
  markNotificationsRead: (ids: string[]) => void;
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

  markNotificationsRead: (ids) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
    })),

  withdraw: (appId) => set((state) => ({ applications: withdrawApplication(state.applications, appId) })),

  confirm: (appId) => {
    const apps = confirmOffer(get().applications, appId);
    set({ applications: apps, confirmed: true });
  },
}));
