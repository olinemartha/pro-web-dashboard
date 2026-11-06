// DONNÉES DE DÉMONSTRATION — fictives, à remplacer par Lovable Cloud plus tard.
import type { Application, Profile } from "./rules";

export interface Company { id: string; name: string; initials: string; about: string; }
export interface Offer {
  id: string; companyId: string; title: string; department: string; location: string;
  type: string; duration: string; level: string; deadline: string; published: string;
  description: string; missions: string[]; profile: string; skills: string[];
}
export interface Notification { id: string; title: string; body: string; date: string; read: boolean; kind: "offre" | "candidature" | "entretien" | "stage" | "document" | "rapport"; }
export interface Activity { id: string; label: string; detail: string; date: string; kind: "envoi" | "vue" | "entretien" | "acceptee" | "refusee"; }
export interface Doc { id: string; name: string; type: string; category: "Attestation" | "Entreprise" | "Stage"; date: string; size: string; }
export interface Report { id: string; periode: string; activites: string; difficultes: string; competences: string; date: string; statut: "Soumis" | "Validé"; }

export const companies: Company[] = [
  { id: "finca", name: "FINCA RDC", initials: "FR", about: "Institution de microfinance engagée pour l'inclusion financière en République Démocratique du Congo, présente dans plusieurs provinces." },
];

export const offers: Offer[] = [
  { id: "o1", companyId: "finca", title: "Stagiaire Analyste Crédit", department: "Direction Crédit", location: "Kinshasa, Gombe", type: "Stage académique", duration: "3 mois", level: "Licence (L3)", deadline: "2026-11-28", published: "2026-10-20", description: "Rejoignez l'équipe Crédit pour participer à l'analyse des dossiers de financement des micro-entrepreneurs.", missions: ["Analyser les dossiers de demande de crédit", "Participer aux visites terrain", "Préparer les synthèses pour le comité de crédit"], profile: "Étudiant en économie, finance ou gestion, rigoureux et à l'aise avec les chiffres.", skills: ["Excel", "Analyse financière", "Rédaction"] },
  { id: "o2", companyId: "finca", title: "Stagiaire Développeur Web", department: "Direction IT", location: "Kinshasa, Gombe", type: "Stage professionnel", duration: "6 mois", level: "Master (M1)", deadline: "2026-12-05", published: "2026-10-25", description: "Contribuez au développement des outils internes et des applications de la direction informatique.", missions: ["Développer des fonctionnalités front-end", "Écrire des tests", "Documenter les applications"], profile: "Étudiant en informatique, curieux et autonome.", skills: ["React", "TypeScript", "SQL"] },
  { id: "o3", companyId: "finca", title: "Stagiaire Marketing Digital", department: "Communication & Marketing", location: "Lubumbashi", type: "Stage académique", duration: "3 mois", level: "Licence (L2)", deadline: "2026-11-20", published: "2026-10-12", description: "Participez à la stratégie de communication digitale de FINCA RDC.", missions: ["Animer les réseaux sociaux", "Créer des contenus", "Suivre les indicateurs de performance"], profile: "Étudiant en communication ou marketing, créatif.", skills: ["Réseaux sociaux", "Canva", "Rédaction"] },
  { id: "o4", companyId: "finca", title: "Stagiaire Ressources Humaines", department: "Ressources Humaines", location: "Kinshasa, Gombe", type: "Stage académique", duration: "4 mois", level: "Licence (L3)", deadline: "2026-12-12", published: "2026-10-28", description: "Accompagnez l'équipe RH dans le recrutement et l'administration du personnel.", missions: ["Trier les candidatures", "Organiser les entretiens", "Mettre à jour les dossiers"], profile: "Étudiant en gestion des ressources humaines ou psychologie.", skills: ["Communication", "Organisation", "Excel"] },
  { id: "o5", companyId: "finca", title: "Stagiaire Audit Interne", department: "Audit & Conformité", location: "Goma", type: "Stage professionnel", duration: "6 mois", level: "Master (M1)", deadline: "2026-12-01", published: "2026-10-15", description: "Intégrez l'équipe d'audit pour évaluer les processus des agences.", missions: ["Réaliser des contrôles en agence", "Rédiger des rapports d'audit", "Suivre les recommandations"], profile: "Étudiant en audit, comptabilité ou finance.", skills: ["Comptabilité", "Analyse", "Rédaction"] },
  { id: "o6", companyId: "finca", title: "Stagiaire Data Analyst", department: "Direction IT", location: "Kinshasa, Gombe", type: "Stage professionnel", duration: "5 mois", level: "Master (M1)", deadline: "2026-12-15", published: "2026-11-02", description: "Exploitez les données clients pour produire des tableaux de bord décisionnels.", missions: ["Nettoyer et préparer les données", "Construire des tableaux de bord", "Présenter les analyses"], profile: "Étudiant en statistique, informatique ou économie.", skills: ["SQL", "Excel", "Python"] },
];

export const demoProfile: Profile = {
  nom: "Mukendi", postnom: "Kalala", prenom: "Grâce", adresse: "Av. de la Justice 24, Gombe, Kinshasa",
  email: "grace.mukendi@exemple.cd", telephone: "+243 81 234 5678", photo: null,
  universite: "Université de Kinshasa", faculte: "Sciences Économiques et de Gestion", filiere: "Gestion financière", niveau: "Licence (L3)",
  competences: ["Excel", "Analyse financière", "Rédaction", "SQL"],
  experiences: "Assistante comptable bénévole — ASBL Mama Kongo (2025, 4 mois).",
  projets: "Mémoire en cours sur l'accès au microcrédit des femmes entrepreneures.", infos: "",
  cv: { name: "CV_Grace_Mukendi.pdf", size: 248000, date: "2026-10-02" }, visible: true,
};

export const demoApplications: Application[] = [
  { id: "a1", offerId: "o1", date: "2026-10-22", status: "acceptee" },
  { id: "a2", offerId: "o5", date: "2026-10-18", status: "acceptee" },
  { id: "a3", offerId: "o3", date: "2026-10-14", status: "entretien" },
  { id: "a4", offerId: "o4", date: "2026-10-30", status: "examen" },
];

export const demoSaved = ["o2", "o6"];

export const demoNotifications: Notification[] = [
  { id: "n1", title: "Candidature acceptée", body: "FINCA RDC a accepté votre candidature « Stagiaire Analyste Crédit ».", date: "2026-11-05T10:12:00", read: false, kind: "candidature" },
  { id: "n2", title: "Entretien programmé", body: "Entretien le 12 nov. à 10h00 pour « Stagiaire Marketing Digital ».", date: "2026-11-04T15:30:00", read: false, kind: "entretien" },
  { id: "n3", title: "Nouvelle offre pertinente", body: "« Stagiaire Data Analyst » correspond à vos compétences.", date: "2026-11-02T09:00:00", read: false, kind: "offre" },
  { id: "n4", title: "Candidature acceptée", body: "FINCA RDC a accepté votre candidature « Stagiaire Audit Interne ».", date: "2026-11-01T11:45:00", read: true, kind: "candidature" },
  { id: "n5", title: "Candidature envoyée", body: "Votre candidature « Stagiaire Ressources Humaines » a bien été transmise.", date: "2026-10-30T08:20:00", read: true, kind: "candidature" },
];

export const demoActivity: Activity[] = [
  { id: "ac1", label: "Candidature acceptée", detail: "Stagiaire Analyste Crédit · FINCA RDC", date: "2026-11-05T10:12:00", kind: "acceptee" },
  { id: "ac2", label: "Entretien programmé", detail: "Stagiaire Marketing Digital · 12 nov. 10h00", date: "2026-11-04T15:30:00", kind: "entretien" },
  { id: "ac3", label: "Candidature acceptée", detail: "Stagiaire Audit Interne · FINCA RDC", date: "2026-11-01T11:45:00", kind: "acceptee" },
  { id: "ac4", label: "Candidature envoyée", detail: "Stagiaire Ressources Humaines · FINCA RDC", date: "2026-10-30T08:20:00", kind: "envoi" },
  { id: "ac5", label: "Candidature consultée", detail: "Stagiaire Marketing Digital · FINCA RDC", date: "2026-10-16T14:00:00", kind: "vue" },
];

/** Données du stage — visibles uniquement après confirmation. */
export const internshipExtras = {
  supervisor: { name: "M. Patrick Ilunga", role: "Responsable Crédit", email: "p.ilunga@finca.cd" },
  start: "2026-11-16", end: "2027-02-16",
  infos: ["Horaires : lundi–vendredi, 8h00–16h30", "Badge à retirer à l'accueil le premier jour", "Tenue professionnelle exigée"],
  attendance: [
    { week: "Sem. 1", present: 5, absent: 0, late: 0 },
    { week: "Sem. 2", present: 4, absent: 0, late: 1 },
  ],
  calendar: [
    { date: "2026-11-16", label: "Début du stage — accueil et intégration" },
    { date: "2026-11-30", label: "Rapport périodique n°1" },
    { date: "2026-12-14", label: "Point d'étape avec l'encadreur" },
    { date: "2026-12-28", label: "Rapport périodique n°2" },
    { date: "2027-02-16", label: "Fin du stage — évaluation finale en présentiel" },
  ],
  documents: [
    { id: "d1", name: "Lettre d'affectation.pdf", type: "PDF", category: "Entreprise", date: "2026-11-06", size: "184 Ko" },
    { id: "d2", name: "Règlement intérieur FINCA RDC.pdf", type: "PDF", category: "Stage", date: "2026-11-06", size: "412 Ko" },
  ] as Doc[],
};

export const companyOf = (id: string) => companies.find((c) => c.id === id)!;
export const offerOf = (id: string) => offers.find((o) => o.id === id)!;
