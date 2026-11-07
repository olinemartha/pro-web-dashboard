import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  FileText,
  Inbox,
  Send,
  Users,
  UserSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarInitials, Badge, KpiCard, SectionLabel, type Tone } from "@/components/company/ui";
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

function fmtDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Todo =
  | { kind: "candidature"; id: string; label: string; meta: string; q: string; urgency: number }
  | { kind: "dossier"; id: string; label: string; meta: string; internId: string; urgency: number }
  | { kind: "entretien"; id: string; label: string; meta: string; urgency: number }
  | { kind: "service"; id: string; label: string; meta: string; urgency: number };

const TODO_TONES: Record<Todo["kind"], string> = {
  candidature: "bg-accent-soft text-primary",
  dossier: "bg-warning-soft text-warning",
  entretien: "bg-primary-soft text-primary",
  service: "bg-muted text-muted-foreground",
};

function TodoLink({ todo, children }: { todo: Todo; children: React.ReactNode }) {
  if (todo.kind === "candidature") {
    return (
      <Link
        to="/entreprise/candidatures"
        search={{ q: todo.q }}
        className="flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted"
      >
        {children}
      </Link>
    );
  }
  if (todo.kind === "dossier") {
    return (
      <Link
        to="/entreprise/stagiaires/$internId"
        params={{ internId: todo.internId }}
        className="flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted"
      >
        {children}
      </Link>
    );
  }
  if (todo.kind === "entretien") {
    return (
      <Link
        to="/entreprise/entretiens"
        className="flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted"
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      to="/entreprise/services"
      className="flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted"
    >
      {children}
    </Link>
  );
}

function CompanyDashboard() {
  const { profile, offers, candidates, interns, interviews, services } = useCompanyStore();

  const activeOffers = offers.filter((offer) => offer.status === "publiee");
  const toExamine = candidates.filter(
    (candidate) => candidate.status === "en_attente" || candidate.status === "examen"
  );
  const accepted = candidates.filter((candidate) => candidate.status === "acceptee");
  const upcomingInterviews = interviews
    .filter((interview) => interview.status === "programme")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

  const offerTitle = (id: string) => offers.find((offer) => offer.id === id)?.title ?? "Offre supprimée";
  const candidateName = (id: string) =>
    candidates.find((candidate) => candidate.id === id)?.name ?? "Candidat";

  const today = new Date().toISOString().split("T")[0];
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 14);
  const horizonIso = horizon.toISOString().split("T")[0];

  const todos: Todo[] = [];

  interns
    .filter((intern) => !intern.confirmed)
    .forEach((intern) => {
      todos.push({
        kind: "dossier",
        id: `affectation-${intern.id}`,
        label: `Valider l'affectation de ${intern.name}`,
        meta: `${offerTitle(intern.offerId)} · dossier à confirmer`,
        internId: intern.id,
        urgency: 0,
      });
    });

  toExamine.forEach((candidate) => {
    todos.push({
      kind: "candidature",
      id: `candidature-${candidate.id}`,
      label: `Examiner la candidature de ${candidate.name}`,
      meta: `${offerTitle(candidate.offerId)} · déposée le ${fmtDate(candidate.appliedAt)}`,
      q: candidate.name,
      urgency: 1,
    });
  });

  interns.forEach((intern) => {
    const pending = intern.reports.filter((report) => report.status === "soumis");
    if (pending.length > 0) {
      todos.push({
        kind: "dossier",
        id: `rapport-${intern.id}`,
        label: `Examiner le rapport de ${intern.name}`,
        meta: `${pending[0].period} · déposé le ${fmtDate(pending[0].date)}`,
        internId: intern.id,
        urgency: 2,
      });
    }
  });

  upcomingInterviews
    .filter((interview) => interview.date >= today && interview.date <= horizonIso)
    .forEach((interview) => {
      todos.push({
        kind: "entretien",
        id: `entretien-${interview.id}`,
        label: `Préparer l'entretien de ${candidateName(interview.candidateId)}`,
        meta: `${fmtDate(interview.date)} à ${interview.time} · ${interview.location}`,
        urgency: 3,
      });
    });

  services.forEach((service) => {
    const filled = interns.filter(
      (intern) =>
        intern.confirmed &&
        (intern.serviceId ? intern.serviceId === service.id : intern.service === service.name)
    ).length;
    const staleDays = Math.floor(
      (Date.now() - new Date(`${service.updatedAt}T00:00:00`).getTime()) / 86_400_000
    );
    const incomplete = !service.education.trim() || service.skills.length === 0 || !service.profiles.trim();
    if (incomplete || staleDays > 30 || filled < service.internsNeeded) {
      const reason = incomplete
        ? "Besoins incomplets"
        : staleDays > 30
          ? `Besoins mis à jour il y a ${staleDays} jours`
          : `${service.internsNeeded - filled} place(s) à pourvoir`;
      todos.push({
        kind: "service",
        id: `service-${service.id}`,
        label: `Compléter les besoins — ${service.name}`,
        meta: reason,
        urgency: 4,
      });
    }
  });

  const queue = todos.sort((a, b) => a.urgency - b.urgency).slice(0, 5);

  const nextStep = (internId: string) => {
    const intern = interns.find((entry) => entry.id === internId);
    if (!intern) return "Dossier introuvable";
    if (!intern.confirmed) return "Affectation à confirmer";
    if (intern.reports.some((report) => report.status === "soumis")) return "Rapport à examiner";
    if (!intern.evaluation) return "Suivi en cours";
    if (intern.certificate === "non_generee") return "Attestation à générer";
    if (intern.certificate === "generee") return "Attestation à valider";
    return "Dossier à jour";
  };

  return (
    <div className="space-y-6">
      {/* Bureau des affaires courantes */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="card-surface relative overflow-hidden p-6 sm:p-7">
          <div className="absolute -right-10 -top-10 size-44 rounded-full bg-accent-soft" aria-hidden />
          <div className="absolute -right-2 top-12 size-20 rounded-full border-8 border-accent/30" aria-hidden />
          <div className="relative max-w-2xl">
            <h2 className="text-balance text-2xl font-semibold leading-tight tracking-tight">
              Bonjour, {profile.name}
            </h2>
            <p className="mt-2 max-w-[60ch] text-pretty text-sm leading-relaxed text-muted-foreground">
              Vos dossiers de recrutement, du dépôt de la candidature à l'attestation de fin de stage.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/entreprise/offres" search={{ nouveau: true }}>
                  <Briefcase className="mr-2 size-4" /> Publier une offre
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/entreprise/candidatures">
                  <UserSearch className="mr-2 size-4" /> Gérer les candidatures
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="card-surface flex flex-col p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <SectionLabel>À traiter</SectionLabel>
            <Badge label={`${todos.length} action(s)`} tone={todos.length ? "warning" : "success"} />
          </div>
          {queue.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
              <CheckCircle2 className="size-6 text-success" />
              <p className="mt-2 text-sm font-medium">Aucune action en attente</p>
              <p className="text-xs text-muted-foreground">Vos dossiers sont à jour.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {queue.map((todo) => (
                <li key={todo.id}>
                  <TodoLink todo={todo}>
                    <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-md", TODO_TONES[todo.kind])}>
                      {todo.kind === "candidature" ? (
                        <Inbox className="size-3.5" />
                      ) : todo.kind === "dossier" ? (
                        <UserSearch className="size-3.5" />
                      ) : todo.kind === "entretien" ? (
                        <CalendarClock className="size-3.5" />
                      ) : (
                        <FileText className="size-3.5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-snug">{todo.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{todo.meta}</span>
                    </span>
                    <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                  </TodoLink>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Offres actives"
          value={activeOffers.length}
          hint={`${offers.length} offre${offers.length > 1 ? "s" : ""} au total`}
          icon={Briefcase}
          tone="primary"
        />
        <KpiCard
          label="Candidatures reçues"
          value={candidates.length}
          hint={`${accepted.length} acceptée${accepted.length > 1 ? "s" : ""}`}
          icon={Send}
          tone="accent"
        />
        <KpiCard
          label="À examiner"
          value={toExamine.length}
          hint={toExamine.length ? "Action requise de votre part" : "Aucune en attente"}
          icon={UserSearch}
          tone={toExamine.length ? "warning" : "success"}
        />
        <KpiCard
          label="Stagiaires accueillis"
          value={interns.length}
          hint={`${upcomingInterviews.length} entretien${upcomingInterviews.length > 1 ? "s" : ""} programmé${upcomingInterviews.length > 1 ? "s" : ""}`}
          icon={Users}
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Dossiers en cours */}
        <section className="card-surface p-5 sm:p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel>Dossiers en cours</SectionLabel>
            <Link
              to="/entreprise/stagiaires"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Tout voir <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {interns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun dossier stagiaire pour le moment.</p>
          ) : (
            <ul className="divide-y">
              {interns.slice(0, 5).map((intern) => (
                <li key={intern.id}>
                  <Link
                    to="/entreprise/stagiaires/$internId"
                    params={{ internId: intern.id }}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <AvatarInitials initials={intern.initials} className="size-8 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{intern.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {offerTitle(intern.offerId)} · {intern.service}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium leading-snug text-foreground">
                        {nextStep(intern.id)}
                      </p>
                      <p className="text-xs leading-4 text-muted-foreground">
                        {intern.confirmed ? "Affectation confirmée" : "À confirmer"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Prochains entretiens + offres */}
        <div className="space-y-6 lg:col-span-2">
          <section className="card-surface p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>Prochains entretiens</SectionLabel>
              <Link
                to="/entreprise/entretiens"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Tout voir <ArrowRight className="size-3.5" />
              </Link>
            </div>
            {upcomingInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun entretien programmé.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingInterviews.slice(0, 3).map((interview) => (
                  <li key={interview.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-soft text-primary">
                      <CalendarClock className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {candidateName(interview.candidateId)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {fmtDate(interview.date)} à {interview.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card-surface p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>Offres publiées</SectionLabel>
              <Link
                to="/entreprise/offres"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Gérer <ArrowRight className="size-3.5" />
              </Link>
            </div>
            {activeOffers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune offre publiée pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {activeOffers.slice(0, 3).map((offer) => {
                  const pipeline = candidates.filter(
                    (candidate) => candidate.offerId === offer.id && candidate.status !== "retiree"
                  );
                  const waiting = pipeline.filter(
                    (candidate) =>
                      candidate.status === "en_attente" || candidate.status === "examen"
                  ).length;
                  return (
                    <li key={offer.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{offer.title}</p>
                        <Badge label={offerStatusLabels[offer.status].label} tone={oTone(offer.status)} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {pipeline.length} candidature{pipeline.length > 1 ? "s" : ""} · {waiting} à
                        examiner
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
