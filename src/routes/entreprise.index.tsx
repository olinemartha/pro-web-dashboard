import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  Check,
  CheckCircle2,
  FileText,
  Inbox,
  Layers,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  UserSearch,
} from "lucide-react";
import { AvatarInitials, Badge, KpiCard, type Tone } from "@/components/company/ui";
import { AnimatedNumber, Reveal } from "@/components/ui/motion";
import { useCompanyStore } from "@/lib/company-store";
import { latestRunFor } from "@/lib/expert-engine";
import { cn } from "@/lib/utils";
import { offerStatusLabels } from "@/lib/company-data";

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
  count,
  to,
  linkLabel = "Tout voir",
}: {
  title: string;
  count?: number;
  to?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
        {title}
        {count !== undefined && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </h2>
      {to && (
        <Link
          to={to}
          className="group inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          {linkLabel}
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* File « À traiter »                                                  */
/* ------------------------------------------------------------------ */

type TodoKind = "candidature" | "affectation" | "rapport" | "entretien" | "service";

type Todo = {
  kind: TodoKind;
  id: string;
  label: string;
  meta: string;
  urgency: number;
  q?: string;
  internId?: string;
};

const TODO_META: Record<TodoKind, { action: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  affectation: { action: "Valider", icon: Sparkles, tone: "bg-warning-soft text-warning" },
  candidature: { action: "Examiner", icon: Inbox, tone: "bg-accent-soft text-primary" },
  rapport: { action: "Examiner", icon: FileText, tone: "bg-primary-soft text-primary" },
  entretien: { action: "Préparer", icon: CalendarClock, tone: "bg-success-soft text-success-ink" },
  service: { action: "Mettre à jour", icon: Layers, tone: "bg-muted text-muted-foreground" },
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
/* Tableau de bord                                                     */
/* ------------------------------------------------------------------ */

function CompanyDashboard() {
  const { offers, candidates, interns, interviews, services, expertRuns } = useCompanyStore();

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

  // Candidatures reçues par semaine (6 dernières semaines) : une vraie série.
  const weeklyBars = Array.from({ length: 6 }, (_, index) => {
    const end = now - (5 - index) * 7 * DAY;
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
  const placesNeeded = serviceCapacity.reduce((sum, entry) => sum + entry.service.internsNeeded, 0);
  const placesFilled = serviceCapacity.reduce((sum, entry) => sum + Math.min(entry.filled, entry.service.internsNeeded), 0);

  /* ---- File À traiter ---- */
  const todos: Todo[] = [];

  pendingAssignments.forEach((intern) =>
    todos.push({
      kind: "affectation",
      id: `affectation-${intern.id}`,
      label: `Valider l'affectation de ${intern.name}`,
      meta: offerTitle(intern.offerId),
      internId: intern.id,
      urgency: 0,
    })
  );
  toExamine.forEach((candidate) =>
    todos.push({
      kind: "candidature",
      id: `candidature-${candidate.id}`,
      label: `Examiner la candidature de ${candidate.name}`,
      meta: `${offerTitle(candidate.offerId)} · ${fmtDate(candidate.appliedAt)}`,
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
  const queue = todos.sort((a, b) => a.urgency - b.urgency).slice(0, 6);

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

  /* ---- Recommandation mise en avant ---- */
  const focusIntern = pendingAssignments[0];
  const focusRun = focusIntern ? latestRunFor(expertRuns, focusIntern.id) : undefined;
  const focusProposal = focusRun?.proposals[0];
  const focusCriteria = focusProposal?.satisfied.filter((criterion) => criterion.satisfied) ?? [];

  return (
    <div className="space-y-6">
      {/* Indicateurs : une seule ligne compacte */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard
          label="Offres actives"
          value={activeOffers.length}
          hint={`sur ${offers.length} offre${offers.length > 1 ? "s" : ""} créée${offers.length > 1 ? "s" : ""}`}
          icon={Briefcase}
          tone="primary"
          delay={0}
        />
        <KpiCard
          label="Candidatures reçues"
          value={candidates.length}
          hint="toutes offres confondues"
          icon={Send}
          tone="accent"
          chip={last30 > 0 ? { label: `+${last30} en 30 jours`, tone: "success", icon: TrendingUp } : undefined}
          bars={weeklyBars}
          delay={60}
        />
        <KpiCard
          label="À examiner"
          value={toExamine.length}
          hint={toExamine.length ? "en attente de votre décision" : "aucune en attente"}
          icon={UserSearch}
          tone={toExamine.length ? "warning" : "success"}
          delay={120}
        />
        <KpiCard
          label="Stagiaires accueillis"
          value={interns.length}
          hint={`${confirmedInterns.length} affectation${confirmedInterns.length > 1 ? "s" : ""} confirmée${confirmedInterns.length > 1 ? "s" : ""}`}
          icon={Users}
          tone="success"
          delay={180}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ============================ Colonne principale ============================ */}
        <div className="min-w-0 space-y-6">
          {/* À traiter */}
          <Reveal as="section" delay={200} className="card-surface">
            <div className="px-5 pb-3 pt-5">
              <SectionHeader title="À traiter" count={todos.length} />
            </div>
            {queue.length === 0 ? (
              <div className="mx-5 mb-5 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <CheckCircle2 className="size-6 text-success" />
                <p className="mt-2 text-sm font-medium">Tout est à jour</p>
                <p className="text-xs text-muted-foreground">Aucune décision ne vous attend pour le moment.</p>
              </div>
            ) : (
              <ul className="divide-y border-t">
                {queue.map((todo, index) => {
                  const meta = TODO_META[todo.kind];
                  return (
                    <Reveal as="li" key={todo.id} delay={240 + index * 50}>
                      <TodoTarget
                        todo={todo}
                        className="group flex items-center gap-3.5 px-5 py-3 transition-colors duration-150 hover:bg-muted/50"
                      >
                        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", meta.tone)}>
                          <meta.icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{todo.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">{todo.meta}</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors group-hover:text-primary">
                          <span className="hidden sm:inline">{meta.action}</span>
                          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </span>
                      </TodoTarget>
                    </Reveal>
                  );
                })}
              </ul>
            )}
            {todos.length > queue.length && (
              <p className="border-t px-5 py-2.5 text-xs text-muted-foreground">
                + {todos.length - queue.length} autre{todos.length - queue.length > 1 ? "s" : ""} action
                {todos.length - queue.length > 1 ? "s" : ""} moins urgente{todos.length - queue.length > 1 ? "s" : ""}
              </p>
            )}
          </Reveal>

          {/* Offres publiées */}
          <section className="space-y-3">
            <Reveal delay={260}>
              <SectionHeader title="Offres publiées" count={activeOffers.length} to="/entreprise/offres" linkLabel="Gérer les offres" />
            </Reveal>
            {activeOffers.length === 0 ? (
              <div className="card-surface flex flex-col items-center p-8 text-center">
                <Briefcase className="size-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Aucune offre publiée</p>
                <p className="text-xs text-muted-foreground">Publiez une offre pour commencer à recevoir des candidatures.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeOffers.slice(0, 4).map((offer, index) => {
                  const pipeline = candidates.filter((c) => c.offerId === offer.id && c.status !== "retiree");
                  const waiting = pipeline.filter((c) => c.status === "en_attente" || c.status === "examen").length;
                  const examined = pipeline.length - pipeline.filter((c) => c.status === "en_attente").length;
                  const pct = pipeline.length ? Math.round((examined / pipeline.length) * 100) : 0;
                  const daysLeft = Math.ceil((new Date(`${offer.deadline}T23:59:59`).getTime() - now) / DAY);
                  return (
                    <Reveal key={offer.id} delay={300 + index * 60} className="min-w-0">
                      <Link to="/entreprise/offres" className="card-surface hover-lift block p-5">
                        <div className="flex items-start gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                            {initialsOf(offer.department)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{offer.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {offer.department} · publiée le {fmtDate(offer.published, false)}
                            </p>
                          </div>
                          <Badge label={offerStatusLabels[offer.status].label} tone={offerStatusLabels[offer.status].tone} />
                        </div>

                        <dl className="mt-5 grid grid-cols-3 gap-2">
                          <div>
                            <dt className="text-xs text-muted-foreground">Candidatures</dt>
                            <dd className="mt-0.5 text-lg font-semibold tabular-nums">{pipeline.length}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">À examiner</dt>
                            <dd className={cn("mt-0.5 text-lg font-semibold tabular-nums", waiting > 0 && "text-warning")}>
                              {waiting}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Clôture</dt>
                            <dd
                              className={cn(
                                "mt-0.5 text-lg font-semibold tabular-nums",
                                daysLeft >= 0 && daysLeft <= 7 && "text-destructive-ink"
                              )}
                            >
                              {daysLeft < 0 ? "Échue" : `J-${daysLeft}`}
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-4">
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Candidatures examinées</span>
                            <span className="font-medium tabular-nums">
                              <AnimatedNumber value={pct} suffix=" %" />
                            </span>
                          </div>
                          <div
                            className="h-1.5 overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Candidatures examinées"
                          >
                            <div
                              className="animate-grow-x h-full rounded-full bg-primary"
                              style={{ width: `${pct}%`, ["--delay" as string]: `${420 + index * 80}ms` }}
                            />
                          </div>
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </section>

          {/* Dossiers stagiaires */}
          <Reveal as="section" delay={340} className="card-surface overflow-hidden">
            <div className="px-5 pb-3 pt-5">
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
                        <Link
                          to="/entreprise/stagiaires/$internId"
                          params={{ internId: intern.id }}
                          className="flex items-center gap-3 px-5 py-3"
                        >
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

        {/* ============================ Colonne latérale ============================ */}
        <aside className="space-y-6">
          {/* Système expert : le moment focal */}
          <Reveal delay={220} className="relative overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-sm">
            <div className="absolute -right-12 -top-12 size-40 rounded-full bg-accent/15" aria-hidden />
            <div className="absolute -bottom-16 -right-4 size-32 rounded-full border-[14px] border-accent/10" aria-hidden />
            <div className="relative p-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                  <Sparkles className="size-3.5" /> Système expert
                </span>
                {pendingAssignments.length > 0 && (
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
                    {pendingAssignments.length} en attente
                  </span>
                )}
              </div>

              {focusIntern ? (
                <>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-semibold">
                      {focusIntern.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{focusIntern.name}</p>
                      <p className="truncate text-xs text-white/60">{offerTitle(focusIntern.offerId)}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-white/[0.07] p-3.5 ring-1 ring-inset ring-white/10">
                    {focusProposal ? (
                      <>
                        <p className="text-[11px] uppercase tracking-[0.08em] text-white/50">Service recommandé</p>
                        <p className="mt-0.5 text-lg font-semibold">{focusProposal.serviceName}</p>
                        {focusCriteria.length > 0 && (
                          <ul className="mt-2.5 space-y-1.5">
                            {focusCriteria.slice(0, 3).map((criterion) => (
                              <li key={criterion.ruleId + criterion.label} className="flex items-start gap-2 text-xs text-white/80">
                                <Check className="mt-0.5 size-3.5 shrink-0 text-accent" />
                                <span>{criterion.label}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Analyse non lancée</p>
                        <p className="mt-0.5 text-xs text-white/60">
                          Lancez l'analyse pour obtenir une recommandation expliquée.
                        </p>
                      </>
                    )}
                  </div>

                  <Link
                    to="/entreprise/stagiaires/$internId"
                    params={{ internId: focusIntern.id }}
                    className="press mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-white text-sm font-semibold text-primary transition-colors hover:bg-accent-soft"
                  >
                    {focusProposal ? "Examiner la recommandation" : "Ouvrir le dossier"}
                    <ArrowRight className="size-4" />
                  </Link>
                  <p className="mt-2.5 text-center text-[11px] text-white/50">
                    Le système recommande, vous décidez.
                  </p>
                </>
              ) : (
                <div className="mt-4">
                  <p className="text-lg font-semibold">Aucune affectation en attente</p>
                  <p className="mt-1 text-sm text-white/60">
                    Les recommandations apparaîtront ici dès qu'un candidat sera retenu.
                  </p>
                </div>
              )}
            </div>
          </Reveal>

          {/* Capacité des services */}
          <Reveal delay={280} className="card-surface p-5">
            <SectionHeader title="Capacité des services" to="/entreprise/services" linkLabel="Gérer" />
            <div className="mt-4 flex items-end justify-between">
              <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">
                <AnimatedNumber value={placesFilled} />
                <span className="text-base font-medium text-muted-foreground">/{placesNeeded}</span>
              </p>
              <p className="text-xs text-muted-foreground">places pourvues</p>
            </div>
            <ul className="mt-4 space-y-3.5">
              {serviceCapacity.map(({ service, filled, left }, index) => {
                const pct = service.internsNeeded ? Math.min(100, Math.round((filled / service.internsNeeded) * 100)) : 0;
                return (
                  <li key={service.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
                      <span className="truncate font-medium">{service.name}</span>
                      <span className={cn("shrink-0 text-xs tabular-nums", left > 0 ? "text-warning" : "text-success-ink")}>
                        {left > 0 ? `${left} libre${left > 1 ? "s" : ""}` : "Complet"}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("animate-grow-x h-full rounded-full", left > 0 ? "bg-accent" : "bg-success")}
                        style={{ width: `${Math.max(pct, 2)}%`, ["--delay" as string]: `${400 + index * 80}ms` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          {/* Prochains entretiens */}
          <Reveal delay={340} className="card-surface p-5">
            <SectionHeader title="Prochains entretiens" to="/entreprise/entretiens" />
            {upcomingInterviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Aucun entretien programmé.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {upcomingInterviews.slice(0, 3).map((interview) => {
                  const date = new Date(`${interview.date}T00:00:00`);
                  return (
                    <li key={interview.id} className="flex items-center gap-3">
                      <span className="flex w-11 shrink-0 flex-col items-center rounded-lg border py-1.5 leading-none">
                        <span className="text-[10px] font-medium uppercase text-muted-foreground">
                          {date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}
                        </span>
                        <span className="mt-0.5 text-base font-semibold tabular-nums">{date.getDate()}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{candidateName(interview.candidateId)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {interview.time} · {candidateOffer(interview.candidateId)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
