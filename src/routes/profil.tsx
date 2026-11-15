import { createFileRoute } from "@tanstack/react-router";
import { Camera, CheckCircle2, Clock, Download, Eye, EyeOff, FileText, FileUp, Save, ShieldCheck } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { TagInput } from "@/components/company/tag-input";
import { Field, PageIntro, SectionHeader, Select, inputClass, textareaClass } from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { AnimatedNumber, Reveal } from "@/components/ui/motion";
import { Switch } from "@/components/ui/switch";
import { fmtDate, localIsoDate } from "@/lib/dates";
import { missingFields, profileCompletion, type Profile } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { downloadCv, uploadCv } from "@/lib/files";
import { remoteState } from "@/lib/remote-flag";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Mon profil — StageManager" },
      { name: "description", content: "Gérez votre profil académique et professionnel, votre CV et sa visibilité." },
    ],
  }),
  component: ProfilePage,
});

const LEVELS = ["Graduat (G1)", "Graduat (G2)", "Graduat (G3)", "Licence (L1)", "Licence (L2)", "Licence (L3)", "Master (M1)", "Master (M2)"];

const SKILL_SUGGESTIONS = ["Excel", "Analyse financière", "Comptabilité", "Rédaction", "SQL", "Python", "Communication", "Organisation", "Canva", "React"];

/** Champs obligatoires pour postuler, dans l'ordre de la page : le focus va au premier manquant. */
const REQUIRED: { key: keyof Profile; id: string; message: string }[] = [
  { key: "nom", id: "p-nom", message: "Le nom est obligatoire." },
  { key: "prenom", id: "p-prenom", message: "Le prénom est obligatoire." },
  { key: "email", id: "p-email", message: "L'adresse e-mail est obligatoire." },
  { key: "telephone", id: "p-telephone", message: "Le téléphone est obligatoire." },
  { key: "universite", id: "p-universite", message: "Indiquez votre université." },
  { key: "filiere", id: "p-filiere", message: "Indiquez votre filière." },
  { key: "niveau", id: "p-niveau", message: "Choisissez votre niveau d'études." },
];

function FormSection({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-6 sm:px-6">
      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-0.5 text-pretty text-[13px] text-muted-foreground">{desc}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ProfilePage() {
  const { profile, updateProfile } = useStore();
  const [draft, setDraft] = useState<Profile>(profile);
  const [errors, setErrors] = useState<Partial<Record<keyof Profile, string>>>({});
  const photoRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const [cvPending, setCvPending] = useState(false);

  // La photo, le CV et la visibilité s'enregistrent aussitôt : ils n'entrent pas dans la comparaison.
  const dirty = useMemo(() => {
    const strip = ({ photo: _p, cv: _c, visible: _v, ...rest }: Profile) => rest;
    return JSON.stringify(strip(profile)) !== JSON.stringify(strip(draft));
  }, [profile, draft]);

  const live = { ...draft, photo: profile.photo, cv: profile.cv };
  const completion = profileCompletion(live);
  const missing = missingFields(live);

  const set = (patch: Partial<Profile>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      (Object.keys(patch) as (keyof Profile)[]).forEach((key) => delete next[key]);
      return next;
    });
  };

  const save = () => {
    const next: typeof errors = {};
    REQUIRED.forEach((field) => {
      if (!String(draft[field.key] ?? "").trim()) next[field.key] = field.message;
    });
    if (draft.email.trim() && !/^\S+@\S+\.\S+$/.test(draft.email.trim())) next.email = "Saisissez une adresse e-mail valide.";
    if (draft.telephone.trim() && !/^[+\d\s]{8,}$/.test(draft.telephone.trim())) next.telephone = "Saisissez un numéro valide, par exemple +243 81 000 0000.";
    setErrors(next);
    const first = REQUIRED.find((field) => next[field.key]);
    if (first) {
      const element = document.getElementById(first.id);
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Profil incomplet", { description: "Complétez les champs signalés en rouge." });
      return;
    }
    updateProfile({ ...draft, photo: profile.photo, cv: profile.cv, visible: profile.visible });
    toast.success("Profil enregistré", { description: "Les entreprises verront ces informations avec vos candidatures." });
  };

  const onPhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Format d'image non pris en charge", { description: "Choisissez un fichier PNG, JPG ou WebP." });
    if (file.size > 2e6) return void toast.error("Image trop lourde", { description: "2 Mo maximum." });
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ photo: reader.result as string });
      toast.success("Photo mise à jour");
    };
    reader.readAsDataURL(file);
  };

  const onCv = async (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") return void toast.error("Le CV doit être au format PDF");
    if (file.size > 5e6) return void toast.error("Fichier trop volumineux", { description: "5 Mo maximum." });
    // Le fichier lui-même part dans le stockage privé : l'entreprise pourra l'ouvrir après votre candidature.
    const userId = useAuth.getState().session?.userId;
    if (remoteState.active && userId) {
      setCvPending(true);
      const error = await uploadCv(userId, file);
      setCvPending(false);
      if (error) return void toast.error("CV non enregistré", { description: error });
    }
    updateProfile({ cv: { name: file.name, size: file.size, date: localIsoDate() } });
    toast.success("CV téléversé", { description: file.name });
  };

  const input = (key: keyof Profile, id: string, placeholder: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      id={id}
      className={inputClass}
      placeholder={placeholder}
      value={String(draft[key] ?? "")}
      onChange={(event) => set({ [key]: event.target.value } as Partial<Profile>)}
      {...extra}
    />
  );

  const initials = `${draft.prenom[0] ?? ""}${draft.nom[0] ?? ""}`.toUpperCase() || "É";

  const saveButton = (
    <Button onClick={save} disabled={!dirty}>
      <Save className="mr-2 size-4" /> Enregistrer
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Ces informations accompagnent chacune de vos candidatures. Vos coordonnées et votre CV ne sont transmis qu'aux entreprises auxquelles vous postulez."
        action={saveButton}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ============================ Formulaire ============================ */}
        <Reveal as="section" className="card-surface overflow-hidden" aria-label="Mon profil">
          <div className="divide-y">
            {/* Identité : la photo s'enregistre aussitôt */}
            <section className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:px-6">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                aria-label={profile.photo ? "Changer la photo de profil" : "Ajouter une photo de profil"}
                className="press group relative size-20 shrink-0 overflow-hidden rounded-full ring-4 ring-primary-soft"
              >
                {profile.photo ? (
                  <img src={profile.photo} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center bg-primary text-xl font-semibold text-primary-foreground">{initials}</span>
                )}
                <span className="absolute inset-0 grid place-items-center bg-overlay/50 text-primary-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera className="size-5" />
                </span>
              </button>
              <input ref={photoRef} type="file" accept="image/*" hidden onChange={(event) => onPhoto(event.target.files?.[0])} />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-tight">
                  {`${draft.prenom} ${draft.nom}`.trim() || "Votre nom"}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {[draft.filiere, draft.niveau].filter(Boolean).join(" · ") || "Filière · niveau"}
                </p>
                <p className="mt-2 text-pretty text-xs text-muted-foreground">
                  Photo facultative (PNG, JPG ou WebP, 2 Mo maximum) ; à défaut, vos initiales s'affichent.
                </p>
              </div>
            </section>

            <FormSection title="Informations personnelles" desc="Pour que l'entreprise puisse vous identifier et vous contacter.">
              <Field label="Nom" htmlFor="p-nom" required error={errors.nom}>
                {input("nom", "p-nom", "Ex. Mukendi", { autoComplete: "family-name" })}
              </Field>
              <Field label="Postnom" htmlFor="p-postnom">
                {input("postnom", "p-postnom", "Ex. Kalala")}
              </Field>
              <Field label="Prénom" htmlFor="p-prenom" required error={errors.prenom}>
                {input("prenom", "p-prenom", "Ex. Grâce", { autoComplete: "given-name" })}
              </Field>
              <Field label="Téléphone" htmlFor="p-telephone" required error={errors.telephone}>
                {input("telephone", "p-telephone", "Ex. +243 81 000 0000", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
              </Field>
              <Field label="E-mail" htmlFor="p-email" hint="L'adresse de votre compte : elle sert à la connexion et ne se modifie pas ici.">
                {input("email", "p-email", "Ex. prenom.nom@exemple.cd", { type: "email", readOnly: true, className: cn(inputClass, "bg-muted/40 text-muted-foreground") })}
              </Field>
              <Field label="Adresse" htmlFor="p-adresse">
                {input("adresse", "p-adresse", "Ex. Av. de la Justice 24, Gombe", { autoComplete: "street-address" })}
              </Field>
            </FormSection>

            <FormSection title="Parcours académique" desc="Le système expert s'en sert pour proposer le service le plus adapté.">
              <Field label="Université" htmlFor="p-universite" required error={errors.universite}>
                {input("universite", "p-universite", "Ex. Université de Kinshasa")}
              </Field>
              <Field label="Faculté" htmlFor="p-faculte">
                {input("faculte", "p-faculte", "Ex. Sciences économiques et de gestion")}
              </Field>
              <Field label="Filière" htmlFor="p-filiere" required error={errors.filiere}>
                {input("filiere", "p-filiere", "Ex. Gestion financière")}
              </Field>
              <Field label="Niveau d'études" htmlFor="p-niveau" required error={errors.niveau}>
                <Select id="p-niveau" value={draft.niveau} placeholder="Choisir un niveau" onChange={(event) => set({ niveau: event.target.value })}>
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormSection>

            <section className="px-5 py-6 sm:px-6">
              <h3 className="text-[15px] font-semibold tracking-tight">Compétences</h3>
              <p className="mt-0.5 text-pretty text-[13px] text-muted-foreground">
                Elles sont comparées à celles demandées par chaque offre.
              </p>
              <TagInput
                id="p-competences"
                label="Vos compétences"
                value={draft.competences}
                onChange={(competences) => set({ competences })}
                suggestions={SKILL_SUGGESTIONS}
                className="mt-4"
              />
            </section>

            <section className="px-5 py-6 sm:px-6">
              <h3 className="text-[15px] font-semibold tracking-tight">Expériences et projets</h3>
              <p className="mt-0.5 text-pretty text-[13px] text-muted-foreground">Quelques lignes suffisent : ce que vous avez fait, où et combien de temps.</p>
              <div className="mt-4 grid gap-4">
                <Field label="Expériences professionnelles" htmlFor="p-experiences">
                  <textarea
                    id="p-experiences"
                    className={cn(textareaClass, "[field-sizing:content]")}
                    placeholder="Ex. Assistante comptable bénévole, ASBL Mama Kongo (2025, 4 mois)"
                    value={draft.experiences}
                    onChange={(event) => set({ experiences: event.target.value })}
                  />
                </Field>
                <Field label="Projets" htmlFor="p-projets">
                  <textarea
                    id="p-projets"
                    className={cn(textareaClass, "[field-sizing:content]")}
                    placeholder="Ex. Mémoire sur l'accès au microcrédit des femmes entrepreneures"
                    value={draft.projets}
                    onChange={(event) => set({ projets: event.target.value })}
                  />
                </Field>
                <Field label="Informations complémentaires" htmlFor="p-infos">
                  <textarea
                    id="p-infos"
                    className={cn(textareaClass, "[field-sizing:content]")}
                    placeholder="Ex. Langues parlées, disponibilités, permis de conduire"
                    value={draft.infos}
                    onChange={(event) => set({ infos: event.target.value })}
                  />
                </Field>
              </div>
            </section>
          </div>
        </Reveal>

        {/* ============================ Colonne latérale ============================ */}
        <aside className="order-first grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6 lg:grid-cols-2 xl:sticky xl:top-[96px] xl:order-none xl:flex xl:flex-col xl:self-start">
          <Reveal delay={80} className="card-surface p-5">
            <SectionHeader title="Profil complété" />
            <p className="mt-3 text-[30px] font-semibold leading-none tracking-tight">
              <AnimatedNumber value={completion} suffix="%" />
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div
                className={cn("h-full rounded-full transition-[width] duration-500 [transition-timing-function:var(--ease-soft)]", missing.length ? "bg-warning" : "bg-success")}
                style={{ width: `${completion}%` }}
              />
            </div>
            {missing.length ? (
              <ul className="mt-4 space-y-1.5">
                {missing.map((field) => (
                  <li key={field.key} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <span className="size-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
                    {field.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex items-center gap-1.5 text-[13px] text-success-ink">
                <CheckCircle2 className="size-4" /> Votre profil est complet.
              </p>
            )}
          </Reveal>

          <Reveal delay={140} className="card-surface p-5">
            <SectionHeader title="CV" description="Obligatoire pour postuler" />
            {profile.cv ? (
              <div className="mt-4 flex items-center gap-3 border-y py-3">
                <FileText className="size-[18px] shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{profile.cv.name}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {Math.round(profile.cv.size / 1000)} Ko · ajouté le {fmtDate(profile.cv.date.slice(0, 10))}
                  </p>
                </div>
                {remoteState.active && (
                  <button
                    type="button"
                    onClick={() => {
                      const userId = useAuth.getState().session?.userId;
                      if (userId) void downloadCv(userId, profile.cv?.name ?? "CV.pdf");
                    }}
                    aria-label={`Télécharger ${profile.cv.name}`}
                    className="press grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Download className="size-4" />
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-3 text-[13px] font-medium text-warning">Aucun CV : ajoutez-le pour pouvoir postuler.</p>
            )}
            <button
              type="button"
              onClick={() => cvRef.current?.click()}
              disabled={cvPending}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                onCv(event.dataTransfer.files[0]);
              }}
              className="press group mt-4 flex w-full flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-accent hover:bg-primary-soft/50 hover:text-primary"
            >
              <FileUp className="nav-icon nav-icon--lift size-[18px]" />
              {cvPending ? "Envoi du CV…" : profile.cv ? "Remplacer le CV" : "Téléverser mon CV"}
              <span className="text-xs font-normal text-muted-foreground">PDF, 5 Mo maximum · glisser-déposer possible</span>
            </button>
            <input ref={cvRef} type="file" accept="application/pdf" hidden onChange={(event) => onCv(event.target.files?.[0])} />
          </Reveal>

          <Reveal delay={200} className="card-surface p-5 lg:col-span-2 xl:col-span-1">
            <SectionHeader title="Visibilité" />
            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[13px] font-medium">
                  {profile.visible ? <Eye className="size-4 text-muted-foreground" /> : <EyeOff className="size-4 text-muted-foreground" />}
                  <label htmlFor="p-visible">Visible par les entreprises</label>
                </p>
                <p className="mt-0.5 text-pretty text-xs text-muted-foreground">
                  Les entreprises peuvent découvrir votre profil, sans vos coordonnées.
                </p>
              </div>
              <Switch
                id="p-visible"
                checked={profile.visible}
                onCheckedChange={(visible) => {
                  updateProfile({ visible });
                  toast.success(visible ? "Profil visible" : "Profil masqué");
                }}
              />
            </div>
            <p className="mt-4 flex gap-2 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0" />
              Votre CV n'est accessible qu'aux entreprises auxquelles vous avez postulé.
            </p>
          </Reveal>
        </aside>
      </div>

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
