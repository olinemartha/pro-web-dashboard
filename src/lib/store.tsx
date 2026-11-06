import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  demoActivity, demoApplications, demoNotifications, demoProfile, demoSaved, internshipExtras, offerOf,
  type Activity, type Doc, type Notification, type Report,
} from "./mock-data";
import { canApply, confirmOffer, profileCompletion, type Application, type Profile } from "./rules";

interface State {
  profile: Profile; applications: Application[]; saved: string[];
  notifications: Notification[]; activity: Activity[]; reports: Report[];
}
const initial: State = {
  profile: demoProfile, applications: demoApplications, saved: demoSaved,
  notifications: demoNotifications, activity: demoActivity, reports: [],
};
const KEY = "stagemanager-demo-v1";

function useStoreValue() {
  const [s, setS] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setS({ ...initial, ...JSON.parse(raw) }); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(s)); }, [s, ready]);

  const now = () => new Date().toISOString();
  const confirmed = s.applications.find((a) => a.status === "confirmee") ?? null;

  return {
    ...s, ready, completion: profileCompletion(s.profile), confirmed,
    documents: (confirmed ? internshipExtras.documents : []) as Doc[],
    unread: s.notifications.filter((n) => !n.read).length,
    toggleSave(id: string) {
      const on = s.saved.includes(id);
      setS({ ...s, saved: on ? s.saved.filter((x) => x !== id) : [...s.saved, id] });
      toast.success(on ? "Offre retirée de vos favoris" : "Offre enregistrée");
    },
    apply(offerId: string) {
      const r = canApply(s.profile, s.applications, offerId);
      if (!r.ok) return r;
      const o = offerOf(offerId);
      setS({
        ...s,
        applications: [{ id: `a${Date.now()}`, offerId, date: now().slice(0, 10), status: "envoyee" }, ...s.applications],
        activity: [{ id: `ac${Date.now()}`, label: "Candidature envoyée", detail: `${o.title} · FINCA RDC`, date: now(), kind: "envoi" }, ...s.activity],
        notifications: [{ id: `n${Date.now()}`, title: "Candidature envoyée", body: `Votre candidature « ${o.title} » a bien été transmise.`, date: now(), read: false, kind: "candidature" }, ...s.notifications],
      });
      return r;
    },
    confirm(appId: string) {
      setS({
        ...s, applications: confirmOffer(s.applications, appId),
        notifications: [{ id: `n${Date.now()}`, title: "Affectation confirmée", body: "Votre stage est confirmé. Les autres entreprises ont été informées de votre décision.", date: now(), read: false, kind: "stage" }, ...s.notifications],
      });
    },
    updateProfile(p: Partial<Profile>) { setS((x) => ({ ...x, profile: { ...x.profile, ...p } })); },
    addReport(r: Omit<Report, "id" | "date" | "statut">) {
      setS({ ...s, reports: [{ ...r, id: `r${Date.now()}`, date: now(), statut: "Soumis" }, ...s.reports] });
    },
    markRead(id: string) { setS({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }); },
    markAllRead() { setS({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }); },
    reset() { setS(initial); toast.success("Données de démonstration réinitialisées"); },
  };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreValue();
  return <Ctx.Provider value={useMemo(() => v, [v])}>{children}</Ctx.Provider>;
}
export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}

export const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
export const fmtRel = (d: string) => {
  const diff = (Date.now() - new Date(d).getTime()) / 86400000;
  if (diff < 1) return "Aujourd'hui";
  if (diff < 2) return "Hier";
  if (diff < 30) return `Il y a ${Math.floor(diff)} j`;
  return fmtDate(d);
};
