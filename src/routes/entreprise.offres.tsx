import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  inputClass,
  textareaClass,
  type Tone,
} from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";
import { cn } from "@/lib/utils";
import { offerStatusLabels, type CompanyOffer, type OfferStatus } from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/offres")({
  validateSearch: (search: Record<string, unknown>): { nouveau?: boolean } => ({
    nouveau: search.nouveau === true || search.nouveau === "1" ? true : undefined,
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
  skills: string;
  status: OfferStatus;
}

const EMPTY_FORM: OfferForm = {
  title: "",
  department: "",
  location: "Kinshasa, Gombe",
  type: "Stage académique",
  duration: "3 mois",
  level: "Licence (L3)",
  deadline: "",
  description: "",
  missions: "",
  skills: "",
  status: "brouillon",
};

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
    skills: offer.skills.join(", "),
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

  const set = (patch: Partial<OfferForm>) => setForm((current) => ({ ...current, ...patch }));

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = "Le titre de l'offre est obligatoire.";
    if (!form.department.trim()) nextErrors.department = "Précisez le service concerné.";
    if (!form.deadline) nextErrors.deadline = "La date limite de candidature est obligatoire.";
    if (!form.description.trim()) nextErrors.description = "Ajoutez une description de l'offre.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Formulaire incomplet", { description: "Vérifiez les champs signalés en rouge." });
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
      skills: form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      status: form.status,
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
      toast.success(form.status === "publiee" ? "Offre publiée" : "Offre enregistrée en brouillon", {
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
              <article key={offer.id} className="card-surface flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-pretty text-lg font-semibold leading-snug tracking-tight">
                      {offer.title}
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

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
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
        description="Les champs marqués d'un astérisque sont obligatoires."
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>
              {editingId
                ? "Enregistrer les modifications"
                : form.status === "publiee"
                  ? "Publier l'offre"
                  : "Enregistrer le brouillon"}
            </Button>
          </>
        }
      >
        <div className="space-y-7">
          <FormSection title="L'offre" desc="Ce que verront les étudiants en premier.">
            <Field label="Titre de l'offre" htmlFor="offre-titre" required error={errors.title} className="sm:col-span-2">
              <input
                id="offre-titre"
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
                value={form.department}
                onChange={(event) => set({ department: event.target.value })}
              />
              <datalist id="offre-services">
                {services.map((service) => (
                  <option key={service.id} value={service.name} />
                ))}
              </datalist>
            </Field>
            <Field label="Lieu" htmlFor="offre-lieu">
              <input
                id="offre-lieu"
                className={inputClass}
                value={form.location}
                onChange={(event) => set({ location: event.target.value })}
              />
            </Field>
          </FormSection>

          <FormSection title="Conditions" desc="Le cadre du stage proposé.">
            <Field label="Type de stage" htmlFor="offre-type">
              <select id="offre-type" className={inputClass} value={form.type} onChange={(event) => set({ type: event.target.value })}>
                <option>Stage académique</option>
                <option>Stage professionnel</option>
                <option>Stage de fin d'études</option>
              </select>
            </Field>
            <Field label="Niveau requis" htmlFor="offre-niveau">
              <select id="offre-niveau" className={inputClass} value={form.level} onChange={(event) => set({ level: event.target.value })}>
                <option>Licence (L2)</option>
                <option>Licence (L3)</option>
                <option>Master (M1)</option>
                <option>Master (M2)</option>
              </select>
            </Field>
            <Field label="Durée" htmlFor="offre-duree">
              <input
                id="offre-duree"
                className={inputClass}
                value={form.duration}
                onChange={(event) => set({ duration: event.target.value })}
              />
            </Field>
            <Field label="Date limite de candidature" htmlFor="offre-deadline" required error={errors.deadline}>
              <input
                id="offre-deadline"
                type="date"
                className={inputClass}
                value={form.deadline}
                onChange={(event) => set({ deadline: event.target.value })}
              />
            </Field>
          </FormSection>

          <FormSection title="Contenu" desc="Missions et compétences : elles servent aussi au système expert.">
            <Field label="Description" htmlFor="offre-description" required error={errors.description} className="sm:col-span-2">
              <textarea
                id="offre-description"
                className={textareaClass}
                placeholder="Présentez la mission proposée au stagiaire."
                value={form.description}
                onChange={(event) => set({ description: event.target.value })}
              />
            </Field>
            <Field label="Missions" htmlFor="offre-missions" hint="Une mission par ligne." className="sm:col-span-2">
              <textarea
                id="offre-missions"
                className={textareaClass}
                placeholder={"Analyser les dossiers de crédit\nParticiper aux visites terrain"}
                value={form.missions}
                onChange={(event) => set({ missions: event.target.value })}
              />
            </Field>
            <Field
              label="Compétences recherchées"
              htmlFor="offre-skills"
              hint="Séparez les compétences par des virgules."
              className="sm:col-span-2"
            >
              <input
                id="offre-skills"
                className={inputClass}
                placeholder="Excel, Analyse financière, Rédaction"
                value={form.skills}
                onChange={(event) => set({ skills: event.target.value })}
              />
              {form.skills.trim() && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.skills
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean)
                    .map((skill) => (
                      <span key={skill} className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-foreground">
                        {skill}
                      </span>
                    ))}
                </div>
              )}
            </Field>
          </FormSection>

          <FormSection title="Publication" desc="Une offre publiée est visible immédiatement par les étudiants.">
            <div role="radiogroup" aria-label="Statut de l'offre" className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-4">
              {(editingId
                ? (["brouillon", "publiee", "desactivee", "cloturee"] as OfferStatus[])
                : (["brouillon", "publiee"] as OfferStatus[])
              ).map((status) => {
                const active = form.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set({ status })}
                    className={cn(
                      "press flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-200",
                      active
                        ? "border-primary bg-primary-soft/60 font-medium text-primary ring-1 ring-primary"
                        : "text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-full border",
                        active ? "border-primary" : "border-muted-foreground/40"
                      )}
                    >
                      {active && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    {offerStatusLabels[status].label}
                  </button>
                );
              })}
            </div>
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

/** Section de formulaire : un titre, une phrase d'aide, puis une grille de champs. */
function FormSection({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-x-6 gap-y-4 sm:grid-cols-[170px_minmax(0,1fr)]">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {desc && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>}
      </div>
      <div className="grid content-start gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
