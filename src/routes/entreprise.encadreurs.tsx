import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Mail, Pencil, Phone, Plus, Trash2, UserPlus, UserRoundCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import {
  ARROW_NUDGE,
  ActionMenu,
  AvatarInitials,
  Badge,
  Drawer,
  EmptyNote,
  Field,
  FilterChips,
  MenuItem,
  Modal,
  PageIntro,
  SECTION_LINK,
  SearchInput,
  Select,
  StatCard,
  inputClass,
  rowActionClass,
  type Tone,
} from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";
import type { Intern, Supervisor } from "@/lib/company-data";
import { cn } from "@/lib/utils";

type Filter = "tous" | "disponibles" | "complets";

export const Route = createFileRoute("/entreprise/encadreurs")({
  validateSearch: (s: Record<string, unknown>): { designer?: string } =>
    typeof s["designer"] === "string" ? { designer: s["designer"] } : {},
  head: () => ({ meta: [{ title: "Encadreurs — Espace entreprise" }] }),
  component: SupervisorsPage,
});

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** Initiales sans la civilité : « Mme Alice Tshimanga » → « AT ». */
function initialsOf(name: string) {
  return name
    .replace(/^(M\.|Mme|Mlle)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

/** Où en est le dossier d'un stagiaire, pour la fiche de l'encadreur. */
function internStep(intern: Intern): { label: string; tone: Tone } {
  if (!intern.confirmed) return { label: "Affectation à valider", tone: "warning" };
  if (intern.reports.some((report) => report.status === "soumis")) return { label: "Rapport à relire", tone: "primary" };
  if (!intern.evaluation) return { label: "Suivi en cours", tone: "accent" };
  if (intern.certificate !== "validee") return { label: "Attestation à finaliser", tone: "warning" };
  return { label: "Stage terminé", tone: "success" };
}

/** Charge d'un encadreur : une case par place, pleine si occupée. */
function LoadMeter({ load, capacity, className }: { load: number; capacity: number; className?: string }) {
  const full = load >= capacity;
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: capacity }, (_, index) => (
          <span
            key={index}
            className={cn("h-1.5 w-3 rounded-full", index < load ? (full ? "bg-warning" : "bg-primary") : "bg-border")}
          />
        ))}
      </span>
      <span className={cn("whitespace-nowrap text-xs tabular-nums", full ? "font-semibold text-warning" : "text-muted-foreground")}>
        {load} sur {capacity}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Formulaire : ajouter ou modifier un encadreur                       */
/* ------------------------------------------------------------------ */

type Draft = { name: string; role: string; serviceId: string; email: string; phone: string; capacity: string };
const EMPTY: Draft = { name: "", role: "", serviceId: "", email: "", phone: "", capacity: "" };

function SupervisorForm({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: Supervisor | null;
  onClose: () => void;
}) {
  const { services, interns, addSupervisor, updateSupervisor } = useCompanyStore();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setDraft(
      editing
        ? {
            name: editing.name,
            role: editing.role,
            serviceId: editing.serviceId,
            email: editing.email,
            phone: editing.phone,
            capacity: String(editing.capacity),
          }
        : EMPTY
    );
  }, [open, editing]);

  const load = editing ? interns.filter((intern) => intern.supervisorId === editing.id).length : 0;
  const set = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      (Object.keys(patch) as (keyof Draft)[]).forEach((key) => delete next[key]);
      return next;
    });
  };

  const save = () => {
    const next: typeof errors = {};
    if (!draft.name.trim()) next.name = "Indiquez le nom de l'encadreur.";
    if (!draft.role.trim()) next.role = "Indiquez sa fonction.";
    if (!draft.serviceId) next.serviceId = "Choisissez son service.";
    else if (editing && load > 0 && draft.serviceId !== editing.serviceId)
      next.serviceId = "Il suit des stagiaires de son service actuel : désignez-leur d'abord un autre encadreur.";
    if (!draft.email.trim()) next.email = "L'e-mail est obligatoire.";
    else if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) next.email = "Saisissez une adresse e-mail valide.";
    if (!draft.capacity) next.capacity = "Choisissez le nombre de stagiaires qu'il peut suivre.";
    else if (Number(draft.capacity) < load) next.capacity = `Il suit déjà ${plural(load, "stagiaire")} : la capacité ne peut pas être inférieure.`;
    setErrors(next);
    const first = (["name", "role", "serviceId", "capacity", "email"] as const).find((key) => next[key]);
    if (first) {
      document.getElementById(`sup-${first}`)?.focus();
      return;
    }
    const value = {
      name: draft.name.trim(),
      initials: initialsOf(draft.name),
      role: draft.role.trim(),
      serviceId: draft.serviceId,
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      capacity: Number(draft.capacity),
    };
    if (editing) updateSupervisor(editing.id, value);
    else addSupervisor(value);
    toast.success(editing ? "Encadreur mis à jour" : "Encadreur ajouté", { description: value.name });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={editing ? Pencil : UserPlus}
      title={editing ? "Modifier l'encadreur" : "Ajouter un encadreur"}
      description="Un salarié qui suivra des stagiaires de son service."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={save}>{editing ? "Enregistrer" : "Ajouter l'encadreur"}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" htmlFor="sup-name" required error={errors.name}>
          <input id="sup-name" className={inputClass} placeholder="Ex. Mme Marie Lukusa" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Fonction" htmlFor="sup-role" required error={errors.role}>
          <input id="sup-role" className={inputClass} placeholder="Ex. Analyste crédit senior" value={draft.role} onChange={(e) => set({ role: e.target.value })} />
        </Field>
        <Field label="Service" htmlFor="sup-serviceId" required error={errors.serviceId}>
          <Select id="sup-serviceId" placeholder="Choisir un service" value={draft.serviceId} onChange={(e) => set({ serviceId: e.target.value })}>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Capacité" htmlFor="sup-capacity" required error={errors.capacity} hint="Stagiaires suivis en même temps.">
          <Select id="sup-capacity" placeholder="Choisir une capacité" value={draft.capacity} onChange={(e) => set({ capacity: e.target.value })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {plural(n, "stagiaire")} au plus
              </option>
            ))}
          </Select>
        </Field>
        <Field label="E-mail" htmlFor="sup-email" required error={errors.email}>
          <input id="sup-email" type="email" inputMode="email" className={inputClass} placeholder="Ex. m.lukusa@finca.cd" value={draft.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Téléphone" htmlFor="sup-phone">
          <input id="sup-phone" type="tel" inputMode="tel" className={inputClass} placeholder="Ex. +243 81 000 0000" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Fenêtre : désigner l'encadreur d'un stagiaire                       */
/* ------------------------------------------------------------------ */

function AssignModal({ intern, onClose }: { intern: Intern | null; onClose: () => void }) {
  const { supervisors, interns, assignSupervisor } = useCompanyStore();
  const [choice, setChoice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setChoice(intern?.supervisorId ?? "");
    setError("");
  }, [intern]);

  const options = intern
    ? supervisors
        .filter((s) => s.serviceId === intern.serviceId)
        .map((s) => ({ ...s, load: interns.filter((i) => i.supervisorId === s.id && i.id !== intern.id).length }))
        .sort((a, b) => a.load / a.capacity - b.load / b.capacity)
    : [];

  const confirm = () => {
    if (!intern) return;
    if (!choice) {
      setError("Choisissez un encadreur.");
      document.getElementById("assign-supervisor")?.focus();
      return;
    }
    const result = assignSupervisor(intern.id, choice);
    if (!result.ok) {
      setError(result.error ?? "L'encadreur n'a pas pu être désigné.");
      return;
    }
    toast.success("Encadreur désigné", {
      description: `${supervisors.find((s) => s.id === choice)?.name} suivra ${intern.name}.`,
    });
    onClose();
  };

  return (
    <Modal
      open={Boolean(intern)}
      onClose={onClose}
      icon={UserRoundCheck}
      title={intern?.supervisorId ? "Changer d'encadreur" : "Désigner l'encadreur"}
      description={intern ? `${intern.name} · ${intern.service}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={confirm} disabled={options.length === 0}>
            Désigner
          </Button>
        </>
      }
    >
      {options.length === 0 ? (
        <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
          Aucun encadreur dans ce service. Ajoutez-en un, puis revenez désigner l'encadreur de {intern?.name}.
        </p>
      ) : (
        <fieldset>
          <legend className="text-xs font-medium">
            Encadreurs du service<span className="ml-0.5 text-muted-foreground" aria-hidden>*</span>
          </legend>
          <p className="mt-0.5 text-xs text-muted-foreground">Les moins chargés d'abord.</p>
          <ul id="assign-supervisor" tabIndex={-1} className="mt-3 divide-y rounded-lg border outline-none">
            {options.map((s) => {
              const full = s.load >= s.capacity;
              return (
                <li key={s.id}>
                  <label
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 transition-colors",
                      full ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/40",
                      choice === s.id && "bg-primary-soft"
                    )}
                  >
                    <input
                      type="radio"
                      name="assign-supervisor"
                      value={s.id}
                      checked={choice === s.id}
                      disabled={full}
                      onChange={() => {
                        setChoice(s.id);
                        setError("");
                      }}
                      className="size-4 accent-primary"
                    />
                    <AvatarInitials initials={s.initials} className="size-8 text-xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{s.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{s.role}</span>
                    </span>
                    <LoadMeter load={s.load} capacity={s.capacity} />
                  </label>
                </li>
              );
            })}
          </ul>
          {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}
        </fieldset>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function SupervisorsPage() {
  const { supervisors, interns, services, removeSupervisor } = useCompanyStore();
  const { designer } = Route.useSearch();
  const navigate = useNavigate({ from: "/entreprise/encadreurs" });
  const [filter, setFilter] = useState<Filter>("tous");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supervisor | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<Intern | null>(null);
  const [removing, setRemoving] = useState<Supervisor | null>(null);

  // Arrivée depuis le tableau de bord : la fenêtre de désignation s'ouvre directement.
  useEffect(() => {
    if (!designer) return;
    const intern = interns.find((entry) => entry.id === designer);
    if (intern?.confirmed) setAssigning(intern);
    navigate({ search: {}, replace: true });
  }, [designer]); // eslint-disable-line react-hooks/exhaustive-deps

  const serviceName = (id: string) => services.find((service) => service.id === id)?.name ?? "Service supprimé";
  const followed = (id: string) => interns.filter((intern) => intern.supervisorId === id);
  const rows = supervisors.map((s) => ({ ...s, interns: followed(s.id), load: followed(s.id).length }));

  const withoutSupervisor = interns.filter((intern) => !intern.supervisorId);
  const assigned = interns.length - withoutSupervisor.length;
  const freePlaces = rows.reduce((sum, s) => sum + Math.max(0, s.capacity - s.load), 0);
  const fullCount = rows.filter((s) => s.load >= s.capacity).length;

  const query = search.trim().toLowerCase();
  const list = rows
    .filter((s) => filter === "tous" || (filter === "complets" ? s.load >= s.capacity : s.load < s.capacity))
    .filter((s) => !query || `${s.name} ${s.role} ${serviceName(s.serviceId)} ${s.interns.map((i) => i.name).join(" ")}`.toLowerCase().includes(query))
    .sort((a, b) => serviceName(a.serviceId).localeCompare(serviceName(b.serviceId)) || a.name.localeCompare(b.name));

  const detail = rows.find((s) => s.id === detailId) ?? null;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Les salariés qui encadrent vos stagiaires, service par service. Leur charge vous aide à répartir les nouveaux stagiaires."
        action={
          <Button onClick={openCreate} className="group">
            <Plus className="mr-2 size-4 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:rotate-90 motion-reduce:transition-none" />
            Ajouter un encadreur
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard
            key="encadreurs"
            label="Encadreurs"
            value={supervisors.length}
            icon={Users}
            motion="bounce"
            foot={`dans ${plural(new Set(supervisors.map((s) => s.serviceId)).size, "service")}`}
          />,
          <StatCard
            key="encadres"
            label="Stagiaires encadrés"
            value={assigned}
            icon={UserRoundCheck}
            motion="pop"
            foot={`sur ${plural(interns.length, "stagiaire")}`}
          />,
          <StatCard
            key="places"
            label="Places disponibles"
            value={freePlaces}
            icon={UserPlus}
            motion="bounce"
            foot={fullCount ? `${plural(fullCount, "encadreur")} complet${fullCount > 1 ? "s" : ""}` : "aucun encadreur complet"}
          />,
          <StatCard
            key="a-designer"
            label="Encadreur à désigner"
            value={withoutSupervisor.length}
            icon={UserRoundCheck}
            motion="pop"
            foot={withoutSupervisor.length ? `${plural(withoutSupervisor.length, "stagiaire")} sans encadreur` : "tous les stagiaires sont suivis"}
            tone={withoutSupervisor.length ? "alert" : "neutral"}
          />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      {/* Stagiaires sans encadreur : la tâche d'abord */}
      {withoutSupervisor.length > 0 && (
        <Reveal as="section" delay={120} className="card-surface overflow-hidden" aria-labelledby="a-designer-titre">
          <div className="border-b px-5 pb-3.5 pt-4">
            <h2 id="a-designer-titre" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Encadreur à désigner
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {withoutSupervisor.length}
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">L'encadreur est choisi parmi les salariés du service d'accueil.</p>
          </div>
          <ul className="divide-y">
            {withoutSupervisor.map((intern) => (
              <li key={intern.id} className="group flex items-center gap-3.5 px-5 py-3 transition-colors duration-200 hover:bg-muted/40">
                <AvatarInitials initials={intern.initials} className="size-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{intern.name}</p>
                  <p className={cn("truncate text-xs", intern.confirmed ? "text-muted-foreground" : "font-medium text-warning")}>
                    {intern.confirmed ? intern.service : "Affectation à valider d'abord"}
                  </p>
                </div>
                {intern.confirmed ? (
                  <button
                    type="button"
                    onClick={() => setAssigning(intern)}
                    aria-label={`Désigner l'encadreur de ${intern.name}`}
                    className={cn(rowActionClass(true), "group")}
                  >
                    <span className="hidden whitespace-nowrap sm:inline">Désigner</span>
                    <ArrowRight className={cn("size-3.5 shrink-0", ARROW_NUDGE)} />
                  </button>
                ) : (
                  <Link
                    to="/entreprise/stagiaires/$internId"
                    params={{ internId: intern.id }}
                    aria-label={`Valider l'affectation de ${intern.name}`}
                    className={cn(rowActionClass(), "group")}
                  >
                    <span className="hidden whitespace-nowrap sm:inline">Valider</span>
                    <ArrowRight className={cn("size-3.5 shrink-0", ARROW_NUDGE)} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {/* Liste des encadreurs */}
      <Reveal as="section" delay={160} className="card-surface overflow-hidden" aria-labelledby="encadreurs-titre">
        <div className="flex flex-col gap-3 border-b px-5 pb-3.5 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <h2 id="encadreurs-titre" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Encadreurs
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {supervisors.length}
              </span>
            </h2>
            <FilterChips
              label="Filtrer les encadreurs"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "tous", label: "Tous", count: rows.length },
                { value: "disponibles", label: "Disponibles", count: rows.length - fullCount },
                { value: "complets", label: "Complets", count: fullCount },
              ]}
            />
          </div>
          <SearchInput
            id="encadreurs-recherche"
            label="Rechercher un encadreur"
            placeholder="Nom, fonction, service, stagiaire"
            value={search}
            onChange={setSearch}
            className="w-full lg:w-64"
          />
        </div>
        <p className="sr-only" aria-live="polite">
          {`${plural(list.length, "encadreur")} affiché${list.length > 1 ? "s" : ""}`}
        </p>

        {list.length === 0 ? (
          <div className="pb-8">
            <EmptyNote
              icon={Users}
              title={supervisors.length === 0 ? "Aucun encadreur pour le moment" : "Aucun encadreur ne correspond"}
              desc={supervisors.length === 0 ? "Ajoutez les salariés qui suivront vos stagiaires." : "Changez de filtre ou de mot-clé."}
              className="py-10"
            />
            <div className="flex justify-center">
              {supervisors.length === 0 ? (
                <button type="button" onClick={openCreate} className={SECTION_LINK}>
                  <Plus className="size-3.5" /> Ajouter un encadreur
                </button>
              ) : (
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
              )}
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {list.map((s, index) => (
              <Reveal as="li" key={s.id} delay={index < 8 ? 200 + index * 40 : 0} className="group">
                <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5 transition-colors duration-200 hover:bg-muted/40 md:grid-cols-[36px_minmax(0,1.2fr)_minmax(0,1fr)_120px_auto]">
                  <AvatarInitials initials={s.initials} className="size-9 text-xs" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.role} · {serviceName(s.serviceId)}
                    </p>
                    <LoadMeter load={s.load} capacity={s.capacity} className="mt-1.5 md:hidden" />
                  </div>
                  <p className="hidden min-w-0 truncate text-xs md:block">
                    {s.interns.length ? (
                      <>
                        <span className="sr-only">Stagiaires suivis : </span>
                        {s.interns.map((i) => i.name).join(", ")}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Aucun stagiaire</span>
                    )}
                  </p>
                  <LoadMeter load={s.load} capacity={s.capacity} className="hidden md:flex" />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDetailId(s.id)}
                      aria-label={`Voir la fiche de ${s.name}`}
                      className={cn(rowActionClass(), "group")}
                    >
                      <span className="hidden whitespace-nowrap sm:inline">Voir la fiche</span>
                      <ArrowRight className={cn("size-3.5 shrink-0", ARROW_NUDGE)} />
                    </button>
                    <ActionMenu label={`Plus d'actions pour ${s.name}`}>
                      <MenuItem
                        onSelect={() => {
                          setEditing(s);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4 text-muted-foreground" /> Modifier
                      </MenuItem>
                      <MenuItem destructive onSelect={() => setRemoving(s)}>
                        <Trash2 className="size-4" /> Retirer
                      </MenuItem>
                    </ActionMenu>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        )}
      </Reveal>

      {/* Fiche de l'encadreur */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail?.name ?? ""}
        description={detail ? `${detail.role} · ${serviceName(detail.serviceId)}` : undefined}
        footer={
          detail && (
            <Button
              variant="outline"
              onClick={() => {
                setEditing(detail);
                setDetailId(null);
                setFormOpen(true);
              }}
            >
              <Pencil className="mr-2 size-4" /> Modifier
            </Button>
          )
        }
      >
        {detail && (
          <div className="space-y-6">
            <dl className="grid grid-cols-2 divide-x rounded-xl border py-3">
              <div className="px-4">
                <dt className="text-[11px] font-medium text-muted-foreground">Charge</dt>
                <dd className="mt-1">
                  <LoadMeter load={detail.load} capacity={detail.capacity} />
                </dd>
              </div>
              <div className="px-4">
                <dt className="text-[11px] font-medium text-muted-foreground">Places libres</dt>
                <dd className="mt-0.5 text-[13px] font-semibold tabular-nums">{Math.max(0, detail.capacity - detail.load)}</dd>
              </div>
            </dl>

            <div>
              <h3 className="text-[13px] font-semibold">Contact</h3>
              <ul className="mt-2 space-y-2 text-[13px]">
                <li>
                  <a href={`mailto:${detail.email}`} className="inline-flex items-center gap-2 text-primary underline-offset-2 hover:underline">
                    <Mail className="size-4 text-muted-foreground" /> {detail.email}
                  </a>
                </li>
                {detail.phone && (
                  <li>
                    <a href={`tel:${detail.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 tabular-nums text-primary underline-offset-2 hover:underline">
                      <Phone className="size-4 text-muted-foreground" /> {detail.phone}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold">Stagiaires suivis</h3>
              {detail.interns.length === 0 ? (
                <p className="mt-2 text-[13px] text-muted-foreground">Aucun stagiaire pour le moment.</p>
              ) : (
                <ul className="mt-2 divide-y rounded-lg border">
                  {detail.interns.map((intern) => {
                    const step = internStep(intern);
                    return (
                      <li key={intern.id}>
                        <Link
                          to="/entreprise/stagiaires/$internId"
                          params={{ internId: intern.id }}
                          className="group flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-muted/40"
                        >
                          <AvatarInitials initials={intern.initials} className="size-8 text-xs" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold transition-colors group-hover:text-primary">{intern.name}</span>
                            <Badge label={step.label} tone={step.tone} className="mt-1 text-[11px]" />
                          </span>
                          <ArrowRight className={cn("size-3.5 shrink-0 text-muted-foreground", ARROW_NUDGE)} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <SupervisorForm open={formOpen} editing={editing} onClose={() => setFormOpen(false)} />
      <AssignModal intern={assigning} onClose={() => setAssigning(null)} />

      {/* Retirer un encadreur */}
      <Modal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        icon={Trash2}
        title="Retirer cet encadreur ?"
        description={removing ? `${removing.name} · ${serviceName(removing.serviceId)}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={Boolean(removing && followed(removing.id).length > 0)}
              onClick={() => {
                if (!removing) return;
                const result = removeSupervisor(removing.id);
                if (!result.ok) {
                  toast.error("Encadreur non retiré", { description: result.error });
                  return;
                }
                toast.success("Encadreur retiré", { description: removing.name });
                setRemoving(null);
              }}
            >
              Retirer
            </Button>
          </>
        }
      >
        <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
          {removing && followed(removing.id).length > 0
            ? `${removing.name} suit encore ${plural(followed(removing.id).length, "stagiaire")}. Désignez-leur d'abord un autre encadreur.`
            : "Il ne pourra plus être désigné pour de nouveaux stagiaires."}
        </p>
      </Modal>
    </div>
  );
}
