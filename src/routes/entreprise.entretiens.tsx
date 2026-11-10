import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  MapPin,
  Pencil,
  RotateCcw,
  Video,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import {
  ARROW_NUDGE,
  ActionMenu,
  Badge,
  EmptyNote,
  Field,
  FilterChips,
  MenuItem,
  Modal,
  PageIntro,
  SECTION_LINK,
  Select,
  StatCard,
  rowActionClass,
  type Tone,
} from "@/components/company/ui";
import {
  EMPTY_INTERVIEW,
  InterviewFields,
  validateInterview,
  type InterviewDraft,
} from "@/components/company/interview-fields";
import { useCompanyStore } from "@/lib/company-store";
import { daysFromToday, fmtDate, localIsoDate, relativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { interviewStatusLabels, type Interview, type InterviewStatus } from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/entretiens")({
  head: () => ({
    meta: [{ title: "Entretiens — Espace entreprise" }],
  }),
  component: CompanyInterviewsPage,
});

const tone = (status: InterviewStatus): Tone => interviewStatusLabels[status].tone;

type Filter = "tous" | "a_venir" | "realise" | "annule";

/** Seuls les candidats encore en course peuvent être convoqués. */
const ELIGIBLE_STATUSES = ["en_attente", "examen", "entretien"] as const;

const isRemote = (location: string) => /visio|teams|meet|zoom|en ligne/i.test(location);

function CompanyInterviewsPage() {
  const { interviews, candidates, offers, scheduleInterview, updateInterview, setInterviewStatus } = useCompanyStore();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<Filter>("tous");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState("");
  const [draft, setDraft] = useState<InterviewDraft>(EMPTY_INTERVIEW);
  const [errors, setErrors] = useState<Partial<Record<keyof InterviewDraft | "candidate", string>>>({});

  const today = localIsoDate();
  const candidate = (id: string) => candidates.find((entry) => entry.id === id);
  const offerTitle = (id: string) => {
    const entry = candidate(id);
    const title = entry ? offers.find((offer) => offer.id === entry.offerId)?.title : undefined;
    return title ? title.replace(/^Stagiaire\s+/i, "") : entry ? "Offre supprimée" : "Candidat supprimé";
  };

  const isUpcoming = (interview: Interview) => interview.status === "programme" && interview.date >= today;
  /** Programmé à une date passée : il faut dire s'il a eu lieu ou non. */
  const isOverdue = (interview: Interview) => interview.status === "programme" && interview.date < today;
  /** La candidature attend encore une décision (ni acceptée, ni refusée, ni retirée). */
  const isOpenCandidate = (id: string) => {
    const status = candidate(id)?.status;
    return status === "en_attente" || status === "examen" || status === "entretien";
  };

  const sorted = useMemo(
    () => [...interviews].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
    [interviews]
  );
  const upcomingAll = sorted.filter(isUpcoming);
  const thisWeek = upcomingAll.filter((interview) => daysFromToday(interview.date) <= 7);
  const soon = upcomingAll.filter((interview) => daysFromToday(interview.date) <= 1);
  const done = sorted.filter((interview) => interview.status === "realise");
  const toDecide = done.filter((interview) => isOpenCandidate(interview.candidateId));
  const overdueAll = sorted.filter(isOverdue);
  const cancelled = sorted.filter((interview) => interview.status === "annule");

  const visible = sorted.filter((interview) => {
    if (filter === "a_venir") return isUpcoming(interview) || isOverdue(interview);
    if (filter === "realise" || filter === "annule") return interview.status === filter;
    return true;
  });
  const upcoming = visible.filter(isUpcoming);
  const overdue = visible.filter(isOverdue);
  // L'historique (réalisés, annulés) se lit du plus récent au plus ancien.
  const past = visible.filter((interview) => interview.status !== "programme").reverse();

  const eligibleCandidates = useMemo(() => {
    const scheduled = new Set(
      interviews.filter((interview) => interview.status === "programme").map((interview) => interview.candidateId)
    );
    const list = candidates.filter(
      (entry) => (ELIGIBLE_STATUSES as readonly string[]).includes(entry.status) && !scheduled.has(entry.id)
    );
    if (editingId) {
      const interview = interviews.find((entry) => entry.id === editingId);
      const current = interview ? candidate(interview.candidateId) : undefined;
      if (current && !list.some((entry) => entry.id === current.id)) list.unshift(current);
    }
    return list;
  }, [candidates, editingId, interviews]);


  const openCreate = () => {
    setEditingId(null);
    setCandidateId("");
    setDraft(EMPTY_INTERVIEW);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (interview: Interview) => {
    setEditingId(interview.id);
    setCandidateId(interview.candidateId);
    setDraft({ date: interview.date, time: interview.time, location: interview.location });
    setErrors({});
    setFormOpen(true);
  };

  const submit = () => {
    const next: typeof errors = validateInterview(draft, Boolean(editingId));
    if (!candidateId) next.candidate = "Choisissez le candidat à convoquer.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const name = candidate(candidateId)?.name ?? "Candidat";
    const when = `${fmtDate(draft.date)} à ${draft.time.replace(":", " h ")}`;
    if (editingId) {
      updateInterview(editingId, { candidateId, ...draft });
      toast.success("Entretien modifié", { description: `${name} — ${when}` });
    } else {
      scheduleInterview(candidateId, draft.date, draft.time, draft.location);
      toast.success("Entretien programmé", { description: `${name} — ${when}` });
    }
    setFormOpen(false);
  };

  const setStatus = (interview: Interview, status: InterviewStatus) => {
    setInterviewStatus(interview.id, status);
    const name = candidate(interview.candidateId)?.name ?? "Candidat";
    if (status === "realise") {
      toast.success("Entretien marqué comme réalisé", {
        description: `${name} — prochaine étape : décider de la candidature.`,
        action: { label: "Décider", onClick: () => navigate({ to: "/entreprise/candidatures", search: { q: name } }) },
      });
    } else if (status === "annule") {
      toast.success("Entretien annulé", {
        description: name,
        action: { label: "Rétablir", onClick: () => setInterviewStatus(interview.id, "programme") },
      });
    } else {
      toast.success("Entretien rétabli", { description: name });
    }
  };

  /** Une ligne d'agenda : date, qui, quand, où, statut, action. */
  const renderRow = (interview: Interview, index: number, highlight = false) => {
    const entry = candidate(interview.candidateId);
    const date = new Date(`${interview.date}T00:00:00`);
    const overdueRow = isOverdue(interview);
    const upcomingRow = isUpcoming(interview) || overdueRow;
    const left = daysFromToday(interview.date);
    const urgent = upcomingRow && left <= 1;
    // On ne marque « réalisé » qu'un entretien du jour ou passé.
    const canMarkDone = interview.status === "programme" && left <= 0;
    const decide = interview.status === "realise" && isOpenCandidate(interview.candidateId);
    const statusBadge = overdueRow
      ? { label: "À confirmer", tone: "warning" as Tone }
      : { label: interviewStatusLabels[interview.status].label, tone: tone(interview.status) };
    const Place = isRemote(interview.location) ? Video : MapPin;
    return (
      <Reveal
        as="li"
        key={interview.id}
        delay={index < 8 ? 160 + index * 40 : 0}
        className={cn(
          "group grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5 transition-colors duration-150 md:grid-cols-[44px_minmax(0,1.4fr)_minmax(0,1fr)_7.5rem_auto]",
          highlight ? "bg-primary-soft/60 hover:bg-primary-soft" : "hover:bg-muted/50"
        )}
      >
        {/* Pavé date, comme dans « Prochains entretiens » */}
        <span
          className={cn(
            "flex w-11 flex-col items-center rounded-lg py-1.5 leading-none",
            highlight ? "bg-primary text-primary-foreground" : upcomingRow ? "border bg-card" : "bg-muted text-muted-foreground"
          )}
          aria-hidden
        >
          <span className={cn("text-[11px] font-medium uppercase", highlight ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}
          </span>
          <span className="mt-0.5 text-base font-semibold tabular-nums">{date.getDate()}</span>
        </span>

        <div className="min-w-0">
          <p className={cn("truncate text-sm font-semibold", !upcomingRow && "text-foreground/80")}>
            {entry?.name ?? "Candidat supprimé"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {offerTitle(interview.candidateId)}
            <span className="md:hidden">
              {" · "}
              {interview.time.replace(":", " h ")}
            </span>
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs md:hidden">
            <Badge label={statusBadge.label} tone={statusBadge.tone} className="px-1.5 py-0 text-[11px]" />
            {upcomingRow && (
              <span className={cn("inline-flex items-center gap-1", urgent ? "font-semibold text-warning" : "text-muted-foreground")}>
                {urgent && <Clock className="size-3" />}
                {relativeDay(interview.date)}
              </span>
            )}
          </p>
        </div>

        {/* Quand et où */}
        <div className="hidden min-w-0 md:block">
          <p className="flex items-center gap-1.5 text-[13px] tabular-nums">
            <Clock className="size-3.5 shrink-0 text-muted-foreground" />
            {interview.time.replace(":", " h ")}
          </p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Place className="size-3.5 shrink-0" />
            <span className="truncate">{interview.location}</span>
          </p>
        </div>

        <div className="hidden flex-col items-start gap-1 md:flex">
          <Badge label={statusBadge.label} tone={statusBadge.tone} className="whitespace-nowrap" />
          {upcomingRow ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 whitespace-nowrap text-xs tabular-nums",
                urgent ? "font-semibold text-warning" : "text-muted-foreground"
              )}
            >
              {urgent && <Clock className="size-3" />}
              {relativeDay(interview.date)}
            </span>
          ) : (
            <span className="text-xs tabular-nums text-muted-foreground">{fmtDate(interview.date, false)}</span>
          )}
        </div>

        {/* Une action principale, le reste dans le menu */}
        <div className="flex items-center gap-1">
          {canMarkDone && (
            <button
              type="button"
              onClick={() => setStatus(interview, "realise")}
              aria-label={`Marquer réalisé — entretien avec ${entry?.name ?? "le candidat"}`}
              className={rowActionClass()}
            >
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span className="hidden whitespace-nowrap sm:inline">Marquer réalisé</span>
            </button>
          )}
          {decide && entry && (
            <Link
              to="/entreprise/candidatures"
              search={{ q: entry.name }}
              aria-label={`Décider de la candidature de ${entry.name}`}
              className={rowActionClass()}
            >
              <span className="hidden whitespace-nowrap sm:inline">Décider</span>
              <ArrowRight className={cn("size-3.5 shrink-0", ARROW_NUDGE)} />
            </Link>
          )}
          {interview.status === "annule" && (
            <button
              type="button"
              onClick={() => setStatus(interview, "programme")}
              aria-label={`Rétablir l'entretien avec ${entry?.name ?? "le candidat"}`}
              className={rowActionClass()}
            >
              <RotateCcw className="size-3.5 shrink-0" />
              <span className="hidden whitespace-nowrap sm:inline">Rétablir</span>
            </button>
          )}
          {/* Garde le bord droit aligné quand la ligne n'a pas d'action principale. */}
          {((interview.status === "realise" && !decide) || (interview.status === "programme" && !canMarkDone)) && (
            <span className="hidden w-36 sm:block" aria-hidden />
          )}
          <ActionMenu>
            <MenuItem onSelect={() => openEdit(interview)}>
              <Pencil className="size-3.5" /> Modifier
            </MenuItem>
            {interview.status === "programme" && (
              <MenuItem onSelect={() => setStatus(interview, "annule")}>
                <XCircle className="size-3.5" /> Annuler l'entretien
              </MenuItem>
            )}
          </ActionMenu>
        </div>
      </Reveal>
    );
  };

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Programmez vos entretiens, indiquez s'ils ont eu lieu, puis décidez de chaque candidature."
        action={
          <Button onClick={openCreate} className="group">
            <CalendarPlus className="mr-2 size-4 nav-icon nav-icon--tilt" />
            Programmer un entretien
          </Button>
        }
      />

      {/* Indicateurs : chacun filtre l'agenda */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard
            key="venir"
            label="À venir"
            value={upcomingAll.length}
            icon={CalendarClock}
            motion="tilt"
            foot={upcomingAll[0] ? `prochain ${relativeDay(upcomingAll[0].date)}` : "aucun programmé"}
          />,
          <StatCard
            key="semaine"
            label="Cette semaine"
            value={thisWeek.length}
            icon={Clock}
            motion="pop"
            foot={soon.length ? `${soon.length} aujourd'hui ou demain` : "rien d'imminent"}
            tone={soon.length ? "alert" : "neutral"}
          />,
          <StatCard
            key="realises"
            label="Réalisés"
            value={done.length}
            icon={CheckCircle2}
            motion="pop"
            foot={toDecide.length ? `${toDecide.length} décision${toDecide.length > 1 ? "s" : ""} à prendre` : "toutes les décisions prises"}
            tone={toDecide.length ? "alert" : "neutral"}
          />,
          <StatCard
            key="annules"
            label="Annulés"
            value={cancelled.length}
            icon={XCircle}
            motion="pop"
            foot="non poursuivis"
          />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      {/* Agenda */}
      <Reveal as="section" delay={120} className="card-surface overflow-hidden" aria-labelledby="agenda-titre">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b px-5 pb-3.5 pt-4">
          <h2 id="agenda-titre" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            Agenda des entretiens
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {visible.length}
            </span>
          </h2>
          <FilterChips
            label="Filtrer les entretiens"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "tous" as Filter, label: "Tous", count: sorted.length },
              { value: "a_venir" as Filter, label: "À venir", count: upcomingAll.length + overdueAll.length, dot: "entretien" as const },
              { value: "realise" as Filter, label: "Réalisés", count: done.length, dot: "acceptee" as const },
              { value: "annule" as Filter, label: "Annulés", count: cancelled.length, dot: "refusee" as const },
            ]}
          />
        </div>
        <p className="sr-only" aria-live="polite">
          {`${visible.length} entretien${visible.length > 1 ? "s" : ""} affiché${visible.length > 1 ? "s" : ""}`}
        </p>

        {visible.length === 0 ? (
          <div className="pb-8">
            <EmptyNote
              icon={CalendarClock}
              title={filter === "tous" ? "Aucun entretien pour l'instant" : "Rien dans cette catégorie"}
              desc={filter === "tous" ? "Programmez un entretien ici ou depuis une candidature." : "Changez de filtre pour voir les autres entretiens."}
              className="pb-4"
            />
            <div className="flex justify-center">
              {filter === "tous" ? (
                <button type="button" onClick={openCreate} className={SECTION_LINK}>
                  <CalendarPlus className="size-3.5" /> Programmer un entretien
                </button>
              ) : (
                <button type="button" onClick={() => setFilter("tous")} className={SECTION_LINK}>
                  Tout afficher
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {overdue.length > 0 && (
              <>
                <h3 className="border-b bg-warning-soft px-5 py-2 text-xs font-semibold text-warning">
                  À confirmer <span className="font-medium tabular-nums">· {overdue.length}</span>
                  <span className="font-normal"> — date passée : marquez-les réalisés ou annulez-les</span>
                </h3>
                <ul className="divide-y">{overdue.map((interview, index) => renderRow(interview, index))}</ul>
              </>
            )}
            {upcoming.length > 0 && (
              <>
                <h3 className="border-b bg-muted/40 px-5 py-2 text-xs font-semibold text-muted-foreground">
                  À venir <span className="font-medium tabular-nums">· {upcoming.length}</span>
                </h3>
                <ul className={cn("divide-y", overdue.length > 0 && "border-t")}>{upcoming.map((interview, index) => renderRow(interview, overdue.length + index, index === 0))}</ul>
              </>
            )}
            {past.length > 0 && (
              <>
                <h3 className={cn("border-b bg-muted/40 px-5 py-2 text-xs font-semibold text-muted-foreground", (upcoming.length > 0 || overdue.length > 0) && "border-t")}>
                  Historique <span className="font-medium tabular-nums">· {past.length}</span>
                </h3>
                <ul className="divide-y">{past.map((interview, index) => renderRow(interview, overdue.length + upcoming.length + index))}</ul>
              </>
            )}
          </>
        )}
      </Reveal>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        icon={editingId ? Pencil : CalendarPlus}
        title={editingId ? "Modifier l'entretien" : "Programmer un entretien"}
        description="Le candidat est notifié automatiquement."
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>
              <CalendarPlus className="mr-2 size-4" />
              {editingId ? "Enregistrer" : "Programmer l'entretien"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Candidat" htmlFor="entretien-candidat" required error={errors.candidate}>
            <Select
              id="entretien-candidat"
              placeholder="Choisir un candidat"
              value={candidateId}
              onChange={(event) => {
                setCandidateId(event.target.value);
                setErrors((current) => ({ ...current, candidate: undefined }));
              }}
              disabled={Boolean(editingId)}
            >
              {eligibleCandidates.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} — {offerTitle(entry.id)}
                </option>
              ))}
            </Select>
          </Field>
          {eligibleCandidates.length === 0 && !editingId && (
            <p className="rounded-lg bg-muted px-4 py-3 text-[13px] text-muted-foreground">
              Aucun candidat à convoquer : ceux qui ont déjà un entretien programmé, ou dont la candidature est close, n'apparaissent pas.
            </p>
          )}
          <InterviewFields
            value={draft}
            allowPast={Boolean(editingId)}
            onChange={(patch) => {
              setDraft((current) => ({ ...current, ...patch }));
              setErrors((current) => {
                const next = { ...current };
                (Object.keys(patch) as (keyof InterviewDraft)[]).forEach((key) => delete next[key]);
                return next;
              });
            }}
            errors={errors}
          />
        </div>
      </Modal>
    </div>
  );
}
