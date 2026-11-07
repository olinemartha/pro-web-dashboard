import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  GraduationCap,
  Lightbulb,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Badge,
  EmptyBlock,
  Field,
  KpiCard,
  Modal,
  PageIntro,
  inputClass,
  textareaClass,
  type Tone,
} from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";
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
  skills: string;
}

const EMPTY_FORM: ServiceForm = {
  name: "",
  internsNeeded: "1",
  profiles: "",
  education: "",
  skills: "",
};

function toForm(service: Service): ServiceForm {
  return {
    name: service.name,
    internsNeeded: String(service.internsNeeded),
    profiles: service.profiles,
    education: service.education,
    skills: service.skills.join(", "),
  };
}

function fmtDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function staleDays(service: Service) {
  return Math.floor(
    (Date.now() - new Date(`${service.updatedAt}T00:00:00`).getTime()) / 86_400_000
  );
}

function isIncomplete(service: Service) {
  return !service.profiles.trim() || !service.education.trim() || service.skills.length === 0;
}

function CompanyServicesPage() {
  const { services, interns, addService, updateService, removeService } = useCompanyStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filledFor = (service: Service) =>
    interns.filter(
      (intern) =>
        intern.confirmed &&
        (intern.serviceId ? intern.serviceId === service.id : intern.service === service.name)
    ).length;

  const totalNeeded = services.reduce((sum, service) => sum + service.internsNeeded, 0);
  const totalFilled = services.reduce((sum, service) => sum + filledFor(service), 0);
  const toDelete = services.find((service) => service.id === deleteId) ?? null;

  const flagged = services.filter(
    (service) =>
      isIncomplete(service) || staleDays(service) > 30 || filledFor(service) < service.internsNeeded
  );

  const set = (patch: Partial<ServiceForm>) => setForm((current) => ({ ...current, ...patch }));

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
    if (!form.name.trim()) next.name = "Le nom du service est obligatoire.";
    if (!form.internsNeeded || Number(form.internsNeeded) < 1) {
      next.internsNeeded = "Indiquez au moins 1 stagiaire.";
    }
    if (!form.profiles.trim()) next.profiles = "Précisez les profils souhaités.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      name: form.name.trim(),
      internsNeeded: Number(form.internsNeeded),
      profiles: form.profiles.trim(),
      education: form.education.trim(),
      skills: form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    };

    if (editingId) {
      updateService(editingId, payload);
      toast.success("Service mis à jour", { description: payload.name });
    } else {
      addService(payload);
      toast.success("Service ajouté", { description: payload.name });
    }
    setFormOpen(false);
  };

  const statusFor = (service: Service): { label: string; tone: Tone } => {
    if (isIncomplete(service)) return { label: "Besoins incomplets", tone: "destructive" };
    if (staleDays(service) > 30) return { label: "À actualiser", tone: "accent" };
    const left = service.internsNeeded - filledFor(service);
    if (left <= 0) return { label: "Complet", tone: "success" };
    return { label: `${left} place(s) restante(s)`, tone: "primary" };
  };

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Renseignez uniquement les services qui accueillent des stagiaires. Ces données alimentent le système expert."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Ajouter un service
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Services enregistrés"
          value={services.length}
          hint="Accueillant des stagiaires"
          icon={Users}
        />
        <KpiCard
          label="Places nécessaires"
          value={totalNeeded}
          hint="Sur la période de recrutement"
          icon={GraduationCap}
        />
        <KpiCard
          label="Places pourvues"
          value={totalFilled}
          hint="Affectations confirmées"
          icon={Users}
        />
        <KpiCard
          label="Places restantes"
          value={Math.max(0, totalNeeded - totalFilled)}
          hint="À pourvoir"
          icon={Users}
        />
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-accent/40 bg-accent-soft p-4 text-sm leading-relaxed text-primary">
        <Lightbulb className="mt-0.5 size-4 shrink-0" />
        <p className="max-w-[75ch] text-pretty">
          Ces informations constituent la base de faits du système expert : plus elles sont précises
          et récentes, plus les recommandations d'affectation sont pertinentes.
        </p>
      </div>

      {flagged.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">
              {flagged.length} service(s) demandent votre attention
            </p>
            <p className="mt-0.5 max-w-[75ch] text-pretty text-xs leading-relaxed">
              Besoins incomplets, données anciennes ou places encore à pourvoir :{" "}
              {flagged.map((service) => service.name).join(", ")}.
            </p>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <EmptyBlock
          title="Aucun service enregistré"
          desc="Ajoutez un service pour indiquer vos besoins en stagiaires."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((service) => {
            const filled = filledFor(service);
            const left = Math.max(0, service.internsNeeded - filled);
            const status = statusFor(service);
            const percent = Math.min(100, Math.round((filled / service.internsNeeded) * 100));
            return (
              <article key={service.id} className="card-surface flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-pretty text-lg font-semibold leading-snug tracking-tight">
                      {service.name}
                    </h2>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs leading-4 text-muted-foreground">
                      <Users className="size-3.5" /> {service.internsNeeded} stagiaire
                      {service.internsNeeded > 1 ? "s" : ""} recherché
                      {service.internsNeeded > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge label={status.label} tone={status.tone} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-muted/60 p-3 text-center">
                  <div>
                    <p className="text-lg font-semibold leading-tight tabular-nums">
                      {service.internsNeeded}
                    </p>
                    <p className="text-xs leading-4 text-foreground/70">Nécessaires</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold leading-tight tabular-nums">{filled}</p>
                    <p className="text-xs leading-4 text-foreground/70">Pourvues</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold leading-tight tabular-nums">{left}</p>
                    <p className="text-xs leading-4 text-foreground/70">Restantes</p>
                  </div>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <dl className="mt-3 space-y-2 text-sm leading-relaxed">
                  <div>
                    <dt className="text-xs font-medium leading-4 text-muted-foreground">
                      Profils souhaités
                    </dt>
                    <dd>{service.profiles || "Non précisés"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium leading-4 text-muted-foreground">
                      Formations / niveaux
                    </dt>
                    <dd>{service.education || "Non renseignés"}</dd>
                  </div>
                </dl>

                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground">Compétences attendues</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {service.skills.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Non précisées.</p>
                    ) : (
                      service.skills.map((skill) => (
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

                <p className="mt-3 text-xs leading-4 tabular-nums text-muted-foreground">
                  Dernière mise à jour : {fmtDate(service.updatedAt)}
                  {staleDays(service) > 30 ? ` · il y a ${staleDays(service)} jours` : ""}
                </p>

                <div className="mt-auto flex gap-2 border-t pt-3">
                  <Button variant="outline" size="sm" onClick={() => openEdit(service)}>
                    <Pencil className="mr-1.5 size-3.5" /> Modifier
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(service.id)}>
                    <Trash2 className="mr-1.5 size-3.5 text-destructive" /> Supprimer
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Modifier le service" : "Ajouter un service"}
        description="Seuls les services accueillant des stagiaires doivent être renseignés."
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>{editingId ? "Enregistrer" : "Ajouter"}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du service" htmlFor="service-nom" required error={errors.name}>
            <input
              id="service-nom"
              className={inputClass}
              placeholder="Ex. Direction Crédit"
              value={form.name}
              onChange={(event) => set({ name: event.target.value })}
            />
          </Field>
          <Field
            label="Nombre de stagiaires nécessaires"
            htmlFor="service-nombre"
            required
            error={errors.internsNeeded}
          >
            <input
              id="service-nombre"
              type="number"
              min={1}
              className={inputClass}
              value={form.internsNeeded}
              onChange={(event) => set({ internsNeeded: event.target.value })}
            />
          </Field>
          <Field
            label="Profils souhaités"
            htmlFor="service-profils"
            required
            error={errors.profiles}
            className="sm:col-span-2"
          >
            <textarea
              id="service-profils"
              className={textareaClass}
              placeholder="Ex. Étudiant rigoureux, à l'aise avec l'analyse financière."
              value={form.profiles}
              onChange={(event) => set({ profiles: event.target.value })}
            />
          </Field>
          <Field
            label="Formations ou niveaux pertinents"
            htmlFor="service-formation"
            hint="Ex. Licence L3 / Master M1 — Finance, Économie, Gestion."
            className="sm:col-span-2"
          >
            <input
              id="service-formation"
              className={inputClass}
              value={form.education}
              onChange={(event) => set({ education: event.target.value })}
            />
          </Field>
          <Field
            label="Compétences attendues"
            htmlFor="service-competences"
            hint="Séparez les compétences par des virgules."
            className="sm:col-span-2"
          >
            <input
              id="service-competences"
              className={inputClass}
              placeholder="Excel, Analyse financière, Rédaction"
              value={form.skills}
              onChange={(event) => set({ skills: event.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setDeleteId(null)}
        title="Supprimer ce service ?"
        description={
          toDelete
            ? `${toDelete.name} sera retiré de la base de faits du système expert.`
            : undefined
        }
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
        <p className="text-sm text-muted-foreground">
          Les offres et stagiaires déjà enregistrés ne sont pas modifiés. Les affectations existantes
          conservent leur trace. Cette action ne peut pas être annulée.
        </p>
      </Modal>
    </div>
  );
}
