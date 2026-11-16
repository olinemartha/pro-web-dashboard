// Système expert, côté étudiant : quelles offres correspondent à ce profil ?
// Base de faits : le profil de l'étudiant (niveau, filière, faculté, compétences) et l'offre.
// Base de règles : O1 à O4 ci-dessous. Ce sont des règles de démonstration,
// à remplacer par les critères réels de FINCA RDC.
// Le moteur recommande et explique ; l'étudiant reste libre de postuler où il veut.

import type { ExpertCriterion, ExpertRule } from "./company-data";
import { daysFromToday, fmtDate } from "./dates";
import type { Offer } from "./mock-data";
import { studyYears } from "./levels";
import type { Profile } from "./rules";

export const OFFER_MATCHING_VERSION = "regles-offres-1.0";

export const OFFER_RULES: ExpertRule[] = [
  {
    id: "O1",
    label: "Niveau d'études",
    description: "Le niveau de l'étudiant atteint au moins le niveau demandé par l'offre. Règle de démonstration.",
  },
  {
    id: "O2",
    label: "Formation en lien",
    description:
      "La filière ou la faculté de l'étudiant figure dans le profil recherché ou le service de l'offre. Règle de démonstration.",
  },
  {
    id: "O3",
    label: "Compétences communes",
    description: "Au moins deux compétences demandées par l'offre figurent dans le profil. Règle de démonstration.",
  },
  {
    id: "O4",
    label: "Candidatures ouvertes",
    description: "La date limite de l'offre n'est pas dépassée. Condition obligatoire. Règle de démonstration.",
  },
];

/** Recommandée : candidatures ouvertes et au moins 2 des 3 autres règles. */
export type OfferVerdict = "recommandee" | "partielle" | "faible" | "close";

export type OfferMatch = {
  offerId: string;
  verdict: OfferVerdict;
  /** Règles satisfaites, sur 4. */
  met: number;
  criteria: ExpertCriterion[];
};

export const VERDICT_LABELS: Record<OfferVerdict, string> = {
  recommandee: "Recommandée pour vous",
  partielle: "Correspondance partielle",
  faible: "Peu adaptée à votre profil",
  close: "Candidatures closes",
};

/** Niveau comparable entre ancien système et LMD (années d'études) ; inconnu → -1. */
const levelRank = studyYears;

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

const STOP = new Set(["etudiant", "etudiante", "sciences", "direction", "service", "autonome", "curieux", "rigoureux"]);

/** Racines de 5 lettres des mots significatifs : « financière » et « finance » se rejoignent. */
function roots(value: string) {
  return new Set(
    normalize(value)
      .split(/[^a-z]+/)
      .filter((word) => word.length >= 5 && !STOP.has(word))
      .map((word) => word.slice(0, 5))
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

export function matchOffer(profile: Profile, offer: Offer): OfferMatch {
  // O1 — Niveau d'études
  const wanted = levelRank(offer.level);
  const mine = levelRank(profile.niveau);
  const levelOk = wanted < 0 || (mine >= 0 && mine >= wanted);

  // O2 — Formation en lien avec le profil recherché
  const studentRoots = roots(`${profile.filiere} ${profile.faculte}`);
  const offerText = `${offer.profile} ${offer.department}`;
  const offerRoots = roots(offerText);
  const shared = [...studentRoots].filter((root) => offerRoots.has(root));
  // Les mots d'origine (avec leurs accents) pour l'explication : « économie », pas « economie ».
  const sharedWords = offerText
    .split(/[^\p{L}]+/u)
    .filter((word) => shared.some((root) => normalize(word).startsWith(root)))
    .map((word) => word.toLowerCase());
  const trainingOk = shared.length > 0;

  // O3 — Compétences communes
  const skills = new Set(profile.competences.map((skill) => normalize(skill)));
  const common = offer.skills.filter((skill) => skills.has(normalize(skill)));
  const skillsOk = common.length >= Math.min(2, offer.skills.length);

  // O4 — Candidatures ouvertes
  const open = daysFromToday(offer.deadline) >= 0;

  const criteria: ExpertCriterion[] = [
    {
      label: "Niveau d'études",
      satisfied: levelOk,
      detail: `Niveau demandé : ${offer.level} · votre niveau : ${profile.niveau || "non renseigné"}`,
      ruleId: "O1",
    },
    {
      label: "Formation en lien",
      satisfied: trainingOk,
      detail: trainingOk
        ? `Le profil recherché mentionne ${[...new Set(sharedWords)].slice(0, 2).join(", ")}, en lien avec votre formation`
        : `Profil recherché : ${offer.profile || offer.department}`,
      ruleId: "O2",
    },
    {
      label: "Compétences communes",
      satisfied: skillsOk,
      detail: common.length
        ? `${plural(common.length, "compétence")} commune${common.length > 1 ? "s" : ""} sur ${offer.skills.length} : ${common.join(", ")}`
        : `Aucune des ${offer.skills.length} compétences demandées : ${offer.skills.join(", ")}`,
      ruleId: "O3",
    },
    {
      label: "Candidatures ouvertes",
      satisfied: open,
      detail: open ? `Date limite : ${fmtDate(offer.deadline)}` : `Closes depuis le ${fmtDate(offer.deadline)}`,
      ruleId: "O4",
    },
  ];

  const met = criteria.filter((criterion) => criterion.satisfied).length;
  const others = [levelOk, trainingOk, skillsOk].filter(Boolean).length;
  const verdict: OfferVerdict = !open ? "close" : others >= 2 ? "recommandee" : others === 1 ? "partielle" : "faible";
  return { offerId: offer.id, verdict, met, criteria };
}

const ORDER: OfferVerdict[] = ["recommandee", "partielle", "faible", "close"];

/** Classement : recommandées d'abord, puis le plus de règles satisfaites, puis la date limite la plus proche. */
export function rankOffers(profile: Profile, offers: Offer[]) {
  return offers
    .map((offer) => ({ offer, match: matchOffer(profile, offer) }))
    .sort(
      (a, b) =>
        ORDER.indexOf(a.match.verdict) - ORDER.indexOf(b.match.verdict) ||
        b.match.met - a.match.met ||
        a.offer.deadline.localeCompare(b.offer.deadline)
    );
}
