// Système expert d'aide à l'affectation des stagiaires.
//
// Les cinq composants, tels qu'ils apparaissent dans le code :
//   1. Module d'acquisition des connaissances (MAC) : la page « Base de règles » de l'espace entreprise
//      (src/routes/entreprise.regles.tsx), où l'expert humain saisit les règles SI–ALORS.
//   2. Base de faits : ce que l'on sait du stagiaire et du service évalué (buildFacts ci-dessous).
//   3. Base de règles : les règles SI–ALORS de l'entreprise (KnowledgeRule, table expert_rules).
//   4. Moteur d'inférence : forwardChain, en chaînage avant (des faits vers la conclusion).
//   5. Module d'explication : la trace des règles déclenchées, cycle par cycle, et la raison
//      pour laquelle chaque règle non déclenchée ne l'a pas été.
//
// Le système recommande ; l'entreprise décide.

import type {
  Candidate,
  CompanyOffer,
  ConditionOp,
  ExpertCriterion,
  ExpertProposal,
  ExpertRule,
  ExpertRun,
  ExpertTraceStep,
  Intern,
  KnowledgeRule,
  RuleCondition,
  Service,
} from "./company-data";

export const EXPERT_ENGINE_VERSION = "chainage-avant-1.0";

/** Le but du raisonnement : le fait que le moteur cherche à établir pour chaque service. */
export const GOAL_FACT = "service_recommande";
export const GOAL_LABEL = "service recommandé";

/* ------------------------------------------------------------------ */
/* Dictionnaire des faits de départ                                     */
/* ------------------------------------------------------------------ */

export type FactType = "booleen" | "nombre" | "niveau" | "texte";

export interface FactDefinition {
  key: string;
  type: FactType;
  /** Formulation dans une règle : « SI <label> … ». */
  label: string;
  /** D'où vient le fait. */
  source: "stagiaire" | "service" | "comparaison";
}

export const BASE_FACTS: FactDefinition[] = [
  { key: "formation_attendue", type: "booleen", label: "la formation du stagiaire est attendue par le service", source: "comparaison" },
  { key: "competences_communes", type: "nombre", label: "le nombre de compétences communes", source: "comparaison" },
  { key: "places_libres", type: "nombre", label: "le nombre de places libres du service", source: "service" },
  { key: "service_de_l_offre", type: "booleen", label: "le service est celui de l'offre", source: "comparaison" },
  { key: "niveau", type: "niveau", label: "le niveau d'études du stagiaire", source: "stagiaire" },
  { key: "filiere", type: "texte", label: "la filière du stagiaire", source: "stagiaire" },
  { key: "service", type: "texte", label: "le nom du service", source: "service" },
];

export const LEVELS = ["G1", "G2", "G3", "L1", "L2", "L3", "M1", "M2"];

/** « Licence (L3) » → 5 ; inconnu → -1. */
export function levelRank(value: string) {
  const match = value.toUpperCase().match(/\b([GLM])\s*([1-3])\b/);
  return match ? LEVELS.indexOf(`${match[1]}${match[2]}`) : -1;
}

export const OPS_BY_TYPE: Record<FactType, ConditionOp[]> = {
  booleen: ["vrai", "faux"],
  nombre: ["gte", "lte", "eq"],
  niveau: ["gte", "lte", "eq"],
  texte: ["contient", "eq"],
};

export const OP_LABELS: Record<ConditionOp, string> = {
  vrai: "est vrai",
  faux: "est faux",
  gte: "est au moins",
  lte: "est au plus",
  eq: "est égal à",
  contient: "contient",
};

/** Les faits déduits par les règles (leurs conclusions) deviennent utilisables dans d'autres règles. */
export function derivedFacts(rules: KnowledgeRule[]): FactDefinition[] {
  const seen = new Map<string, FactDefinition>();
  for (const rule of rules) {
    if (rule.conclusion === GOAL_FACT || seen.has(rule.conclusion)) continue;
    seen.set(rule.conclusion, { key: rule.conclusion, type: "booleen", label: rule.conclusionLabel, source: "comparaison" });
  }
  return [...seen.values()];
}

export function factDefinition(key: string, rules: KnowledgeRule[]): FactDefinition | undefined {
  return BASE_FACTS.find((fact) => fact.key === key) ?? derivedFacts(rules).find((fact) => fact.key === key);
}

const isDerived = (key: string) => !BASE_FACTS.some((fact) => fact.key === key);

/** « formation compatible » → « formation_compatible ». */
export function factKey(label: string) {
  return normalize(label)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/* ------------------------------------------------------------------ */
/* Écriture des règles                                                 */
/* ------------------------------------------------------------------ */

export function conditionText(condition: RuleCondition, rules: KnowledgeRule[]) {
  const fact = factDefinition(condition.fact, rules);
  const label = fact?.label ?? condition.fact;
  if (fact && isDerived(fact.key)) return condition.op === "faux" ? `« ${label} » n'est pas établi` : `« ${label} » est établi`;
  if (condition.op === "vrai" || condition.op === "faux") return condition.op === "vrai" ? label : `non (${label})`;
  return `${label} ${OP_LABELS[condition.op]} ${condition.op === "contient" ? `« ${condition.value} »` : condition.value}`;
}

/** « SI a ET b ALORS c » */
export function ruleText(rule: KnowledgeRule, rules: KnowledgeRule[]) {
  const conditions = rule.conditions.map((condition) => conditionText(condition, rules)).join(" ET ");
  return `SI ${conditions || "…"} ALORS « ${rule.conclusionLabel || "…"} »`;
}

/* ------------------------------------------------------------------ */
/* Base de règles de départ                                            */
/* ------------------------------------------------------------------ */

const rule = (
  position: number,
  label: string,
  conditions: RuleCondition[],
  conclusionLabel: string
): KnowledgeRule => ({
  id: `regle-depart-${position}`,
  code: `R${position}`,
  label,
  conditions,
  conclusion: conclusionLabel === GOAL_LABEL ? GOAL_FACT : factKey(conclusionLabel),
  conclusionLabel,
  active: true,
  position,
  updatedAt: "2026-11-15T00:00:00.000Z",
});

/**
 * Règles de départ, tirées des critères cités par FINCA RDC dans l'enquête
 * (formation, niveau, besoins de l'entreprise, disponibilité des services).
 * Les seuils restent à valider avec l'entreprise : elle les modifie dans le module d'acquisition.
 */
export const DEFAULT_RULES: KnowledgeRule[] = [
  rule(1, "Formation compatible", [{ fact: "formation_attendue", op: "vrai", value: "" }], "formation compatible"),
  rule(2, "Compétences adaptées", [{ fact: "competences_communes", op: "gte", value: "2" }], "compétences adaptées"),
  rule(3, "Service disponible", [{ fact: "places_libres", op: "gte", value: "1" }], "service disponible"),
  rule(4, "Continuité de l'offre", [{ fact: "service_de_l_offre", op: "vrai", value: "" }], "continuité de l'offre"),
  rule(
    5,
    "Profil admissible",
    [
      { fact: "formation_compatible", op: "vrai", value: "" },
      { fact: "service_disponible", op: "vrai", value: "" },
    ],
    "profil admissible"
  ),
  rule(
    6,
    "Recommandation par les compétences",
    [
      { fact: "profil_admissible", op: "vrai", value: "" },
      { fact: "competences_adaptees", op: "vrai", value: "" },
    ],
    GOAL_LABEL
  ),
  rule(
    7,
    "Recommandation par l'offre",
    [
      { fact: "profil_admissible", op: "vrai", value: "" },
      { fact: "continuite_de_l_offre", op: "vrai", value: "" },
    ],
    GOAL_LABEL
  ),
];

/** Les anciennes règles (moteur demo-1.0), encore citées par les analyses déjà enregistrées. */
export const DEMO_RULES: ExpertRule[] = DEFAULT_RULES.slice(0, 4).map((r) => ({
  id: r.code,
  label: r.label,
  description: ruleText(r, DEFAULT_RULES),
  conclusion: r.conclusionLabel,
}));

/* ------------------------------------------------------------------ */
/* Base de faits                                                       */
/* ------------------------------------------------------------------ */

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
  if (candidate.niveau && compact(service.education).includes(compact(candidate.niveau))) return true;
  return words(candidate.filiere).some((word) => serviceText.includes(word));
}

export function countFilledPlaces(service: Service, interns: Intern[], excludeInternId?: string): number {
  return interns.filter(
    (intern) =>
      intern.id !== excludeInternId &&
      intern.confirmed &&
      (intern.serviceId ? intern.serviceId === service.id : intern.service === service.name)
  ).length;
}

type FactValue = boolean | number | string;
type FactBase = Map<string, FactValue>;

/** Base de faits de départ pour un couple (stagiaire, service). */
function buildFacts(candidate: Candidate, service: Service, offer: CompanyOffer | undefined, left: number, overlapping: string[]): FactBase {
  return new Map<string, FactValue>([
    ["formation_attendue", educationMatches(candidate, service)],
    ["competences_communes", overlapping.length],
    ["places_libres", left],
    ["service_de_l_offre", Boolean(offer && compact(service.name) === compact(offer.department))],
    ["niveau", candidate.niveau],
    ["filiere", candidate.filiere],
    ["service", service.name],
  ]);
}

/* ------------------------------------------------------------------ */
/* Moteur d'inférence : chaînage avant                                 */
/* ------------------------------------------------------------------ */

const show = (value: FactValue | undefined) =>
  value === undefined
    ? "non établi"
    : typeof value === "boolean"
      ? value
        ? "vrai"
        : "faux"
      : typeof value === "number"
        ? String(value)
        : value || "non renseigné";

function holds(condition: RuleCondition, facts: FactBase): boolean {
  const value = facts.get(condition.fact);
  switch (condition.op) {
    case "vrai":
      return value === true;
    case "faux":
      return value !== true;
    case "contient":
      return typeof value === "string" && normalize(value).includes(normalize(condition.value));
    default: {
      const [left, right] =
        factDefinitionType(condition.fact) === "niveau"
          ? [levelRank(String(value ?? "")), levelRank(condition.value)]
          : typeof value === "number"
            ? [value, Number(condition.value)]
            : [compact(String(value ?? "")), compact(condition.value)];
      if (left === -1 || right === -1) return false;
      if (condition.op === "eq") return left === right;
      return condition.op === "gte" ? left >= right : left <= right;
    }
  }
}

const factDefinitionType = (key: string): FactType => BASE_FACTS.find((fact) => fact.key === key)?.type ?? "booleen";

export interface ChainResult {
  facts: FactBase;
  trace: ExpertTraceStep[];
  /** Pour chaque règle non déclenchée : la première condition qui a échoué. */
  blocked: Map<string, string>;
  cycles: number;
}

/**
 * Chaînage avant : à chaque cycle, le moteur cherche les règles dont toutes les conditions sont
 * vraies dans la base de faits (filtrage), puis les déclenche et ajoute leur conclusion à la base
 * (exécution). Il recommence jusqu'à ce qu'aucune règle ne produise de fait nouveau (saturation).
 */
export function forwardChain(initial: FactBase, rules: KnowledgeRule[]): ChainResult {
  const facts = new Map(initial);
  const trace: ExpertTraceStep[] = [];
  const fired = new Set<string>();
  const active = rules.filter((r) => r.active && r.conditions.length > 0).sort((a, b) => a.position - b.position);
  let cycle = 0;

  for (;;) {
    cycle += 1;
    // Filtrage : règles applicables sur la base de faits telle qu'elle est au début du cycle.
    const applicable = active.filter(
      (r) => !fired.has(r.id) && facts.get(r.conclusion) !== true && r.conditions.every((c) => holds(c, facts))
    );
    if (applicable.length === 0 || cycle > 50) break;
    // Exécution : chaque règle ajoute sa conclusion.
    for (const r of applicable) {
      // Deux règles du même cycle peuvent conclure le même fait : seule la première l'ajoute.
      if (facts.get(r.conclusion) === true) continue;
      fired.add(r.id);
      facts.set(r.conclusion, true);
      trace.push({
        cycle,
        ruleId: r.code,
        because: r.conditions.map((c) =>
          isDerived(c.fact) ? conditionText(c, rules) : `${conditionText(c, rules)} (valeur : ${show(facts.get(c.fact))})`
        ),
        deduced: r.conclusionLabel,
      });
    }
  }

  const blocked = new Map<string, string>();
  for (const r of active) {
    if (fired.has(r.id)) continue;
    if (facts.get(r.conclusion) === true) {
      const by = trace.find((step) => step.deduced === r.conclusionLabel);
      blocked.set(r.id, `Non déclenchée : « ${r.conclusionLabel} » était déjà établi${by ? ` par ${by.ruleId}` : ""}.`);
      continue;
    }
    const failing = r.conditions.find((c) => !holds(c, facts));
    if (failing) {
      const observed = facts.get(failing.fact);
      blocked.set(
        r.id,
        isDerived(failing.fact)
          ? `Non déclenchée : le fait « ${factDefinition(failing.fact, rules)?.label ?? failing.fact} » n'est pas établi.`
          : `Non déclenchée : la condition « ${conditionText(failing, rules)} » n'est pas vérifiée (valeur observée : ${show(observed)}).`
      );
    }
  }
  return { facts, trace, blocked, cycles: cycle - 1 };
}

/* ------------------------------------------------------------------ */
/* Analyse complète d'un dossier                                       */
/* ------------------------------------------------------------------ */

interface BuildRunInput {
  intern: Intern;
  candidate?: Candidate;
  offer?: CompanyOffer;
  services: Service[];
  interns: Intern[];
  rules?: KnowledgeRule[];
  id?: string;
  createdAt?: string;
}

const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count > 1 ? many : word}`;

export function buildExpertRun({ intern, candidate, offer, services, interns, rules: given, id, createdAt }: BuildRunInput): ExpertRun {
  const runId = id ?? crypto.randomUUID();
  const stamp = createdAt ?? new Date().toISOString();
  const rules = (given && given.length ? given : DEFAULT_RULES).filter((r) => r.active).sort((a, b) => a.position - b.position);
  const snapshot: ExpertRule[] = rules.map((r) => ({ id: r.code, label: r.label, description: ruleText(r, rules), conclusion: r.conclusionLabel }));

  const facts = [
    { label: "Candidat", value: intern.name },
    { label: "Offre", value: offer?.title ?? "Offre introuvable" },
    { label: "Filière", value: candidate?.filiere || "Non renseignée" },
    { label: "Niveau", value: candidate?.niveau || "Non renseigné" },
    { label: "Compétences", value: candidate?.competences.length ? candidate.competences.join(", ") : "Non renseignées" },
    { label: "Service de l'offre", value: offer?.department ?? "Non renseigné" },
  ];

  const missingFacts: string[] = [];
  if (!candidate) missingFacts.push("Profil du candidat introuvable");
  if (!candidate?.competences.length) missingFacts.push("Compétences non renseignées");
  if (!candidate?.niveau) missingFacts.push("Niveau d'études non renseigné");
  if (!offer) missingFacts.push("Offre d'origine introuvable");
  if (services.length === 0) missingFacts.push("Aucun service et besoin renseigné");
  if (rules.length === 0) missingFacts.push("Aucune règle active dans la base de règles");

  const base = { id: runId, internId: intern.id, createdAt: stamp, engineVersion: EXPERT_ENGINE_VERSION, facts, rules: snapshot, missingFacts };

  if (services.length === 0 || rules.length === 0) return { ...base, status: "aucune_proposition", proposals: [] };
  if (!candidate || candidate.competences.length === 0) return { ...base, status: "donnees_insuffisantes", proposals: [] };

  const proposals: ExpertProposal[] = services.map((service) => {
    const filled = countFilledPlaces(service, interns, intern.id);
    const left = Math.max(0, service.internsNeeded - filled);
    const overlapping = candidate.competences.filter((skill) => service.skills.some((expected) => compact(expected) === compact(skill)));
    const chain = forwardChain(buildFacts(candidate, service, offer, left, overlapping), rules);
    const goalReached = chain.facts.get(GOAL_FACT) === true;

    const satisfied: ExpertCriterion[] = rules.map((r) => {
      const step = chain.trace.find((entry) => entry.ruleId === r.code);
      return {
        label: r.label,
        satisfied: Boolean(step),
        detail: step
          ? `Déclenchée au cycle ${step.cycle} : « ${r.conclusionLabel} » ajouté à la base de faits.`
          : chain.blocked.get(r.id) ?? "Non déclenchée.",
        ruleId: r.code,
      };
    });

    const limits = rules
      .filter((r) => r.conclusion !== GOAL_FACT && !chain.trace.some((step) => step.ruleId === r.code) && chain.facts.get(r.conclusion) !== true)
      .map((r) => `« ${r.conclusionLabel} » non établi (${r.code})`);

    const firedCount = chain.trace.length;
    return {
      serviceId: service.id,
      serviceName: service.name,
      rank: 0,
      satisfied,
      limits,
      ruleIds: rules.map((r) => r.code),
      capacityAtRun: { needed: service.internsNeeded, filled, left },
      summary: goalReached
        ? `Conclusion établie · ${plural(firedCount, "règle déclenchée", "règles déclenchées")}`
        : `Conclusion non établie · ${plural(firedCount, "règle déclenchée", "règles déclenchées")}`,
      score: (goalReached ? 100 : 0) + firedCount * 10,
      goalReached,
      trace: chain.trace,
    };
  });

  proposals.sort((a, b) => b.score - a.score || b.capacityAtRun.left - a.capacityAtRun.left || a.serviceName.localeCompare(b.serviceName));
  proposals.forEach((proposal, index) => {
    proposal.rank = index + 1;
  });

  return { ...base, status: "prete", proposals };
}

export function latestRunFor(runs: ExpertRun[], internId: string): ExpertRun | undefined {
  return [...runs].filter((run) => run.internId === internId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** Le service recommandé : le premier qui a atteint la conclusion (ancien moteur : le premier proposé). */
export function recommendedProposal(run: ExpertRun | undefined) {
  if (run?.status !== "prete") return undefined;
  const top = run.proposals[0];
  return top && top.goalReached !== false ? top : undefined;
}

/** Un service est « recommandé » s'il a atteint la conclusion (ancien moteur : s'il figure parmi les propositions). */
export function isRecommendedService(run: ExpertRun | undefined, serviceId: string): boolean {
  const proposal = run?.proposals.find((p) => p.serviceId === serviceId);
  if (!proposal) return false;
  return proposal.goalReached ?? true;
}
