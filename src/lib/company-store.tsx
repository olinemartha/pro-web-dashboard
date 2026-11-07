import { create } from "zustand";
import {
  demoCompanyProfile,
  demoCompanyOffers,
  demoCandidates,
  demoInterviews,
  demoInterns,
  demoServices,
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
} from "./company-data";
import {
  buildExpertRun,
  EXPERT_ENGINE_VERSION,
  latestRunFor,
} from "./expert-engine";

function today() {
  return new Date().toISOString().split("T")[0];
}

function addMonths(iso: string, months: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
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
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  profile: demoCompanyProfile,
  offers: demoCompanyOffers,
  candidates: demoCandidates,
  interviews: demoInterviews,
  interns: demoInterns,
  services: demoServices,
  expertRuns: seedRuns,
  decisions: seedDecisions,

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
      supervisor: "",
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
    });

    return internId;
  },

  refuseCandidate: (candidateId, reason) =>
    set((state) => ({
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
}));
