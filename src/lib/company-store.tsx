import { create } from "zustand";
import {
  demoCompanyProfile,
  demoCompanyOffers,
  demoCandidates,
  demoInterviews,
  demoInterns,
  demoServices,
  demoSupervisors,
  type AssignmentDecision,
  type AssignmentSource,
  type Candidate,
  type CandidateStatus,
  type CompanyOffer,
  type CompanyProfile,
  type ExpertRun,
  type Interview,
  type Intern,
  type OfferStatus,
  type Service,
  type Supervisor,
} from "./company-data";
import { localIsoDate } from "./dates";
import type { HostingProfile } from "./auth";
import {
  buildExpertRun,
  EXPERT_ENGINE_VERSION,
  latestRunFor,
} from "./expert-engine";

/** Date du jour en heure locale (Kinshasa), pas en UTC. */
function today() {
  return localIsoDate();
}

function addMonths(iso: string, months: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return localIsoDate(date);
}

/** Une candidature close (acceptée, refusée, retirée) n'a plus d'entretien à venir. */
const CLOSED: CandidateStatus[] = ["acceptee", "refusee", "retiree"];
function cancelPendingInterviews(interviews: Interview[], candidateId: string) {
  return interviews.map((interview) =>
    interview.candidateId === candidateId && interview.status === "programme" && interview.date >= today()
      ? { ...interview, status: "annule" as const }
      : interview
  );
}

function historyEntry(status: CandidateStatus, note?: string) {
  return { status, date: today(), ...(note ? { note } : {}) };
}

const seedRuns: ExpertRun[] = demoInterns.map((intern) =>
  buildExpertRun({
    intern,
    candidate: demoCandidates.find((candidate) => candidate.id === intern.candidateId),
    offer: demoCompanyOffers.find((offer) => offer.id === intern.offerId),
    services: demoServices,
    interns: demoInterns,
    id: `run-seed-${intern.id}`,
    createdAt: intern.assignmentDecidedAt ?? "2026-11-03T09:00:00.000Z",
  })
);

const seedDecisions: AssignmentDecision[] = demoInterns
  .filter((intern) => intern.confirmed)
  .map((intern) => {
    const run = seedRuns.find((candidate) => candidate.internId === intern.id);
    return {
      internId: intern.id,
      serviceId: intern.serviceId ?? "",
      service: intern.service,
      decidedAt: intern.assignmentDecidedAt ?? "2026-11-03T09:00:00.000Z",
      decidedBy: intern.assignmentDecidedBy ?? demoCompanyProfile.representativeName,
      source: (intern.assignmentSource ?? "recommandation") as AssignmentSource,
      reason: intern.assignmentReason ?? "",
      runId: run?.id ?? "",
      engineVersion: run?.engineVersion ?? EXPERT_ENGINE_VERSION,
    };
  });

interface ValidationResult {
  ok: boolean;
  error?: string;
}

interface CompanyState {
  profile: CompanyProfile;
  offers: CompanyOffer[];
  candidates: Candidate[];
  interviews: Interview[];
  interns: Intern[];
  services: Service[];
  expertRuns: ExpertRun[];
  decisions: AssignmentDecision[];
  /** Identifiants des notifications déjà consultées. */
  readNotices: string[];

  markNoticesRead: (ids: string[]) => void;
  updateProfile: (p: Partial<CompanyProfile>) => void;
  addOffer: (o: Omit<CompanyOffer, "id" | "applicationsCount" | "published">) => void;
  updateOffer: (offerId: string, patch: Partial<CompanyOffer>) => void;
  setOfferStatus: (offerId: string, status: OfferStatus) => void;

  updateCandidateStatus: (candidateId: string, status: CandidateStatus, note?: string) => void;
  acceptCandidate: (candidateId: string) => string | null;
  refuseCandidate: (candidateId: string, reason: string) => void;

  scheduleInterview: (candidateId: string, date: string, time: string, location: string) => void;
  updateInterview: (interviewId: string, patch: Partial<Interview>) => void;
  setInterviewStatus: (interviewId: string, status: Interview["status"]) => void;

  updateIntern: (internId: string, patch: Partial<Intern>) => void;
  runExpertAnalysis: (internId: string) => ExpertRun | null;
  validateAssignment: (internId: string, serviceId: string, reason?: string) => ValidationResult;
  setReportStatus: (internId: string, reportId: string, status: Intern["reports"][number]["status"]) => void;
  setEvaluation: (internId: string, score: number, comment: string) => void;
  validateCertificate: (internId: string) => void;
  generateCertificate: (internId: string) => void;

  addService: (s: Omit<Service, "id" | "updatedAt">) => void;
  updateService: (serviceId: string, patch: Partial<Omit<Service, "id">>) => void;
  removeService: (serviceId: string) => void;

  /** Une candidature arrive de l'espace étudiant : elle devient un candidat « En attente ». */
  receiveApplication: (input: Omit<Candidate, "id" | "status" | "history">) => string;
  /** L'étudiant retire sa candidature ou décline la proposition. */
  studentWithdraw: (candidateId: string, note: string) => void;

  supervisors: Supervisor[];
  /** Réponses de l'entreprise à l'inscription : types de stagiaires, critères d'affectation… */
  hosting: HostingProfile | null;
  setHosting: (hosting: HostingProfile) => void;
  addSupervisor: (s: Omit<Supervisor, "id">) => void;
  updateSupervisor: (supervisorId: string, patch: Partial<Omit<Supervisor, "id">>) => void;
  /** Retire un encadreur sans stagiaire. Refusé s'il suit encore quelqu'un. */
  removeSupervisor: (supervisorId: string) => ValidationResult;
  /** Désigne l'encadreur d'un stagiaire : même service, capacité respectée. */
  assignSupervisor: (internId: string, supervisorId: string) => ValidationResult;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  profile: demoCompanyProfile,
  offers: demoCompanyOffers,
  candidates: demoCandidates,
  interviews: demoInterviews,
  interns: demoInterns,
  services: demoServices,
  supervisors: demoSupervisors,
  hosting: null,
  setHosting: (hosting) => set({ hosting }),
  expertRuns: seedRuns,
  decisions: seedDecisions,
  // Démo : les plus anciennes notifications sont déjà lues.
  readNotices: ["c-c2", "e-i5", "r-s1"],

  markNoticesRead: (ids) =>
    set((state) => ({ readNotices: Array.from(new Set([...state.readNotices, ...ids])) })),

  updateProfile: (p) => set({ profile: { ...get().profile, ...p } }),

  addOffer: (o) =>
    set((state) => ({
      offers: [
        {
          ...o,
          id: `o-${Date.now()}`,
          applicationsCount: 0,
          published: today(),
        },
        ...state.offers,
      ],
    })),

  updateOffer: (offerId, patch) =>
    set((state) => ({
      offers: state.offers.map((o) => (o.id === offerId ? { ...o, ...patch } : o)),
    })),

  setOfferStatus: (offerId, status) =>
    set((state) => ({
      offers: state.offers.map((o) => (o.id === offerId ? { ...o, status } : o)),
    })),

  updateCandidateStatus: (candidateId, status, note) =>
    set((state) => ({
      interviews: CLOSED.includes(status) ? cancelPendingInterviews(state.interviews, candidateId) : state.interviews,
      candidates: state.candidates.map((candidate) => {
        if (candidate.id !== candidateId || candidate.status === status) return candidate;
        return {
          ...candidate,
          status,
          history: [...candidate.history, historyEntry(status, note)],
        };
      }),
    })),

  acceptCandidate: (candidateId) => {
    const state = get();
    const candidate = state.candidates.find((entry) => entry.id === candidateId);
    if (!candidate) return null;

    const existing = state.interns.find((intern) => intern.candidateId === candidateId);
    if (existing) {
      set({
        interviews: cancelPendingInterviews(state.interviews, candidateId),
        candidates: state.candidates.map((entry) =>
          entry.id === candidateId && entry.status !== "acceptee"
            ? {
                ...entry,
                status: "acceptee",
                history: [...entry.history, historyEntry("acceptee", "Candidature acceptée")],
              }
            : entry
        ),
      });
      return existing.id;
    }

    const start = today();
    const internId = `s-${Date.now()}`;
    const intern: Intern = {
      id: internId,
      candidateId,
      name: candidate.name,
      initials: candidate.initials,
      offerId: candidate.offerId,
      service: "À affecter",
      start,
      end: addMonths(start, 3),
      missions: "",
      objectives: "",
      confirmed: false,
      reports: [],
      evaluation: null,
      certificate: "non_generee",
    };

    set({
      candidates: state.candidates.map((entry) =>
        entry.id === candidateId
          ? {
              ...entry,
              status: "acceptee",
              history: [...entry.history, historyEntry("acceptee", "Candidature acceptée")],
            }
          : entry
      ),
      interns: [intern, ...state.interns],
      interviews: cancelPendingInterviews(state.interviews, candidateId),
    });

    // Un nouveau stagiaire est disponible : le moteur d'inférence propose aussitôt des services.
    // Il recommande seulement ; l'entreprise valide ensuite l'affectation.
    get().runExpertAnalysis(internId);

    return internId;
  },

  refuseCandidate: (candidateId, reason) =>
    set((state) => ({
      interviews: cancelPendingInterviews(state.interviews, candidateId),
      candidates: state.candidates.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              status: "refusee",
              refusalReason: reason.trim(),
              history: [
                ...candidate.history,
                historyEntry("refusee", reason.trim() || "Candidature refusée"),
              ],
            }
          : candidate
      ),
    })),

  scheduleInterview: (candidateId, date, time, location) =>
    set((state) => ({
      interviews: [
        ...state.interviews,
        { id: `i-${Date.now()}`, candidateId, date, time, location, status: "programme" },
      ],
      candidates: state.candidates.map((candidate) =>
        candidate.id === candidateId && candidate.status !== "entretien"
          ? {
              ...candidate,
              status: "entretien",
              history: [...candidate.history, historyEntry("entretien", "Entretien programmé")],
            }
          : candidate
      ),
    })),

  setInterviewStatus: (interviewId, status) =>
    set((state) => ({
      interviews: state.interviews.map((interview) =>
        interview.id === interviewId ? { ...interview, status } : interview
      ),
    })),

  updateInterview: (interviewId, patch) =>
    set((state) => ({
      interviews: state.interviews.map((interview) =>
        interview.id === interviewId ? { ...interview, ...patch } : interview
      ),
    })),

  updateIntern: (internId, patch) =>
    set((state) => ({
      interns: state.interns.map((intern) =>
        intern.id === internId ? { ...intern, ...patch } : intern
      ),
    })),

  runExpertAnalysis: (internId) => {
    const state = get();
    const intern = state.interns.find((entry) => entry.id === internId);
    if (!intern) return null;

    const run = buildExpertRun({
      intern,
      candidate: state.candidates.find((candidate) => candidate.id === intern.candidateId),
      offer: state.offers.find((offer) => offer.id === intern.offerId),
      services: state.services,
      interns: state.interns,
    });

    set({ expertRuns: [run, ...state.expertRuns] });
    return run;
  },

  validateAssignment: (internId, serviceId, reason = "") => {
    const state = get();
    const intern = state.interns.find((entry) => entry.id === internId);
    if (!intern) return { ok: false, error: "Dossier stagiaire introuvable." };

    const service = state.services.find((entry) => entry.id === serviceId);
    if (!service) return { ok: false, error: "Choisissez un service d'affectation." };

    const latestRun = latestRunFor(state.expertRuns, internId);
    const recommended = Boolean(
      latestRun?.proposals.some((proposal) => proposal.serviceId === serviceId)
    );
    const motive = reason.trim();

    if (!recommended && !motive) {
      return {
        ok: false,
        error:
          "Un motif est requis lorsque vous vous écartez de la recommandation du système expert.",
      };
    }

    const stamp = new Date().toISOString();
    const source: AssignmentSource = recommended ? "recommandation" : "manuel";

    set({
      interns: state.interns.map((entry) =>
        entry.id === internId
          ? {
              ...entry,
              service: service.name,
              serviceId: service.id,
              supervisorId:
                state.supervisors.find((s) => s.id === entry.supervisorId)?.serviceId === service.id
                  ? entry.supervisorId
                  : undefined,
              confirmed: true,
              assignmentSource: source,
              assignmentReason: motive,
              assignmentDecidedAt: stamp,
              assignmentDecidedBy: state.profile.representativeName,
              expertRunId: latestRun?.id,
            }
          : entry
      ),
      decisions: [
        {
          internId,
          serviceId: service.id,
          service: service.name,
          decidedAt: stamp,
          decidedBy: state.profile.representativeName,
          source,
          reason: motive,
          runId: latestRun?.id ?? "",
          engineVersion: latestRun?.engineVersion ?? EXPERT_ENGINE_VERSION,
        },
        ...state.decisions,
      ],
    });

    return { ok: true };
  },

  setReportStatus: (internId, reportId, status) =>
    set((state) => ({
      interns: state.interns.map((intern) =>
        intern.id === internId
          ? {
              ...intern,
              reports: intern.reports.map((report) =>
                report.id === reportId ? { ...report, status } : report
              ),
            }
          : intern
      ),
    })),

  setEvaluation: (internId, score, comment) =>
    set((state) => ({
      interns: state.interns.map((intern) =>
        intern.id === internId ? { ...intern, evaluation: { score, comment } } : intern
      ),
    })),

  generateCertificate: (internId) =>
    set((state) => ({
      interns: state.interns.map((intern) =>
        intern.id === internId
          ? {
              ...intern,
              certificate: "generee",
              certificateGeneratedAt: new Date().toISOString(),
            }
          : intern
      ),
    })),

  validateCertificate: (internId) =>
    set((state) => ({
      interns: state.interns.map((intern) =>
        intern.id === internId
          ? {
              ...intern,
              certificate: "validee",
              certificateValidatedAt: new Date().toISOString(),
            }
          : intern
      ),
    })),

  addService: (service) =>
    set((state) => ({
      services: [
        ...state.services,
        { ...service, id: `sv-${Date.now()}`, updatedAt: today() },
      ],
    })),

  updateService: (serviceId, patch) =>
    set((state) => ({
      services: state.services.map((service) =>
        service.id === serviceId ? { ...service, ...patch, updatedAt: today() } : service
      ),
    })),

  removeService: (serviceId) =>
    set((state) => ({
      services: state.services.filter((service) => service.id !== serviceId),
    })),

  receiveApplication: (input) => {
    const id = `c-${Date.now()}`;
    set((state) => ({
      candidates: [{ ...input, id, status: "en_attente", history: [historyEntry("en_attente", "Candidature reçue")] }, ...state.candidates],
      offers: state.offers.map((offer) =>
        offer.id === input.offerId ? { ...offer, applicationsCount: offer.applicationsCount + 1 } : offer
      ),
    }));
    return id;
  },

  studentWithdraw: (candidateId, note) =>
    set((state) => ({
      interviews: cancelPendingInterviews(state.interviews, candidateId),
      // Un dossier pas encore validé n'a plus lieu d'être : l'étudiant ne fera pas ce stage.
      interns: state.interns.filter((intern) => intern.candidateId !== candidateId || intern.confirmed),
      candidates: state.candidates.map((candidate) =>
        candidate.id === candidateId && candidate.status !== "retiree"
          ? { ...candidate, status: "retiree", history: [...candidate.history, historyEntry("retiree", note)] }
          : candidate
      ),
    })),

  addSupervisor: (supervisor) =>
    set((state) => ({ supervisors: [...state.supervisors, { ...supervisor, id: `e-${Date.now()}` }] })),

  updateSupervisor: (supervisorId, patch) =>
    set((state) => ({
      supervisors: state.supervisors.map((s) => (s.id === supervisorId ? { ...s, ...patch } : s)),
    })),

  removeSupervisor: (supervisorId) => {
    const state = get();
    const followed = state.interns.filter((intern) => intern.supervisorId === supervisorId).length;
    if (followed > 0)
      return { ok: false, error: `Cet encadreur suit encore ${followed} stagiaire${followed > 1 ? "s" : ""} : désignez-leur d'abord un autre encadreur.` };
    set({ supervisors: state.supervisors.filter((s) => s.id !== supervisorId) });
    return { ok: true };
  },

  assignSupervisor: (internId, supervisorId) => {
    const state = get();
    const intern = state.interns.find((entry) => entry.id === internId);
    const supervisor = state.supervisors.find((entry) => entry.id === supervisorId);
    if (!intern) return { ok: false, error: "Dossier stagiaire introuvable." };
    if (!supervisor) return { ok: false, error: "Choisissez un encadreur." };
    if (!intern.confirmed || !intern.serviceId)
      return { ok: false, error: "Validez d'abord l'affectation du stagiaire à un service." };
    if (supervisor.serviceId !== intern.serviceId)
      return { ok: false, error: "L'encadreur doit appartenir au service d'accueil du stagiaire." };
    const load = state.interns.filter((entry) => entry.supervisorId === supervisorId && entry.id !== internId).length;
    if (load >= supervisor.capacity)
      return { ok: false, error: `${supervisor.name} suit déjà ${load} stagiaire${load > 1 ? "s" : ""} sur ${supervisor.capacity} : capacité atteinte.` };
    set({
      interns: state.interns.map((entry) => (entry.id === internId ? { ...entry, supervisorId } : entry)),
    });
    return { ok: true };
  },
}));
