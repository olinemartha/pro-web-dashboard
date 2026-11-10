// Moteur d'expertise de démonstration.
// Les règles ci-dessous sont explicitement des règles de démonstration :
// elles ne représentent pas les règles réelles d'affectation de FINCA RDC.

import type {
  Candidate,
  CompanyOffer,
  ExpertCriterion,
  ExpertProposal,
  ExpertRule,
  ExpertRun,
  Intern,
  Service,
} from "./company-data";

export const EXPERT_ENGINE_VERSION = "demo-1.0";

export const DEMO_RULES: ExpertRule[] = [
  {
    id: "R1",
    label: "Formation compatible",
    description:
      "La filière ou le niveau du candidat correspond aux formations attendues par le service. Règle de démonstration.",
  },
  {
    id: "R2",
    label: "Compétences communes",
    description:
      "Au moins deux compétences déclarées par le candidat figurent parmi celles attendues par le service. Règle de démonstration.",
  },
  {
    id: "R3",
    label: "Capacité disponible",
    description:
      "Le service dispose encore d'au moins une place non pourvue au moment de l'analyse. Règle de démonstration.",
  },
  {
    id: "R4",
    label: "Continuité de l'offre",
    description:
      "Le service correspond à celui de l'offre à laquelle le candidat a postulé. Règle de démonstration.",
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function compact(value: string): string {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function words(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);
}

function educationMatches(candidate: Candidate, service: Service): boolean {
  if (!service.education.trim()) return false;
  const serviceText = normalize(service.education);
  if (compact(service.education).includes(compact(candidate.niveau))) return true;
  return words(candidate.filiere).some((word) => serviceText.includes(word));
}

export function countFilledPlaces(
  service: Service,
  interns: Intern[],
  excludeInternId?: string
): number {
  return interns.filter(
    (intern) =>
      intern.id !== excludeInternId &&
      intern.confirmed &&
      (intern.serviceId ? intern.serviceId === service.id : intern.service === service.name)
  ).length;
}

interface BuildRunInput {
  intern: Intern;
  candidate?: Candidate;
  offer?: CompanyOffer;
  services: Service[];
  interns: Intern[];
  id?: string;
  createdAt?: string;
}

export function buildExpertRun({
  intern,
  candidate,
  offer,
  services,
  interns,
  id,
  createdAt,
}: BuildRunInput): ExpertRun {
  const runId = id ?? `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const stamp = createdAt ?? new Date().toISOString();

  const facts = [
    { label: "Candidat", value: intern.name },
    { label: "Offre", value: offer?.title ?? "Offre introuvable" },
    { label: "Filière", value: candidate?.filiere ?? "Non renseignée" },
    { label: "Niveau", value: candidate?.niveau ?? "Non renseigné" },
    {
      label: "Compétences",
      value: candidate?.competences.length ? candidate.competences.join(", ") : "Non renseignées",
    },
    { label: "Service de l'offre", value: offer?.department ?? "Non renseigné" },
  ];

  const missingFacts: string[] = [];
  if (!candidate) missingFacts.push("Profil du candidat introuvable");
  if (!candidate?.competences.length) missingFacts.push("Compétences non renseignées");
  if (!candidate?.niveau) missingFacts.push("Niveau d'études non renseigné");
  if (!offer) missingFacts.push("Offre d'origine introuvable");
  if (services.length === 0) missingFacts.push("Aucun service et besoin renseigné");

  if (services.length === 0) {
    return {
      id: runId,
      internId: intern.id,
      createdAt: stamp,
      engineVersion: EXPERT_ENGINE_VERSION,
      status: "aucune_proposition",
      facts,
      rules: DEMO_RULES,
      proposals: [],
      missingFacts,
    };
  }

  if (!candidate || candidate.competences.length === 0) {
    return {
      id: runId,
      internId: intern.id,
      createdAt: stamp,
      engineVersion: EXPERT_ENGINE_VERSION,
      status: "donnees_insuffisantes",
      facts,
      rules: DEMO_RULES,
      proposals: [],
      missingFacts,
    };
  }

  const proposals: ExpertProposal[] = services.map((service) => {
    const filled = countFilledPlaces(service, interns, intern.id);
    const left = Math.max(0, service.internsNeeded - filled);
    const overlapping = candidate.competences.filter((skill) =>
      service.skills.some((expected) => compact(expected) === compact(skill))
    );
    const educationOk = educationMatches(candidate, service);
    const skillsOk = overlapping.length >= 2;
    const capacityOk = left > 0;
    const continuityOk = Boolean(offer && compact(service.name) === compact(offer.department));

    const satisfied: ExpertCriterion[] = [
      {
        label: "Formation compatible",
        satisfied: educationOk,
        detail: service.education.trim()
          ? `Formation attendue : ${service.education}`
          : "Formations non renseignées par le service",
        ruleId: "R1",
      },
      {
        label: "Compétences communes",
        satisfied: skillsOk,
        detail: overlapping.length
          ? `${overlapping.length} compétence${overlapping.length > 1 ? "s" : ""} commune${overlapping.length > 1 ? "s" : ""} : ${overlapping.join(", ")}`
          : "Aucune compétence commune",
        ruleId: "R2",
      },
      {
        label: "Capacité disponible",
        satisfied: capacityOk,
        detail: `${left} place${left > 1 ? "s" : ""} libre${left > 1 ? "s" : ""} sur ${service.internsNeeded}`,
        ruleId: "R3",
      },
      {
        label: "Continuité de l'offre",
        satisfied: continuityOk,
        detail: offer ? `Service de l'offre : ${offer.department}` : "Offre introuvable",
        ruleId: "R4",
      },
    ];

    const limits: string[] = [];
    if (!educationOk) limits.push("Formation hors du périmètre déclaré par le service");
    if (!skillsOk) limits.push(`Compétences partielles (${overlapping.length} sur 2 attendues)`);
    if (!capacityOk) limits.push("Aucune place restante au moment de l'analyse");
    if (!continuityOk) limits.push("Service différent de celui de l'offre d'origine");

    const score =
      satisfied.filter((criterion) => criterion.satisfied).length * 10 +
      (continuityOk ? 3 : 0) +
      (capacityOk ? 2 : 0);

    return {
      serviceId: service.id,
      serviceName: service.name,
      rank: 0,
      satisfied,
      limits,
      ruleIds: DEMO_RULES.map((rule) => rule.id),
      capacityAtRun: { needed: service.internsNeeded, filled, left },
      summary: `${satisfied.filter((criterion) => criterion.satisfied).length} critère${satisfied.filter((criterion) => criterion.satisfied).length > 1 ? "s" : ""} sur ${satisfied.length}`,
      score,
    };
  });

  proposals.sort((a, b) => b.score - a.score || a.serviceName.localeCompare(b.serviceName));
  proposals.forEach((proposal, index) => {
    proposal.rank = index + 1;
  });

  return {
    id: runId,
    internId: intern.id,
    createdAt: stamp,
    engineVersion: EXPERT_ENGINE_VERSION,
    status: proposals.length ? "prete" : "aucune_proposition",
    facts,
    rules: DEMO_RULES,
    proposals,
    missingFacts,
  };
}

export function latestRunFor(runs: ExpertRun[], internId: string): ExpertRun | undefined {
  return [...runs]
    .filter((run) => run.internId === internId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function isRecommendedService(run: ExpertRun | undefined, serviceId: string): boolean {
  return Boolean(run?.proposals.some((proposal) => proposal.serviceId === serviceId));
}
