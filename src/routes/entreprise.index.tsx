import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  CalendarDays,
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
import { AvatarInitials, Badge, KpiCard, type Tone } from "@/components/company/ui";
import { AnimatedNumber, Reveal } from "@/components/ui/motion";
import { useCompanyStore } from "@/lib/company-store";
import { cn } from "@/lib/utils";
import { offerStatusLabels, type OfferStatus } from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/")({
  head: () => ({
    meta: [{ title: "Tableau de bord — Espace entreprise" }],
  }),
  component: CompanyDashboard,
});

const oTone = (status: OfferStatus): Tone => offerStatusLabels[status].tone;

const DAY = 86_400_000;

function fmtDate(value: string, withYear = true) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
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

const TODO_META: Record<
  TodoKind,
  { tag: string; action: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  affectation: { tag: "Affectation", action: "Valider", icon: Sparkles, tone: "bg-warning-soft text-warning" },
  candidature: { tag: "Candidature", action: "Examiner", icon: Inbox, tone: "bg-accent-soft text-primary" },
  rapport: { tag: "Rapport", action: "Examiner", icon: FileText, tone: "bg-primary-soft text-primary" },
  entretien: { tag: "Entretien", action: "Préparer", icon: CalendarClock, tone: "bg-success-soft text-success-ink" },
  service: { tag: "Service", action: "Compléter", icon: Layers, tone: "bg-muted text-muted-foreground" },
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
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
        {title}
        {count !== undefined && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </h2>
      {to && (
        <Link
          to={to}
          className="group inline-flex items-center gap-1 text-sm font-medium text-primary/80 transition-colors hover:text-primary"
        >
          {linkLabel}
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tableau de bord                                                     */
/* ------------------------------------------------------------------ */

function CompanyDashboard() {
  const { profile, offers, candidates, interns, interviews, services } = useCompanyStore();

  const now = Date.now();
  const todayIso = new Date().toISOString().split("T")[0];
  const horizonIso = new Date(now + 14 * DAY).toISOString().split("T")[0];

  const activeOffers = offers.filter((offer) => offer.status === "publiee");
  const toExamine = candidates.filter((c) => c.status === "en_attente" || c.status === "examen");
  const accepted = candidates.filter((c) => c.status === "acceptee");
  const upcomingInterviews = interviews
    .filter((interview) => interview.status === "programme")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const pendingAssignments = interns.filter((intern) => !intern.confirmed);

  const offerTitle = (id: string) => offers.find((offer) => offer.id === id)?.title ?? "Offre supprimée";
  const candidateName = (id: string) => candidates.find((c) => c.id === id)?.name ?? "Candidat";
  const candidateOffer = (id: string) => {
    const candidate = candidates.find((c) => c.id === id);
    return candidate ? offerTitle(candidate.offerId) : "";
  };

  // Candidatures reçues par semaine (6 dernières semaines) — vraie série, pas un décor.
  const weeklyBars = Array.from({ length: 6 }, (_, index) => {
    const end = now - (5 - index) * 7 * DAY;
    const start = end - 7 * DAY;
    return candidates.filter((c) => {
      const t = new Date(`${c.appliedAt}T12:00:00`).getTime();
      return t > start && t <= end;
    }).length;
  });
  const last30 = candidates.filter(
    (c) => now - new Date(`${c.appliedAt}T12:00:00`).getTime() <= 30 * DAY
  ).length;

  const serviceCapacity = services.map((service) => {
    const filled = interns.filter(
      (intern) =>
        intern.confirmed &&
        (intern.serviceId ? intern.serviceId === service.id : intern.service === service.name)
    ).length;
    return { service, filled, left: Math.max(0, service.internsNeeded - filled) };
  });
  const placesLeft = serviceCapacity.reduce((sum, entry) => sum + entry.left, 0);

  /* ---- File À traiter ---- */
  const todos: Todo[] = [];

  pendingAssignments.forEach((intern) =>
    todos.push({
      kind: "affectation",
      id: `affectation-${intern.id}`,
      label: `Valider l'affectation de ${intern.name}`,
      meta: `${offerTitle(intern.offerId)} · recommandation à examiner`,
      internId: intern.id,
      urgency: 0,
    })
  );

  toExamine.forEach((candidate) =>
    todos.push({
      kind: "candidature",
      id: `candidature-${candidate.id}`,
      label: `Examiner la candidature de ${candidate.name}`,
      meta: `${offerTitle(candidate.offerId)} · déposée le ${fmtDate(candidate.appliedAt)}`,
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

  const queue = todos.sort((a, b) => a.urgency - b.urgency).slice(0, 5);

  const nextStep = (internId: string): { label: string; tone: Tone } => {
    const intern = interns.find((entry) => entry.id === internId);
    if (!intern) return { label: "Dossier introuvable", tone: "muted" };
    if (!intern.confirmed) return { label: "Affectation à valider", tone: "warning" };
    if (intern.reports.some((report) => report.status === "soumis"))
      return { label: "Rapport à examiner", tone: "primary" };
    if (!intern.evaluation) return { label: "Suivi en cours", tone: "accent" };
    if (intern.certificate === "non_generee") return { label: "Attestation à générer", tone: "warning" };
    if (intern.certificate === "generee") return { label: "Attestation à valider", tone: "warning" };
    return { label: "Dossier à jour", tone: "success" };
  };

  const hour = new Date().getHours();
  const greeting = hour < 18 ? "Bonjour" : "Bonsoir";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      {/* ============================ Colonne principale ============================ */}
      <div className="min-w-0 space-y-6">
        <Reveal className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-[26px]">
            {greeting}, {profile.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {todos.length > 0
              ? `${todos.length} action${todos.length > 1 ? "s" : ""} attend${todos.length > 1 ? "ent" : ""} votre décision aujourd'hui.`
              : "Tous vos dossiers sont à jour."}
          </p>
        </Reveal>

        {/* Indicateurs */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Offres actives"
            value={activeOffers.length}
            hint={`${offers.length} offre${offers.length > 1 ? "s" : ""} au total`}
            icon={Briefcase}
            tone="primary"
            delay={60}
          />
          <KpiCard
            label="Candidatures reçues"
            value={candidates.length}
            hint={`${accepted.length} acceptée${accepted.length > 1 ? "s" : ""}`}
            icon={Send}
            tone="accent"
            chip={last30 > 0 ? { label: `+${last30} en 30 jours`, tone: "success", icon: TrendingUp } : undefined}
            bars={weeklyBars}
            delay={120}
          />
          <KpiCard
            label="À examiner"
            value={toExamine.length}
            hint={toExamine.length ? "En attente de votre décision" : "Aucune en attente"}
            icon={UserSearch}
            tone={toExamine.length ? "warning" : "success"}
            chip={toExamine.length ? { label: "Action requise", tone: "warning", icon: Clock } : undefined}
            delay={180}
          />
          <KpiCard
            label="Stagiaires accueillis"
            value={interns.length}
            hint={`${upcomingInterviews.length} entretien${upcomingInterviews.length > 1 ? "s" : ""} programmé${upcomingInterviews.length > 1 ? "s" : ""}`}
            icon={Users}
            tone="success"
            delay={240}
          />
        </div>

        {/* À traiter */}
        <Reveal as="section" delay={280} className="card-surface p-4 sm:p-5">
          <SectionHeader title="À traiter" count={todos.length} />
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
              <CheckCircle2 className="size-7 text-success" />
              <p className="mt-2 text-sm font-medium">Aucune action en attente</p>
              <p className="text-xs text-muted-foreground">Vos dossiers sont à jour.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {queue.map((todo, index) => {
                const meta = TODO_META[todo.kind];
                return (
                  <Reveal as="li" key={todo.id} delay={340 + index * 60}>
                    <TodoTarget
                      todo={todo}
                      className="group flex items-center gap-3 rounded-xl border border-transparent bg-muted/50 px-3 py-3 transition-all duration-200 hover:border-border hover:bg-card hover:shadow-sm sm:gap-4 sm:px-4"
                    >
                      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", meta.tone)}>
                        <meta.icon className="size-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold leading-snug">{todo.label}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{todo.meta}</span>
                      </span>
                      <span className="hidden rounded-md border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground md:inline-block">
                        {meta.tag}
                      </span>
                      <span className="press inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors group-hover:bg-primary-hover">
                        <span className="hidden sm:inline">{meta.action}</span>
                        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </span>
                    </TodoTarget>
                  </Reveal>
                );
              })}
            </ul>
          )}
        </Reveal>

        {/* Offres en cours */}
        <section>
          <Reveal delay={320}>
            <SectionHeader title="Offres publiées" count={activeOffers.length} to="/entreprise/offres" linkLabel="Gérer" />
          </Reveal>
          {activeOffers.length === 0 ? (
            <div className="card-surface p-8 text-center text-sm text-muted-foreground">
              Aucune offre publiée pour le moment.
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
                  <Reveal key={offer.id} delay={380 + index * 70} className="min-w-0">
                    <Link
                      to="/entreprise/offres"
                      className="card-surface hover-lift block p-4 sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                          {initialsOf(offer.department)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold leading-snug">{offer.title}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="size-3" /> Publiée le {fmtDate(offer.published)}
                          </p>
                        </div>
                        <Badge label={offerStatusLabels[offer.status].label} tone={oTone(offer.status)} />
                      </div>

                      <dl className="mt-4 grid grid-cols-3 divide-x rounded-lg border bg-muted/40 py-2.5 text-center">
                        <div>
                          <dt className="text-[11px] text-muted-foreground">Candidatures</dt>
                          <dd className="text-sm font-semibold tabular-nums">{pipeline.length}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">À examiner</dt>
                          <dd className={cn("text-sm font-semibold tabular-nums", waiting > 0 && "text-warning")}>
                            {waiting}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">Clôture</dt>
                          <dd className={cn("text-sm font-semibold", daysLeft <= 7 && daysLeft >= 0 && "text-destructive-ink")}>
                            {daysLeft < 0 ? "Échue" : `J-${daysLeft}`}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4 flex items-center gap-3">
                        <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                          {offer.department}
                        </span>
                        <div
                          className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Candidatures examinées"
                        >
                          <div
                            className="animate-grow-x h-full rounded-full bg-primary"
                            style={{ width: `${pct}%`, ["--delay" as string]: `${500 + index * 80}ms` }}
                          />
                        </div>
                        <span className="w-14 shrink-0 text-right text-lg font-semibold tabular-nums">
                          <AnimatedNumber value={pct} suffix="%" />
                        </span>
                      </div>
                      <p className="mt-1 text-right text-[11px] text-muted-foreground">candidatures examinées</p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          )}
        </section>

        {/* Dossiers en cours */}
        <Reveal as="section" delay={420} className="card-surface overflow-hidden">
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <SectionHeader title="Dossiers stagiaires" count={interns.length} to="/entreprise/stagiaires" />
          </div>
          {interns.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">Aucun dossier stagiaire pour le moment.</p>
          ) : (
            <>
              {/* Tableau sur grand écran */}
              <table className="hidden w-full text-sm md:table">
                <thead>
                  <tr className="border-y bg-muted/50 text-left text-xs text-muted-foreground">
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
                          <Link
                            to="/entreprise/stagiaires/$internId"
                            params={{ internId: intern.id }}
                            className="flex items-center gap-3"
                          >
                            <AvatarInitials initials={intern.initials} className="size-9 text-xs" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium group-hover:text-primary">{intern.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {offerTitle(intern.offerId)}
                              </span>
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

              {/* Liste sur téléphone */}
              <ul className="divide-y border-t md:hidden">
                {interns.slice(0, 5).map((intern) => {
                  const step = nextStep(intern.id);
                  return (
                    <li key={intern.id}>
                      <Link
                        to="/entreprise/stagiaires/$internId"
                        params={{ internId: intern.id }}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <AvatarInitials initials={intern.initials} className="size-9 text-xs" />
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
      <aside className="space-y-4">
        {/* Carte entreprise */}
        <Reveal delay={160} className="card-surface overflow-hidden">
          <div className="relative bg-gradient-to-b from-accent-soft/80 via-accent-soft/30 to-card px-5 pb-5 pt-6 text-center">
            <div
              className="absolute -right-8 -top-8 size-28 rounded-full border-[10px] border-accent/15"
              aria-hidden
            />
            <span className="relative mx-auto grid size-20 place-items-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground ring-4 ring-card shadow-md">
              {profile.initials}
            </span>
            <p className="relative mt-3 text-lg font-semibold tracking-tight">{profile.name}</p>
            <p className="relative text-sm text-muted-foreground">{profile.sector}</p>
            <p className="relative mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" /> {profile.city}
            </p>
            <div className="relative mt-5">
              <p className="text-4xl font-semibold tracking-tight">
                <AnimatedNumber value={placesLeft} />
              </p>
              <p className="text-sm text-muted-foreground">
                place{placesLeft > 1 ? "s" : ""} de stage à pourvoir
              </p>
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

        {/* Prochains entretiens */}
        <Reveal delay={240} className="card-surface p-4 sm:p-5">
          <SectionHeader title="Prochains entretiens" to="/entreprise/entretiens" />
          {upcomingInterviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun entretien programmé.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingInterviews.slice(0, 3).map((interview) => {
                const date = new Date(`${interview.date}T00:00:00`);
                return (
                  <li key={interview.id} className="flex items-center gap-3">
                    <span className="flex w-12 shrink-0 flex-col items-center rounded-xl border bg-card py-1.5 leading-none">
                      <span className="text-[10px] font-semibold uppercase text-destructive-ink">
                        {date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}
                      </span>
                      <span className="mt-0.5 text-lg font-semibold tabular-nums">{date.getDate()}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{candidateName(interview.candidateId)}</p>
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

        {/* Système expert */}
        <Reveal delay={320} className="relative overflow-hidden rounded-xl bg-primary p-5 text-primary-foreground">
          <div className="absolute -right-10 -top-10 size-36 rounded-full bg-accent/20" aria-hidden />
          <div className="absolute -bottom-12 right-10 size-28 rounded-full border-[12px] border-accent/15" aria-hidden />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-accent">
              <Sparkles className="size-3" /> Système expert
            </span>
            <p className="mt-3 text-xl font-semibold leading-snug tracking-tight">
              {pendingAssignments.length > 0
                ? `${pendingAssignments.length} affectation${pendingAssignments.length > 1 ? "s" : ""} à valider`
                : "Aucune affectation en attente"}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/70">
              Le système propose un service et explique pourquoi. La décision finale vous appartient.
            </p>
            <Link
              to="/entreprise/stagiaires"
              className="press mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-accent-soft"
            >
              Ouvrir les dossiers <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </Reveal>
      </aside>
    </div>
  );
}
