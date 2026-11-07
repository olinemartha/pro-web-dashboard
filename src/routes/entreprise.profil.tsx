import { createFileRoute } from "@tanstack/react-router";
import { useState, type ComponentType } from "react";
import { Download, FileText, Globe, Lock, Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, PageIntro, inputClass, textareaClass } from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";
import type { CompanyProfile } from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/profil")({
  head: () => ({
    meta: [{ title: "Mon profil entreprise — StageManager" }],
  }),
  component: CompanyProfilePage,
});

function fmtDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SectionTitle({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold leading-none tabular-nums text-primary">
        {step}
      </span>
      <div>
        <h2 className="text-sm font-semibold leading-snug">{title}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function GroupHeader({
  icon: Icon,
  title,
  desc,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b pb-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-soft text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-snug tracking-tight">{title}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function CompanyProfilePage() {
  const { profile, updateProfile } = useCompanyStore();
  const [draft, setDraft] = useState<CompanyProfile>(profile);

  const set = (patch: Partial<CompanyProfile>) => setDraft((current) => ({ ...current, ...patch }));

  const save = () => {
    updateProfile(draft);
    toast.success("Profil entreprise enregistré", {
      description: "Le profil public est mis à jour ; le dossier administratif reste confidentiel.",
    });
  };

  const addDocument = () => {
    const document = {
      id: `cd-${Date.now()}`,
      name: `Document_${draft.documents.length + 1}.pdf`,
      date: new Date().toISOString().split("T")[0],
    };
    set({ documents: [...draft.documents, document] });
    toast.success("Document ajouté", { description: document.name });
  };

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Le profil public est visible par les étudiants ; le dossier administratif reste confidentiel."
        action={
          <Button onClick={save}>
            <Save className="mr-2 size-4" /> Enregistrer
          </Button>
        }
      />

      {/* Profil public */}
      <GroupHeader
        icon={Globe}
        title="Profil public"
        desc="Visible par les étudiants sur vos offres publiées."
      />

      <section className="card-surface p-5 sm:p-6">
        <SectionTitle
          step={1}
          title="Informations générales"
          desc="Nom, logo facultatif, secteur et description de l'entreprise."
        />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2">
            <span className="grid size-20 place-items-center rounded-xl bg-primary text-2xl font-semibold text-primary-foreground">
              {draft.initials || "E"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("Téléversement de logo", { description: "Fonction de démonstration." })
              }
            >
              <Upload className="mr-2 size-3.5" /> Logo
            </Button>
            <p className="max-w-[22ch] text-center text-xs leading-relaxed text-muted-foreground">
              Facultatif — les initiales s'affichent par défaut.
            </p>
          </div>

          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <Field label="Nom de l'entreprise" htmlFor="company-name" required>
              <input
                id="company-name"
                className={inputClass}
                value={draft.name}
                onChange={(event) => set({ name: event.target.value })}
              />
            </Field>
            <Field
              label="Initiales"
              htmlFor="company-initials"
              hint="2 caractères, utilisés en l'absence de logo."
            >
              <input
                id="company-initials"
                className={inputClass}
                maxLength={2}
                value={draft.initials}
                onChange={(event) => set({ initials: event.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Secteur d'activité" htmlFor="company-sector" required>
              <input
                id="company-sector"
                className={inputClass}
                value={draft.sector}
                onChange={(event) => set({ sector: event.target.value })}
              />
            </Field>
            <Field label="Description" htmlFor="company-description" className="sm:col-span-2">
              <textarea
                id="company-description"
                className={textareaClass}
                value={draft.description}
                onChange={(event) => set({ description: event.target.value })}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="card-surface p-5 sm:p-6">
        <SectionTitle
          step={2}
          title="Coordonnées"
          desc="Adresse, ville, téléphone et e-mail professionnel."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adresse" htmlFor="company-address">
            <input
              id="company-address"
              className={inputClass}
              value={draft.address}
              onChange={(event) => set({ address: event.target.value })}
            />
          </Field>
          <Field label="Ville" htmlFor="company-city">
            <input
              id="company-city"
              className={inputClass}
              value={draft.city}
              onChange={(event) => set({ city: event.target.value })}
            />
          </Field>
          <Field label="Téléphone" htmlFor="company-phone">
            <input
              id="company-phone"
              className={inputClass}
              value={draft.phone}
              onChange={(event) => set({ phone: event.target.value })}
            />
          </Field>
          <Field label="E-mail professionnel" htmlFor="company-email" required>
            <input
              id="company-email"
              type="email"
              className={inputClass}
              value={draft.email}
              onChange={(event) => set({ email: event.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className="card-surface p-5 sm:p-6">
        <SectionTitle
          step={3}
          title="Présentation"
          desc="Activités principales, domaines d'intervention et site web."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Activités principales" htmlFor="company-activities" className="sm:col-span-2">
            <textarea
              id="company-activities"
              className={textareaClass}
              value={draft.activities}
              onChange={(event) => set({ activities: event.target.value })}
            />
          </Field>
          <Field label="Domaines d'intervention" htmlFor="company-domains">
            <input
              id="company-domains"
              className={inputClass}
              value={draft.domains}
              onChange={(event) => set({ domains: event.target.value })}
            />
          </Field>
          <Field
            label="Site web"
            htmlFor="company-website"
            hint="Adresse complète, par exemple https://exemple.cd."
          >
            <input
              id="company-website"
              className={inputClass}
              value={draft.website}
              onChange={(event) => set({ website: event.target.value })}
            />
          </Field>
        </div>
      </section>

      {/* Dossier administratif */}
      <GroupHeader
        icon={Lock}
        title="Dossier administratif"
        desc="Utilisé pour la vérification interne. Non exposé aux étudiants."
      />

      <section className="card-surface p-5 sm:p-6">
        <SectionTitle
          step={4}
          title="Informations légales"
          desc="Numéro d'enregistrement et références officielles de l'entreprise."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Numéro d'enregistrement (RCCM)" htmlFor="company-registration" required>
            <input
              id="company-registration"
              className={inputClass}
              value={draft.registration}
              onChange={(event) => set({ registration: event.target.value })}
            />
          </Field>
          <Field label="Références officielles" htmlFor="company-legal">
            <input
              id="company-legal"
              className={inputClass}
              value={draft.legalRefs}
              onChange={(event) => set({ legalRefs: event.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className="card-surface p-5 sm:p-6">
        <SectionTitle
          step={5}
          title="Responsable"
          desc="Identité et coordonnées du représentant principal. Non exposé aux étudiants."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du responsable" htmlFor="rep-name" required>
            <input
              id="rep-name"
              className={inputClass}
              value={draft.representativeName}
              onChange={(event) => set({ representativeName: event.target.value })}
            />
          </Field>
          <Field label="Fonction" htmlFor="rep-role">
            <input
              id="rep-role"
              className={inputClass}
              value={draft.representativeRole}
              onChange={(event) => set({ representativeRole: event.target.value })}
            />
          </Field>
          <Field label="E-mail" htmlFor="rep-email">
            <input
              id="rep-email"
              type="email"
              className={inputClass}
              value={draft.representativeEmail}
              onChange={(event) => set({ representativeEmail: event.target.value })}
            />
          </Field>
          <Field label="Téléphone" htmlFor="rep-phone">
            <input
              id="rep-phone"
              className={inputClass}
              value={draft.representativePhone}
              onChange={(event) => set({ representativePhone: event.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className="card-surface p-5 sm:p-6">
        <SectionTitle
          step={6}
          title="Documents officiels"
          desc="Pièces justificatives de l'existence de l'entreprise. Non exposées aux étudiants."
        />
        {draft.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun document enregistré.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {draft.documents.map((document) => (
              <li key={document.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-soft text-primary">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-snug">{document.name}</p>
                  <p className="text-xs leading-4 tabular-nums text-muted-foreground">
                    Ajouté le {fmtDate(document.date)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Télécharger ${document.name}`}
                  onClick={() => toast.success("Téléchargement démarré", { description: document.name })}
                >
                  <Download className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Supprimer ${document.name}`}
                  onClick={() => {
                    set({ documents: draft.documents.filter((entry) => entry.id !== document.id) });
                    toast.success("Document supprimé");
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" className="mt-3" onClick={addDocument}>
          <Plus className="mr-2 size-4" /> Ajouter un document
        </Button>
      </section>

      <div className="flex justify-end">
        <Button onClick={save}>
          <Save className="mr-2 size-4" /> Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
