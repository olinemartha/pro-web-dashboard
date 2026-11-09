import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  Clock,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Send,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ActionMenu,
  Badge,
  EmptyBlock,
  Field,
  MenuItem,
  Modal,
  PageIntro,
  Select,
  inputClass,
  textareaClass,
  type Tone,
} from "@/components/company/ui";
import { DatePicker } from "@/components/company/date-picker";
import { useCompanyStore } from "@/lib/company-store";
import { cn } from "@/lib/utils";
import { offerStatusLabels, type CompanyOffer, type OfferStatus } from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/offres")({
  validateSearch: (search: Record<string, unknown>): { nouveau?: boolean } => ({
    // Le routeur lit « ?nouveau=1 » comme le nombre 1.
    nouveau: search.nouveau === true || search.nouveau === 1 || search.nouveau === "1" ? true : undefined,
  }),
  head: () => ({
    meta: [{ title: "Mes offres — Espace entreprise" }],
  }),
  component: CompanyOffersPage,
});

const tone = (status: OfferStatus): Tone => offerStatusLabels[status].tone;

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

function localIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** « dans 19 jours » à partir d'une date AAAA-MM-JJ. */
function daysFromToday(value: string) {
  const today = new Date(`${localIso(new Date())}T00:00:00`);
  const target = new Date(`${value}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

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

function fmtDate(value: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CompanyOffersPage() {
  const { offers, candidates, services, addOffer, updateOffer, setOfferStatus } = useCompanyStore();
  const { nouveau } = Route.useSearch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<OfferStatus | "tous">("tous");

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

  const filtered = useMemo(
    () => (filter === "tous" ? offers : offers.filter((offer) => offer.status === filter)),
    [offers, filter]
  );
  const detail = offers.find((offer) => offer.id === detailId) ?? null;
  // Suggestions de compétences : celles déjà utilisées dans vos offres.
  const skillSuggestions = useMemo(
    () => Array.from(new Set(offers.flatMap((offer) => offer.skills))).sort((x, y) => x.localeCompare(y, "fr")),
    [offers]
  );

  const pipeline = (offerId: string) => {
    const list = candidates.filter(
      (candidate) => candidate.offerId === offerId && candidate.status !== "retiree"
    );
    return {
      total: list.length,
      examine: list.filter(
        (candidate) => candidate.status === "en_attente" || candidate.status === "examen"
      ).length,
      interview: list.filter((candidate) => candidate.status === "entretien").length,
      accepted: list.filter((candidate) => candidate.status === "acceptee").length,
    };
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
          description: `${previous.applicationsCount} candidat(s) concerné(s) seront informés de la modification.`,
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
          ? `${offer.applicationsCount} candidat(s) recevront une notification.`
          : offer.title,
    });
  };

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Publiez, modifiez, désactivez ou clôturez vos offres de stage."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Publier une offre
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((entry) => {
          const count =
            entry.value === "tous"
              ? offers.length
              : offers.filter((offer) => offer.status === entry.value).length;
          return (
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
              {entry.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyBlock
          title="Aucune offre dans cette catégorie"
          desc="Modifiez le filtre ou publiez une nouvelle offre de stage."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((offer) => {
            const flow = pipeline(offer.id);
            return (
              <article key={offer.id} className="card-surface hover-lift group relative flex cursor-pointer flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-pretty text-lg font-semibold leading-snug tracking-tight">
                      {/* Toute la carte ouvre le détail : le bouton du titre la recouvre. */}
                      <button
                        type="button"
                        onClick={() => setDetailId(offer.id)}
                        className="text-left transition-colors after:absolute after:inset-0 after:rounded-xl after:content-[''] group-hover:text-primary focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
                      >
                        {offer.title}
                      </button>
                    </h2>
                    <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                      {offer.department}
                    </p>
                  </div>
                  <Badge label={offerStatusLabels[offer.status].label} tone={tone(offer.status)} />
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" /> {offer.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {offer.duration}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" /> Clôture : {fmtDate(offer.deadline)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" /> {flow.total} candidature
                    {flow.total > 1 ? "s" : ""}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {offer.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {offer.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs leading-relaxed tabular-nums text-foreground/70">
                  <span className="font-medium text-foreground">{flow.total}</span> candidature
                  {flow.total > 1 ? "s" : ""} ·{" "}
                  <span className="font-medium text-foreground">{flow.examine}</span> à examiner ·{" "}
                  <span className="font-medium text-foreground">{flow.interview}</span> en entretien
                </p>

                <div className="relative z-10 mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
                  {offer.status === "brouillon" && (
                    <Button size="sm" onClick={() => changeStatus(offer, "publiee")}>
                      <Send className="mr-1.5 size-3.5" /> Publier
                    </Button>
                  )}
                  {offer.status === "publiee" && (
                    <Button size="sm" asChild>
                      <Link to="/entreprise/candidatures" search={{ offre: offer.id }}>
                        <Users className="mr-1.5 size-3.5" /> Voir les candidatures
                      </Link>
                    </Button>
                  )}
                  {offer.status === "desactivee" && (
                    <Button size="sm" onClick={() => changeStatus(offer, "publiee")}>
                      Réactiver
                    </Button>
                  )}
                  {offer.status === "cloturee" && (
                    <Button size="sm" variant="outline" onClick={() => setDetailId(offer.id)}>
                      <Eye className="mr-1.5 size-3.5" /> Consulter
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setDetailId(offer.id)}>
                    Détails
                  </Button>
                  <div className="ml-auto">
                    <ActionMenu>
                      <MenuItem onSelect={() => openEdit(offer)}>
                        <Pencil className="size-3.5" /> Modifier
                      </MenuItem>
                      {offer.status !== "cloturee" && (
                        <MenuItem onSelect={() => changeStatus(offer, "cloturee")}>
                          Clôturer l'offre
                        </MenuItem>
                      )}
                      {offer.status === "publiee" && (
                        <MenuItem onSelect={() => changeStatus(offer, "desactivee")}>
                          Désactiver
                        </MenuItem>
                      )}
                      {offer.status === "cloturee" && (
                        <MenuItem onSelect={() => changeStatus(offer, "publiee")}>
                          Rouvrir
                        </MenuItem>
                      )}
                    </ActionMenu>
                  </div>
                </div>
              </article>
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
            <Field label="Service / département" htmlFor="offre-service" required error={errors.department}>
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
                min={editingId ? undefined : localIso(new Date(Date.now() + 86_400_000))}
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
            <SkillsInput
              value={form.skills}
              onChange={(skills) => set({ skills })}
              suggestions={skillSuggestions}
            />
          </FormSection>
        </div>
      </Modal>

      {/* Détail */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail?.title ?? "Détail de l'offre"}
        description={detail ? `${detail.department} · ${detail.location}` : undefined}
        wide
        footer={
          detail && (
            <>
              <Button variant="outline" onClick={() => setDetailId(null)}>
                Fermer
              </Button>
              <Button asChild>
                <Link to="/entreprise/candidatures" search={{ offre: detail.id }}>
                  <Users className="mr-2 size-4" /> Voir les candidatures
                </Link>
              </Button>
              <Button variant="outline" onClick={() => openEdit(detail)}>
                <Pencil className="mr-2 size-4" /> Modifier l'offre
              </Button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={offerStatusLabels[detail.status].label} tone={tone(detail.status)} />
              <Badge label={detail.type} tone="accent" />
              <Badge label={detail.level} tone="muted" />
            </div>

            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-muted-foreground">
                Pipeline de l'offre
              </p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-semibold leading-tight tabular-nums">
                    {pipeline(detail.id).total}
                  </p>
                  <p className="text-xs leading-4 text-muted-foreground">Candidatures</p>
                </div>
                <div>
                  <p className="text-lg font-semibold leading-tight tabular-nums">
                    {pipeline(detail.id).examine}
                  </p>
                  <p className="text-xs leading-4 text-muted-foreground">À examiner</p>
                </div>
                <div>
                  <p className="text-lg font-semibold leading-tight tabular-nums">
                    {pipeline(detail.id).interview}
                  </p>
                  <p className="text-xs leading-4 text-muted-foreground">En entretien</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Durée : </span>
                {detail.duration}
              </p>
              <p>
                <span className="text-muted-foreground">Date limite : </span>
                {fmtDate(detail.deadline)}
              </p>
              <p>
                <span className="text-muted-foreground">Publiée le : </span>
                {fmtDate(detail.published)}
              </p>
              <p className="inline-flex items-center gap-1">
                <Briefcase className="size-4 text-muted-foreground" /> {detail.department}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold leading-snug">Description</h3>
              <p className="mt-1 max-w-[68ch] text-pretty text-sm leading-relaxed text-muted-foreground">
                {detail.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold leading-snug">Missions</h3>
              {detail.missions.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">Aucune mission renseignée.</p>
              ) : (
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {detail.missions.map((mission) => (
                    <li key={mission}>{mission}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold">Compétences recherchées</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {detail.skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune compétence renseignée.</p>
                ) : (
                  detail.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-primary"
                    >
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
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

/**
 * Compétences en étiquettes : Entrée ou virgule ajoute, la croix retire,
 * Retour arrière sur un champ vide retire la dernière. Pas de doublon.
 */
function SkillsInput({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (skills: string[]) => void;
  suggestions: string[];
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    parts.forEach((part) => {
      if (!next.some((skill) => skill.toLowerCase() === part.toLowerCase())) next.push(part);
    });
    onChange(next);
    setDraft("");
  };

  const remove = (skill: string) => {
    onChange(value.filter((entry) => entry !== skill));
    inputRef.current?.focus();
  };

  const available = suggestions.filter(
    (suggestion) => !value.some((skill) => skill.toLowerCase() === suggestion.toLowerCase())
  );

  return (
    <Field
      label="Compétences recherchées"
      htmlFor="offre-skills"
      hint="Appuyez sur Entrée ou tapez une virgule pour ajouter une compétence."
      className="sm:col-span-2"
    >
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 transition hover:border-foreground/25 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-ring/15"
      >
        {value.map((skill) => (
          <span
            key={skill}
            className="animate-scale-in inline-flex h-7 items-center gap-1 rounded-full bg-accent-soft pl-2.5 pr-1 text-xs font-medium text-primary"
          >
            {skill}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                remove(skill);
              }}
              aria-label={`Retirer ${skill}`}
              className="grid size-5 place-items-center rounded-full text-primary/70 transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id="offre-skills"
          list="offre-skills-list"
          autoComplete="off"
          aria-describedby="offre-skills-hint"
          className="h-7 min-w-[10rem] flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
          placeholder={value.length ? "Ajouter une compétence" : "Ex. Excel, Analyse financière"}
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            if (next.includes(",")) add(next);
            else setDraft(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
        />
      </div>
      <datalist id="offre-skills-list">
        {available.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </Field>
  );
}
