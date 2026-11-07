import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  MapPin,
  Pencil,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AvatarInitials,
  Badge,
  EmptyBlock,
  Field,
  KpiCard,
  Modal,
  PageIntro,
  SectionLabel,
  inputClass,
  type Tone,
} from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";
import { interviewStatusLabels, type Interview, type InterviewStatus } from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/entretiens")({
  head: () => ({
    meta: [{ title: "Entretiens — Espace entreprise" }],
  }),
  component: CompanyInterviewsPage,
});

const tone = (status: InterviewStatus): Tone => interviewStatusLabels[status].tone;

function fmtDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface InterviewForm {
  candidateId: string;
  date: string;
  time: string;
  location: string;
}

const EMPTY_FORM: InterviewForm = {
  candidateId: "",
  date: "",
  time: "10:00",
  location: "Siège FINCA — Salle 1",
};

/** Seuls les candidats encore en course peuvent être convoqués. */
const ELIGIBLE_STATUSES = ["en_attente", "examen", "entretien"] as const;

function CompanyInterviewsPage() {
  const {
    interviews,
    candidates,
    offers,
    scheduleInterview,
    updateInterview,
    setInterviewStatus,
  } = useCompanyStore();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<InterviewStatus | "tous">("tous");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InterviewForm>(EMPTY_FORM);
  const [error, setError] = useState("");

  const candidate = (id: string) => candidates.find((entry) => entry.id === id);
  const offerTitle = (candidateId: string) => {
    const entry = candidate(candidateId);
    return entry
      ? offers.find((offer) => offer.id === entry.offerId)?.title ?? "Offre supprimée"
      : "Candidat supprimé";
  };

  const eligibleCandidates = useMemo(() => {
    const list = candidates.filter((entry) =>
      (ELIGIBLE_STATUSES as readonly string[]).includes(entry.status)
    );
    if (editingId) {
      const interview = interviews.find((entry) => entry.id === editingId);
      const current = interview ? candidate(interview.candidateId) : undefined;
      if (current && !list.some((entry) => entry.id === current.id)) list.unshift(current);
    }
    return list;
  }, [candidates, editingId, interviews]);

  const filtered = useMemo(
    () =>
      [...interviews]
        .filter((interview) => filter === "tous" || interview.status === filter)
        .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
    [interviews, filter]
  );

  const today = new Date().toISOString().split("T")[0];
  const upcoming = filtered.filter(
    (interview) => interview.status === "programme" && interview.date >= today
  );
  const past = filtered.filter(
    (interview) => !(interview.status === "programme" && interview.date >= today)
  );

  const counts = {
    programme: interviews.filter((interview) => interview.status === "programme").length,
    realise: interviews.filter((interview) => interview.status === "realise").length,
    annule: interviews.filter((interview) => interview.status === "annule").length,
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, candidateId: eligibleCandidates[0]?.id ?? "" });
    setError("");
    setFormOpen(true);
  };

  const openEdit = (interview: Interview) => {
    setEditingId(interview.id);
    setForm({
      candidateId: interview.candidateId,
      date: interview.date,
      time: interview.time,
      location: interview.location,
    });
    setError("");
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.candidateId) {
      setError("Sélectionnez un candidat.");
      return;
    }
    if (!form.date) {
      setError("Choisissez une date d'entretien.");
      return;
    }
    if (editingId) {
      updateInterview(editingId, {
        candidateId: form.candidateId,
        date: form.date,
        time: form.time,
        location: form.location,
      });
      toast.success("Entretien modifié", {
        description: `${candidate(form.candidateId)?.name ?? "Candidat"} — ${fmtDate(form.date)} à ${form.time}`,
      });
    } else {
      scheduleInterview(form.candidateId, form.date, form.time, form.location);
      toast.success("Entretien programmé", {
        description: `${candidate(form.candidateId)?.name ?? "Candidat"} — ${fmtDate(form.date)} à ${form.time}`,
      });
    }
    setFormOpen(false);
  };

  const setStatus = (interview: Interview, status: InterviewStatus) => {
    setInterviewStatus(interview.id, status);
    const name = candidate(interview.candidateId)?.name ?? "Candidat";

    if (status === "realise") {
      toast.success("Entretien marqué comme réalisé", {
        description: `${name} — prochaine étape : décider de la candidature.`,
        action: {
          label: "Décider",
          onClick: () =>
            navigate({ to: "/entreprise/candidatures", search: { q: name } }),
        },
      });
      return;
    }

    toast.success("Entretien annulé", { description: name });
  };

  const renderInterview = (interview: Interview) => {
    const entry = candidate(interview.candidateId);
    return (
      <article key={interview.id} className="card-surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AvatarInitials initials={entry?.initials ?? "?"} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">{entry?.name ?? "Candidat supprimé"}</h2>
              <Badge
                label={interviewStatusLabels[interview.status].label}
                tone={tone(interview.status)}
              />
            </div>
            <p className="truncate text-xs text-muted-foreground">{offerTitle(interview.candidateId)}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-relaxed tabular-nums text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3.5" /> {fmtDate(interview.date)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" /> {interview.time}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {interview.location}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {interview.status === "programme" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStatus(interview, "realise")}>
                <CheckCircle2 className="mr-1.5 size-3.5" /> Réalisé
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStatus(interview, "annule")}>
                <XCircle className="mr-1.5 size-3.5" /> Annuler
              </Button>
            </>
          )}
          {interview.status === "annule" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setInterviewStatus(interview.id, "programme");
                toast.success("Entretien reprogrammé");
              }}
            >
              Rétablir
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => openEdit(interview)}>
            <Pencil className="mr-1.5 size-3.5" /> Modifier
          </Button>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Planifiez, modifiez ou annulez les entretiens avec les candidats."
        action={
          <Button onClick={openCreate}>
            <CalendarPlus className="mr-2 size-4" /> Planifier un entretien
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <KpiCard label="Programmés" value={counts.programme} hint="À venir" icon={CalendarClock} />
        <KpiCard label="Réalisés" value={counts.realise} hint="Historique" icon={CheckCircle2} />
        <KpiCard label="Annulés" value={counts.annule} hint="Non poursuivis" icon={XCircle} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "tous", label: "Tous" },
            { value: "programme", label: "Programmés" },
            { value: "realise", label: "Réalisés" },
            { value: "annule", label: "Annulés" },
          ] as const
        ).map((entry) => (
          <button
            key={entry.value}
            type="button"
            onClick={() => setFilter(entry.value)}
            className={
              filter === entry.value
                ? "rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
                : "rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            }
          >
            {entry.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyBlock
          title="Aucun entretien"
          desc="Planifiez un entretien depuis cette page ou depuis une candidature."
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <SectionLabel className="mb-3 tabular-nums">
                À venir ({upcoming.length})
              </SectionLabel>
              <div className="space-y-3">{upcoming.map(renderInterview)}</div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <SectionLabel className="mb-3 tabular-nums">Passés ({past.length})</SectionLabel>
              <div className="space-y-3">{past.map(renderInterview)}</div>
            </section>
          )}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Modifier l'entretien" : "Planifier un entretien"}
        description="Le candidat est notifié automatiquement."
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>{editingId ? "Enregistrer" : "Programmer"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Candidat" htmlFor="entretien-candidat" required error={error}>
            <select
              id="entretien-candidat"
              className={inputClass}
              value={form.candidateId}
              onChange={(event) => setForm((current) => ({ ...current, candidateId: event.target.value }))}
              disabled={Boolean(editingId)}
            >
              <option value="">— Sélectionner un candidat —</option>
              {eligibleCandidates.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} — {entry.niveau}
                </option>
              ))}
            </select>
          </Field>
          {eligibleCandidates.length === 0 && !editingId && (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Aucun candidat éligible : les candidatures refusées ou retirées ne peuvent pas être
              convoquées.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="entretien-date" required>
              <input
                id="entretien-date"
                type="date"
                className={inputClass}
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </Field>
            <Field label="Heure" htmlFor="entretien-heure" required>
              <input
                id="entretien-heure"
                type="time"
                className={inputClass}
                value={form.time}
                onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
              />
            </Field>
          </div>
          <Field label="Lieu" htmlFor="entretien-lieu" required hint="Adresse ou lien de visioconférence.">
            <input
              id="entretien-lieu"
              className={inputClass}
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
