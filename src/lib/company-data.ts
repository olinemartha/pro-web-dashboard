// Données de démonstration de l'espace entreprise — fictives.
// Conforme au PRD §4.2 (profil, offres, candidatures, entretiens, stagiaires, services).
// Les règles du système expert sont explicitement des règles de démonstration.

export type OfferStatus = "brouillon" | "publiee" | "cloturee" | "desactivee";

export interface CompanyOffer {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  duration: string;
  level: string;
  deadline: string;
  published: string;
  status: OfferStatus;
  description: string;
  missions: string[];
  skills: string[];
  applicationsCount: number;
}

/**
 * Statuts alignés sur le PRD. « Présélectionnée » n'est plus un statut public :
 * la présélection est une étape interne de l'examen.
 */
export type CandidateStatus =
  | "en_attente"
  | "examen"
  | "entretien"
  | "acceptee"
  | "refusee"
  | "retiree";

export interface CandidateHistoryEntry {
  status: CandidateStatus;
  date: string;
  note?: string;
}

export interface Candidate {
  id: string;
  offerId: string;
  name: string;
  initials: string;
  universite: string;
  filiere: string;
  niveau: string;
  email: string;
  phone: string;
  competences: string[];
  cvName: string;
  appliedAt: string;
  status: CandidateStatus;
  history: CandidateHistoryEntry[];
  refusalReason?: string;
}

export type InterviewStatus = "programme" | "realise" | "annule";

export interface Interview {
  id: string;
  candidateId: string;
  date: string;
  time: string;
  location: string;
  status: InterviewStatus;
}

export type ReportStatus = "soumis" | "valide" | "corrige";

export interface InternReport {
  id: string;
  period: string;
  date: string;
  status: ReportStatus;
}

export type AssignmentSource = "recommandation" | "manuel";

export interface Intern {
  id: string;
  candidateId: string;
  name: string;
  initials: string;
  offerId: string;
  serviceId?: string;
  service: string;
  supervisor: string;
  start: string;
  end: string;
  missions: string;
  objectives: string;
  confirmed: boolean;
  assignmentSource?: AssignmentSource;
  assignmentReason?: string;
  assignmentDecidedAt?: string;
  assignmentDecidedBy?: string;
  expertRunId?: string;
  reports: InternReport[];
  evaluation: { score: number; comment: string } | null;
  certificate: "non_generee" | "generee" | "validee";
  certificateGeneratedAt?: string;
  certificateValidatedAt?: string;
}

export interface Service {
  id: string;
  name: string;
  internsNeeded: number;
  profiles: string;
  education: string;
  skills: string[];
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Système expert — types                                              */
/* ------------------------------------------------------------------ */

export type ExpertRunStatus = "prete" | "donnees_insuffisantes" | "aucune_proposition";

export interface ExpertRule {
  id: string;
  label: string;
  description: string;
}

export interface ExpertFact {
  label: string;
  value: string;
}

export interface ExpertCriterion {
  label: string;
  satisfied: boolean;
  detail: string;
  ruleId: string;
}

export interface ExpertCapacity {
  needed: number;
  filled: number;
  left: number;
}

export interface ExpertProposal {
  serviceId: string;
  serviceName: string;
  rank: number;
  satisfied: ExpertCriterion[];
  limits: string[];
  ruleIds: string[];
  capacityAtRun: ExpertCapacity;
  summary: string;
  score: number;
}

export interface ExpertRun {
  id: string;
  internId: string;
  createdAt: string;
  engineVersion: string;
  status: ExpertRunStatus;
  facts: ExpertFact[];
  rules: ExpertRule[];
  proposals: ExpertProposal[];
  missingFacts: string[];
}

export interface AssignmentDecision {
  internId: string;
  serviceId: string;
  service: string;
  decidedAt: string;
  decidedBy: string;
  source: AssignmentSource;
  reason: string;
  runId: string;
  engineVersion: string;
}

/* ------------------------------------------------------------------ */
/* Politique de révélation des coordonnées — point de vérité unique     */
/* ------------------------------------------------------------------ */

/**
 * Décision produit : e-mail et téléphone sont révélés à l'acceptation.
 * La règle reste centralisée ici pour pouvoir être resserrée sans refonte
 * (RG-12 prévoit le téléphone après confirmation de l'affectation).
 */
export const contactRevealPolicy: Record<"email" | "phone", CandidateStatus[]> = {
  email: ["acceptee"],
  phone: ["acceptee"],
};

export function isContactVisible(kind: "email" | "phone", status: CandidateStatus): boolean {
  return contactRevealPolicy[kind].includes(status);
}

/* ------------------------------------------------------------------ */
/* Profil entreprise                                                   */
/* ------------------------------------------------------------------ */

export interface CompanyProfile {
  name: string;
  initials: string;
  /** Logo facultatif (PRD §4.2.2) : à défaut, les initiales sont affichées. */
  logo?: string | null;
  sector: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  registration: string;
  legalRefs: string;
  activities: string;
  domains: string;
  website: string;
  representativeName: string;
  representativeRole: string;
  representativeEmail: string;
  representativePhone: string;
  documents: { id: string; name: string; date: string }[];
}

export const demoCompanyProfile: CompanyProfile = {
  name: "FINCA RDC",
  initials: "FR",
  sector: "Microfinance",
  description: "Institution de microfinance engagée pour l'inclusion financière en République Démocratique du Congo.",
  address: "12, avenue de la Justice",
  city: "Kinshasa, Gombe",
  phone: "+243 81 000 0000",
  email: "contact@finca.cd",
  registration: "RCCM CD/KIN/RCCM/12-B-01234",
  legalRefs: "Autorisation BCC n° 2020-045",
  activities: "Crédits aux micro-entrepreneurs, épargne, transferts d'argent.",
  domains: "Finance, inclusion financière, développement communautaire",
  website: "https://www.finca.cd",
  representativeName: "M. Patrick Ilunga",
  representativeRole: "Responsable Crédit",
  representativeEmail: "p.ilunga@finca.cd",
  representativePhone: "+243 81 111 1111",
  documents: [
    { id: "cd1", name: "RCCM_FINCA_RDC.pdf", date: "2026-10-01" },
    { id: "cd2", name: "Autorisation_BCC.pdf", date: "2026-10-01" },
  ],
};

/* ------------------------------------------------------------------ */
/* Offres                                                              */
/* ------------------------------------------------------------------ */

export const demoCompanyOffers: CompanyOffer[] = [
  {
    id: "o1", title: "Stagiaire Analyste Crédit", department: "Direction Crédit",
    location: "Kinshasa, Gombe", type: "Stage académique", duration: "3 mois", level: "Licence (L3)",
    deadline: "2026-11-28", published: "2026-10-20", status: "publiee",
    description: "Participez à l'analyse des dossiers de financement des micro-entrepreneurs.",
    missions: ["Analyser les dossiers de crédit", "Participer aux visites terrain", "Préparer les synthèses"],
    skills: ["Excel", "Analyse financière", "Rédaction"], applicationsCount: 3,
  },
  {
    id: "o2", title: "Stagiaire Développeur Web", department: "Direction IT",
    location: "Kinshasa, Gombe", type: "Stage professionnel", duration: "6 mois", level: "Master (M1)",
    deadline: "2026-12-05", published: "2026-10-25", status: "publiee",
    description: "Contribuez au développement des outils internes de la direction informatique.",
    missions: ["Développer des fonctionnalités front-end", "Écrire des tests", "Documenter"],
    skills: ["React", "TypeScript", "SQL"], applicationsCount: 3,
  },
  {
    id: "o3", title: "Stagiaire Marketing Digital", department: "Communication & Marketing",
    location: "Lubumbashi", type: "Stage académique", duration: "3 mois", level: "Licence (L2)",
    deadline: "2026-11-20", published: "2026-10-12", status: "publiee",
    description: "Participez à la stratégie de communication digitale.",
    missions: ["Animer les réseaux sociaux", "Créer des contenus", "Suivre les indicateurs"],
    skills: ["Réseaux sociaux", "Canva", "Rédaction"], applicationsCount: 3,
  },
  {
    id: "o4", title: "Stagiaire Ressources Humaines", department: "Ressources Humaines",
    location: "Kinshasa, Gombe", type: "Stage académique", duration: "4 mois", level: "Licence (L3)",
    deadline: "2026-12-12", published: "2026-10-28", status: "brouillon",
    description: "Accompagnez l'équipe RH dans le recrutement et l'administration du personnel.",
    missions: ["Trier les candidatures", "Organiser les entretiens", "Mettre à jour les dossiers"],
    skills: ["Communication", "Organisation", "Excel"], applicationsCount: 0,
  },
  {
    id: "o5", title: "Stagiaire Audit Interne", department: "Audit & Conformité",
    location: "Goma", type: "Stage professionnel", duration: "6 mois", level: "Master (M1)",
    deadline: "2026-12-01", published: "2026-10-15", status: "cloturee",
    description: "Évaluez les processus des agences.",
    missions: ["Contrôles en agence", "Rédiger des rapports", "Suivre les recommandations"],
    skills: ["Comptabilité", "Analyse", "Rédaction"], applicationsCount: 0,
  },
];

/* ------------------------------------------------------------------ */
/* Candidatures                                                        */
/* ------------------------------------------------------------------ */

export const demoCandidates: Candidate[] = [
  {
    id: "c1", offerId: "o1", name: "Grâce Mukendi", initials: "GM", universite: "Université de Kinshasa",
    filiere: "Gestion financière", niveau: "Licence (L3)", email: "grace.mukendi@exemple.cd",
    phone: "+243 81 234 5678", competences: ["Excel", "Analyse financière", "Rédaction", "SQL"],
    cvName: "CV_Grace_Mukendi.pdf", appliedAt: "2026-10-22", status: "acceptee",
    history: [
      { status: "en_attente", date: "2026-10-22" },
      { status: "examen", date: "2026-10-24" },
      { status: "entretien", date: "2026-10-28" },
      { status: "acceptee", date: "2026-11-02", note: "Candidature acceptée" },
    ],
  },
  {
    id: "c2", offerId: "o1", name: "Jean Kabasele", initials: "JK", universite: "Université Protestante au Congo",
    filiere: "Économie", niveau: "Licence (L3)", email: "jean.kabasele@exemple.cd",
    phone: "+243 82 111 2233", competences: ["Excel", "Statistiques"],
    cvName: "CV_Jean_Kabasele.pdf", appliedAt: "2026-10-24", status: "examen",
    history: [
      { status: "en_attente", date: "2026-10-24" },
      { status: "examen", date: "2026-10-30", note: "Profil en cours d'examen" },
    ],
  },
  {
    id: "c3", offerId: "o1", name: "Rachel Ilunga", initials: "RI", universite: "Université de Kinshasa",
    filiere: "Comptabilité", niveau: "Licence (L2)", email: "rachel.ilunga@exemple.cd",
    phone: "+243 83 444 5566", competences: ["Comptabilité", "Excel"],
    cvName: "CV_Rachel_Ilunga.pdf", appliedAt: "2026-10-26", status: "en_attente",
    history: [{ status: "en_attente", date: "2026-10-26" }],
  },
  {
    id: "c4", offerId: "o2", name: "Patrick Mwamba", initials: "PM", universite: "Université de Lubumbashi",
    filiere: "Informatique", niveau: "Master (M1)", email: "patrick.mwamba@exemple.cd",
    phone: "+243 84 777 8899", competences: ["React", "TypeScript", "SQL", "Node.js"],
    cvName: "CV_Patrick_Mwamba.pdf", appliedAt: "2026-10-27", status: "examen",
    history: [
      { status: "en_attente", date: "2026-10-27" },
      { status: "examen", date: "2026-11-01", note: "Profil en cours d'examen" },
    ],
  },
  {
    id: "c5", offerId: "o2", name: "Sarah N'Goy", initials: "SN", universite: "Université de Kinshasa",
    filiere: "Génie logiciel", niveau: "Master (M1)", email: "sarah.ngoy@exemple.cd",
    phone: "+243 85 000 1122", competences: ["React", "Python", "SQL"],
    cvName: "CV_Sarah_Ngoy.pdf", appliedAt: "2026-10-29", status: "acceptee",
    history: [
      { status: "en_attente", date: "2026-10-29" },
      { status: "examen", date: "2026-10-30" },
      { status: "entretien", date: "2026-11-02" },
      { status: "acceptee", date: "2026-11-05", note: "Candidature acceptée" },
    ],
  },
  {
    id: "c6", offerId: "o3", name: "Divine Kasongo", initials: "DK", universite: "Université de Lubumbashi",
    filiere: "Communication", niveau: "Licence (L2)", email: "divine.kasongo@exemple.cd",
    phone: "+243 86 333 4455", competences: ["Réseaux sociaux", "Canva"],
    cvName: "CV_Divine_Kasongo.pdf", appliedAt: "2026-10-18", status: "refusee",
    history: [
      { status: "en_attente", date: "2026-10-18" },
      { status: "examen", date: "2026-10-25" },
      { status: "entretien", date: "2026-10-28" },
      { status: "refusee", date: "2026-10-31", note: "Profil non retenu après entretien" },
    ],
    refusalReason: "Profil non retenu après entretien",
  },
  {
    id: "c7", offerId: "o3", name: "Esther Mbuyi", initials: "EM", universite: "Université de Kinshasa",
    filiere: "Marketing", niveau: "Licence (L3)", email: "esther.mbuyi@exemple.cd",
    phone: "+243 87 555 6677", competences: ["Réseaux sociaux", "Canva", "Rédaction"],
    cvName: "CV_Esther_Mbuyi.pdf", appliedAt: "2026-10-30", status: "entretien",
    history: [
      { status: "en_attente", date: "2026-10-30" },
      { status: "examen", date: "2026-11-02" },
      { status: "entretien", date: "2026-11-05", note: "Entretien programmé" },
    ],
  },
  {
    id: "c8", offerId: "o2", name: "Marc Tshibangu", initials: "MT", universite: "Université de Kinshasa",
    filiere: "Réseaux informatiques", niveau: "Licence (L3)", email: "marc.tshibangu@exemple.cd",
    phone: "+243 88 999 0011", competences: ["Réseaux", "Support"],
    cvName: "CV_Marc_Tshibangu.pdf", appliedAt: "2026-10-20", status: "retiree",
    history: [
      { status: "en_attente", date: "2026-10-20" },
      { status: "retiree", date: "2026-10-23", note: "Candidature retirée par le candidat" },
    ],
  },
  {
    id: "c9", offerId: "o3", name: "Amina Bofane", initials: "AB", universite: "Université de Lubumbashi",
    filiere: "Communication", niveau: "Licence (L3)", email: "amina.bofane@exemple.cd",
    phone: "+243 89 222 3344", competences: ["Réseaux sociaux", "Canva", "Rédaction"],
    cvName: "CV_Amina_Bofane.pdf", appliedAt: "2026-10-16", status: "acceptee",
    history: [
      { status: "en_attente", date: "2026-10-16" },
      { status: "examen", date: "2026-10-19" },
      { status: "entretien", date: "2026-10-22" },
      { status: "acceptee", date: "2026-10-26", note: "Candidature acceptée" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Entretiens                                                          */
/* ------------------------------------------------------------------ */

export const demoInterviews: Interview[] = [
  { id: "i1", candidateId: "c5", date: "2026-11-02", time: "10:00", location: "Siège FINCA — Salle 2", status: "realise" },
  { id: "i2", candidateId: "c2", date: "2026-11-14", time: "14:30", location: "Siège FINCA — Salle 1", status: "programme" },
  { id: "i3", candidateId: "c6", date: "2026-10-30", time: "09:00", location: "Visio", status: "realise" },
  { id: "i4", candidateId: "c7", date: "2026-11-18", time: "11:00", location: "Siège FINCA — Salle 3", status: "programme" },
  { id: "i5", candidateId: "c4", date: "2026-11-21", time: "09:30", location: "Visio", status: "programme" },
];

/* ------------------------------------------------------------------ */
/* Stagiaires                                                          */
/* ------------------------------------------------------------------ */

export const demoInterns: Intern[] = [
  {
    id: "s1", candidateId: "c1", name: "Grâce Mukendi", initials: "GM", offerId: "o1", serviceId: "sv1",
    service: "Direction Crédit", supervisor: "M. Patrick Ilunga", start: "2026-10-05", end: "2027-01-05",
    missions: "Analyse des dossiers de crédit et visites terrain.",
    objectives: "Maîtriser le processus d'octroi de crédit.",
    confirmed: true,
    assignmentSource: "recommandation",
    assignmentReason: "",
    assignmentDecidedAt: "2026-11-03T09:15:00.000Z",
    assignmentDecidedBy: "M. Patrick Ilunga",
    expertRunId: "run-seed-s1",
    reports: [
      { id: "r1", period: "Semaine 1-2", date: "2026-10-19", status: "valide" },
      { id: "r2", period: "Semaine 3-4", date: "2026-11-02", status: "soumis" },
    ],
    evaluation: null, certificate: "non_generee",
  },
  {
    id: "s2", candidateId: "c5", name: "Sarah N'Goy", initials: "SN", offerId: "o2", serviceId: "sv2",
    service: "Direction IT", supervisor: "Mme Alice Tshimanga", start: "2026-11-23", end: "2027-05-23",
    missions: "Développement d'outils internes.",
    objectives: "Livrer un module de gestion des demandes.",
    confirmed: false,
    reports: [],
    evaluation: null, certificate: "non_generee",
  },
  {
    id: "s3", candidateId: "c9", name: "Amina Bofane", initials: "AB", offerId: "o3", serviceId: "sv3",
    service: "Communication & Marketing", supervisor: "Mme Chantal Mbala", start: "2026-10-01", end: "2027-01-31",
    missions: "Animation des réseaux sociaux et création de contenus.",
    objectives: "Publier un calendrier éditorial mensuel.",
    confirmed: true,
    assignmentSource: "recommandation",
    assignmentReason: "",
    assignmentDecidedAt: "2026-10-27T14:00:00.000Z",
    assignmentDecidedBy: "M. Patrick Ilunga",
    expertRunId: "run-seed-s3",
    reports: [{ id: "r4", period: "Octobre", date: "2026-10-31", status: "valide" }],
    evaluation: { score: 15, comment: "Bonne régularité éditoriale." }, certificate: "generee",
  },
];

/* ------------------------------------------------------------------ */
/* Services et besoins                                                 */
/* ------------------------------------------------------------------ */

export const demoServices: Service[] = [
  {
    id: "sv1", name: "Direction Crédit", internsNeeded: 2,
    profiles: "Analyse financière, rigueur",
    education: "Licence L3 / Master M1 — Finance, Économie, Gestion",
    skills: ["Excel", "Analyse financière", "Rédaction"],
    updatedAt: "2026-10-20",
  },
  {
    id: "sv2", name: "Direction IT", internsNeeded: 2,
    profiles: "Développement web, data",
    education: "Master M1 — Informatique, Statistique",
    skills: ["React", "TypeScript", "SQL", "Python"],
    updatedAt: "2026-09-15",
  },
  {
    id: "sv3", name: "Communication & Marketing", internsNeeded: 1,
    profiles: "Créativité, communication digitale",
    education: "",
    skills: ["Réseaux sociaux", "Canva", "Rédaction"],
    updatedAt: "2026-10-25",
  },
];

/* ------------------------------------------------------------------ */
/* Libellés                                                            */
/* ------------------------------------------------------------------ */

export const candidateStatusLabels: Record<
  CandidateStatus,
  { label: string; tone: "muted" | "primary" | "accent" | "success" | "destructive" }
> = {
  en_attente: { label: "En attente", tone: "muted" },
  examen: { label: "En cours d'examen", tone: "primary" },
  entretien: { label: "En entretien", tone: "primary" },
  acceptee: { label: "Acceptée", tone: "success" },
  refusee: { label: "Refusée", tone: "destructive" },
  retiree: { label: "Retirée", tone: "muted" },
};

export const offerStatusLabels: Record<
  OfferStatus,
  { label: string; tone: "muted" | "primary" | "accent" | "success" | "destructive" }
> = {
  brouillon: { label: "Brouillon", tone: "muted" },
  publiee: { label: "Publiée", tone: "success" },
  cloturee: { label: "Clôturée", tone: "accent" },
  desactivee: { label: "Désactivée", tone: "destructive" },
};

export const interviewStatusLabels: Record<
  InterviewStatus,
  { label: string; tone: "muted" | "primary" | "success" | "destructive" }
> = {
  programme: { label: "Programmé", tone: "primary" },
  realise: { label: "Réalisé", tone: "success" },
  annule: { label: "Annulé", tone: "destructive" },
};
