import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  Download,
  FileText,
  Inbox,
  Lock,
  Mail,
  Phone,
  Sparkles,
  UserCheck,
  UserSearch,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import {
  ARROW_NUDGE,
  AvatarInitials,
  Badge,
  Drawer,
  EmptyNote,
  Field,
  FilterChips,
  Modal,
  PIPELINE_COLORS,
  PIPELINE_SHORT_LABELS,
  PageIntro,
  SECTION_LINK,
  SearchInput,
  Select,
  StatCard,
  StatusDot,
  rowActionClass,
  textareaClass,
  type Tone,
} from "@/components/company/ui";
import {
  EMPTY_INTERVIEW,
  InterviewFields,
  validateInterview,
  type InterviewDraft,
} from "@/components/company/interview-fields";
import { useCompanyStore } from "@/lib/company-store";
import { fmtDate, relativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  candidateStatusLabels,
  isContactVisible,
  type Candidate,
  type CandidateStatus,
} from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/candidatures")({
  validateSearch: (search: Record<string, unknown>): { q?: string; offre?: string } => ({
    q: typeof search.q === "string" && search.q.trim() ? search.q : undefined,
    offre: typeof search.offre === "string" && search.offre ? search.offre : undefined,
  }),
  head: () => ({
    meta: [{ title: "Candidatures — Espace entreprise" }],
  }),
  component: CompanyApplicationsPage,
});

const tone = (status: CandidateStatus): Tone => candidateStatusLabels[status].tone;

type StatusFilter = CandidateStatus | "toutes";

const STATUS_STEPS: { value: StatusFilter; label: string }[] = [
  { value: "toutes", label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "examen", label: "En examen" },
  { value: "entretien", label: "En entretien" },
  { value: "acceptee", label: "Acceptées" },
  { value: "refusee", label: "Refusées" },
  { value: "retiree", label: "Retirées" },
];

/** Étapes du parcours, dans l'ordre, pour la frise du panneau candidat. */
const JOURNEY: { status: CandidateStatus; label: string }[] = [
  { status: "en_attente", label: "Reçue" },
  { status: "examen", label: "Examen" },
  { status: "entretien", label: "Entretien" },
  { status: "acceptee", label: "Décision" },
];

const isOpen = (status: CandidateStatus) => status === "en_attente" || status === "examen" || status === "entretien";

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("toutes");
  const [search, setSearch] = useState(q ?? "");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [interviewFor, setInterviewFor] = useState<Candidate | null>(null);
  const [interviewForm, setInterviewForm] = useState<InterviewDraft>(EMPTY_INTERVIEW);
  const [interviewErrors, setInterviewErrors] = useState<Partial<Record<keyof InterviewDraft, string>>>({});

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

  const offerOf = (id: string) => offers.find((offer) => offer.id === id);
  const offerTitle = (id: string) => offerOf(id)?.title.replace(/^Stagiaire\s+/i, "") ?? "Offre supprimée";
  const internFor = (candidateId: string) => interns.find((intern) => intern.candidateId === candidateId);

  // Les compteurs suivent le filtre d'offre : ils décrivent ce qu'on regarde.
  const scoped = useMemo(
    () => (offerFilter === "toutes" ? candidates : candidates.filter((candidate) => candidate.offerId === offerFilter)),
    [candidates, offerFilter]
  );

  const counts = useMemo(() => {
    const base: Record<string, number> = { toutes: scoped.length };
    for (const step of STATUS_STEPS) {
      if (step.value !== "toutes") base[step.value] = scoped.filter((candidate) => candidate.status === step.value).length;
    }
    return base;
  }, [scoped]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return scoped
      .filter((candidate) => {
        if (statusFilter !== "toutes" && candidate.status !== statusFilter) return false;
        if (!term) return true;
        return [candidate.name, candidate.filiere, candidate.universite, candidate.niveau, offerTitle(candidate.offerId)].some(
          (value) => value.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  }, [scoped, statusFilter, search, offers]);

  const toReview = scoped.filter((candidate) => candidate.status === "en_attente" || candidate.status === "examen").length;
  const decided = scoped.filter((candidate) => candidate.status === "acceptee" || candidate.status === "refusee");
  const acceptance = decided.length
    ? Math.round((decided.filter((candidate) => candidate.status === "acceptee").length / decided.length) * 100)
    : null;

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
    setInterviewErrors({});
    setInterviewFor(candidate);
  };

  const submitInterview = () => {
    if (!interviewFor) return;
    const errors = validateInterview(interviewForm);
    setInterviewErrors(errors);
    if (Object.keys(errors).length) return;
    scheduleInterview(interviewFor.id, interviewForm.date, interviewForm.time, interviewForm.location);
    toast.success("Entretien programmé", {
      description: `${interviewFor.name} — ${fmtDate(interviewForm.date)} à ${interviewForm.time.replace(":", " h ")}`,
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
    toast.success("Candidature refusée", { description: `${refuseTarget.name} sera informé du motif.` });
    setRefuseTarget(null);
    setRefuseReason("");
    setRefuseError("");
    setDetailId(null);
  };

  /** Prochaine étape d'une candidature : un seul bouton de ligne, discret. */
  const rowAction = (candidate: Candidate) => {
    const intern = candidate.status === "acceptee" ? internFor(candidate.id) : undefined;
    const content = (label: string) => (
      <>
        <span className="hidden whitespace-nowrap sm:inline">{label}</span>
        <ArrowRight className={cn("size-3.5 shrink-0", ARROW_NUDGE)} />
      </>
    );
    if (intern) {
      return (
        <Link
          to="/entreprise/stagiaires/$internId"
          params={{ internId: intern.id }}
          aria-label={`Ouvrir le dossier de ${candidate.name}`}
          className={rowActionClass()}
        >
          {content("Ouvrir le dossier")}
        </Link>
      );
    }
    const action =
      candidate.status === "en_attente"
        ? {
            label: "Examiner",
            run: () => {
              setStatus(candidate, "examen", "Profil en cours d'examen");
              setDetailId(candidate.id);
            },
          }
        : candidate.status === "examen"
          ? { label: "Convoquer", run: () => openInterview(candidate) }
          : candidate.status === "entretien"
            ? { label: "Décider", run: () => setDetailId(candidate.id) }
            : { label: "Voir le profil", run: () => setDetailId(candidate.id) };
    return (
      <button
        type="button"
        onClick={action.run}
        aria-label={`${action.label} — ${candidate.name}`}
        className={rowActionClass()}
      >
        {content(action.label)}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <PageIntro desc="Examinez, convoquez puis décidez : chaque candidature avance d'une étape à la fois." />

      {/* Indicateurs : ils filtrent la liste */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard
            key="recues"
            label="Candidatures reçues"
            value={scoped.length}
            icon={Inbox}
            motion="bounce"
            foot={offerFilter === "toutes" ? "toutes offres confondues" : offerTitle(offerFilter)}
          />,
          <StatCard
            key="examiner"
            label="À examiner"
            value={toReview}
            icon={UserSearch}
            motion="pop"
            foot={toReview ? "en attente de votre décision" : "rien en attente"}
            tone={toReview ? "alert" : "neutral"}
          />,
          <StatCard
            key="entretien"
            label="En entretien"
            value={counts.entretien ?? 0}
            icon={CalendarPlus}
            motion="tilt"
            foot="décision attendue après l'entretien"
          />,
          <StatCard
            key="taux"
            label="Taux d'acceptation"
            value={acceptance ?? 0}
            suffix={acceptance === null ? undefined : " %"}
            icon={UserCheck}
            motion="bounce"
            foot={acceptance === null ? "aucune décision prise" : `sur ${decided.length} décision${decided.length > 1 ? "s" : ""} prise${decided.length > 1 ? "s" : ""}`}
            tone={acceptance !== null && acceptance >= 50 ? "trend" : "neutral"}
          />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      {/* Liste : une carte, des lignes séparées par un filet */}
      <Reveal as="section" delay={120} className="card-surface overflow-hidden" aria-labelledby="candidatures-titre">
        <div className="space-y-3 border-b px-5 pb-3.5 pt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 id="candidatures-titre" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Candidatures
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {filtered.length}
              </span>
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <SearchInput
                id="filtre-recherche"
                label="Rechercher une candidature"
                placeholder="Nom, filière, université…"
                value={search}
                onChange={setSearch}
                className="sm:w-64"
              />
              <div className="sm:w-56">
                <Select
                  id="filtre-offre"
                  aria-label="Filtrer par offre"
                  value={offerFilter}
                  onChange={(event) => setOfferFilter(event.target.value)}
                  className="h-9"
                >
                  <option value="toutes">Toutes les offres</option>
                  {offers.map((offer) => (
                    <option key={offer.id} value={offer.id}>
                      {offer.title.replace(/^Stagiaire\s+/i, "")}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
          <FilterChips
            label="Filtrer par étape"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_STEPS.map((step) => ({
              value: step.value,
              label: step.label,
              count: counts[step.value] ?? 0,
              dot: step.value === "toutes" ? undefined : step.value,
            }))}
            className="-mx-1"
          />
        </div>
        <p className="sr-only" aria-live="polite">
          {`${filtered.length} candidature${filtered.length > 1 ? "s" : ""} affichée${filtered.length > 1 ? "s" : ""}`}
        </p>

        {filtered.length === 0 ? (
          <div className="pb-8">
            <EmptyNote
              icon={Users}
              title="Aucune candidature ne correspond"
              desc="Changez de filtre ou effacez la recherche."
              className="pb-4"
            />
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("toutes");
                  setOfferFilter("toutes");
                  setSearch("");
                }}
                className={SECTION_LINK}
              >
                Tout afficher
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((candidate, index) => {
              const contact = isContactVisible("email", candidate.status);
              return (
                <Reveal
                  as="li"
                  key={candidate.id}
                  delay={index < 8 ? 160 + index * 40 : 0}
                  className="group relative grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5 transition-colors duration-150 hover:bg-muted/50 md:grid-cols-[36px_minmax(0,1.5fr)_minmax(0,1.2fr)_8.5rem_auto]"
                >
                  <AvatarInitials initials={candidate.initials} />

                  {/* Qui : le nom ouvre le profil, toute la ligne est cliquable */}
                  <div className="min-w-0">
                    <p className="flex min-w-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailId(candidate.id)}
                        className="truncate text-left text-sm font-semibold transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-primary focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
                      >
                        {candidate.name}
                      </button>
                      {!contact && (
                        <Lock className="size-3 shrink-0 text-muted-foreground/70" aria-label="Coordonnées masquées" />
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {candidate.filiere} · {candidate.niveau}
                      <span className="md:hidden"> · {offerTitle(candidate.offerId)}</span>
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground md:hidden">
                      <StatusDot status={candidate.status} />
                      {PIPELINE_SHORT_LABELS[candidate.status]} · {relativeDay(candidate.appliedAt)}
                    </p>
                  </div>

                  {/* Pour quelle offre, et depuis quand */}
                  <div className="hidden min-w-0 md:block">
                    <p className="truncate text-[13px]">{offerTitle(candidate.offerId)}</p>
                    <p className="truncate text-xs text-muted-foreground">{candidate.universite}</p>
                  </div>

                  <div className="hidden min-w-0 flex-col items-start gap-1 md:flex">
                    <Badge label={candidateStatusLabels[candidate.status].label} tone={tone(candidate.status)} className="whitespace-nowrap" />
                    <span className="text-xs tabular-nums text-muted-foreground">{relativeDay(candidate.appliedAt)}</span>
                  </div>

                  <div className="relative z-10">{rowAction(candidate)}</div>
                </Reveal>
              );
            })}
          </ul>
        )}
      </Reveal>

      {/* Panneau candidat */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail?.name ?? "Profil du candidat"}
        description={detail ? `Candidature à ${offerOf(detail.offerId)?.title ?? "une offre supprimée"}` : undefined}
        footer={
          detail &&
          (isOpen(detail.status) ? (
            <>
              <Button variant="outline" onClick={() => setRefuseTarget(detail)} className="text-destructive hover:text-destructive">
                <UserX className="mr-2 size-4" /> Refuser
              </Button>
              {detail.status !== "entretien" && (
                <Button variant="outline" onClick={() => openInterview(detail)}>
                  <CalendarPlus className="mr-2 size-4" /> Convoquer
                </Button>
              )}
              <Button onClick={() => setAcceptTarget(detail)}>
                <UserCheck className="mr-2 size-4" /> Accepter
              </Button>
            </>
          ) : detail.status === "acceptee" && internFor(detail.id) ? (
            <Button asChild className="group">
              <Link to="/entreprise/stagiaires/$internId" params={{ internId: internFor(detail.id)!.id }}>
                Ouvrir le dossier stagiaire <ArrowRight className={cn("ml-2 size-4", ARROW_NUDGE)} />
              </Link>
            </Button>
          ) : null)
        }
      >
        {detail &&
          (() => {
            const offer = offerOf(detail.offerId);
            const wanted = new Set((offer?.skills ?? []).map((skill) => skill.toLowerCase()));
            const matched = detail.competences.filter((skill) => wanted.has(skill.toLowerCase())).length;
            const contact = isContactVisible("email", detail.status);
            const reached = JOURNEY.findIndex((step) => step.status === detail.status);
            const lastIndex = reached >= 0 ? reached : JOURNEY.length - 1;
            return (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <AvatarInitials initials={detail.initials} className="size-12 text-base" />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-tight">{detail.universite}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge label={candidateStatusLabels[detail.status].label} tone={tone(detail.status)} />
                      <span className="text-xs text-muted-foreground">déposée {relativeDay(detail.appliedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Frise du parcours, aux couleurs du pipeline */}
                <ol className="grid grid-cols-4 gap-1.5" aria-label="Avancement de la candidature">
                  {JOURNEY.map((step, index) => {
                    const final = index === JOURNEY.length - 1 && (detail.status === "refusee" || detail.status === "retiree");
                    const done = index <= lastIndex;
                    const color = final ? PIPELINE_COLORS[detail.status] : PIPELINE_COLORS[step.status];
                    const label = final ? candidateStatusLabels[detail.status].label : step.label;
                    return (
                      <li key={step.status} className="min-w-0" aria-current={index === lastIndex ? "step" : undefined}>
                        <span
                          className="block h-1.5 rounded-full transition-colors"
                          style={{ background: done ? color : "hsl(var(--muted))" }}
                        />
                        <span className={cn("mt-1.5 block truncate text-xs", index === lastIndex ? "font-semibold text-foreground" : "text-muted-foreground")}>
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <dl className="grid grid-cols-2 gap-y-4 rounded-xl border py-3.5 sm:divide-x">
                  {[
                    { label: "Filière", value: detail.filiere },
                    { label: "Niveau d'études", value: detail.niveau },
                  ].map((fact) => (
                    <div key={fact.label} className="min-w-0 px-4">
                      <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                      <dd className="mt-0.5 truncate text-[13px] font-medium">{fact.value}</dd>
                    </div>
                  ))}
                </dl>

                <section>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[13px] font-semibold">Compétences déclarées</h3>
                    {offer && offer.skills.length > 0 && (
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Sparkles className="size-3 text-primary" />
                        <span className="font-semibold tabular-nums text-primary">
                          {matched}/{offer.skills.length}
                        </span>{" "}
                        attendues par l'offre
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {detail.competences.map((skill) => {
                      const hit = wanted.has(skill.toLowerCase());
                      return (
                        <span
                          key={skill}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs",
                            hit ? "bg-primary-soft font-medium text-primary" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {hit && <Check className="size-3" aria-label="attendue par l'offre" />}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="text-[13px] font-semibold">Coordonnées</h3>
                  {contact ? (
                    <ul className="mt-2 space-y-1.5 text-[13px]">
                      <li>
                        <a href={`mailto:${detail.email}`} className="inline-flex items-center gap-2 text-foreground hover:text-primary">
                          <Mail className="size-3.5 text-muted-foreground" /> {detail.email}
                        </a>
                      </li>
                      <li>
                        <a href={`tel:${detail.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-foreground hover:text-primary">
                          <Phone className="size-3.5 text-muted-foreground" /> {detail.phone}
                        </a>
                      </li>
                    </ul>
                  ) : (
                    <p className="mt-1.5 flex items-start gap-2 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                      <Lock className="mt-0.5 size-3.5 shrink-0" />
                      L'e-mail et le téléphone seront révélés à l'acceptation de la candidature.
                    </p>
                  )}
                </section>

                <section className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                  <span className="flex min-w-0 items-center gap-2.5 text-[13px]">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{detail.cvName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toast.success("Téléchargement du CV", { description: detail.cvName })}
                    className={SECTION_LINK}
                  >
                    <Download className="size-3.5" /> Télécharger
                  </button>
                </section>

                <section>
                  <h3 className="text-[13px] font-semibold">Historique</h3>
                  <ol className="mt-3 space-y-3">
                    {[...detail.history].reverse().map((entry, index) => (
                      <li key={`${entry.status}-${entry.date}-${index}`} className="flex gap-3">
                        <StatusDot status={entry.status} className="mt-1.5" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium leading-snug">{candidateStatusLabels[entry.status].label}</p>
                          <p className="text-xs leading-relaxed tabular-nums text-muted-foreground">
                            {fmtDate(entry.date)}
                            {entry.note ? ` · ${entry.note}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                {isOpen(detail.status) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-4 text-xs">
                    {detail.status !== "en_attente" && (
                      <button
                        type="button"
                        onClick={() => setStatus(detail, "en_attente", "Remise en attente")}
                        className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        Remettre en attente
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStatus(detail, "retiree", "Candidature retirée")}
                      className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Marquer comme retirée
                    </button>
                  </div>
                )}

                {detail.status === "acceptee" && !internFor(detail.id) && (
                  <p className="rounded-lg bg-primary-soft px-4 py-3 text-[13px] text-primary">
                    Candidature acceptée. Le dossier stagiaire sera créé à la prochaine étape.
                  </p>
                )}
              </div>
            );
          })()}
      </Drawer>

      {/* Confirmation d'acceptation */}
      <Modal
        open={Boolean(acceptTarget)}
        onClose={() => setAcceptTarget(null)}
        icon={UserCheck}
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
        <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            L'acceptation révèle les coordonnées du candidat et crée son dossier stagiaire, avec une affectation à
            confirmer.
          </p>
          <p className="flex items-start gap-2 rounded-lg bg-primary-soft px-4 py-3 text-primary">
            <Sparkles className="mt-0.5 size-3.5 shrink-0" />
            Le système expert recommandera ensuite un service. La décision finale vous appartient.
          </p>
        </div>
      </Modal>

      {/* Refus motivé */}
      <Modal
        open={Boolean(refuseTarget)}
        onClose={() => setRefuseTarget(null)}
        icon={UserX}
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
            placeholder="Ex. Le niveau d'études ne correspond pas à celui demandé."
            value={refuseReason}
            onChange={(event) => {
              setRefuseReason(event.target.value);
              if (refuseError && event.target.value.trim()) setRefuseError("");
            }}
          />
        </Field>
      </Modal>

      {/* Dossier créé */}
      <Modal
        open={Boolean(newInternId)}
        onClose={() => setNewInternId(null)}
        icon={UserCheck}
        title="Candidature acceptée"
        description="Le dossier stagiaire est créé."
        footer={
          <>
            <Button variant="outline" onClick={() => setNewInternId(null)}>
              Plus tard
            </Button>
            {newInternId && (
              <Button asChild className="group">
                <Link to="/entreprise/stagiaires/$internId" params={{ internId: newInternId }} onClick={() => setNewInternId(null)}>
                  Affecter maintenant <ArrowRight className={cn("ml-2 size-4", ARROW_NUDGE)} />
                </Link>
              </Button>
            )}
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Le dossier attend une affectation. Ouvrez-le pour consulter le rapport d'expertise et valider le service.
        </p>
      </Modal>

      {/* Planification d'entretien */}
      <Modal
        open={Boolean(interviewFor)}
        onClose={() => setInterviewFor(null)}
        icon={CalendarPlus}
        title="Convoquer à un entretien"
        description={interviewFor ? `${interviewFor.name} — ${offerTitle(interviewFor.offerId)}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setInterviewFor(null)}>
              Annuler
            </Button>
            <Button onClick={submitInterview}>
              <CalendarPlus className="mr-2 size-4" /> Programmer l'entretien
            </Button>
          </>
        }
      >
        {interviewFor && (
          <div className="space-y-4">
            <InterviewFields
              value={interviewForm}
              onChange={(patch) => {
                setInterviewForm((current) => ({ ...current, ...patch }));
                setInterviewErrors((current) => {
                  const next = { ...current };
                  (Object.keys(patch) as (keyof InterviewDraft)[]).forEach((key) => delete next[key]);
                  return next;
                });
              }}
              errors={interviewErrors}
            />
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
              Le candidat est notifié et sa candidature passe à l'étape « En entretien ».
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
