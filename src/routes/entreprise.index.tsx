import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Inbox,
  Layers,
  MapPin,
  Send,
  Scale,
  TrendingUp,
  Users,
  UserSearch,
} from "lucide-react";
import { AvatarInitials, Badge, type Tone } from "@/components/company/ui";
import { CompanyLogoUploader } from "@/components/company/company-logo";
import { AnimatedNumber, Reveal } from "@/components/ui/motion";
import { useCompanyStore } from "@/lib/company-store";
import { latestRunFor } from "@/lib/expert-engine";
import { cn } from "@/lib/utils";
import { candidateStatusLabels, type CandidateStatus } from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/")({
  head: () => ({
    meta: [{ title: "Tableau de bord — Espace entreprise" }],
  }),
  component: CompanyDashboard,
});

const DAY = 86_400_000;

function fmtDate(value: string, withYear = true) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function relativeDay(value: string) {
  const days = Math.round((Date.now() - new Date(`${value}T12:00:00`).getTime()) / DAY);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days === -1) return "demain";
  if (days < 0) return `dans ${-days} jours`;
  if (days < 14) return `il y a ${days} jours`;
  if (days < 60) return `il y a ${Math.round(days / 7)} semaines`;
  return fmtDate(value, false);
}

/** Date courte pour une colonne étroite : « auj. », « hier », « 4 j », « 2 sem. ». */
function shortDay(value: string) {
  const days = Math.round((Date.now() - new Date(`${value}T12:00:00`).getTime()) / DAY);
  if (days <= 0) return "auj.";
  if (days === 1) return "hier";
  if (days < 14) return `${days} j`;
  if (days < 60) return `${Math.round(days / 7)} sem.`;
  return fmtDate(value, false);
}

/** Événement lisible à partir d'un statut d'historique (court pour le badge, long pour l'accessibilité). */
function activityEvent(
  status: CandidateStatus,
  interviewDate?: string
): { short: string; long: string; tone: Tone } {
  switch (status) {
    case "en_attente":
      return { short: "Nouvelle", long: "nouvelle candidature", tone: "primary" };
    case "examen":
      return { short: "En examen", long: "profil en cours d'examen", tone: "muted" };
    case "entretien": {
      const when = interviewDate ? fmtDate(interviewDate, false) : null;
      return {
        short: when ? `Entretien ${when}` : "Entretien",
        long: when ? `entretien programmé le ${when}` : "entretien programmé",
        tone: "primary",
      };
    }
    case "acceptee":
      return { short: "Acceptée", long: "candidature acceptée", tone: "success" };
    case "refusee":
      return { short: "Non retenu", long: "profil non retenu", tone: "destructive" };
    case "retiree":
    default:
      return { short: "Retirée", long: "candidature retirée", tone: "muted" };
  }
}

/** Date du jour au format ISO, en heure locale (Kinshasa), et non en UTC. */
function localIsoDate(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function initialsOf(value: string) {
  // « Direction Crédit » → « CR », « Communication & Marketing » → « CM ».
  const STOP = new Set(["direction", "service", "de", "des", "du", "et", "la", "le", "les"]);
  const words = value
    .split(/[^\p{L}0-9]+/u)
    .filter((word) => word && !STOP.has(word.toLowerCase()));
  if (words.length === 0) return value.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/* ------------------------------------------------------------------ */
/* Éléments partagés                                                   */
/* ------------------------------------------------------------------ */

/** État vide unique pour toutes les cartes : icône nue, titre, phrase courte. */
function EmptyNote({
  icon: Icon,
  title,
  desc,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-5 py-8 text-center", className)}>
      <Icon className="size-6 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  count,
  to,
  linkLabel = "Tout voir",
}: {
  title: string;
  description?: string;
  count?: number;
  to?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          {title}
          {count !== undefined && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {count}
            </span>
          )}
        </h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {to && (
        <Link
          to={to}
          aria-label={`${linkLabel} — ${title}`}
          className="press group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-card px-3 text-[13px] font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md"
        >
          {linkLabel}
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/** Petite courbe : une vraie série (candidatures par semaine), dessinée sans bibliothèque. */
function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 96;
  const h = 32;
  const max = Math.max(1, ...values);
  const step = w / Math.max(1, values.length - 1);
  const points = values.map((v, i) => [i * step, h - 3 - (v / max) * (h - 6)] as const);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-24 overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" className="animate-fade-in" />
      <path
        d={line}
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="spark-draw"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.75" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="1.5" />}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* File « À traiter »                                                  */
/* ------------------------------------------------------------------ */

type TodoKind = "affectation" | "candidature" | "rapport" | "entretien" | "service";

type Todo = {
  kind: TodoKind;
  id: string;
  /** Qui ou quoi : la personne concernée, ou le service. C'est ce qu'on lit en premier. */
  subject: string;
  /** La tâche, formulée sans verbe en tête : « Candidature à examiner ». */
  task: string;
  /** Contexte secondaire : offre, période, heure et lieu. */
  context: string;
  /** Délai court pour la colonne de droite : « 14 j d'attente », « demain ». */
  when: string;
  /** Délai complet, pour les lecteurs d'écran. */
  whenLong: string;
  /** Urgent : délai en ambre (attente de 7 jours ou plus, entretien aujourd'hui ou demain). */
  urgent: boolean;
  /** Rappel de fond (besoins des services) : moins appuyé qu'une personne qui attend. */
  reminder?: boolean;
  /** Urgence réelle : plus le score est élevé, plus l'action remonte. */
  score: number;
  q?: string;
  internId?: string;
  /** Recommandation du système expert, pour les affectations. */
  recommendation?: { service: string; met: number; total: number };
};

type TodoGroup = "recrutement" | "stagiaires" | "services";

const TODO_META: Record<
  TodoKind,
  { action: string; icon: React.ComponentType<{ className?: string }>; group: TodoGroup }
> = {
  affectation: { action: "Valider", icon: Scale, group: "stagiaires" },
  candidature: { action: "Examiner", icon: Inbox, group: "recrutement" },
  rapport: { action: "Relire", icon: FileText, group: "stagiaires" },
  entretien: { action: "Préparer", icon: CalendarClock, group: "recrutement" },
  service: { action: "Mettre à jour", icon: Layers, group: "services" },
};

const TODO_GROUPS: { key: TodoGroup | "tout"; label: string }[] = [
  { key: "tout", label: "Tout" },
  { key: "recrutement", label: "Recrutement" },
  { key: "stagiaires", label: "Stagiaires" },
  { key: "services", label: "Services" },
];

/** Jours entiers entre deux dates ISO (positif si `to` est après `from`). */
function daysBetween(from: string, to: string) {
  return Math.round(
    (new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / DAY
  );
}

function TodoTarget({
  todo,
  label,
  className,
  children,
}: {
  todo: Todo;
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  switch (todo.kind) {
    case "candidature":
      return (
        <Link to="/entreprise/candidatures" search={{ q: todo.q }} aria-label={label} className={className}>
          {children}
        </Link>
      );
    case "affectation":
    case "rapport":
      return (
        <Link
          to="/entreprise/stagiaires/$internId"
          params={{ internId: todo.internId! }}
          aria-label={label}
          className={className}
        >
          {children}
        </Link>
      );
    case "entretien":
      return (
        <Link to="/entreprise/entretiens" aria-label={label} className={className}>
          {children}
        </Link>
      );
    default:
      return (
        <Link to="/entreprise/services" aria-label={label} className={className}>
          {children}
        </Link>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                            */
/* ------------------------------------------------------------------ */

/**
 * Une seule famille de bleus, du plus clair (en attente) au plus foncé
 * (acceptée) ; le refus reste en gris neutre. Pas d'arc-en-ciel.
 */
const PIPELINE: { status: CandidateStatus; color: string }[] = [
  { status: "en_attente", color: "hsl(220 25% 85%)" },
  { status: "examen", color: "hsl(218 90% 78%)" },
  { status: "entretien", color: "hsl(220 84% 56%)" },
  { status: "acceptee", color: "hsl(224 64% 33%)" },
  { status: "refusee", color: "hsl(220 12% 64%)" },
];

type PipelineStep = { status: CandidateStatus; color: string; count: number };

/** Anneau interactif + barres comparatives : survoler un statut le met en avant partout. */
function PipelineChart({
  steps,
  total,
  acceptanceRate,
}: {
  steps: PipelineStep[];
  total: number;
  acceptanceRate: number | null;
}) {
  const [hover, setHover] = useState<CandidateStatus | null>(null);
  const size = 136;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = total > 0 && steps.filter((s) => s.count > 0).length > 1 ? 3 : 0;
  const max = Math.max(1, ...steps.map((s) => s.count));
  const active = steps.find((s) => s.status === hover);

  let offset = 0;
  const arcs = steps
    .filter((s) => s.count > 0)
    .map((s) => {
      const len = (s.count / Math.max(1, total)) * c;
      const arc = { ...s, dash: Math.max(0, len - gap), offset };
      offset += len;
      return arc;
    });

  return (
    <div className="mt-4 grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
      {/* Anneau */}
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label="Répartition des candidatures par statut">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
          {arcs.map((arc, index) => (
            <circle
              key={arc.status}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={hover === arc.status ? stroke + 4 : stroke}
              strokeDasharray={`${arc.dash} ${c}`}
              strokeDashoffset={-arc.offset}
              className="donut-arc transition-[stroke-width,opacity] duration-200"
              style={{
                opacity: hover && hover !== arc.status ? 0.35 : 1,
                ["--arc-len" as string]: `${arc.dash}`,
                ["--delay" as string]: `${200 + index * 120}ms`,
              }}
              onMouseEnter={() => setHover(arc.status)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-semibold leading-none tracking-tight tabular-nums">
              {active ? active.count : <AnimatedNumber value={total} />}
            </p>
            <p className="mt-1 max-w-[96px] text-[11px] leading-tight text-muted-foreground">
              {active ? candidateStatusLabels[active.status].label : total > 1 ? "candidatures" : "candidature"}
            </p>
          </div>
        </div>
      </div>

      {/* Barres comparatives */}
      <div className="min-w-0 space-y-1">
        {steps.map((step, index) => {
          const pct = total ? Math.round((step.count / total) * 100) : 0;
          const dim = hover && hover !== step.status;
          return (
            <div
              key={step.status}
              onMouseEnter={() => setHover(step.status)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                "grid cursor-default grid-cols-[minmax(0,150px)_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-1 transition-all duration-200",
                hover === step.status && "bg-muted/60",
                dim && "opacity-50"
              )}
            >
              <span className="flex min-w-0 items-center gap-2 text-[13px]">
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: step.color }} aria-hidden />
                <span className="truncate">{candidateStatusLabels[step.status].label}</span>
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-muted">
                <span
                  className="animate-grow-x block h-full rounded-full"
                  style={{
                    width: `${(step.count / max) * 100}%`,
                    background: step.color,
                    ["--delay" as string]: `${300 + index * 80}ms`,
                  }}
                />
              </span>
              <span className="min-w-16 whitespace-nowrap text-right text-[13px] tabular-nums">
                <span className="font-semibold">{step.count}</span>
                <span className="ml-1 text-xs text-muted-foreground">{pct} %</span>
              </span>
            </div>
          );
        })}
        <div className="mt-2 flex items-center justify-between border-t px-2 pt-2.5">
          <span className="text-[13px] text-muted-foreground">Taux d'acceptation (décisions prises)</span>
          <span className="text-[15px] font-semibold tabular-nums">
            {acceptanceRate === null ? "—" : <AnimatedNumber value={acceptanceRate} suffix=" %" />}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tableau de bord                                                     */
/* ------------------------------------------------------------------ */

function CompanyDashboard() {
  const { profile, offers, candidates, interns, interviews, services, expertRuns } = useCompanyStore();
  const [tab, setTab] = useState<TodoGroup | "tout">("tout");
  const [expanded, setExpanded] = useState(false);

  const now = Date.now();
  const todayIso = localIsoDate();
  // Seuls les entretiens des 3 prochains jours entrent dans la file ; l'agenda couvre les suivants.
  const horizonIso = localIsoDate(new Date(now + 3 * DAY));

  const activeOffers = offers.filter((offer) => offer.status === "publiee");
  const toExamine = candidates.filter((c) => c.status === "en_attente" || c.status === "examen");
  const confirmedInterns = interns.filter((intern) => intern.confirmed);
  const pendingAssignments = interns.filter((intern) => !intern.confirmed);
  const upcomingInterviews = interviews
    .filter((interview) => interview.status === "programme")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

  const offerTitle = (id: string) => offers.find((offer) => offer.id === id)?.title ?? "Offre supprimée";
  const candidateName = (id: string) => candidates.find((c) => c.id === id)?.name ?? "Candidat";
  const candidateOffer = (id: string) => {
    const candidate = candidates.find((c) => c.id === id);
    return candidate ? offerTitle(candidate.offerId) : "";
  };

  // Candidatures reçues par semaine (8 dernières semaines).
  const weekly = Array.from({ length: 8 }, (_, index) => {
    const end = now - (7 - index) * 7 * DAY;
    const start = end - 7 * DAY;
    return candidates.filter((c) => {
      const t = new Date(`${c.appliedAt}T12:00:00`).getTime();
      return t > start && t <= end;
    }).length;
  });
  const last30 = candidates.filter((c) => now - new Date(`${c.appliedAt}T12:00:00`).getTime() <= 30 * DAY).length;

  const serviceCapacity = services.map((service) => {
    const filled = interns.filter(
      (intern) =>
        intern.confirmed &&
        (intern.serviceId ? intern.serviceId === service.id : intern.service === service.name)
    ).length;
    return { service, filled, left: Math.max(0, service.internsNeeded - filled) };
  });
  const placesLeft = serviceCapacity.reduce((sum, entry) => sum + entry.left, 0);

  /* ---- Pipeline ---- */
  const inPipeline = candidates.filter((c) => c.status !== "retiree");
  const pipelineCounts = PIPELINE.map((step) => ({
    ...step,
    count: inPipeline.filter((c) => c.status === step.status).length,
  }));
  const acceptedCount = pipelineCounts.find((s) => s.status === "acceptee")?.count ?? 0;
  const refusedCount = pipelineCounts.find((s) => s.status === "refusee")?.count ?? 0;
  const decided = acceptedCount + refusedCount;
  const acceptanceRate = decided ? Math.round((acceptedCount / decided) * 100) : null;

  /* ---- File À traiter ----
   * Tri par urgence réelle (délai, ancienneté), le type ne sert qu'à départager :
   * - entretien : plus il est proche, plus il remonte (demain ≈ 84) ;
   * - affectation : un stagiaire attend sa décision (85) ;
   * - candidature : plus elle attend, plus elle remonte (12 jours ≈ 58) ;
   * - rapport : plus il attend sa relecture, plus il remonte ;
   * - besoins de service : rappel de fond (20 à 30).
   */
  const todos: Todo[] = [];
  pendingAssignments.forEach((intern) => {
    const run = latestRunFor(expertRuns, intern.id);
    const proposal = run?.proposals[0];
    const age = run ? Math.max(0, daysBetween(run.createdAt.slice(0, 10), todayIso)) : null;
    todos.push({
      kind: "affectation",
      id: `affectation-${intern.id}`,
      subject: intern.name,
      task: "Affectation à valider",
      context: offerTitle(intern.offerId),
      when: age === null ? "à décider" : age === 0 ? "aujourd'hui" : `depuis ${age} j`,
      whenLong:
        age === null ? "décision attendue" : age === 0 ? "recommandation du jour" : `décision attendue depuis ${age} jours`,
      urgent: age !== null && age >= 7,
      score: 85,
      internId: intern.id,
      recommendation: proposal
        ? {
            service: proposal.serviceName,
            met: proposal.satisfied.filter((criterion) => criterion.satisfied).length,
            total: proposal.satisfied.length,
          }
        : undefined,
    });
  });
  toExamine.forEach((candidate) => {
    // Un entretien est déjà programmé : la candidature est suivie dans l'agenda, pas en double ici.
    if (upcomingInterviews.some((interview) => interview.candidateId === candidate.id)) return;
    const waited = Math.max(0, daysBetween(candidate.appliedAt, todayIso));
    todos.push({
      kind: "candidature",
      id: `candidature-${candidate.id}`,
      subject: candidate.name,
      task: "Candidature à examiner",
      context: offerTitle(candidate.offerId).replace(/^Stagiaire\s+/i, ""),
      when: waited === 0 ? "reçue aujourd'hui" : `${waited} j d'attente`,
      whenLong: waited === 0 ? "reçue aujourd'hui" : `en attente depuis ${waited} jours`,
      urgent: waited >= 7,
      score: 40 + Math.min(waited, 30) * 1.5,
      q: candidate.name,
    });
  });
  interns.forEach((intern) => {
    const pending = intern.reports.find((report) => report.status === "soumis");
    if (!pending) return;
    const waited = Math.max(0, daysBetween(pending.date, todayIso));
    todos.push({
      kind: "rapport",
      id: `rapport-${intern.id}`,
      subject: intern.name,
      task: "Rapport à relire",
      context: pending.period,
      when: waited === 0 ? "aujourd'hui" : `il y a ${waited} j`,
      whenLong: waited === 0 ? "déposé aujourd'hui" : `déposé il y a ${waited} jours`,
      urgent: waited >= 7,
      score: 50 + Math.min(waited, 20) * 2,
      internId: intern.id,
    });
  });
  upcomingInterviews
    .filter((interview) => interview.date >= todayIso && interview.date <= horizonIso)
    .forEach((interview) => {
      const inDays = daysBetween(todayIso, interview.date);
      const day = inDays === 0 ? "aujourd'hui" : inDays === 1 ? "demain" : `dans ${inDays} j`;
      todos.push({
        kind: "entretien",
        id: `entretien-${interview.id}`,
        subject: candidateName(interview.candidateId),
        task: "Entretien à préparer",
        context: `${interview.time} · ${interview.location}`,
        when: day,
        whenLong: `entretien ${inDays <= 1 ? day : `dans ${inDays} jours`} à ${interview.time}`,
        urgent: inDays <= 1,
        score: 90 - inDays * 6,
      });
    });
  serviceCapacity.forEach(({ service }) => {
    const staleDays = Math.floor((now - new Date(`${service.updatedAt}T00:00:00`).getTime()) / DAY);
    const incomplete = !service.education.trim() || service.skills.length === 0 || !service.profiles.trim();
    if (incomplete || staleDays > 30) {
      todos.push({
        kind: "service",
        id: `service-${service.id}`,
        subject: service.name,
        task: incomplete ? "Besoins à compléter" : "Besoins à revoir",
        context: "Alimente les recommandations du système expert",
        when: incomplete ? "à compléter" : `il y a ${staleDays} j`,
        whenLong: incomplete ? "besoins incomplets" : `besoins mis à jour il y a ${staleDays} jours`,
        urgent: false,
        reminder: true,
        score: incomplete ? 30 : 20,
      });
    }
  });
  const KIND_ORDER: TodoKind[] = ["affectation", "entretien", "candidature", "rapport", "service"];
  todos.sort((a, b) => b.score - a.score || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));

  const tabs = TODO_GROUPS.map((group) => ({
    ...group,
    count: group.key === "tout" ? todos.length : todos.filter((t) => TODO_META[t.kind].group === group.key).length,
  })).filter((entry) => entry.key === "tout" || entry.count > 0);
  // Si le filtre choisi n'a plus d'élément, on revient à « Tout » plutôt que d'afficher « Tout est à jour » à tort.
  const currentTab = tabs.some((entry) => entry.key === tab) ? tab : "tout";
  const filtered = currentTab === "tout" ? todos : todos.filter((t) => TODO_META[t.kind].group === currentTab);
  const COLLAPSED = 5;
  const visibleTodos = expanded ? filtered : filtered.slice(0, COLLAPSED);
  const hiddenCount = filtered.length - Math.min(filtered.length, COLLAPSED);

  /* ---- Activité récente : le dernier événement de chaque candidat ----
   * On montre un événement (« Acceptée », « Entretien 18 nov. »), pas un statut brut,
   * et une seule ligne par candidat pour éviter les doublons contradictoires.
   */
  const activity = candidates
    .map((candidate) => {
      const last = [...candidate.history].sort((a, b) => b.date.localeCompare(a.date))[0];
      if (!last) return null;
      const interview =
        last.status === "entretien"
          ? interviews.find((i) => i.candidateId === candidate.id && i.status === "programme")
          : undefined;
      const event = activityEvent(last.status, interview?.date);
      return {
        id: candidate.id,
        name: candidate.name,
        initials: candidate.initials,
        date: last.date,
        offer: offerTitle(candidate.offerId).replace(/^Stagiaire\s+/i, ""),
        ...event,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  const nextStep = (internId: string): { label: string; tone: Tone } => {
    const intern = interns.find((entry) => entry.id === internId);
    if (!intern) return { label: "Dossier introuvable", tone: "muted" };
    if (!intern.confirmed) return { label: "Affectation à valider", tone: "warning" };
    if (intern.reports.some((report) => report.status === "soumis")) return { label: "Rapport à examiner", tone: "primary" };
    if (!intern.evaluation) return { label: "Suivi en cours", tone: "accent" };
    if (intern.certificate === "non_generee") return { label: "Attestation à générer", tone: "warning" };
    if (intern.certificate === "generee") return { label: "Attestation à valider", tone: "warning" };
    return { label: "Dossier à jour", tone: "success" };
  };

  /* ---- Indicateurs ---- */
  const stats: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    foot: string;
    to: string;
    trend?: boolean;
    alert?: boolean;
    spark?: number[];
  }[] = [
    {
      label: "Offres actives",
      value: activeOffers.length,
      icon: Briefcase,
      foot: `sur ${offers.length} offre${offers.length > 1 ? "s" : ""} créée${offers.length > 1 ? "s" : ""}`,
      to: "/entreprise/offres",
    },
    {
      label: "Candidatures reçues",
      value: candidates.length,
      icon: Send,
      foot: last30 > 0 ? `+${last30} en 30 jours` : "aucune ce mois-ci",
      trend: last30 > 0,
      spark: weekly,
      to: "/entreprise/candidatures",
    },
    {
      label: "À examiner",
      value: toExamine.length,
      icon: UserSearch,
      foot: toExamine.length ? "en attente de votre décision" : "rien en attente",
      alert: toExamine.length > 0,
      to: "/entreprise/candidatures",
    },
    {
      label: "Stagiaires accueillis",
      value: interns.length,
      icon: Users,
      foot: `${confirmedInterns.length} affectation${confirmedInterns.length > 1 ? "s" : ""} confirmée${confirmedInterns.length > 1 ? "s" : ""}`,
      to: "/entreprise/stagiaires",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ============================ Bandeau d'indicateurs ============================ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {stats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 60} className="min-w-0">
            <Link
              to={stat.to}
              className="card-surface hover-lift group flex h-full flex-col gap-4 p-4 sm:p-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
                  <stat.icon className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-muted-foreground line-clamp-2 xl:line-clamp-1">{stat.label}</span>
              </div>
              <div className="flex items-end justify-between gap-2">
                <p className="text-[30px] font-semibold leading-none tracking-tight">
                  <AnimatedNumber value={stat.value} />
                </p>
                {stat.spark && <Sparkline values={stat.spark} className="hidden sm:block" />}
              </div>
              <p
                className={cn(
                  "mt-auto flex items-center gap-1 border-t pt-3 text-xs",
                  stat.trend ? "font-medium text-success-ink" : stat.alert ? "font-medium text-warning" : "text-muted-foreground"
                )}
              >
                {stat.trend && <TrendingUp className="size-3.5 shrink-0" />}
                {stat.alert && <Clock className="size-3.5 shrink-0" />}
                <span className="line-clamp-2 xl:line-clamp-1">{stat.foot}</span>
              </p>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Ligne 1 : les deux colonnes finissent au même niveau (la dernière carte de chaque colonne s'étire) */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* Pipeline de recrutement */}
          <Reveal as="section" delay={80} className="card-surface p-5">
            <SectionHeader
              title="Pipeline de recrutement"
              description={`${inPipeline.length} candidature${inPipeline.length > 1 ? "s" : ""} au total, toutes offres confondues`}
              to="/entreprise/candidatures"
            />
            <PipelineChart steps={pipelineCounts} total={inPipeline.length} acceptanceRate={acceptanceRate} />
          </Reveal>

          {/* À traiter : la personne d'abord, l'urgence visible, un seul élément teinté (la recommandation) */}
          <Reveal
            as="section"
            delay={140}
            className="card-surface flex flex-col overflow-hidden xl:flex-1"
            aria-labelledby="todo-title"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b px-5 pb-3.5 pt-4">
              <h2 id="todo-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                À traiter
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {todos.length}
                </span>
              </h2>
              {todos.length > 0 && (
                <div role="group" aria-label="Filtrer les décisions" className="flex flex-wrap gap-0.5 sm:gap-1">
                  {tabs.map((entry) => {
                    const active = currentTab === entry.key;
                    return (
                      <button
                        key={entry.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setTab(entry.key);
                          setExpanded(false);
                        }}
                        className={cn(
                          "press inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[13px] transition-colors duration-200 sm:px-2.5",
                          active
                            ? "bg-primary-soft font-semibold text-primary"
                            : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {entry.label}
                        {entry.key !== "tout" && (
                          <span className={cn("hidden text-xs tabular-nums sm:inline", active ? "text-primary/70" : "text-muted-foreground/80")}>
                            {entry.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="sr-only" aria-live="polite">
              {`${filtered.length} action${filtered.length > 1 ? "s" : ""} affichée${filtered.length > 1 ? "s" : ""}`}
            </p>

            {visibleTodos.length === 0 ? (
              <div className="m-5 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center xl:flex-1">
                <CheckCircle2 className="size-6 text-success" />
                <p className="mt-2 text-sm font-medium">Tout est à jour</p>
                <p className="text-xs text-muted-foreground">Aucune décision ne vous attend pour le moment.</p>
              </div>
            ) : (
              <ul id="todo-list" className={cn("flex flex-col divide-y", visibleTodos.length >= 4 ? "flex-1" : "xl:border-b")}>
                {visibleTodos.map((todo, index) => {
                  const meta = TODO_META[todo.kind];
                  const rec = todo.recommendation;
                  const label =
                    `${todo.subject} — ${todo.task}. ${todo.context}. ${todo.whenLong}.` +
                    (rec
                      ? ` Recommandé : ${rec.service}, ${rec.met} critères satisfaits sur ${rec.total}. Ouvrir l'explication.`
                      : ` ${meta.action}.`);
                  return (
                    <Reveal
                      as="li"
                      key={todo.id}
                      delay={index < 5 ? index * 40 : 0}
                      className={cn("flex", visibleTodos.length >= 4 ? "xl:flex-1" : "xl:min-h-[5.5rem]")}
                    >
                      <TodoTarget
                        todo={todo}
                        label={label}
                        className={cn(
                          "group grid w-full grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3 transition-colors duration-150 focus-visible:outline-offset-[-3px] sm:grid-cols-[20px_minmax(0,1fr)_auto_auto]",
                          rec
                            ? "bg-primary-soft shadow-[inset_3px_0_0_hsl(var(--primary))] hover:bg-[hsl(218_92%_92%)]"
                            : "hover:bg-muted/50"
                        )}
                      >
                        {/* Icône nue, de sens */}
                        <meta.icon
                          className={cn(
                            "size-[18px] transition-colors duration-200",
                            rec ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />

                        {/* Qui, puis quoi ; le contexte dessous */}
                        <span className="min-w-0">
                          <span className="line-clamp-2 text-sm leading-5 sm:line-clamp-1 xl:line-clamp-2">
                            <span className={cn("font-semibold", todo.reminder ? "text-muted-foreground" : "text-foreground")}>
                              {todo.subject}
                            </span>
                            <span className="text-muted-foreground"> · {todo.task}</span>
                          </span>
                          {rec ? (
                            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                              <span className="truncate text-primary">
                                Recommandé : <span className="font-semibold">{rec.service}</span>
                              </span>
                              <span className="flex shrink-0 items-center gap-0.5" aria-hidden="true">
                                {Array.from({ length: rec.total }, (_, i) => (
                                  <span
                                    key={i}
                                    className={cn("size-1.5 rounded-[2px]", i < rec.met ? "bg-primary" : "bg-border")}
                                  />
                                ))}
                              </span>
                              <span className="hidden shrink-0 tabular-nums text-muted-foreground sm:inline">
                                {rec.met}/{rec.total} critères
                              </span>
                              <span className={cn("shrink-0 whitespace-nowrap sm:hidden", todo.urgent ? "font-medium text-warning" : "text-muted-foreground")}>
                                · {todo.when}
                              </span>
                            </span>
                          ) : (
                            <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="truncate">{todo.context}</span>
                              <span className={cn("shrink-0 whitespace-nowrap sm:hidden", todo.urgent && "font-medium text-warning")}>
                                · {todo.when}
                              </span>
                            </span>
                          )}
                        </span>

                        {/* Délai : la colonne qui rend l'urgence visible */}
                        <span
                          className={cn(
                            "hidden items-center justify-end gap-1 whitespace-nowrap text-right text-xs tabular-nums sm:flex",
                            todo.urgent ? "font-semibold text-warning" : "font-medium text-muted-foreground"
                          )}
                        >
                          {todo.urgent && <Clock className="size-3" />}
                          {todo.when}
                        </span>

                        {/* Bouton : discret et de largeur fixe ; seul celui de la recommandation est plein */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center gap-1 rounded-lg text-xs transition-colors duration-200 sm:w-36 sm:px-3",
                            rec
                              ? "bg-primary font-semibold text-primary-foreground shadow-sm group-hover:bg-primary-hover"
                              : "bg-muted/70 font-medium text-muted-foreground group-hover:bg-primary-soft group-hover:text-primary"
                          )}
                        >
                          <span className="hidden whitespace-nowrap sm:inline">{rec ? "Voir l'explication" : meta.action}</span>
                          <ArrowRight className="size-3.5 shrink-0" />
                        </span>
                      </TodoTarget>
                    </Reveal>
                  );
                })}
              </ul>
            )}
            {visibleTodos.length > 0 && visibleTodos.length < 4 && (
              <div className="hidden flex-1 flex-col items-center justify-center gap-2 px-5 py-6 text-center xl:flex">
                <CheckCircle2 className="size-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {currentTab === "tout"
                    ? "Rien d'autre à traiter pour le moment."
                    : `Rien d'autre côté ${TODO_GROUPS.find((g) => g.key === currentTab)?.label.toLowerCase()}.`}
                </p>
                {currentTab !== "tout" && (
                  <button
                    type="button"
                    onClick={() => setTab("tout")}
                    className="press inline-flex h-8 items-center gap-1 rounded-lg border bg-card px-3 text-[13px] font-medium shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Tout afficher
                  </button>
                )}
              </div>
            )}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                aria-controls="todo-list"
                className="group flex w-full items-center justify-center gap-1.5 border-t px-5 py-2.5 text-[13px] focus-visible:outline-offset-[-3px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                {expanded
                  ? "Réduire la liste"
                  : `Afficher ${hiddenCount} autre${hiddenCount > 1 ? "s" : ""} action${hiddenCount > 1 ? "s" : ""}`}
                <ChevronDown className={cn("size-4 transition-transform duration-300", expanded && "rotate-180")} />
              </button>
            )}
          </Reveal>

        </div>
        <aside className="grid gap-6 lg:grid-cols-2 xl:flex xl:flex-col">
          {/* Carte entreprise — version d'origine, conservée telle quelle (logo ajoutable) */}
          <Reveal delay={120} className="card-surface overflow-hidden">
            <div className="relative bg-gradient-to-b from-accent-soft/80 via-accent-soft/30 to-card px-5 pb-5 pt-6 text-center">
              <div className="absolute -right-8 -top-8 size-28 rounded-full border-[10px] border-accent/15" aria-hidden />
              <CompanyLogoUploader radius="rounded-full" className="relative mx-auto size-20 rounded-full shadow-md ring-4 ring-card" />
              <p className="relative mt-3 text-lg font-semibold tracking-tight">{profile.name}</p>
              <p className="relative text-sm text-muted-foreground">{profile.sector}</p>
              <p className="relative mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {profile.city}
              </p>
              <div className="relative mt-5">
                <p className="text-4xl font-semibold tracking-tight">
                  <AnimatedNumber value={placesLeft} />
                </p>
                <p className="text-sm text-muted-foreground">place{placesLeft > 1 ? "s" : ""} de stage à pourvoir</p>
              </div>
            </div>

            <div className="space-y-2 px-4 pb-4">
              {serviceCapacity.slice(0, 4).map(({ service, filled, left }) => {
                const pct = service.internsNeeded ? Math.round((filled / service.internsNeeded) * 100) : 0;
                return (
                  <Link
                    key={service.id}
                    to="/entreprise/services"
                    className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-accent/50 hover:bg-muted/40"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-[11px] font-semibold text-primary">
                      {initialsOf(service.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Places pourvues : {filled}/{service.internsNeeded}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                        left > 0 ? "bg-warning-soft text-warning" : "bg-success-soft text-success-ink"
                      )}
                    >
                      {left > 0 ? `${left} libre${left > 1 ? "s" : ""}` : `${pct}%`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Reveal>

          {/* Prochains entretiens : agenda */}
          <Reveal delay={180} className="card-surface p-5 xl:flex-1">
            <SectionHeader title="Prochains entretiens" to="/entreprise/entretiens" />
            {upcomingInterviews.length === 0 ? (
              <EmptyNote icon={CalendarClock} title="Aucun entretien programmé" desc="Les prochains entretiens apparaîtront ici." className="mt-4 rounded-lg border border-dashed" />
            ) : (
              <ul className="mt-4 space-y-2">
                {upcomingInterviews.slice(0, 3).map((interview, index) => {
                  const date = new Date(`${interview.date}T00:00:00`);
                  const first = index === 0;
                  return (
                    <li key={interview.id}>
                      <Link
                        to="/entreprise/entretiens"
                        className={cn(
                          "group flex items-center gap-3 rounded-xl p-2.5 transition-colors duration-150",
                          first ? "bg-primary-soft/70 hover:bg-primary-soft" : "hover:bg-muted/60"
                        )}
                      >
                      <span
                        className={cn(
                          "flex w-11 shrink-0 flex-col items-center rounded-lg py-1.5 leading-none",
                          first ? "bg-primary text-primary-foreground" : "border bg-card"
                        )}
                      >
                        <span className={cn("text-[11px] font-medium uppercase", first ? "text-white/70" : "text-muted-foreground")}>
                          {date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}
                        </span>
                        <span className="mt-0.5 text-base font-semibold tabular-nums">{date.getDate()}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">{candidateName(interview.candidateId)}</p>
                        <p className="truncate text-xs text-muted-foreground">{candidateOffer(interview.candidateId)}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-card px-1.5 py-0.5 text-xs font-medium tabular-nums ring-1 ring-border">
                        {interview.time}
                      </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>

        </aside>

        {/* Ligne 2 : offres et activité, alignées en haut, chacune à sa hauteur naturelle */}
        <div className="min-w-0 self-start">
          {/* Offres publiées : tableau */}
          <Reveal as="section" delay={200} className="card-surface overflow-hidden">
            <div className="px-5 pb-4 pt-5">
              <SectionHeader title="Offres publiées" count={activeOffers.length} to="/entreprise/offres" linkLabel="Gérer les offres" />
            </div>
            {activeOffers.length === 0 ? (
              <div className="flex flex-col items-center border-t p-8 text-center">
                <Briefcase className="size-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Aucune offre publiée</p>
                <p className="text-xs text-muted-foreground">Publiez une offre pour commencer à recevoir des candidatures.</p>
              </div>
            ) : (
              <ul className="divide-y border-t">
                <li className="hidden grid-cols-[minmax(0,2fr)_60px_76px_minmax(0,1.2fr)_52px] gap-4 bg-muted/40 px-5 py-2.5 text-xs font-medium text-muted-foreground md:grid">
                  <span>Offre</span>
                  <span>Reçues</span>
                  <span>À examiner</span>
                  <span>Examinées</span>
                  <span className="text-right">Clôture</span>
                </li>
                {activeOffers.map((offer, index) => {
                  const pipeline = candidates.filter((c) => c.offerId === offer.id && c.status !== "retiree");
                  const waiting = pipeline.filter((c) => c.status === "en_attente" || c.status === "examen").length;
                  const examined = pipeline.length - pipeline.filter((c) => c.status === "en_attente").length;
                  const pct = pipeline.length ? Math.round((examined / pipeline.length) * 100) : 0;
                  const daysLeft = Math.ceil((new Date(`${offer.deadline}T23:59:59`).getTime() - now) / DAY);
                  const urgent = daysLeft >= 0 && daysLeft <= 7;
                  return (
                    <li key={offer.id}>
                      <Link
                        to="/entreprise/offres"
                        className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-5 py-3.5 transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,2fr)_60px_76px_minmax(0,1.2fr)_52px]"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="grid size-5 shrink-0 place-items-center text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
                            <Briefcase className="size-[18px]" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium group-hover:text-primary">{offer.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">{offer.department}</span>
                          </span>
                        </span>
                        {/* Téléphone : clôture à droite du titre */}
                        <span className={cn("text-xs tabular-nums md:hidden", urgent ? "font-medium text-destructive-ink" : "text-muted-foreground")}>
                          {daysLeft < 0 ? "Échue" : `J-${daysLeft}`}
                        </span>
                        <span className="hidden text-sm tabular-nums md:block">{pipeline.length}</span>
                        <span className={cn("hidden text-sm tabular-nums md:block", waiting > 0 && "font-medium text-warning")}>
                          {waiting}
                        </span>
                        <span className="col-span-2 flex items-center gap-2.5 md:col-span-1">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <span
                              className="animate-grow-x block h-full rounded-full bg-primary"
                              style={{ width: `${pct}%`, ["--delay" as string]: `${320 + index * 80}ms` }}
                            />
                          </span>
                          <span className="w-10 text-right text-xs font-medium tabular-nums">{pct} %</span>
                        </span>
                        <span className={cn("hidden text-right text-sm tabular-nums md:block", urgent ? "font-medium text-destructive-ink" : "text-muted-foreground")}>
                          {daysLeft < 0 ? "Échue" : `J-${daysLeft}`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>

        </div>
        <div className="min-w-0 self-start">
          {/* Activité récente : colonne d'événements alignée, avatar, nom et offre, date courte */}
          <Reveal delay={240} className="card-surface p-5">
            <SectionHeader title="Activité récente" to="/entreprise/candidatures" />
            {activity.length === 0 ? (
              <EmptyNote
                icon={Inbox}
                title="Aucune activité pour le moment"
                desc="Les nouvelles candidatures apparaîtront ici."
                className="mt-4 rounded-lg border border-dashed"
              />
            ) : (
              <ul className="mt-3 divide-y">
                {activity.map((item) => (
                  <li key={item.id}>
                    <Link
                      to="/entreprise/candidatures"
                      search={{ q: item.name }}
                      aria-label={`${item.name} — ${item.long}, ${relativeDay(item.date)}, ${item.offer}`}
                      className="group -mx-2 grid grid-cols-[6.5rem_28px_minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-offset-0"
                    >
                      {/* 1. L'événement, dans une colonne alignée */}
                      <Badge label={item.short} tone={item.tone} className="justify-self-start whitespace-nowrap px-1.5 py-0 text-[11px]" />
                      {/* 2. L'avatar */}
                      <AvatarInitials initials={item.initials} className="size-7 text-[11px]" />
                      {/* 3. Qui, pour quelle offre */}
                      <span className="min-w-0" aria-hidden="true">
                        <span className="block truncate text-[13px] font-medium leading-5 transition-colors group-hover:text-primary">
                          {item.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{item.offer}</span>
                      </span>
                      {/* 4. Quand */}
                      <time
                        dateTime={item.date}
                        title={relativeDay(item.date)}
                        className="whitespace-nowrap text-right text-xs tabular-nums text-muted-foreground"
                      >
                        {shortDay(item.date)}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        </div>

        {/* Ligne 3 : dossiers stagiaires, sur toute la largeur */}
        <div className="min-w-0 xl:col-span-2">
          {/* Dossiers stagiaires */}
          <Reveal as="section" delay={260} className="card-surface overflow-hidden">
            <div className="px-5 pb-4 pt-5">
              <SectionHeader title="Dossiers stagiaires" count={interns.length} to="/entreprise/stagiaires" />
            </div>
            {interns.length === 0 ? (
              <EmptyNote icon={Users} title="Aucun dossier stagiaire" desc="Les stagiaires recrutés apparaîtront ici." className="border-t" />
            ) : (
              <>
                <table className="hidden w-full table-fixed text-sm md:table">
                  <thead>
                    <tr className="border-y bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="w-[40%] px-5 py-2.5 font-medium">Stagiaire</th>
                      <th className="w-[22%] px-3 py-2.5 font-medium">Service</th>
                      <th className="w-[18%] px-3 py-2.5 font-medium">Période</th>
                      <th className="px-5 py-2.5 font-medium">Prochaine étape</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {interns.slice(0, 5).map((intern) => {
                      const step = nextStep(intern.id);
                      return (
                        <tr key={intern.id} className="group relative transition-colors hover:bg-muted/40">
                          <td className="px-5 py-3">
                            <Link to="/entreprise/stagiaires/$internId" params={{ internId: intern.id }} className="flex items-center gap-3 after:absolute after:inset-0">
                              <AvatarInitials initials={intern.initials} className="size-8 text-xs" />
                              <span className="min-w-0">
                                <span className="block truncate font-medium group-hover:text-primary">{intern.name}</span>
                                <span className="block truncate text-xs text-muted-foreground">{offerTitle(intern.offerId)}</span>
                              </span>
                            </Link>
                          </td>
                          <td className="truncate px-3 py-3 text-muted-foreground">{intern.service || "—"}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                            {intern.start ? `${fmtDate(intern.start, false)} → ${fmtDate(intern.end, false)}` : "À définir"}
                          </td>
                          <td className="px-5 py-3">
                            <Badge label={step.label} tone={step.tone} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <ul className="divide-y border-t md:hidden">
                  {interns.slice(0, 5).map((intern) => {
                    const step = nextStep(intern.id);
                    return (
                      <li key={intern.id}>
                        <Link to="/entreprise/stagiaires/$internId" params={{ internId: intern.id }} className="flex items-center gap-3 px-5 py-3">
                          <AvatarInitials initials={intern.initials} className="size-8 text-xs" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{intern.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{intern.service || "Service à définir"}</p>
                          </div>
                          <Badge label={step.label} tone={step.tone} className="shrink-0" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Reveal>
        </div>
      </div>
    </div>
  );
}
