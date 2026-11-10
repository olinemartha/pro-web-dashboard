import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, GraduationCap, Layers, Pencil, Plus, Trash2, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import {
  ActionMenu,
  Badge,
  CARD_INTERACTIVE,
  EmptyNote,
  Field,
  FilterChips,
  MenuItem,
  Modal,
  PageIntro,
  SECTION_LINK,
  StatCard,
  inputClass,
  textareaClass,
  type Tone,
} from "@/components/company/ui";
import { TagInput } from "@/components/company/tag-input";
import { useCompanyStore } from "@/lib/company-store";
import { daysFromToday, relativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/services")({
  head: () => ({
    meta: [{ title: "Services et besoins — Espace entreprise" }],
  }),
  component: CompanyServicesPage,
});

interface ServiceForm {
  name: string;
  internsNeeded: string;
  profiles: string;
  education: string;
  skills: string[];
}

const EMPTY_FORM: ServiceForm = { name: "", internsNeeded: "", profiles: "", education: "", skills: [] };

/** Au-delà de ce nombre de jours sans mise à jour, les besoins sont « à actualiser ». */
const STALE_DAYS = 30;

type Filter = "tous" | "a_pourvoir" | "a_completer" | "complets";

function toForm(service: Service): ServiceForm {
  return {
    name: service.name,
    internsNeeded: String(service.internsNeeded),
    profiles: service.profiles,
    education: service.education,
    skills: [...service.skills],
  };
}

const staleDays = (service: Service) => -daysFromToday(service.updatedAt);
const isIncomplete = (service: Service) =>
  !service.profiles.trim() || !service.education.trim() || service.skills.length === 0;
const needsUpdate = (service: Service) => isIncomplete(service) || staleDays(service) > STALE_DAYS;

/** Monogramme du service, comme sur la carte entreprise du tableau de bord. */
function initialsOf(value: string) {
  const STOP = new Set(["direction", "service", "de", "des", "du", "et", "la", "le", "les"]);
  const words = value.split(/[^\p{L}0-9]+/u).filter((word) => word && !STOP.has(word.toLowerCase()));
  if (words.length === 0) return value.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function CompanyServicesPage() {
  const { services, interns, offers, addService, updateService, removeService } = useCompanyStore();

  const [filter, setFilter] = useState<Filter>("tous");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filledFor = (service: Service) =>
    interns.filter(
      (intern) => intern.confirmed && (intern.serviceId ? intern.serviceId === service.id : intern.service === service.name)
    ).length;
  const leftFor = (service: Service) => Math.max(0, service.internsNeeded - filledFor(service));

  const totalNeeded = services.reduce((sum, service) => sum + service.internsNeeded, 0);
  const totalFilled = services.reduce((sum, service) => sum + Math.min(service.internsNeeded, filledFor(service)), 0);
  const totalLeft = Math.max(0, totalNeeded - totalFilled);
  const toUpdate = services.filter(needsUpdate);
  const toFill = services.filter((service) => leftFor(service) > 0);
  const full = services.filter((service) => leftFor(service) === 0);
  const toDelete = services.find((service) => service.id === deleteId) ?? null;

  const visible = services.filter((service) => {
    if (filter === "a_pourvoir") return leftFor(service) > 0;
    if (filter === "a_completer") return needsUpdate(service);
    if (filter === "complets") return leftFor(service) === 0;
    return true;
  });

  const skillSuggestions = useMemo(
    () =>
      Array.from(new Set([...services.flatMap((service) => service.skills), ...offers.flatMap((offer) => offer.skills)])).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [services, offers]
  );

  const toggle = (value: Filter) => setFilter((current) => (current === value ? "tous" : value));

  const set = (patch: Partial<ServiceForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingId(service.id);
    setForm(toForm(service));
    setErrors({});
    setFormOpen(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    const name = form.name.trim();
    const needed = Number(form.internsNeeded);
    const current = editingId ? services.find((service) => service.id === editingId) : undefined;
    const alreadyFilled = current ? filledFor(current) : 0;
    if (!name) next.name = "Le nom du service est obligatoire.";
    else if (services.some((service) => service.id !== editingId && service.name.trim().toLowerCase() === name.toLowerCase()))
      next.name = "Un service porte déjà ce nom.";
    if (!form.internsNeeded || !Number.isInteger(needed) || needed < 1) next.internsNeeded = "Indiquez un nombre entier, au moins 1.";
    else if (needed < alreadyFilled)
      next.internsNeeded = `${alreadyFilled} stagiaire${alreadyFilled > 1 ? "s sont" : " est"} déjà affecté${alreadyFilled > 1 ? "s" : ""} à ce service.`;
    if (!form.profiles.trim()) next.profiles = "Précisez les profils souhaités.";
    setErrors(next);
    const first = ["name", "internsNeeded", "profiles"].find((key) => next[key]);
    if (first) {
      document.getElementById({ name: "service-nom", internsNeeded: "service-nombre", profiles: "service-profils" }[first]!)?.focus();
      return;
    }

    const payload = {
      name: form.name.trim(),
      internsNeeded: Number(form.internsNeeded),
      profiles: form.profiles.trim(),
      education: form.education.trim(),
      skills: form.skills,
    };

    if (editingId) {
      updateService(editingId, payload);
      toast.success("Besoins mis à jour", { description: payload.name });
    } else {
      addService(payload);
      toast.success("Service ajouté", { description: payload.name });
    }
    setFormOpen(false);
  };

  const statusFor = (service: Service): { label: string; tone: Tone } => {
    if (isIncomplete(service)) return { label: "À compléter", tone: "warning" };
    if (staleDays(service) > STALE_DAYS) return { label: "À actualiser", tone: "warning" };
    const left = leftFor(service);
    if (left === 0) return { label: "Complet", tone: "success" };
    return { label: `${left} place${left > 1 ? "s" : ""} libre${left > 1 ? "s" : ""}`, tone: "primary" };
  };

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Les services qui accueillent des stagiaires, et ce qu'ils recherchent. Ces besoins forment la base de faits du système expert : plus ils sont précis et récents, plus ses recommandations sont justes."
        action={
          <Button onClick={openCreate} className="group">
            <Plus className="mr-2 size-4 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:rotate-90 motion-reduce:transition-none" />
            Ajouter un service
          </Button>
        }
      />

      {/* Indicateurs : ils filtrent les services */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard
            key="services"
            label="Services d'accueil"
            value={services.length}
            icon={Layers}
            motion="stack"
            foot={`${totalNeeded} place${totalNeeded > 1 ? "s" : ""} au total`}
            onClick={() => setFilter("tous")}
          />,
          <StatCard
            key="pourvues"
            label="Places pourvues"
            value={totalNeeded ? Math.round((totalFilled / totalNeeded) * 100) : 0}
            suffix=" %"
            icon={UserCheck}
            motion="bounce"
            foot={`${totalFilled} sur ${totalNeeded} affectation${totalFilled > 1 ? "s" : ""} confirmée${totalFilled > 1 ? "s" : ""}`}
            tone={totalNeeded && totalFilled === totalNeeded ? "trend" : "neutral"}
            onClick={() => toggle("complets")}
            pressed={filter === "complets"}
          />,
          <StatCard
            key="libres"
            label="Places libres"
            value={totalLeft}
            icon={Users}
            motion="bounce"
            foot={toFill.length ? `dans ${toFill.length} service${toFill.length > 1 ? "s" : ""}` : "tous les services sont complets"}
            tone={totalLeft ? "alert" : "neutral"}
            onClick={() => toggle("a_pourvoir")}
            pressed={filter === "a_pourvoir"}
          />,
          <StatCard
            key="maj"
            label="Besoins à revoir"
            value={toUpdate.length}
            icon={Clock}
            motion="pop"
            foot={toUpdate.length ? "incomplets ou anciens" : "tous à jour"}
            tone={toUpdate.length ? "alert" : "neutral"}
            onClick={() => toggle("a_completer")}
            pressed={filter === "a_completer"}
          />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Filtrer les services"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "tous" as Filter, label: "Tous", count: services.length },
            { value: "a_pourvoir" as Filter, label: "Places libres", count: toFill.length },
            { value: "a_completer" as Filter, label: "À revoir", count: toUpdate.length },
            { value: "complets" as Filter, label: "Complets", count: full.length },
          ]}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {`${visible.length} service${visible.length > 1 ? "s" : ""} affiché${visible.length > 1 ? "s" : ""}`}
      </p>

      {visible.length === 0 ? (
        <div className="card-surface pb-10">
          <EmptyNote
            icon={Layers}
            title={services.length ? "Aucun service dans cette catégorie" : "Aucun service enregistré"}
            desc={services.length ? "Changez de filtre pour voir les autres services." : "Ajoutez un service pour indiquer vos besoins en stagiaires."}
            className="pb-4 pt-12"
          />
          <div className="flex justify-center">
            {services.length ? (
              <button type="button" onClick={() => setFilter("tous")} className={SECTION_LINK}>
                Tout afficher
              </button>
            ) : (
              <button type="button" onClick={openCreate} className={SECTION_LINK}>
                <Plus className="size-3.5" /> Ajouter un service
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {visible.map((service, index) => {
            const filled = Math.min(service.internsNeeded, filledFor(service));
            const left = leftFor(service);
            const status = statusFor(service);
            const stale = staleDays(service) > STALE_DAYS;
            return (
              <Reveal key={service.id} delay={index < 6 ? 120 + index * 50 : 0} className="min-w-0">
                <article className={cn(CARD_INTERACTIVE, "relative flex h-full cursor-pointer flex-col p-5")}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                      {initialsOf(service.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-pretty text-[15px] font-semibold leading-snug tracking-tight">
                        {/* Toute la carte ouvre la mise à jour des besoins */}
                        <button
                          type="button"
                          onClick={() => openEdit(service)}
                          aria-label={`${service.name} — mettre à jour les besoins`}
                          className="text-left transition-colors after:absolute after:inset-0 after:rounded-xl after:content-[''] group-hover:text-primary focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
                        >
                          {service.name}
                        </button>
                      </h2>
                      <p className={cn("mt-0.5 text-xs", stale ? "font-medium text-warning" : "text-muted-foreground")}>
                        Mis à jour {relativeDay(service.updatedAt)}
                      </p>
                    </div>
                    <Badge label={status.label} tone={status.tone} className="shrink-0" />
                  </div>

                  {/* Capacité : une case par place, pourvue en bleu roi */}
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between gap-3 text-[13px]">
                      <p>
                        <span className="font-semibold tabular-nums">{filled}</span>{" "}
                        <span className="text-muted-foreground">
                          place{filled > 1 ? "s" : ""} pourvue{filled > 1 ? "s" : ""} sur{" "}
                        </span>
                        <span className="font-semibold tabular-nums">{service.internsNeeded}</span>
                      </p>
                      <p className={cn("text-xs tabular-nums", left ? "font-semibold text-warning" : "font-medium text-success-ink")}>
                        {left ? `${left} libre${left > 1 ? "s" : ""}` : "Complet"}
                      </p>
                    </div>
                    <div className="mt-2 flex gap-1" aria-hidden>
                      {Array.from({ length: service.internsNeeded }, (_, slot) => (
                        <span
                          key={slot}
                          className={cn("animate-grow-x h-1.5 flex-1 rounded-full", slot < filled ? "bg-primary" : "bg-muted")}
                          style={{ ["--delay" as string]: `${200 + slot * 60}ms` }}
                        />
                      ))}
                    </div>
                  </div>

                  <dl className="mt-4 space-y-3 border-t pt-4">
                    <div>
                      <dt className="text-xs text-muted-foreground">Profils souhaités</dt>
                      <dd className={cn("mt-0.5 text-pretty text-[13px] leading-relaxed", !service.profiles.trim() && "font-medium text-warning")}>
                        {service.profiles || "À préciser"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Formations et niveaux</dt>
                      <dd className={cn("mt-0.5 flex items-start gap-1.5 text-[13px] leading-relaxed", !service.education.trim() && "font-medium text-warning")}>
                        {service.education.trim() && <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />}
                        {service.education || "À préciser"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Compétences attendues</dt>
                      <dd className="mt-1.5 flex flex-wrap gap-1.5">
                        {service.skills.length === 0 ? (
                          <span className="text-[13px] font-medium text-warning">À préciser</span>
                        ) : (
                          service.skills.map((skill) => (
                            <span key={skill} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-primary">
                              {skill}
                            </span>
                          ))
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="relative z-10 mt-auto flex items-center gap-2 pt-4">
                    <button type="button" onClick={() => openEdit(service)} className={SECTION_LINK}>
                      <Pencil className="size-3.5" /> {needsUpdate(service) ? "Compléter les besoins" : "Modifier"}
                    </button>
                    <div className="ml-auto">
                      <ActionMenu>
                        <MenuItem onSelect={() => openEdit(service)}>
                          <Pencil className="size-3.5" /> Modifier
                        </MenuItem>
                        <MenuItem onSelect={() => setDeleteId(service.id)}>
                          <Trash2 className="size-3.5" /> Supprimer
                        </MenuItem>
                      </ActionMenu>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        icon={editingId ? Pencil : Layers}
        title={editingId ? "Mettre à jour les besoins" : "Ajouter un service"}
        description="Ces informations alimentent les recommandations d'affectation du système expert."
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>{editingId ? "Enregistrer les besoins" : "Ajouter le service"}</Button>
          </>
        }
      >
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-[minmax(0,1fr)_200px]">
          <Field label="Nom du service" htmlFor="service-nom" required error={errors.name}>
            <input
              id="service-nom"
              data-autofocus
              className={inputClass}
              placeholder="Ex. Direction Crédit"
              value={form.name}
              onChange={(event) => set({ name: event.target.value })}
            />
          </Field>
          <Field label="Stagiaires recherchés" htmlFor="service-nombre" required error={errors.internsNeeded}>
            <input
              id="service-nombre"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              className={cn(inputClass, "tabular-nums")}
              placeholder="Ex. 2"
              value={form.internsNeeded}
              onChange={(event) => set({ internsNeeded: event.target.value })}
            />
          </Field>
          <Field label="Profils souhaités" htmlFor="service-profils" required error={errors.profiles} className="sm:col-span-2">
            <textarea
              id="service-profils"
              className={textareaClass}
              placeholder="Ex. Étudiant rigoureux, à l'aise avec l'analyse financière."
              value={form.profiles}
              onChange={(event) => set({ profiles: event.target.value })}
            />
          </Field>
          <Field
            label="Formations et niveaux"
            htmlFor="service-formation"
            hint="Les filières et niveaux d'études pertinents pour ce service."
            className="sm:col-span-2"
          >
            <input
              id="service-formation"
              className={inputClass}
              placeholder="Ex. Licence L3 ou Master M1 — Finance, Économie, Gestion"
              value={form.education}
              onChange={(event) => set({ education: event.target.value })}
            />
          </Field>
          <TagInput
            id="service-competences"
            label="Compétences attendues"
            value={form.skills}
            onChange={(skills) => set({ skills })}
            suggestions={skillSuggestions}
            addPlaceholder="Ajouter une compétence"
            hint="Appuyez sur Entrée ou tapez une virgule pour ajouter une compétence."
            className="sm:col-span-2"
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setDeleteId(null)}
        icon={Trash2}
        title="Supprimer ce service ?"
        description={toDelete ? `${toDelete.name} sera retiré de la base de faits du système expert.` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (toDelete) {
                  removeService(toDelete.id);
                  toast.success("Service supprimé", { description: toDelete.name });
                }
                setDeleteId(null);
              }}
            >
              <Trash2 className="mr-2 size-4" /> Supprimer
            </Button>
          </>
        }
      >
        <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
          Les offres et les stagiaires déjà enregistrés ne changent pas, et les affectations existantes gardent leur trace.
          Cette action est définitive.
        </p>
      </Modal>
    </div>
  );
}
