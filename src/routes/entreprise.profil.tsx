import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Download, FileText, Globe, Lock, MapPin, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import {
  ActionMenu,
  EmptyNote,
  Field,
  MenuItem,
  PageIntro,
  SECTION_LINK,
  iconMotion,
  inputClass,
  textareaClass,
} from "@/components/company/ui";
import { CompanyLogoUploader } from "@/components/company/company-logo";
import { useCompanyStore } from "@/lib/company-store";
import { fmtDate, localIsoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CompanyProfile } from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/profil")({
  head: () => ({
    meta: [{ title: "Mon profil entreprise — StageManager" }],
  }),
  component: CompanyProfilePage,
});

/** Champs obligatoires, dans l'ordre de la page : le focus va au premier manquant. */
const REQUIRED: { key: keyof CompanyProfile; id: string; message: string }[] = [
  { key: "name", id: "company-name", message: "Le nom de l'entreprise est obligatoire." },
  { key: "sector", id: "company-sector", message: "Précisez le secteur d'activité." },
  { key: "email", id: "company-email", message: "L'e-mail professionnel est obligatoire." },
  { key: "registration", id: "company-registration", message: "Le numéro RCCM est obligatoire." },
  { key: "representativeName", id: "rep-name", message: "Indiquez le nom du responsable." },
];

/** Une section de formulaire : titre et phrase d'aide au-dessus, champs sur deux colonnes. */
function FormSection({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-6 sm:px-6">
      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-0.5 text-pretty text-[13px] text-muted-foreground">{desc}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** En-tête d'un groupe : titre de carte et pastille de visibilité. */
function GroupHeader({
  id,
  title,
  desc,
  visibility,
}: {
  id: string;
  title: string;
  desc: string;
  visibility: "public" | "confidentiel";
}) {
  const Icon = visibility === "public" ? Globe : Lock;
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 pb-4 pt-5 sm:px-6">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-0.5 text-pretty text-[13px] text-muted-foreground">{desc}</p>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          visibility === "public" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-3.5" />
        {visibility === "public" ? "Visible par les étudiants" : "Confidentiel"}
      </span>
    </div>
  );
}

function CompanyProfilePage() {
  const { profile, updateProfile } = useCompanyStore();
  const [draft, setDraft] = useState<CompanyProfile>(profile);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyProfile, string>>>({});

  // Le logo s'enregistre à part (immédiatement) : il n'entre pas dans la comparaison.
  const dirty = useMemo(() => {
    const { logo: _a, ...current } = profile;
    const { logo: _b, ...edited } = draft;
    return JSON.stringify(current) !== JSON.stringify(edited);
  }, [profile, draft]);

  const set = (patch: Partial<CompanyProfile>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      (Object.keys(patch) as (keyof CompanyProfile)[]).forEach((key) => delete next[key]);
      return next;
    });
  };

  const save = () => {
    const next: typeof errors = {};
    REQUIRED.forEach((field) => {
      if (!String(draft[field.key] ?? "").trim()) next[field.key] = field.message;
    });
    if (draft.email.trim() && !/^\S+@\S+\.\S+$/.test(draft.email.trim())) next.email = "Saisissez une adresse e-mail valide.";
    setErrors(next);
    const first = REQUIRED.find((field) => next[field.key]);
    if (first) {
      const element = document.getElementById(first.id);
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Profil incomplet", { description: "Complétez les champs signalés en rouge." });
      return;
    }
    updateProfile({ ...draft, logo: profile.logo });
    toast.success("Profil entreprise enregistré", {
      description: "Le profil public est à jour ; le dossier administratif reste confidentiel.",
    });
  };

  const addDocument = () => {
    const document = { id: `cd-${Date.now()}`, name: `Document_${draft.documents.length + 1}.pdf`, date: localIsoDate() };
    set({ documents: [...draft.documents, document] });
    toast.success("Document ajouté", { description: `${document.name} — pensez à enregistrer.` });
  };

  const input = (key: keyof CompanyProfile, id: string, placeholder: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      id={id}
      className={inputClass}
      placeholder={placeholder}
      value={String(draft[key] ?? "")}
      onChange={(event) => set({ [key]: event.target.value } as Partial<CompanyProfile>)}
      {...extra}
    />
  );

  const saveButton = (
    <Button onClick={save} disabled={!dirty} className="group">
      <Save className="mr-2 size-4" /> Enregistrer
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Le profil public accompagne vos offres auprès des étudiants ; le dossier administratif sert à la vérification et reste confidentiel."
        action={saveButton}
      />

      {/* Profil public */}
      <Reveal as="section" className="card-surface overflow-hidden" aria-labelledby="profil-public">
        <GroupHeader
          id="profil-public"
          title="Profil public"
          desc="Ce que les étudiants voient sur chacune de vos offres."
          visibility="public"
        />

        <div className="divide-y">
          {/* Identité : le logo (enregistré aussitôt) et l'aperçu de la carte entreprise */}
          <section className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:px-6">
            <CompanyLogoUploader className="size-20 shrink-0 rounded-2xl shadow-sm ring-4 ring-primary-soft" radius="rounded-2xl" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight">{draft.name || "Nom de l'entreprise"}</p>
              <p className="text-[13px] text-muted-foreground">{draft.sector || "Secteur d'activité"}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {draft.city || "Ville"}
              </p>
              <p className="mt-2 text-pretty text-xs text-muted-foreground">
                Logo facultatif (PNG, JPG, WebP ou SVG, 2 Mo maximum) ; à défaut, les initiales s'affichent.
              </p>
            </div>
          </section>

          <FormSection title="Informations générales" desc="Le nom, le secteur et la présentation de l'entreprise.">
            <Field label="Nom de l'entreprise" htmlFor="company-name" required error={errors.name}>
              {input("name", "company-name", "Ex. FINCA RDC")}
            </Field>
            <Field label="Secteur d'activité" htmlFor="company-sector" required error={errors.sector}>
              {input("sector", "company-sector", "Ex. Microfinance")}
            </Field>
            <Field label="Initiales" htmlFor="company-initials" hint="2 lettres, affichées en l'absence de logo.">
              <input
                id="company-initials"
                className={cn(inputClass, "uppercase")}
                maxLength={2}
                placeholder="Ex. FR"
                value={draft.initials}
                onChange={(event) => set({ initials: event.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Site web" htmlFor="company-website" hint="Adresse complète, par exemple https://exemple.cd.">
              {input("website", "company-website", "https://", { type: "url", inputMode: "url" })}
            </Field>
            <Field label="Description" htmlFor="company-description" className="sm:col-span-2">
              <textarea
                id="company-description"
                className={textareaClass}
                placeholder="Ex. Institution de microfinance qui accompagne les entrepreneurs congolais."
                value={draft.description}
                onChange={(event) => set({ description: event.target.value })}
              />
            </Field>
          </FormSection>

          <FormSection title="Activités" desc="Ce que fait l'entreprise : utile aux étudiants pour choisir une offre.">
            <Field label="Activités principales" htmlFor="company-activities" className="sm:col-span-2">
              <textarea
                id="company-activities"
                className={textareaClass}
                placeholder="Ex. Crédit aux micro-entrepreneurs, épargne, éducation financière"
                value={draft.activities}
                onChange={(event) => set({ activities: event.target.value })}
              />
            </Field>
            <Field label="Domaines d'intervention" htmlFor="company-domains" className="sm:col-span-2">
              {input("domains", "company-domains", "Ex. Finance inclusive, agriculture, commerce")}
            </Field>
          </FormSection>

          <FormSection title="Coordonnées" desc="Où et comment joindre l'entreprise.">
            <Field label="Adresse" htmlFor="company-address">
              {input("address", "company-address", "Ex. 25, avenue de la Justice, Gombe")}
            </Field>
            <Field label="Ville" htmlFor="company-city">
              {input("city", "company-city", "Ex. Kinshasa")}
            </Field>
            <Field label="Téléphone" htmlFor="company-phone">
              {input("phone", "company-phone", "Ex. +243 81 000 0000", { type: "tel", inputMode: "tel" })}
            </Field>
            <Field label="E-mail professionnel" htmlFor="company-email" required error={errors.email}>
              {input("email", "company-email", "Ex. stages@finca.cd", { type: "email", inputMode: "email" })}
            </Field>
          </FormSection>
        </div>
      </Reveal>

      {/* Dossier administratif */}
      <Reveal as="section" delay={80} className="card-surface overflow-hidden" aria-labelledby="dossier-admin">
        <GroupHeader
          id="dossier-admin"
          title="Dossier administratif"
          desc="Utilisé pour vérifier l'entreprise. Jamais montré aux étudiants."
          visibility="confidentiel"
        />

        <div className="divide-y">
          <FormSection title="Informations légales" desc="L'enregistrement officiel de l'entreprise.">
            <Field label="Numéro d'enregistrement (RCCM)" htmlFor="company-registration" required error={errors.registration}>
              {input("registration", "company-registration", "Ex. CD/KIN/RCCM/14-B-0000")}
            </Field>
            <Field label="Références officielles" htmlFor="company-legal">
              {input("legalRefs", "company-legal", "Ex. Agrément BCC n° 000")}
            </Field>
          </FormSection>

          <FormSection title="Responsable" desc="La personne qui représente l'entreprise sur StageManager.">
            <Field label="Nom du responsable" htmlFor="rep-name" required error={errors.representativeName}>
              {input("representativeName", "rep-name", "Ex. Marie Lukusa")}
            </Field>
            <Field label="Fonction" htmlFor="rep-role">
              {input("representativeRole", "rep-role", "Ex. Responsable des ressources humaines")}
            </Field>
            <Field label="E-mail" htmlFor="rep-email">
              {input("representativeEmail", "rep-email", "Ex. m.lukusa@finca.cd", { type: "email", inputMode: "email" })}
            </Field>
            <Field label="Téléphone" htmlFor="rep-phone">
              {input("representativePhone", "rep-phone", "Ex. +243 81 000 0000", { type: "tel", inputMode: "tel" })}
            </Field>
          </FormSection>

          {/* Documents officiels : des lignes séparées par un filet */}
          <section className="py-6">
            <div className="flex flex-wrap items-end justify-between gap-3 px-5 sm:px-6">
              <div>
                <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                  Documents officiels
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {draft.documents.length}
                  </span>
                </h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">Les pièces qui attestent l'existence de l'entreprise.</p>
              </div>
              <button type="button" onClick={addDocument} className={SECTION_LINK}>
                <Plus className="size-3.5" /> Ajouter un document
              </button>
            </div>
            {draft.documents.length === 0 ? (
              <EmptyNote icon={FileText} title="Aucun document" desc="Ajoutez le RCCM ou l'agrément de l'entreprise." />
            ) : (
              <ul className="mt-4 divide-y border-y">
                {draft.documents.map((document) => (
                  <li
                    key={document.id}
                    className="group grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3 transition-colors duration-150 hover:bg-muted/50 sm:px-6"
                  >
                    <FileText className={iconMotion("lift", "size-[18px] text-muted-foreground group-hover:text-foreground")} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{document.name}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">Ajouté le {fmtDate(document.date)}</p>
                    </div>
                    <ActionMenu>
                      <MenuItem onSelect={() => toast.success("Téléchargement démarré", { description: document.name })}>
                        <Download className="size-3.5" /> Télécharger
                      </MenuItem>
                      <MenuItem
                        onSelect={() => {
                          set({ documents: draft.documents.filter((entry) => entry.id !== document.id) });
                          toast.success("Document retiré", { description: `${document.name} — pensez à enregistrer.` });
                        }}
                      >
                        <Trash2 className="size-3.5" /> Retirer
                      </MenuItem>
                    </ActionMenu>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Reveal>

      {/* Barre d'enregistrement */}
      <div className="card-surface flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
        <p className={cn("inline-flex items-center gap-1.5 text-[13px]", dirty ? "font-medium text-warning" : "text-muted-foreground")} aria-live="polite">
          {dirty ? <Clock className="size-3.5" /> : <CheckCircle2 className="size-3.5 text-success" />}
          {dirty ? "Modifications non enregistrées" : "Tout est enregistré"}
        </p>
        <div className="flex gap-2">
          {dirty && (
            <Button
              variant="outline"
              onClick={() => {
                setDraft(profile);
                setErrors({});
              }}
            >
              Annuler
            </Button>
          )}
          {saveButton}
        </div>
      </div>
    </div>
  );
}
