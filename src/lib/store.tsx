import { useMemo } from "react";
import { create } from "zustand";
import type { Profile, Application, AppStatus } from "./rules";
import { profileCompletion, confirmOffer, withdrawApplication } from "./rules";
import {
  demoProfile,
  demoApplications,
  demoSaved,
  demoNotifications,
  demoActivity,
  offerOf,
  toStudentOffer,
  type Activity,
  type Notification,
  type Offer,
} from "./mock-data";
import { useCompanyStore } from "./company-store";
import type { CandidateStatus } from "./company-data";
import { fmtDate, localIsoDate } from "./dates";
import { latestRunFor } from "./expert-engine";

interface AppState {
  profile: Profile;
  applications: Application[];
  saved: string[];
  notifications: Notification[];
  activity: Activity[];
  completion: number;
  confirmed: boolean;
  updateProfile: (p: Partial<Profile>) => void;
  setProfile: (p: Profile) => void;
  /** Envoie une candidature : elle arrive aussitôt chez l'entreprise. */
  apply: (offerId: string) => void;
  toggleSave: (offerId: string) => void;
  confirm: (appId: string) => void;
  /** Retire une candidature en cours (statut « Retirée »). */
  withdraw: (appId: string) => void;
  /** Marque des notifications comme lues. */
  markNotificationsRead: (ids: string[]) => void;
}

const nowIso = () => new Date().toISOString().slice(0, 19);

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

  apply: (offerId) => {
    const { profile } = get();
    const name = `${profile.prenom} ${profile.nom}`.trim();
    const appId = `a-${Date.now()}`;
    // Le profil part tel quel chez l'entreprise : c'est le dossier du candidat.
    const candidateId = useCompanyStore.getState().receiveApplication({
      offerId,
      name,
      initials: `${profile.prenom[0] ?? ""}${profile.nom[0] ?? ""}`.toUpperCase(),
      universite: profile.universite,
      filiere: profile.filiere,
      niveau: profile.niveau,
      email: profile.email,
      phone: profile.telephone,
      competences: profile.competences,
      photo: profile.photo,
      cvName: profile.cv?.name ?? "",
      appliedAt: localIsoDate(),
      studentAppId: appId,
    });
    const offer = offerOf(offerId);
    set((state) => ({
      applications: [...state.applications, { id: appId, offerId, date: localIsoDate(), status: "envoyee", candidateId }],
      activity: [
        { id: `ac-${appId}`, label: "Candidature envoyée", detail: `${offer.title} · FINCA RDC`, date: nowIso(), kind: "envoi" },
        ...state.activity,
      ],
    }));
  },

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

  withdraw: (appId) => {
    const app = get().applications.find((a) => a.id === appId);
    set((state) => ({ applications: withdrawApplication(state.applications, appId) }));
    if (app?.candidateId) useCompanyStore.getState().studentWithdraw(app.candidateId, "Candidature retirée par l'étudiant");
  },

  confirm: (appId) => {
    const before = get().applications;
    const apps = confirmOffer(before, appId);
    set({ applications: apps, confirmed: true });
    // Les propositions déclinées sont retirées chez l'entreprise.
    apps
      .filter((a) => a.status === "declinee" && before.find((b) => b.id === a.id)?.status !== "declinee" && a.candidateId)
      .forEach((a) => useCompanyStore.getState().studentWithdraw(a.candidateId!, "Proposition déclinée par l'étudiant"));
  },
}));

/* ------------------------------------------------------------------ */
/* Lien entre les deux espaces                                          */
/* ------------------------------------------------------------------ */

/** Statut côté entreprise → statut vu par l'étudiant. */
const FROM_COMPANY: Record<CandidateStatus, AppStatus> = {
  en_attente: "envoyee",
  examen: "examen",
  entretien: "entretien",
  acceptee: "acceptee",
  refusee: "refusee",
  retiree: "retiree",
};

/** Ce que l'étudiant reçoit quand l'entreprise avance sur sa candidature. */
function noticeFor(status: AppStatus, title: string, interview?: Application["interview"]) {
  switch (status) {
    case "examen":
      return { title: "Candidature en examen", body: `FINCA RDC étudie votre candidature « ${title} ».`, kind: "candidature" as const, act: "vue" as const };
    case "entretien":
      return {
        title: "Entretien programmé",
        body: interview
          ? `Entretien le ${fmtDate(interview.date, false)} à ${interview.time} pour « ${title} » · ${interview.place}.`
          : `Un entretien est programmé pour « ${title} ».`,
        kind: "entretien" as const,
        act: "entretien" as const,
      };
    case "acceptee":
      return { title: "Candidature acceptée", body: `FINCA RDC a accepté votre candidature « ${title} ».`, kind: "candidature" as const, act: "acceptee" as const };
    case "refusee":
      return { title: "Candidature non retenue", body: `FINCA RDC n'a pas retenu votre candidature « ${title} ».`, kind: "candidature" as const, act: "refusee" as const };
    default:
      return null;
  }
}

// Chaque décision de l'entreprise (examen, entretien, acceptation, refus) se répercute
// sur la candidature de l'étudiant, avec une notification.
useCompanyStore.subscribe((company) => {
  const student = useStore.getState();
  const notices: Notification[] = [];
  const events: Activity[] = [];
  let changed = false;

  const applications = student.applications.map((app) => {
    if (!app.candidateId) return app;
    const candidate = company.candidates.find((c) => c.id === app.candidateId);
    if (!candidate) return app;

    let status = FROM_COMPANY[candidate.status];
    // Le choix de l'étudiant (confirmer, décliner, retirer) l'emporte sur l'état « accepté » ou « retiré ».
    if ((app.status === "confirmee" || app.status === "declinee") && (status === "acceptee" || status === "retiree")) status = app.status;
    if (app.status === "retiree") status = "retiree";

    const next = company.interviews
      .filter((i) => i.candidateId === candidate.id && i.status === "programme")
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
    const interview = status === "entretien" && next ? { date: next.date, time: next.time, place: next.location } : undefined;

    const sameInterview = JSON.stringify(interview ?? null) === JSON.stringify(app.interview ?? null);
    if (status === app.status && sameInterview) return app;

    changed = true;
    const notice = noticeFor(status, offerOf(app.offerId).title, interview);
    if (notice) {
      const stamp = nowIso();
      notices.push({ id: `n-${app.id}-${status}-${Date.now()}`, title: notice.title, body: notice.body, date: stamp, read: false, kind: notice.kind });
      events.push({ id: `ac-${app.id}-${status}-${Date.now()}`, label: notice.title, detail: `${offerOf(app.offerId).title} · FINCA RDC`, date: stamp, kind: notice.act });
    }
    return { ...app, status, interview };
  });

  if (changed)
    useStore.setState((state) => ({
      applications,
      notifications: [...notices, ...state.notifications],
      activity: [...events, ...state.activity],
    }));
});

// Affectation validée et encadreur désigné : l'étudiant en est prévenu.
// On mémorise ce qui a déjà été vu pour ne notifier qu'un vrai changement.
const seenAssignment = new Map<string, { serviceId?: string; supervisorId?: string; confirmed: boolean }>();
useCompanyStore.subscribe((company) => {
  const student = useStore.getState();
  const notices: Notification[] = [];
  for (const app of student.applications) {
    if (app.status !== "confirmee" || !app.candidateId) continue;
    const intern = company.interns.find((entry) => entry.candidateId === app.candidateId);
    if (!intern) continue;
    const now = { serviceId: intern.serviceId, supervisorId: intern.supervisorId, confirmed: intern.confirmed };
    const before = seenAssignment.get(intern.id);
    seenAssignment.set(intern.id, now);
    if (!before) continue;
    const stamp = nowIso();
    if (now.confirmed && (!before.confirmed || before.serviceId !== now.serviceId))
      notices.push({
        id: `n-affectation-${intern.id}-${Date.now()}`,
        title: "Affectation validée",
        body: `Service d'accueil : ${intern.service}. Les raisons sont dans « Suivi du stage ».`,
        date: stamp,
        read: false,
        kind: "stage",
      });
    if (now.supervisorId && now.supervisorId !== before.supervisorId) {
      const supervisor = company.supervisors.find((entry) => entry.id === now.supervisorId);
      notices.push({
        id: `n-encadreur-${intern.id}-${Date.now()}`,
        title: "Encadreur désigné",
        body: `${supervisor?.name ?? "Votre encadreur"} suivra votre stage.`,
        date: stamp,
        read: false,
        kind: "stage",
      });
    }
  }
  if (notices.length) useStore.setState((state) => ({ notifications: [...notices, ...state.notifications] }));
});

// L'étudiant confirme son stage : on note l'état du dossier à cet instant (point de départ des notifications).
useStore.subscribe((student) => {
  const company = useCompanyStore.getState();
  for (const app of student.applications) {
    if (app.status !== "confirmee" || !app.candidateId) continue;
    const intern = company.interns.find((entry) => entry.candidateId === app.candidateId);
    if (intern && !seenAssignment.has(intern.id))
      seenAssignment.set(intern.id, { serviceId: intern.serviceId, supervisorId: intern.supervisorId, confirmed: intern.confirmed });
  }
});

/** Les offres que l'entreprise a publiées : l'étudiant ne voit ni les brouillons ni les offres clôturées. */
export function usePublishedOffers(): Offer[] {
  const companyOffers = useCompanyStore((state) => state.offers);
  return useMemo(() => companyOffers.filter((o) => o.status === "publiee").map(toStudentOffer), [companyOffers]);
}

/** Statut de publication d'une offre chez l'entreprise. */
export function useOfferIsOpen(offerId: string) {
  return useCompanyStore((state) => state.offers.find((o) => o.id === offerId)?.status === "publiee");
}

/**
 * Le dossier d'affectation de l'étudiant chez l'entreprise : analyse du système expert,
 * décision validée, encadreur. Lecture seule ; l'entreprise reste seule à décider.
 */
export function useMyAssignment(candidateId?: string) {
  const interns = useCompanyStore((state) => state.interns);
  const expertRuns = useCompanyStore((state) => state.expertRuns);
  const decisions = useCompanyStore((state) => state.decisions);
  const supervisors = useCompanyStore((state) => state.supervisors);
  return useMemo(() => {
    if (!candidateId) return null;
    const intern = interns.find((entry) => entry.candidateId === candidateId);
    if (!intern) return null;
    return {
      intern,
      run: latestRunFor(expertRuns, intern.id),
      decision: decisions.find((entry) => entry.internId === intern.id),
      supervisor: supervisors.find((entry) => entry.id === intern.supervisorId),
    };
  }, [candidateId, interns, expertRuns, decisions, supervisors]);
}
