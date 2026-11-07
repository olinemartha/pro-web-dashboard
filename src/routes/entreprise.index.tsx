import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  Layers,
  MapPin,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  UserSearch,
} from "lucide-react";
import { AvatarInitials, Badge, type Tone } from "@/components/company/ui";
import { CompanyLogoUploader } from "@/components/company/company-logo";
import { AnimatedNumber, Reveal } from "@/components/ui/motion";
import { useCompanyStore } from "@/lib/company-store";
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
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;
  if (days < 30) return `il y a ${Math.round(days / 7)} sem.`;
  return fmtDate(value, false);
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
          className="press group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-card px-3 text-[13px] font-medium text-foreground shadow-sm transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-background hover:shadow-md"
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
      {last && <circle cx={last[0]} cy={last[1]} r="2.75" fill="hsl(var(--primary))" stroke="#fff" strokeWidth="1.5" />}
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
  label: string;
  meta: string;
  urgency: number;
  q?: string;
  internId?: string;
};

const TODO_META: Record<
  TodoKind,
  { action: string; icon: React.ComponentType<{ className?: string }>; tab: string }
> = {
  affectation: { action: "Valider", icon: Sparkles, tab: "Affectations" },
  candidature: { action: "Examiner", icon: Inbox, tab: "Candidatures" },
  rapport: { action: "Examiner", icon: FileText, tab: "Rapports" },
  entretien: { action: "Préparer", icon: CalendarClock, tab: "Entretiens" },
  service: { action: "Mettre à jour", icon: Layers, tab: "Services" },
};

function TodoTarget({ todo, className, children }: { todo: Todo; className: string; children: React.ReactNode }) {
  switch (todo.kind) {
    case "candidature":
      return (
        <Link to="/entreprise/candidatures" search={{ q: todo.q }} className={className}>
          {children}
        </Link>
      );
    case "affectation":
    case "rapport":
      return (
        <Link to="/entreprise/stagiaires/$internId" params={{ internId: todo.internId! }} className={className}>
          {children}
        </Link>
      );
    case "entretien":
      return (
        <Link to="/entreprise/entretiens" className={className}>
          {children}
        </Link>
      );
    default:
      return (
        <Link to="/entreprise/services" className={className}>
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
  acceptanceRate: number;
}) {
  const [hover, setHover] = useState<CandidateStatus | null>(null);
  const size = 168;
  const stroke = 22;
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
    <div className="mt-5 grid items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
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
              className="donut-arc cursor-pointer transition-[stroke-width,opacity] duration-200"
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
            <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">
              {active ? active.count : <AnimatedNumber value={total} />}
            </p>
            <p className="mt-1 max-w-[96px] text-[11px] leading-tight text-muted-foreground">
              {active ? candidateStatusLabels[active.status].label : "candidatures"}
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
                "grid cursor-default grid-cols-[minmax(0,130px)_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-1.5 transition-all duration-200",
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
              <span className="w-16 text-right text-[13px] tabular-nums">
                <span className="font-semibold">{step.count}</span>
                <span className="ml-1 text-xs text-muted-foreground">{pct} %</span>
              </span>
            </div>
          );
        })}
        <div className="mt-3 flex items-center justify-between border-t px-2 pt-3">
          <span className="text-[13px] text-muted-foreground">Taux d'acceptation (décisions prises)</span>
          <span className="text-[15px] font-semibold tabular-nums">
            <AnimatedNumber value={acceptanceRate} suffix=" %" />
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
  const { profile, offers, candidates, interns, interviews, services } = useCompanyStore();
  const [tab, setTab] = useState<TodoKind | "tout">("tout");

  const now = Date.now();
  const todayIso = new Date().toISOString().split("T")[0];
  const horizonIso = new Date(now + 14 * DAY).toISOString().split("T")[0];

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
  const acceptanceRate = decided ? Math.round((acceptedCount / decided) * 100) : 0;

  /* ---- File À traiter ---- */
  const todos: Todo[] = [];
  pendingAssignments.forEach((intern) =>
    todos.push({
      kind: "affectation",
      id: `affectation-${intern.id}`,
      label: `Valider l'affectation de ${intern.name}`,
      meta: `${offerTitle(intern.offerId)} · recommandation du système expert`,
      internId: intern.id,
      urgency: 0,
    })
  );
  toExamine.forEach((candidate) =>
    todos.push({
      kind: "candidature",
      id: `candidature-${candidate.id}`,
      label: `Examiner la candidature de ${candidate.name}`,
      meta: `${offerTitle(candidate.offerId)} · reçue ${relativeDay(candidate.appliedAt)}`,
      q: candidate.name,
      urgency: 1,
    })
  );
  interns.forEach((intern) => {
    const pending = intern.reports.filter((report) => report.status === "soumis");
    if (pending.length > 0) {
      todos.push({
        kind: "rapport",
        id: `rapport-${intern.id}`,
        label: `Examiner le rapport de ${intern.name}`,
        meta: `${pending[0].period} · déposé le ${fmtDate(pending[0].date)}`,
        internId: intern.id,
        urgency: 2,
      });
    }
  });
  upcomingInterviews
    .filter((interview) => interview.date >= todayIso && interview.date <= horizonIso)
    .forEach((interview) =>
      todos.push({
        kind: "entretien",
        id: `entretien-${interview.id}`,
        label: `Préparer l'entretien de ${candidateName(interview.candidateId)}`,
        meta: `${fmtDate(interview.date)} à ${interview.time} · ${interview.location}`,
        urgency: 3,
      })
    );
  serviceCapacity.forEach(({ service }) => {
    const staleDays = Math.floor((now - new Date(`${service.updatedAt}T00:00:00`).getTime()) / DAY);
    const incomplete = !service.education.trim() || service.skills.length === 0 || !service.profiles.trim();
    if (incomplete || staleDays > 30) {
      todos.push({
        kind: "service",
        id: `service-${service.id}`,
        label: `Mettre à jour les besoins — ${service.name}`,
        meta: incomplete ? "Besoins incomplets" : `Dernière mise à jour il y a ${staleDays} jours`,
        urgency: 4,
      });
    }
  });
  todos.sort((a, b) => a.urgency - b.urgency);

  const tabs = (["tout", "affectation", "candidature", "rapport", "entretien", "service"] as const)
    .map((key) => ({
      key,
      label: key === "tout" ? "Tout" : TODO_META[key].tab,
      count: key === "tout" ? todos.length : todos.filter((t) => t.kind === key).length,
    }))
    .filter((entry) => entry.key === "tout" || entry.count > 0);
  const filtered = tab === "tout" ? todos : todos.filter((t) => t.kind === tab);
  const visibleTodos = filtered.slice(0, 6);
  const hiddenCount = filtered.length - visibleTodos.length;

  /* ---- Activité récente (historique des candidatures) ---- */
  const activity = candidates
    .flatMap((candidate) =>
      candidate.history.map((entry) => ({
        id: `${candidate.id}-${entry.status}-${entry.date}`,
        name: candidate.name,
        initials: candidate.initials,
        status: entry.status,
        date: entry.date,
        offer: offerTitle(candidate.offerId),
      }))
    )
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-muted-foreground">{stat.label}</span>
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
                <span className="truncate">{stat.foot}</span>
              </p>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Ligne 1 : vue d'ensemble et actions | entreprise et agenda */}
        <div className="min-w-0 space-y-6">
          {/* Pipeline de recrutement */}
          <Reveal as="section" delay={80} className="card-surface p-5">
            <SectionHeader
              title="Pipeline de recrutement"
              description={`${inPipeline.length} candidature${inPipeline.length > 1 ? "s" : ""} en cours, toutes offres confondues`}
              to="/entreprise/candidatures"
            />
            <PipelineChart steps={pipelineCounts} total={inPipeline.length} acceptanceRate={acceptanceRate} />
          </Reveal>

          {/* À traiter, avec onglets filtrants */}
          <Reveal as="section" delay={140} className="card-surface overflow-hidden">
            <div className="space-y-4 px-5 pt-5">
              <SectionHeader title="À traiter" description="Les décisions qui vous attendent, de la plus urgente à la moins urgente." />
              <div role="tablist" aria-label="Filtrer les actions" className="flex flex-wrap gap-1.5">
                {tabs.map((entry) => {
                  const active = tab === entry.key;
                  return (
                    <button
                      key={entry.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(entry.key)}
                      className={cn(
                        "press inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors duration-200",
                        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {entry.label}
                      <span
                        className={cn(
                          "rounded px-1 text-[11px] tabular-nums",
                          active ? "bg-white/15 text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {entry.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {visibleTodos.length === 0 ? (
              <div className="m-5 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <CheckCircle2 className="size-6 text-success" />
                <p className="mt-2 text-sm font-medium">Tout est à jour</p>
                <p className="text-xs text-muted-foreground">Aucune décision ne vous attend pour le moment.</p>
              </div>
            ) : (
              <ul key={tab} className="mt-4 divide-y border-t">
                {visibleTodos.map((todo, index) => {
                  const meta = TODO_META[todo.kind];
                  return (
                    <Reveal as="li" key={todo.id} delay={index * 40}>
                      <TodoTarget
                        todo={todo}
                        className="group flex items-center gap-3.5 px-5 py-3 transition-colors duration-150 hover:bg-muted/50"
                      >
                        <span className="grid size-5 shrink-0 place-items-center text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
                          <meta.icon className="size-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{todo.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">{todo.meta}</span>
                        </span>
                        <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border bg-card px-2.5 text-[13px] font-medium text-foreground shadow-sm transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                          <span className="hidden sm:inline">{meta.action}</span>
                          <ArrowRight className="size-3.5" />
                        </span>
                      </TodoTarget>
                    </Reveal>
                  );
                })}
              </ul>
            )}
            {hiddenCount > 0 && (
              <p className="border-t bg-muted/30 px-5 py-2.5 text-xs text-muted-foreground">
                + {hiddenCount} autre{hiddenCount > 1 ? "s" : ""} action{hiddenCount > 1 ? "s" : ""} dans cette catégorie
              </p>
            )}
          </Reveal>

        </div>
        <aside className="space-y-6">
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
          <Reveal delay={180} className="card-surface p-5">
            <SectionHeader title="Prochains entretiens" to="/entreprise/entretiens" />
            {upcomingInterviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Aucun entretien programmé.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {upcomingInterviews.slice(0, 3).map((interview, index) => {
                  const date = new Date(`${interview.date}T00:00:00`);
                  const first = index === 0;
                  return (
                    <li
                      key={interview.id}
                      className={cn("flex items-center gap-3 rounded-xl p-2.5", first ? "bg-primary-soft/70" : "hover:bg-muted/50")}
                    >
                      <span
                        className={cn(
                          "flex w-11 shrink-0 flex-col items-center rounded-lg py-1.5 leading-none",
                          first ? "bg-primary text-primary-foreground" : "border bg-card"
                        )}
                      >
                        <span className={cn("text-[10px] font-medium uppercase", first ? "text-white/70" : "text-muted-foreground")}>
                          {date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}
                        </span>
                        <span className="mt-0.5 text-base font-semibold tabular-nums">{date.getDate()}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{candidateName(interview.candidateId)}</p>
                        <p className="truncate text-xs text-muted-foreground">{candidateOffer(interview.candidateId)}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-card px-1.5 py-0.5 text-xs font-medium tabular-nums ring-1 ring-border">
                        {interview.time}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>

        </aside>

        {/* Ligne 2 : offres et activité, alignées en haut et de même hauteur */}
        <div className="min-w-0">
          {/* Offres publiées : tableau */}
          <Reveal as="section" delay={200} className="card-surface h-full overflow-hidden">
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
                <li className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,0.6fr)] gap-4 bg-muted/40 px-5 py-2.5 text-xs font-medium text-muted-foreground md:grid">
                  <span>Offre</span>
                  <span>Candidatures</span>
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
                        className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-5 py-3.5 transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,0.6fr)]"
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
        <div className="min-w-0">
          {/* Activité récente : fil chronologique */}
          <Reveal delay={240} className="card-surface h-full p-5">
            <SectionHeader title="Activité récente" to="/entreprise/candidatures" />
            {activity.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Aucune activité pour le moment.</p>
            ) : (
              <ol className="relative mt-4 space-y-4 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-border">
                {activity.map((item) => (
                  <li key={item.id} className="relative flex gap-3">
                    <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-card text-[10px] font-semibold text-primary ring-1 ring-border">
                      {item.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] leading-snug">
                        <span className="font-medium">{item.name}</span>
                        <Badge
                          label={candidateStatusLabels[item.status].label}
                          tone={candidateStatusLabels[item.status].tone}
                          className="px-1.5 py-0 text-[10px]"
                        />
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.offer} · {relativeDay(item.date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Reveal>
        </div>

        {/* Ligne 3 : dossiers stagiaires */}
        <div className="min-w-0">
          {/* Dossiers stagiaires */}
          <Reveal as="section" delay={260} className="card-surface overflow-hidden">
            <div className="px-5 pb-4 pt-5">
              <SectionHeader title="Dossiers stagiaires" count={interns.length} to="/entreprise/stagiaires" />
            </div>
            {interns.length === 0 ? (
              <p className="border-t px-5 py-6 text-sm text-muted-foreground">Aucun dossier stagiaire pour le moment.</p>
            ) : (
              <>
                <table className="hidden w-full text-sm md:table">
                  <thead>
                    <tr className="border-y bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-5 py-2.5 font-medium">Stagiaire</th>
                      <th className="px-3 py-2.5 font-medium">Service</th>
                      <th className="px-3 py-2.5 font-medium">Période</th>
                      <th className="px-5 py-2.5 font-medium">Prochaine étape</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {interns.slice(0, 5).map((intern) => {
                      const step = nextStep(intern.id);
                      return (
                        <tr key={intern.id} className="group transition-colors hover:bg-muted/40">
                          <td className="px-5 py-3">
                            <Link to="/entreprise/stagiaires/$internId" params={{ internId: intern.id }} className="flex items-center gap-3">
                              <AvatarInitials initials={intern.initials} className="size-8 text-xs" />
                              <span className="min-w-0">
                                <span className="block truncate font-medium group-hover:text-primary">{intern.name}</span>
                                <span className="block truncate text-xs text-muted-foreground">{offerTitle(intern.offerId)}</span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{intern.service || "—"}</td>
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
