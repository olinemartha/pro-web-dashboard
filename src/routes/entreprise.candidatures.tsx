import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarPlus,
  Download,
  FileText,
  Lock,
  Mail,
  Phone,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AvatarInitials,
  Badge,
  Drawer,
  EmptyBlock,
  Field,
  Modal,
  PageIntro,
  inputClass,
  textareaClass,
  type Tone,
} from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";
import {
  candidateStatusLabels,
  isContactVisible,
  type Candidate,
  type CandidateStatus,
} from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/candidatures")({
  validateSearch: (
    search: Record<string, unknown>
  ): { q?: string; offre?: string } => ({
    q: typeof search.q === "string" && search.q.trim() ? search.q : undefined,
    offre: typeof search.offre === "string" && search.offre ? search.offre : undefined,
  }),
  head: () => ({
    meta: [{ title: "Candidatures — Espace entreprise" }],
  }),
  component: CompanyApplicationsPage,
});

const tone = (status: CandidateStatus): Tone => candidateStatusLabels[status].tone;

const STATUS_STEPS: { value: CandidateStatus | "toutes"; label: string }[] = [
  { value: "toutes", label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "examen", label: "En examen" },
  { value: "entretien", label: "En entretien" },
  { value: "acceptee", label: "Acceptées" },
  { value: "refusee", label: "Refusées" },
  { value: "retiree", label: "Retirées" },
];

function fmtDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const EMPTY_INTERVIEW = { date: "", time: "10:00", location: "Siège FINCA — Salle 1" };

function CompanyApplicationsPage() {
  const {
    offers,
    candidates,
    interns,
    updateCandidateStatus,
    acceptCandidate,
    refuseCandidate,
    scheduleInterview,
  } = useCompanyStore();

  const { q, offre } = Route.useSearch();

  const [offerFilter, setOfferFilter] = useState(offre ?? "toutes");
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "toutes">("toutes");
  const [search, setSearch] = useState(q ?? "");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [interviewFor, setInterviewFor] = useState<Candidate | null>(null);
  const [interviewForm, setInterviewForm] = useState(EMPTY_INTERVIEW);
  const [interviewError, setInterviewError] = useState("");

  const [acceptTarget, setAcceptTarget] = useState<Candidate | null>(null);
  const [refuseTarget, setRefuseTarget] = useState<Candidate | null>(null);
  const [refuseReason, setRefuseReason] = useState("");
  const [refuseError, setRefuseError] = useState("");
  const [newInternId, setNewInternId] = useState<string | null>(null);

  useEffect(() => {
    if (offre) setOfferFilter(offre);
  }, [offre]);

  useEffect(() => {
    setSearch(q ?? "");
  }, [q]);

  const offerTitle = (id: string) => offers.find((offer) => offer.id === id)?.title ?? "Offre supprimée";
  const internFor = (candidateId: string) => interns.find((intern) => intern.candidateId === candidateId);

  const counts = useMemo(() => {
    const base: Record<string, number> = { toutes: candidates.length };
    for (const step of STATUS_STEPS) {
      if (step.value === "toutes") continue;
      base[step.value] = candidates.filter((candidate) => candidate.status === step.value).length;
    }
    return base;
  }, [candidates]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return candidates.filter((candidate) => {
      if (offerFilter !== "toutes" && candidate.offerId !== offerFilter) return false;
      if (statusFilter !== "toutes" && candidate.status !== statusFilter) return false;
      if (!term) return true;
      return [
        candidate.name,
        candidate.filiere,
        candidate.universite,
        candidate.niveau,
        offerTitle(candidate.offerId),
      ].some((value) => value.toLowerCase().includes(term));
    });
  }, [candidates, offerFilter, statusFilter, search, offers]);

  const detail = candidates.find((candidate) => candidate.id === detailId) ?? null;

  const setStatus = (candidate: Candidate, status: CandidateStatus, note?: string) => {
    updateCandidateStatus(candidate.id, status, note);
    toast.success(`Candidature mise à jour : ${candidateStatusLabels[status].label}`, {
      description: `${candidate.name} recevra une notification.`,
    });
  };

  const openInterview = (candidate: Candidate) => {
    setDetailId(null);
    setInterviewForm(EMPTY_INTERVIEW);
    setInterviewError("");
    setInterviewFor(candidate);
  };

  const submitInterview = () => {
    if (!interviewFor) return;
    if (!interviewForm.date) {
      setInterviewError("Choisissez une date d'entretien.");
      return;
    }
    scheduleInterview(interviewFor.id, interviewForm.date, interviewForm.time, interviewForm.location);
    toast.success("Entretien programmé", {
      description: `${interviewFor.name} — ${fmtDate(interviewForm.date)} à ${interviewForm.time}`,
    });
    setInterviewFor(null);
  };

  const confirmAccept = () => {
    if (!acceptTarget) return;
    const internId = acceptCandidate(acceptTarget.id);
    toast.success("Candidature acceptée", {
      description: `${acceptTarget.name} — coordonnées révélées, dossier stagiaire créé.`,
    });
    setAcceptTarget(null);
    setDetailId(null);
    if (internId) setNewInternId(internId);
  };

  const confirmRefuse = () => {
    if (!refuseTarget) return;
    if (!refuseReason.trim()) {
      setRefuseError("Indiquez le motif du refus.");
      return;
    }
    refuseCandidate(refuseTarget.id, refuseReason);
    toast.success("Candidature refusée", {
      description: `${refuseTarget.name} sera informé du motif.`,
    });
    setRefuseTarget(null);
    setRefuseReason("");
    setRefuseError("");
    setDetailId(null);
  };

  const primaryAction = (candidate: Candidate) => {
    if (candidate.status === "acceptee") {
      const intern = internFor(candidate.id);
      if (intern) {
        return (
          <Button size="sm" asChild>
            <Link to="/entreprise/stagiaires/$internId" params={{ internId: intern.id }}>
              Ouvrir le dossier <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        );
      }
      return (
        <Button size="sm" variant="outline" onClick={() => setDetailId(candidate.id)}>
          Voir le profil
        </Button>
      );
    }
    if (candidate.status === "en_attente") {
      return (
        <Button
          size="sm"
          onClick={() => {
            setStatus(candidate, "examen", "Profil en cours d'examen");
            setDetailId(candidate.id);
          }}
        >
          Examiner
        </Button>
      );
    }
    if (candidate.status === "examen") {
      return (
        <Button size="sm" onClick={() => openInterview(candidate)}>
          <CalendarPlus className="mr-1.5 size-3.5" /> Convoquer
        </Button>
      );
    }
    if (candidate.status === "entretien") {
      return (
        <Button size="sm" onClick={() => setDetailId(candidate.id)}>
          Décider
        </Button>
      );
    }
    return (
      <Button size="sm" variant="outline" onClick={() => setDetailId(candidate.id)}>
        Voir le profil
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Une chaîne de décision continue : examiner, convoquer, accepter, affecter."
        action={<Badge label={`${candidates.length} candidature(s)`} tone="primary" />}
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_STEPS.map((step) => (
          <button
            key={step.value}
            type="button"
            onClick={() => setStatusFilter(step.value)}
            className={
              statusFilter === step.value
                ? "rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
                : "rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            }
          >
            {step.label} ({counts[step.value] ?? 0})
          </button>
        ))}
      </div>

      <div className="card-surface grid gap-3 p-4 sm:grid-cols-3">
        <Field label="Rechercher" htmlFor="filtre-recherche">
          <input
            id="filtre-recherche"
            type="search"
            className={inputClass}
            placeholder="Nom, filière, offre..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field>
        <Field label="Filtrer par offre" htmlFor="filtre-offre">
          <select
            id="filtre-offre"
            className={inputClass}
            value={offerFilter}
            onChange={(event) => setOfferFilter(event.target.value)}
          >
            <option value="toutes">Toutes les offres</option>
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Filtrer par étape" htmlFor="filtre-statut">
          <select
            id="filtre-statut"
            className={inputClass}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as CandidateStatus | "toutes")}
          >
            {STATUS_STEPS.map((step) => (
              <option key={step.value} value={step.value}>
                {step.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {filtered.length === 0 ? (
        <EmptyBlock
          title="Aucune candidature"
          desc="Aucune candidature ne correspond aux filtres sélectionnés."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((candidate) => (
            <article key={candidate.id} className="card-surface p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <AvatarInitials initials={candidate.initials} className="size-10" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold">{candidate.name}</h2>
                      <Badge
                        label={candidateStatusLabels[candidate.status].label}
                        tone={tone(candidate.status)}
                      />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {candidate.filiere} · {candidate.niveau} · {candidate.universite}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{offerTitle(candidate.offerId)}</span>{" "}
                      · déposée le {fmtDate(candidate.appliedAt)}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {isContactVisible("email", candidate.status) ? (
                        <>
                          <Mail className="size-3.5" /> Coordonnées visibles
                        </>
                      ) : (
                        <>
                          <Lock className="size-3.5" /> Coordonnées masquées
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {primaryAction(candidate)}
                  <Button variant="ghost" size="sm" onClick={() => setDetailId(candidate.id)}>
                    Profil
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Panneau candidat */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail?.name ?? "Profil du candidat"}
        description={detail ? `${detail.filiere} · ${detail.niveau}` : undefined}
        footer={
          detail && (
            <>
              <Button variant="outline" onClick={() => setDetailId(null)}>
                Fermer
              </Button>
              {detail.status !== "refusee" && detail.status !== "retiree" && detail.status !== "acceptee" && (
                <>
                  <Button variant="destructive" onClick={() => setRefuseTarget(detail)}>
                    <UserX className="mr-2 size-4" /> Refuser
                  </Button>
                  <Button variant="outline" onClick={() => openInterview(detail)}>
                    <CalendarPlus className="mr-2 size-4" /> Convoquer
                  </Button>
                  <Button onClick={() => setAcceptTarget(detail)}>
                    <UserCheck className="mr-2 size-4" /> Accepter
                  </Button>
                </>
              )}
              {detail.status === "acceptee" && internFor(detail.id) && (
                <Button asChild>
                  <Link
                    to="/entreprise/stagiaires/$internId"
                    params={{ internId: internFor(detail.id)!.id }}
                  >
                    Ouvrir le dossier <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              )}
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <AvatarInitials initials={detail.initials} className="size-14 text-lg" />
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-snug tracking-tight">{detail.name}</p>
                <p className="truncate text-sm leading-relaxed text-muted-foreground">
                  {detail.universite}
                </p>
                <Badge
                  label={candidateStatusLabels[detail.status].label}
                  tone={tone(detail.status)}
                  className="mt-1"
                />
              </div>
            </div>

            <dl className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs leading-4 text-muted-foreground">Filière</dt>
                <dd className="font-medium leading-snug">{detail.filiere}</dd>
              </div>
              <div>
                <dt className="text-xs leading-4 text-muted-foreground">Niveau d'études</dt>
                <dd className="font-medium leading-snug">{detail.niveau}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs leading-4 text-muted-foreground">Offre concernée</dt>
                <dd className="font-medium leading-snug">{offerTitle(detail.offerId)}</dd>
              </div>
            </dl>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                {isContactVisible("email", detail.status) ? (
                  <Mail className="size-4 text-primary" />
                ) : (
                  <Lock className="size-4 text-muted-foreground" />
                )}
                <h3 className="text-sm font-semibold">
                  {isContactVisible("email", detail.status) ? "Coordonnées" : "Coordonnées masquées"}
                </h3>
              </div>
              {isContactVisible("email", detail.status) ? (
                <div className="mt-2 space-y-1 text-sm">
                  <p className="inline-flex items-center gap-2">
                    <Mail className="size-3.5 text-muted-foreground" /> {detail.email}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Phone className="size-3.5 text-muted-foreground" /> {detail.phone}
                  </p>
                </div>
              ) : (
                <p className="mt-2 max-w-[62ch] text-pretty text-sm leading-relaxed text-muted-foreground">
                  L'e-mail et le téléphone seront révélés lorsque la candidature sera acceptée.
                  Cette règle est centralisée et peut être resserrée sans refonte.
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold">Compétences déclarées</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {detail.competences.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="size-4 text-primary" />
                <span className="font-medium">{detail.cvName}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Téléchargement du CV", { description: detail.cvName })}
              >
                <Download className="mr-1.5 size-3.5" /> Télécharger
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Chronologie des statuts</h3>
              <ol className="mt-2 space-y-2 border-l pl-4">
                {detail.history.map((entry, index) => (
                  <li key={`${entry.status}-${entry.date}-${index}`} className="relative">
                    <span className="absolute -left-[22px] top-1.5 size-2 rounded-full bg-accent ring-2 ring-background" />
                    <p className="text-sm font-medium leading-snug">
                      {candidateStatusLabels[entry.status].label}
                    </p>
                    <p className="text-xs leading-relaxed tabular-nums text-muted-foreground">
                      {fmtDate(entry.date)}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            {detail.status !== "acceptee" && detail.status !== "refusee" && detail.status !== "retiree" && (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatus(detail, "en_attente", "Remise en attente")}
                >
                  Remettre en attente
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatus(detail, "retiree", "Candidature retirée")}
                >
                  Marquer retirée
                </Button>
              </div>
            )}

            {detail.status === "acceptee" && !internFor(detail.id) && (
              <p className="rounded-md bg-accent-soft p-3 text-sm text-primary">
                Candidature acceptée. Le dossier stagiaire sera créé à la prochaine étape.
              </p>
            )}
          </div>
        )}
      </Drawer>

      {/* Confirmation d'acceptation */}
      <Modal
        open={Boolean(acceptTarget)}
        onClose={() => setAcceptTarget(null)}
        title="Accepter la candidature ?"
        description={acceptTarget ? `${acceptTarget.name} — ${offerTitle(acceptTarget.offerId)}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setAcceptTarget(null)}>
              Annuler
            </Button>
            <Button onClick={confirmAccept}>
              <UserCheck className="mr-2 size-4" /> Accepter
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            L'acceptation révèle les coordonnées du candidat et crée un dossier stagiaire avec le
            statut « Affectation à confirmer ».
          </p>
          <p className="rounded-md bg-accent-soft p-3 text-primary">
            Le système expert recommandera ensuite un service. La décision finale vous appartient.
          </p>
        </div>
      </Modal>

      {/* Refus motivé */}
      <Modal
        open={Boolean(refuseTarget)}
        onClose={() => setRefuseTarget(null)}
        title="Refuser la candidature"
        description={refuseTarget ? `${refuseTarget.name} — ${offerTitle(refuseTarget.offerId)}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setRefuseTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmRefuse}>
              <UserX className="mr-2 size-4" /> Confirmer le refus
            </Button>
          </>
        }
      >
        <Field
          label="Motif du refus"
          htmlFor="refus-motif"
          required
          error={refuseError}
          hint="Le motif est enregistré et communiqué au candidat."
        >
          <textarea
            id="refus-motif"
            className={textareaClass}
            value={refuseReason}
            onChange={(event) => setRefuseReason(event.target.value)}
          />
        </Field>
      </Modal>

      {/* Dossier créé */}
      <Modal
        open={Boolean(newInternId)}
        onClose={() => setNewInternId(null)}
        title="Candidature acceptée"
        description="Le dossier stagiaire est créé."
        footer={
          <>
            <Button variant="outline" onClick={() => setNewInternId(null)}>
              Plus tard
            </Button>
            {newInternId && (
              <Button asChild>
                <Link
                  to="/entreprise/stagiaires/$internId"
                  params={{ internId: newInternId }}
                  onClick={() => setNewInternId(null)}
                >
                  Affecter maintenant <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            )}
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Le dossier attend une affectation. Ouvrez-le pour consulter le rapport d'expertise et
          valider le service.
        </p>
      </Modal>

      {/* Planification d'entretien */}
      <Modal
        open={Boolean(interviewFor)}
        onClose={() => setInterviewFor(null)}
        title="Planifier un entretien"
        description={
          interviewFor ? `${interviewFor.name} — ${offerTitle(interviewFor.offerId)}` : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setInterviewFor(null)}>
              Annuler
            </Button>
            <Button onClick={submitInterview}>
              <CalendarPlus className="mr-2 size-4" /> Programmer
            </Button>
          </>
        }
      >
        {interviewFor && (
          <div className="space-y-4">
            <p className="rounded-md bg-accent-soft p-3 text-sm text-primary">
              Le candidat sera notifié et sa candidature passera au statut « En entretien ».
            </p>
            <Field label="Date de l'entretien" htmlFor="entretien-date" required error={interviewError}>
              <input
                id="entretien-date"
                type="date"
                className={inputClass}
                value={interviewForm.date}
                onChange={(event) =>
                  setInterviewForm((current) => ({ ...current, date: event.target.value }))
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Heure" htmlFor="entretien-heure" required>
                <input
                  id="entretien-heure"
                  type="time"
                  className={inputClass}
                  value={interviewForm.time}
                  onChange={(event) =>
                    setInterviewForm((current) => ({ ...current, time: event.target.value }))
                  }
                />
              </Field>
              <Field label="Lieu" htmlFor="entretien-lieu" required>
                <input
                  id="entretien-lieu"
                  className={inputClass}
                  value={interviewForm.location}
                  onChange={(event) =>
                    setInterviewForm((current) => ({ ...current, location: event.target.value }))
                  }
                />
              </Field>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
