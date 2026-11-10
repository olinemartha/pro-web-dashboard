import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CalendarDays,
  Check,
  Clock,
  FileText,
  GraduationCap,
  Inbox,
  MapPin,
  Pencil,
  Plus,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ARROW_NUDGE,
  ActionMenu,
  Badge,
  CARD_INTERACTIVE,
  EmptyNote,
  Field,
  FilterChips,
  MenuItem,
  Modal,
  PIPELINE_ORDER,
  PIPELINE_SHORT_LABELS,
  PageIntro,
  PipelineBar,
  SECTION_LINK,
  SearchInput,
  Select,
  StatCard,
  StatusDot,
  inputClass,
  textareaClass,
  type Tone,
} from "@/components/company/ui";
import { Reveal } from "@/components/ui/motion";
import { DatePicker } from "@/components/company/date-picker";
import { TagInput } from "@/components/company/tag-input";
import { useCompanyStore } from "@/lib/company-store";
import { daysFromToday, fmtDate, localIsoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  offerStatusLabels,
  type CandidateStatus,
  type CompanyOffer,
  type OfferStatus,
} from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/offres")({
  validateSearch: (search: Record<string, unknown>): { nouveau?: boolean; offre?: string } => ({
    // Le routeur lit « ?nouveau=1 » comme le nombre 1.
    nouveau: search.nouveau === true || search.nouveau === 1 || search.nouveau === "1" ? true : undefined,
    // « ?offre=o1 » ouvre directement le détail de l'offre (depuis la recherche).
    offre: typeof search.offre === "string" && search.offre ? search.offre : undefined,
  }),
  head: () => ({
    meta: [{ title: "Mes offres — Espace entreprise" }],
  }),
  component: CompanyOffersPage,
});

const tone = (status: OfferStatus): Tone => offerStatusLabels[status].tone;

/** Une offre publiée « clôture bientôt » sous ce nombre de jours. */
const CLOSING_DAYS = 14;

const FILTERS: { value: OfferStatus | "tous"; label: string }[] = [
  { value: "tous", label: "Toutes" },
  { value: "publiee", label: "Publiées" },
  { value: "brouillon", label: "Brouillons" },
  { value: "cloturee", label: "Clôturées" },
  { value: "desactivee", label: "Désactivées" },
];

interface OfferForm {
  title: string;
  department: string;
  location: string;
  type: string;
  duration: string;
  level: string;
  deadline: string;
  description: string;
  missions: string;
  skills: string[];
  status: OfferStatus;
}

/** Aucun champ prérempli : chaque valeur publiée a été choisie. */
const EMPTY_FORM: OfferForm = {
  title: "",
  department: "",
  location: "",
  type: "",
  duration: "",
  level: "",
  deadline: "",
  description: "",
  missions: "",
  skills: [],
  status: "brouillon",
};

const TYPES = ["Stage académique", "Stage professionnel", "Stage de fin d'études"];
const LEVELS = ["Licence (L2)", "Licence (L3)", "Master (M1)", "Master (M2)"];
const DURATIONS = ["1 mois", "2 mois", "3 mois", "4 mois", "5 mois", "6 mois"];

/** Ordre des champs à l'écran : le focus va au premier champ en erreur. */
const FIELD_ORDER: { key: keyof OfferForm; id: string }[] = [
  { key: "title", id: "offre-titre" },
  { key: "department", id: "offre-service" },
  { key: "location", id: "offre-lieu" },
  { key: "type", id: "offre-type" },
  { key: "level", id: "offre-niveau" },
  { key: "duration", id: "offre-duree" },
  { key: "deadline", id: "offre-deadline" },
  { key: "description", id: "offre-description" },
];

/** Garde l'option actuelle d'une offre existante même si elle sort de la liste. */
function withCurrent(options: string[], current: string) {
  return current && !options.includes(current) ? [current, ...options] : options;
}

function toForm(offer: CompanyOffer): OfferForm {
  return {
    title: offer.title,
    department: offer.department,
    location: offer.location,
    type: offer.type,
    duration: offer.duration,
    level: offer.level,
    deadline: offer.deadline,
    description: offer.description,
    missions: offer.missions.join("\n"),
    skills: [...offer.skills],
    status: offer.status,
  };
}

function CompanyOffersPage() {
  const { offers, candidates, services, addOffer, updateOffer, setOfferStatus } = useCompanyStore();
  const { nouveau, offre } = Route.useSearch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<OfferStatus | "tous">("tous");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OfferForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (!nouveau) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
    navigate({ to: "/entreprise/offres", search: { nouveau: false }, replace: true });
  }, [nouveau, navigate]);

  useEffect(() => {
    if (!offre) return;
    setDetailId(offre);
    navigate({ to: "/entreprise/offres", search: {}, replace: true });
  }, [offre, navigate]);

  const closingSoon = useMemo(
    () =>
      offers.filter((offer) => {
        const left = daysFromToday(offer.deadline);
        return offer.status === "publiee" && left >= 0 && left <= CLOSING_DAYS;
      }),
    [offers]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base =
      filter === "tous" ? offers : offers.filter((offer) => offer.status === filter);
    if (!term) return base;
    return base.filter((offer) =>
      [offer.title, offer.department, offer.location, ...offer.skills].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [offers, filter, search, closingSoon]);

  const statusCount = (status: OfferStatus) => offers.filter((offer) => offer.status === status).length;
  const activeCandidates = candidates.filter((candidate) => candidate.status !== "retiree");
  const toReview = activeCandidates.filter(
    (candidate) => candidate.status === "en_attente" || candidate.status === "examen"
  ).length;
  // Un indicateur déjà actif remet la liste à « Toutes ».
  const detail = offers.find((offer) => offer.id === detailId) ?? null;
  // Suggestions de compétences : celles déjà utilisées dans vos offres.
  const skillSuggestions = useMemo(
    () => Array.from(new Set(offers.flatMap((offer) => offer.skills))).sort((x, y) => x.localeCompare(y, "fr")),
    [offers]
  );

  const countsFor = (offerId: string) => {
    const counts: Partial<Record<CandidateStatus, number>> = {};
    candidates
      .filter((candidate) => candidate.offerId === offerId)
      .forEach((candidate) => {
        counts[candidate.status] = (counts[candidate.status] ?? 0) + 1;
      });
    return counts;
  };

  /** « Clôture dans 19 j », « Clôture aujourd'hui », « Clôturée le 4 nov. ». */
  const deadlineLabel = (offer: CompanyOffer) => {
    if (!offer.deadline) return "Sans date limite";
    const left = daysFromToday(offer.deadline);
    if (offer.status === "cloturee" || left < 0) return `Clôturée le ${fmtDate(offer.deadline, false)}`;
    if (left === 0) return "Clôture aujourd'hui";
    if (left === 1) return "Clôture demain";
    return `Clôture dans ${left} j`;
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (offer: CompanyOffer) => {
    setEditingId(offer.id);
    setForm(toForm(offer));
    setErrors({});
    setDetailId(null);
    setFormOpen(true);
  };

  const validate = (values: OfferForm) => {
    const next: Record<string, string> = {};
    if (!values.title.trim()) next.title = "Le titre de l'offre est obligatoire.";
    if (!values.department.trim()) next.department = "Précisez le service concerné.";
    if (!values.location.trim()) next.location = "Indiquez le lieu du stage.";
    if (!values.type) next.type = "Choisissez le type de stage.";
    if (!values.level) next.level = "Choisissez le niveau requis.";
    if (!values.duration) next.duration = "Choisissez la durée du stage.";
    if (!values.deadline) next.deadline = "La date limite de candidature est obligatoire.";
    else if (!editingId && daysFromToday(values.deadline) < 1)
      next.deadline = "Choisissez une date à partir de demain.";
    if (!values.description.trim()) next.description = "Ajoutez une description de l'offre.";
    return next;
  };

  const set = (patch: Partial<OfferForm>) =>
    setForm((current) => {
      const next = { ...current, ...patch };
      // Après une première tentative, chaque erreur disparaît dès qu'elle est corrigée.
      if (Object.keys(errors).length > 0) {
        const fresh = validate(next);
        setErrors((previous) =>
          Object.fromEntries(Object.keys(previous).filter((key) => fresh[key]).map((key) => [key, fresh[key]]))
        );
      }
      return next;
    });

  const submit = (status: OfferStatus = form.status) => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field.key]);
    if (firstInvalid) {
      const element = document.getElementById(firstInvalid.id);
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: "center", behavior: "smooth" });
      const count = Object.keys(nextErrors).length;
      toast.error("Formulaire incomplet", {
        description: `${count} champ${count > 1 ? "s" : ""} à compléter, signalé${count > 1 ? "s" : ""} en rouge.`,
      });
      return;
    }

    const payload = {
      title: form.title.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      type: form.type,
      duration: form.duration,
      level: form.level,
      deadline: form.deadline,
      description: form.description.trim(),
      missions: form.missions
        .split("\n")
        .map((mission) => mission.trim())
        .filter(Boolean),
      skills: form.skills,
      status,
    };

    if (editingId) {
      const previous = offers.find((offer) => offer.id === editingId);
      updateOffer(editingId, payload);
      if (previous && previous.applicationsCount > 0) {
        toast.success("Offre modifiée", {
          description:
            previous.applicationsCount > 1
              ? `Les ${previous.applicationsCount} candidats concernés seront prévenus de la modification.`
              : "Le candidat concerné sera prévenu de la modification.",
        });
      } else {
        toast.success("Offre modifiée");
      }
    } else {
      addOffer(payload);
      toast.success(status === "publiee" ? "Offre publiée" : "Offre enregistrée en brouillon", {
        description: form.title,
      });
    }
    setFormOpen(false);
  };

  const changeStatus = (offer: CompanyOffer, status: OfferStatus) => {
    // Une offre ne repasse pas en ligne avec une date limite déjà passée : on demande d'abord une nouvelle date.
    if (status === "publiee" && (!offer.deadline || daysFromToday(offer.deadline) < 0)) {
      setEditingId(offer.id);
      setForm({ ...toForm(offer), deadline: "", status: "publiee" });
      setErrors({ deadline: "La date limite est passée : choisissez une nouvelle date pour remettre l'offre en ligne." });
      setDetailId(null);
      setFormOpen(true);
      toast.info("Date limite dépassée", { description: "Choisissez une nouvelle date, puis enregistrez." });
      return;
    }
    setOfferStatus(offer.id, status);
    const messages: Record<OfferStatus, string> = {
      brouillon: "Offre repassée en brouillon",
      publiee: "Offre publiée",
      cloturee: "Offre clôturée",
      desactivee: "Offre désactivée",
    };
    toast.success(messages[status], {
      description:
        offer.applicationsCount > 0
          ? offer.applicationsCount > 1
            ? `Les ${offer.applicationsCount} candidats concernés recevront une notification.`
            : "Le candidat concerné recevra une notification."
          : offer.title,
    });
  };

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Publiez, suivez et clôturez vos offres de stage. Chaque offre montre où en sont ses candidats."
        action={
          <Button onClick={openCreate} className="group">
            <Plus className="mr-2 size-4 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:rotate-90 motion-reduce:transition-none" />
            Publier une offre
          </Button>
        }
      />

      {/* Indicateurs : les deux premiers et le dernier filtrent la liste */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard
            key="publiees"
            label="Offres publiées"
            value={statusCount("publiee")}
            icon={Briefcase}
            motion="lift"
            foot={`sur ${offers.length} offre${offers.length > 1 ? "s" : ""} créée${offers.length > 1 ? "s" : ""}`}
          />,
          <StatCard
            key="brouillons"
            label="Brouillons"
            value={statusCount("brouillon")}
            icon={FileText}
            motion="lift"
            foot={statusCount("brouillon") ? "à compléter puis publier" : "aucun brouillon en cours"}
          />,
          <StatCard
            key="candidatures"
            label="Candidatures reçues"
            value={activeCandidates.length}
            icon={Inbox}
            motion="bounce"
            foot={toReview ? `${toReview} à examiner` : "aucune en attente"}
            tone={toReview ? "alert" : "neutral"}
          />,
          <StatCard
            key="bientot"
            label="Clôture proche"
            value={closingSoon.length}
            icon={CalendarClock}
            motion="tilt"
            foot={closingSoon.length ? `sous ${CLOSING_DAYS} jours` : `aucune sous ${CLOSING_DAYS} jours`}
            tone={closingSoon.length ? "alert" : "neutral"}
          />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          label="Filtrer les offres par statut"
          value={filter}
          onChange={(value) => setFilter(value)}
          options={FILTERS.map((entry) => ({
            value: entry.value,
            label: entry.label,
            count: entry.value === "tous" ? offers.length : statusCount(entry.value),
          }))}
        />
        <SearchInput
          id="offres-recherche"
          label="Rechercher une offre"
          placeholder="Rechercher une offre"
          value={search}
          onChange={setSearch}
          className="w-full sm:w-64"
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {`${filtered.length} offre${filtered.length > 1 ? "s" : ""} affichée${filtered.length > 1 ? "s" : ""}`}
      </p>

      {filtered.length === 0 ? (
        <div className="card-surface">
          <EmptyNote
            icon={Briefcase}
            title={search ? "Aucune offre ne correspond à votre recherche" : "Aucune offre dans cette catégorie"}
            desc={search ? "Essayez un autre mot-clé." : "Changez de filtre ou publiez une nouvelle offre."}
            className="py-12"
          />
          {(filter !== "tous" || search) && (
            <div className="-mt-6 flex justify-center pb-10">
              <button
                type="button"
                onClick={() => {
                  setFilter("tous");
                  setSearch("");
                }}
                className={SECTION_LINK}
              >
                Tout afficher
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {filtered.map((offer, index) => {
            const counts = countsFor(offer.id);
            const total = PIPELINE_ORDER.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
            const left = daysFromToday(offer.deadline);
            const urgent = offer.status === "publiee" && left >= 0 && left <= CLOSING_DAYS;
            return (
              <Reveal key={offer.id} delay={index < 6 ? 80 + index * 50 : 0} className="min-w-0">
                <article className={cn(CARD_INTERACTIVE, "relative flex h-full cursor-pointer flex-col p-5")}>
                  {/* En-tête : titre (ouvre le détail, toute la carte est cliquable) et statut */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-pretty text-[15px] font-semibold leading-snug tracking-tight">
                        <button
                          type="button"
                          onClick={() => setDetailId(offer.id)}
                          aria-label={`${offer.title} — ouvrir le détail`}
                          className="text-left transition-colors after:absolute after:inset-0 after:rounded-xl after:content-[''] group-hover:text-primary focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
                        >
                          {offer.title}
                        </button>
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{offer.department}</p>
                    </div>
                    <Badge label={offerStatusLabels[offer.status].label} tone={tone(offer.status)} className="shrink-0" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" /> {offer.location || "Lieu à préciser"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {offer.duration || "Durée à préciser"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="size-3.5" /> {offer.level || "Niveau à préciser"}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                    {offer.description}
                  </p>

                  {offer.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {offer.skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-primary">
                          {skill}
                        </span>
                      ))}
                      {offer.skills.length > 4 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          +{offer.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Candidats de l'offre : la même gamme que le pipeline du tableau de bord */}
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px]">
                        <span className="font-semibold tabular-nums">{total}</span>{" "}
                        <span className="text-muted-foreground">candidature{total > 1 ? "s" : ""}</span>
                      </p>
                      <p
                        className={cn(
                          "inline-flex items-center gap-1 whitespace-nowrap text-xs tabular-nums",
                          urgent ? "font-semibold text-warning" : "text-muted-foreground"
                        )}
                      >
                        {urgent && <Clock className="size-3" />}
                        {deadlineLabel(offer)}
                      </p>
                    </div>
                    <PipelineBar counts={counts} className="mt-2.5" />
                    {total > 0 && (
                      <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {PIPELINE_ORDER.filter((status) => counts[status]).map((status) => (
                          <li key={status} className="inline-flex items-center gap-1.5">
                            <StatusDot status={status} />
                            <span className="font-medium tabular-nums text-foreground">{counts[status]}</span>
                            {PIPELINE_SHORT_LABELS[status].toLowerCase()}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Actions : au-dessus du lien étiré */}
                  <div className="relative z-10 mt-auto flex items-center gap-2 pt-4">
                    {offer.status === "publiee" && (
                      <Link to="/entreprise/candidatures" search={{ offre: offer.id }} className={SECTION_LINK}>
                        Voir les candidatures
                        <ArrowRight className={cn("size-3.5", ARROW_NUDGE)} />
                      </Link>
                    )}
                    {offer.status === "brouillon" && (
                      <Button size="sm" onClick={() => changeStatus(offer, "publiee")} className="group/send">
                        <Send className="mr-1.5 size-3.5 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover/send:-translate-y-px group-hover/send:translate-x-0.5 motion-reduce:transition-none" />
                        Publier
                      </Button>
                    )}
                    {offer.status === "desactivee" && (
                      <button type="button" onClick={() => changeStatus(offer, "publiee")} className={SECTION_LINK}>
                        Réactiver
                      </button>
                    )}
                    <div className="ml-auto">
                      <ActionMenu>
                        <MenuItem onSelect={() => openEdit(offer)}>
                          <Pencil className="size-3.5" /> Modifier
                        </MenuItem>
                        {offer.status !== "cloturee" && (
                          <MenuItem onSelect={() => changeStatus(offer, "cloturee")}>Clôturer l'offre</MenuItem>
                        )}
                        {offer.status === "publiee" && (
                          <MenuItem onSelect={() => changeStatus(offer, "desactivee")}>Désactiver</MenuItem>
                        )}
                        {offer.status === "cloturee" && (
                          <MenuItem onSelect={() => changeStatus(offer, "publiee")}>Rouvrir</MenuItem>
                        )}
                      </ActionMenu>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}

      {/* Formulaire */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        icon={editingId ? Pencil : Briefcase}
        title={editingId ? "Modifier l'offre" : "Publier une offre de stage"}
        description={
          editingId
            ? "Les candidats déjà inscrits seront informés de vos modifications."
            : "Rien n'est visible par les étudiants tant que vous n'avez pas publié."
        }
        wide
        footer={
          <>
            <p className="hidden min-w-0 items-center gap-1.5 text-xs text-muted-foreground sm:mr-auto sm:flex">
              {form.deadline && daysFromToday(form.deadline) >= 1 ? (
                <>
                  <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">Clôture le {fmtDate(form.deadline)}</span>
                </>
              ) : (
                <span className="truncate">* Champs obligatoires</span>
              )}
            </p>
            {editingId ? (
              <>
                <Button variant="outline" onClick={() => setFormOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => submit()}>Enregistrer les modifications</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => submit("brouillon")}>
                  Enregistrer en brouillon
                </Button>
                <Button onClick={() => submit("publiee")} className="group">
                  <Send className="mr-2 size-4 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:-translate-y-px group-hover:translate-x-0.5 motion-reduce:transition-none" />
                  Publier l'offre
                </Button>
              </>
            )}
          </>
        }
      >
        <div className="divide-y">
          <FormSection title="L'offre" desc="Ce que les étudiants voient en premier.">
            <Field label="Titre de l'offre" htmlFor="offre-titre" required error={errors.title} className="sm:col-span-2">
              <input
                id="offre-titre"
                data-autofocus
                className={inputClass}
                placeholder="Ex. Stagiaire Analyste Crédit"
                value={form.title}
                onChange={(event) => set({ title: event.target.value })}
              />
            </Field>
            <Field label="Service d'accueil" htmlFor="offre-service" required error={errors.department}>
              <input
                id="offre-service"
                className={inputClass}
                placeholder="Ex. Direction Crédit"
                list="offre-services"
                autoComplete="off"
                value={form.department}
                onChange={(event) => set({ department: event.target.value })}
              />
            </Field>
            <Field label="Lieu du stage" htmlFor="offre-lieu" required error={errors.location}>
              <input
                id="offre-lieu"
                className={inputClass}
                placeholder="Ex. Kinshasa, Gombe"
                value={form.location}
                onChange={(event) => set({ location: event.target.value })}
              />
            </Field>
            <datalist id="offre-services">
              {services.map((service) => (
                <option key={service.id} value={service.name} />
              ))}
            </datalist>
          </FormSection>

          <FormSection title="Conditions" desc="Le cadre du stage proposé.">
            <Field label="Type de stage" htmlFor="offre-type" required error={errors.type}>
              <Select
                id="offre-type"
                placeholder="Choisir un type"
                value={form.type}
                onChange={(event) => set({ type: event.target.value })}
              >
                {withCurrent(TYPES, form.type).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </Field>
            <Field label="Niveau requis" htmlFor="offre-niveau" required error={errors.level}>
              <Select
                id="offre-niveau"
                placeholder="Choisir un niveau"
                value={form.level}
                onChange={(event) => set({ level: event.target.value })}
              >
                {withCurrent(LEVELS, form.level).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </Field>
            <Field label="Durée" htmlFor="offre-duree" required error={errors.duration}>
              <Select
                id="offre-duree"
                placeholder="Choisir une durée"
                value={form.duration}
                onChange={(event) => set({ duration: event.target.value })}
              >
                {withCurrent(DURATIONS, form.duration).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </Field>
            <Field
              label="Date limite de candidature"
              htmlFor="offre-deadline"
              required
              error={errors.deadline}
              hint={
                form.deadline && daysFromToday(form.deadline) >= 1
                  ? `Les candidatures ferment dans ${daysFromToday(form.deadline)} jour${daysFromToday(form.deadline) > 1 ? "s" : ""}.`
                  : undefined
              }
            >
              <DatePicker
                id="offre-deadline"
                min={editingId ? undefined : localIsoDate(new Date(Date.now() + 86_400_000))}
                value={form.deadline}
                onChange={(deadline) => set({ deadline })}
              />
            </Field>
          </FormSection>

          <FormSection title="Contenu" desc="Missions et compétences alimentent aussi le système expert.">
            <Field label="Description" htmlFor="offre-description" required error={errors.description} className="sm:col-span-2">
              <textarea
                id="offre-description"
                className={cn(textareaClass, "min-h-[120px]")}
                placeholder="Présentez la mission, l'équipe d'accueil et ce que le stagiaire apprendra."
                value={form.description}
                onChange={(event) => set({ description: event.target.value })}
              />
            </Field>
            <Field label="Missions" htmlFor="offre-missions" hint="Une mission par ligne." className="sm:col-span-2">
              <textarea
                id="offre-missions"
                className={textareaClass}
                placeholder={"Ex. Analyser les dossiers de crédit\nParticiper aux visites terrain"}
                value={form.missions}
                onChange={(event) => set({ missions: event.target.value })}
              />
            </Field>
            <TagInput
              id="offre-skills"
              label="Compétences recherchées"
              value={form.skills}
              onChange={(skills) => set({ skills })}
              suggestions={skillSuggestions}
              addPlaceholder="Ajouter une compétence"
              hint="Appuyez sur Entrée ou tapez une virgule pour ajouter une compétence."
              className="sm:col-span-2"
            />
          </FormSection>
        </div>
      </Modal>

      {/* Détail */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        icon={Briefcase}
        title={detail?.title ?? "Détail de l'offre"}
        description={detail ? `${detail.department} · ${detail.location}` : undefined}
        wide
        footer={
          detail && (
            <>
              <Button variant="outline" onClick={() => openEdit(detail)}>
                <Pencil className="mr-2 size-4" /> Modifier l'offre
              </Button>
              <Button asChild className="group">
                <Link to="/entreprise/candidatures" search={{ offre: detail.id }}>
                  Voir les candidatures
                  <ArrowRight className={cn("ml-2 size-4", ARROW_NUDGE)} />
                </Link>
              </Button>
            </>
          )
        }
      >
        {detail &&
          (() => {
            const counts = countsFor(detail.id);
            const total = PIPELINE_ORDER.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
            return (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge label={offerStatusLabels[detail.status].label} tone={tone(detail.status)} />
                  {detail.type && <Badge label={detail.type} tone="accent" />}
                  {detail.level && <Badge label={detail.level} tone="muted" />}
                </div>

                {/* Repères : une bande de faits, pas de cartes imbriquées */}
                <dl className="grid grid-cols-2 gap-y-4 rounded-xl border py-3.5 sm:grid-cols-4 sm:divide-x">
                  {[
                    { label: "Durée", value: detail.duration || "—" },
                    { label: "Lieu", value: detail.location || "—" },
                    { label: "Date limite", value: fmtDate(detail.deadline), hint: deadlineLabel(detail) },
                    { label: "Publiée le", value: fmtDate(detail.published) },
                  ].map((fact) => (
                    <div key={fact.label} className="min-w-0 px-4">
                      <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                      <dd className="mt-0.5 truncate text-[13px] font-medium">{fact.value}</dd>
                      {fact.hint && <dd className="truncate text-xs text-muted-foreground">{fact.hint}</dd>}
                    </div>
                  ))}
                </dl>

                <section>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[13px] font-semibold">Candidatures</h3>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {total} au total
                    </p>
                  </div>
                  <PipelineBar counts={counts} className="mt-3 h-2" />
                  <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
                    {PIPELINE_ORDER.map((status) => (
                      <li key={status} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <StatusDot status={status} />
                        <span className="min-w-0 truncate">{PIPELINE_SHORT_LABELS[status]}</span>
                        <span className="ml-auto font-semibold tabular-nums text-foreground sm:ml-0">
                          {counts[status] ?? 0}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-[13px] font-semibold">Description</h3>
                  <p className="mt-1.5 max-w-[68ch] text-pretty text-[13px] leading-relaxed text-muted-foreground">
                    {detail.description}
                  </p>
                </section>

                <section>
                  <h3 className="text-[13px] font-semibold">Missions</h3>
                  {detail.missions.length === 0 ? (
                    <p className="mt-1.5 text-[13px] text-muted-foreground">Aucune mission renseignée.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {detail.missions.map((mission) => (
                        <li key={mission} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
                          <Check className="mt-1 size-3.5 shrink-0 text-primary" />
                          {mission}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h3 className="text-[13px] font-semibold">Compétences recherchées</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {detail.skills.length === 0 ? (
                      <p className="text-[13px] text-muted-foreground">Aucune compétence renseignée.</p>
                    ) : (
                      detail.skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-primary">
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </section>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
}

/** Section de formulaire : titre et phrase d'aide au-dessus, champs sur deux colonnes. */
function FormSection({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="py-6 first:pt-1 last:pb-1">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        {desc && <p className="mt-0.5 text-pretty text-[13px] leading-relaxed text-muted-foreground">{desc}</p>}
      </div>
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
