import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { AuthBrand, PasswordInput } from "@/components/auth/auth-ui";
import { TagInput } from "@/components/company/tag-input";
import { ARROW_NUDGE, Field, Select, inputClass } from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { ROLE_HOME, useAuth, type HostingProfile } from "@/lib/auth";
import { useCompanyStore } from "@/lib/company-store";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Créer un compte — StageManager" },
      { name: "description", content: "Créez votre compte StageManager, étudiant ou entreprise, en quelques étapes." },
    ],
  }),
  component: SignUpPage,
});

type Role = "etudiant" | "entreprise";

const STEPS: Record<Role | "aucun", string[]> = {
  aucun: ["Début", "Compte", "Profil", "Terminé"],
  etudiant: ["Début", "Compte", "Identité", "Parcours", "Compétences"],
  entreprise: ["Début", "Compte", "Entreprise", "Responsable", "Stagiaires", "Affectation"],
};

const LEVELS = ["Graduat (G1)", "Graduat (G2)", "Graduat (G3)", "Licence (L1)", "Licence (L2)", "Licence (L3)", "Master (M1)", "Master (M2)"];
const SKILL_SUGGESTIONS = ["Excel", "Analyse financière", "Comptabilité", "Rédaction", "SQL", "Python", "Communication", "Organisation", "Canva", "React"];

/* Questions reprises du questionnaire d'enquête mené auprès de FINCA RDC. */
const INTERN_TYPES = [
  "Informatique / IT",
  "Gestion",
  "Comptabilité / Finance",
  "Ressources humaines",
  "Marketing / Communication",
  "Logistique",
  "Droit",
  "Ingénierie / Technique",
];
const FREQUENCIES = ["Rarement", "Occasionnellement", "Régulièrement", "Très régulièrement"];
const ARRIVAL_INFO = ["Formation / domaine d'études", "Niveau d'études", "Compétences", "Expérience", "Domaine souhaité", "CV"];
const DECIDERS = ["Responsable des ressources humaines", "Responsable du service", "Direction", "Maître de stage / encadreur"];
const CRITERIA = [
  "Formation",
  "Compétences",
  "Niveau d'études",
  "Expérience",
  "Besoins de l'entreprise",
  "Domaine souhaité par le stagiaire",
  "Disponibilité des services",
];

/* ------------------------------------------------------------------ */
/* Éléments de l'onboarding                                            */
/* ------------------------------------------------------------------ */

/** Barre d'étapes : cercles reliés, l'étape en cours entourée, les étapes faites cochées. */
function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Étapes de l'inscription" className="w-full">
      <ol className="mx-auto flex max-w-xl items-start">
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={label} className="relative flex flex-1 flex-col items-center" aria-current={active ? "step" : undefined}>
              {index > 0 && (
                <span
                  className={cn(
                    "absolute right-1/2 top-[11px] h-px w-full -translate-x-3 transition-colors duration-500",
                    index <= current ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-10 grid size-6 place-items-center rounded-full border-2 bg-card transition-all duration-300 [transition-timing-function:var(--ease-soft)]",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary ring-4 ring-primary-soft",
                  !done && !active && "border-border"
                )}
              >
                {done && <Check className="size-3.5" strokeWidth={3} />}
                {active && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span
                className={cn(
                  "mt-2 hidden whitespace-nowrap text-[11px] sm:block",
                  active ? "font-semibold text-primary" : done ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
              <span className="sr-only">{done ? " (fait)" : active ? " (étape en cours)" : ""}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-xs text-muted-foreground sm:hidden">
        Étape {current + 1} sur {steps.length} · <span className="font-medium text-foreground">{steps[current]}</span>
      </p>
    </nav>
  );
}

/** Choix multiples ou unique, en grandes puces cochées. */
function ChoiceGrid({
  id,
  options,
  value,
  onChange,
  multiple = true,
  columns = 2,
  label,
}: {
  id: string;
  options: string[];
  value: string[];
  /** Reçoit une fonction de mise à jour : chaque clic part de l'état le plus récent. */
  onChange: (update: (previous: string[]) => string[]) => void;
  multiple?: boolean;
  columns?: 1 | 2;
  label: string;
}) {
  return (
    <div id={id} tabIndex={-1} role="group" aria-label={label} className={cn("grid gap-2 outline-none", columns === 2 && "sm:grid-cols-2")}>
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={selected}
            onClick={() =>
              onChange((previous) =>
                multiple ? (previous.includes(option) ? previous.filter((v) => v !== option) : [...previous, option]) : [option]
              )
            }
            className={cn(
              "press flex min-h-11 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[13px] transition-colors duration-200",
              selected ? "border-primary bg-primary-soft font-semibold text-primary" : "bg-card font-medium hover:border-foreground/25 hover:bg-muted/40"
            )}
          >
            <span
              className={cn(
                "grid size-[18px] shrink-0 place-items-center border transition-colors",
                multiple ? "rounded-[5px]" : "rounded-full",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
              )}
              aria-hidden
            >
              {selected && (multiple ? <Check className="size-3" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-primary-foreground" />)}
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

function StepTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center">
      <h1 className="text-pretty text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mx-auto mt-2 max-w-[52ch] text-pretty text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type Errors = Record<string, string>;

function SignUpPage() {
  const navigate = useNavigate();
  const { session, signUp, completeOnboarding } = useAuth();
  // Inscription commencée (compte créé, profil à compléter) : on reprend après l'étape « Compte ».
  const [role, setRole] = useState<Role | null>(session && session.role !== "admin" ? session.role : null);
  const [step, setStep] = useState(session && !session.onboarded ? 2 : 0);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  const [account, setAccount] = useState({ email: "", password: "", confirm: "" });
  const [student, setStudent] = useState({
    prenom: "", nom: "", postnom: "", telephone: "", universite: "", faculte: "", filiere: "", niveau: "", competences: [] as string[],
  });
  const [company, setCompany] = useState({
    name: "", sector: "", city: "", address: "", representativeName: "", representativeRole: "", representativePhone: "",
  });
  const [hosting, setHosting] = useState<HostingProfile>({ internTypes: [], frequency: "", arrivalInfo: [], deciders: [], criteria: [] });

  const steps = STEPS[role ?? "aucun"];
  const last = step === steps.length - 1;

  const fail = (next: Errors, order: string[]) => {
    setErrors(next);
    const first = order.find((key) => next[key]);
    if (first) document.getElementById(first)?.focus();
    return Boolean(first);
  };
  const clear = (key: string) => setErrors((current) => ({ ...current, [key]: "" }));

  /** Vérifie l'étape en cours ; renvoie vrai si on peut continuer. */
  const validate = (): boolean => {
    const next: Errors = {};
    if (step === 1) {
      if (!account.email.trim()) next["su-email"] = "Saisissez votre adresse e-mail.";
      else if (!/^\S+@\S+\.\S+$/.test(account.email.trim())) next["su-email"] = "Saisissez une adresse e-mail valide.";
      if (account.password.length < 8) next["su-password"] = "8 caractères minimum.";
      if (account.confirm !== account.password) next["su-confirm"] = "Les deux saisies ne correspondent pas.";
      return !fail(next, ["su-email", "su-password", "su-confirm"]);
    }
    if (role === "etudiant") {
      if (step === 2) {
        if (!student.prenom.trim()) next["st-prenom"] = "Indiquez votre prénom.";
        if (!student.nom.trim()) next["st-nom"] = "Indiquez votre nom.";
        if (!/^[+\d\s]{8,}$/.test(student.telephone.trim())) next["st-telephone"] = "Saisissez un numéro valide, par exemple +243 81 000 0000.";
        return !fail(next, ["st-prenom", "st-nom", "st-telephone"]);
      }
      if (step === 3) {
        if (!student.universite.trim()) next["st-universite"] = "Indiquez votre université.";
        if (!student.filiere.trim()) next["st-filiere"] = "Indiquez votre filière.";
        if (!student.niveau) next["st-niveau"] = "Choisissez votre niveau d'études.";
        return !fail(next, ["st-universite", "st-filiere", "st-niveau"]);
      }
      if (step === 4) {
        if (student.competences.length === 0) next["st-competences"] = "Ajoutez au moins une compétence : le système expert s'en sert pour vous recommander des offres.";
        return !fail(next, ["st-competences"]);
      }
    }
    if (role === "entreprise") {
      if (step === 2) {
        if (!company.name.trim()) next["co-name"] = "Indiquez le nom de l'entreprise.";
        if (!company.sector.trim()) next["co-sector"] = "Précisez le secteur d'activité.";
        if (!company.city.trim()) next["co-city"] = "Indiquez la ville.";
        return !fail(next, ["co-name", "co-sector", "co-city"]);
      }
      if (step === 3) {
        if (!company.representativeName.trim()) next["co-rep"] = "Indiquez le nom du responsable.";
        if (!company.representativeRole.trim()) next["co-role"] = "Indiquez sa fonction.";
        return !fail(next, ["co-rep", "co-role"]);
      }
      if (step === 4) {
        if (hosting.internTypes.length === 0) next["co-types"] = "Choisissez au moins un type de stagiaires.";
        if (!hosting.frequency) next["co-frequency"] = "Choisissez une fréquence.";
        return !fail(next, ["co-types", "co-frequency"]);
      }
      if (step === 5) {
        if (hosting.deciders.length === 0) next["co-deciders"] = "Choisissez au moins une personne.";
        if (hosting.criteria.length === 0) next["co-criteria"] = "Choisissez au moins un critère.";
        return !fail(next, ["co-deciders", "co-criteria"]);
      }
    }
    return true;
  };

  const finish = () => {
    if (!session) return;
    if (role === "etudiant") {
      const profile = {
        prenom: student.prenom.trim(),
        nom: student.nom.trim(),
        postnom: student.postnom.trim(),
        telephone: student.telephone.trim(),
        email: session.email,
        universite: student.universite.trim(),
        faculte: student.faculte.trim(),
        filiere: student.filiere.trim(),
        niveau: student.niveau,
        competences: student.competences,
      };
      const name = `${profile.prenom} ${profile.nom}`;
      completeOnboarding({ name, profile });
      useStore.getState().startFresh(profile);
      toast.success(`Bienvenue, ${profile.prenom}`, { description: "Le système expert a déjà comparé votre profil aux offres." });
      navigate({ to: ROLE_HOME.etudiant });
    } else {
      const profile = {
        name: company.name.trim(),
        initials: company.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "E",
        sector: company.sector.trim(),
        city: company.city.trim(),
        address: company.address.trim(),
        email: session.email,
        representativeName: company.representativeName.trim(),
        representativeRole: company.representativeRole.trim(),
        representativeEmail: session.email,
        representativePhone: company.representativePhone.trim(),
      };
      completeOnboarding({ name: profile.name, company: { profile, hosting } });
      useCompanyStore.getState().updateProfile(profile);
      useCompanyStore.getState().setHosting(hosting);
      toast.success(`Bienvenue, ${profile.name}`, { description: "Votre espace entreprise est prêt." });
      navigate({ to: ROLE_HOME.entreprise });
    }
  };

  const next = async () => {
    if (!validate()) return;
    if (step === 1 && role && !session) {
      setPending(true);
      const result = await signUp({ role, email: account.email, password: account.password });
      setPending(false);
      if (!result.ok) {
        fail({ [result.field === "password" ? "su-password" : "su-email"]: result.error }, ["su-email", "su-password"]);
        return;
      }
    }
    if (last) return finish();
    setErrors({});
    setStep((value) => value + 1);
  };

  // On ne revient pas sur « Compte » une fois le compte créé.
  const canGoBack = step > 0 && !(session && step <= 2);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-col items-center gap-6 px-4 pb-4 pt-8 sm:pt-10">
        <Link to="/connexion" aria-label="StageManager — connexion">
          <AuthBrand />
        </Link>
        <Stepper steps={steps} current={step} />
      </header>

      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 sm:pt-12">
        <Reveal key={`${role}-${step}`}>
          {/* ---------------- Étape 0 : rôle ---------------- */}
          {step === 0 && (
            <div>
              <StepTitle title="Comment pouvons-nous vous aider ?" desc="Votre espace s'ouvre selon votre profil. Vous ne pourrez pas en changer ensuite." />
              <div className="mt-10 space-y-3">
                {(
                  [
                    { value: "etudiant", title: "Je cherche un stage", desc: "Profil, offres recommandées par le système expert, candidatures, suivi du stage.", icon: GraduationCap, motion: "tilt" },
                    { value: "entreprise", title: "J'accueille des stagiaires", desc: "Offres, candidatures, affectation par service avec le système expert, encadrement.", icon: Building2, motion: "lift" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setRole(option.value);
                      setStep(1);
                    }}
                    className="press group flex w-full items-center gap-4 rounded-full border-2 bg-card px-6 py-4 text-left transition-colors duration-200 hover:border-primary hover:bg-primary-soft"
                  >
                    <option.icon className={`nav-icon nav-icon--${option.motion} size-6 shrink-0 text-muted-foreground group-hover:text-primary`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold group-hover:text-primary">{option.title}</span>
                      <span className="block text-pretty text-xs text-muted-foreground">{option.desc}</span>
                    </span>
                    <ArrowRight className={cn("size-4 shrink-0 text-muted-foreground group-hover:text-primary", ARROW_NUDGE)} />
                  </button>
                ))}
              </div>
              <p className="mt-10 text-center text-[13px] text-muted-foreground">
                Déjà un compte ?{" "}
                <Link to="/connexion" className="-my-2 py-2 font-semibold text-primary underline-offset-2 hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          )}

          {/* ---------------- Étape 1 : compte ---------------- */}
          {step === 1 && (
            <div>
              <StepTitle
                title="Créez votre compte"
                desc={role === "entreprise" ? "Utilisez l'adresse professionnelle du responsable des stages." : "Cette adresse servira à vous connecter et à recevoir les réponses des entreprises."}
              />
              <div className="mt-8 space-y-4">
                <Field label="E-mail" htmlFor="su-email" required error={errors["su-email"]}>
                  <input
                    id="su-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className={inputClass}
                    placeholder={role === "entreprise" ? "Ex. stages@finca.cd" : "Ex. prenom.nom@exemple.cd"}
                    value={account.email}
                    onChange={(e) => {
                      setAccount({ ...account, email: e.target.value });
                      clear("su-email");
                    }}
                  />
                </Field>
                <Field label="Mot de passe" htmlFor="su-password" required error={errors["su-password"]} hint="8 caractères minimum.">
                  <PasswordInput
                    id="su-password"
                    autoComplete="new-password"
                    placeholder="Choisissez un mot de passe"
                    value={account.password}
                    onChange={(e) => {
                      setAccount({ ...account, password: e.target.value });
                      clear("su-password");
                    }}
                  />
                </Field>
                <Field label="Confirmer le mot de passe" htmlFor="su-confirm" required error={errors["su-confirm"]}>
                  <PasswordInput
                    id="su-confirm"
                    autoComplete="new-password"
                    placeholder="Saisissez-le à nouveau"
                    value={account.confirm}
                    onChange={(e) => {
                      setAccount({ ...account, confirm: e.target.value });
                      clear("su-confirm");
                    }}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ---------------- Étudiant ---------------- */}
          {role === "etudiant" && step === 2 && (
            <div>
              <StepTitle title="Qui êtes-vous ?" desc="Les entreprises verront ces informations avec vos candidatures." />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Field label="Prénom" htmlFor="st-prenom" required error={errors["st-prenom"]}>
                  <input id="st-prenom" autoComplete="given-name" className={inputClass} placeholder="Ex. Grâce" value={student.prenom} onChange={(e) => { setStudent({ ...student, prenom: e.target.value }); clear("st-prenom"); }} />
                </Field>
                <Field label="Nom" htmlFor="st-nom" required error={errors["st-nom"]}>
                  <input id="st-nom" autoComplete="family-name" className={inputClass} placeholder="Ex. Mukendi" value={student.nom} onChange={(e) => { setStudent({ ...student, nom: e.target.value }); clear("st-nom"); }} />
                </Field>
                <Field label="Postnom" htmlFor="st-postnom">
                  <input id="st-postnom" className={inputClass} placeholder="Ex. Kalala" value={student.postnom} onChange={(e) => setStudent({ ...student, postnom: e.target.value })} />
                </Field>
                <Field label="Téléphone" htmlFor="st-telephone" required error={errors["st-telephone"]}>
                  <input id="st-telephone" type="tel" inputMode="tel" autoComplete="tel" className={inputClass} placeholder="Ex. +243 81 000 0000" value={student.telephone} onChange={(e) => { setStudent({ ...student, telephone: e.target.value }); clear("st-telephone"); }} />
                </Field>
              </div>
            </div>
          )}

          {role === "etudiant" && step === 3 && (
            <div>
              <StepTitle title="Votre parcours" desc="Le système expert compare votre formation et votre niveau à ceux demandés par chaque offre." />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Field label="Université" htmlFor="st-universite" required error={errors["st-universite"]} className="sm:col-span-2">
                  <input id="st-universite" className={inputClass} placeholder="Ex. Université de Kinshasa" value={student.universite} onChange={(e) => { setStudent({ ...student, universite: e.target.value }); clear("st-universite"); }} />
                </Field>
                <Field label="Faculté" htmlFor="st-faculte">
                  <input id="st-faculte" className={inputClass} placeholder="Ex. Sciences économiques et de gestion" value={student.faculte} onChange={(e) => setStudent({ ...student, faculte: e.target.value })} />
                </Field>
                <Field label="Filière" htmlFor="st-filiere" required error={errors["st-filiere"]}>
                  <input id="st-filiere" className={inputClass} placeholder="Ex. Gestion financière" value={student.filiere} onChange={(e) => { setStudent({ ...student, filiere: e.target.value }); clear("st-filiere"); }} />
                </Field>
                <Field label="Niveau d'études" htmlFor="st-niveau" required error={errors["st-niveau"]} className="sm:col-span-2">
                  <Select id="st-niveau" placeholder="Choisir un niveau" value={student.niveau} onChange={(e) => { setStudent({ ...student, niveau: e.target.value }); clear("st-niveau"); }}>
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          )}

          {role === "etudiant" && step === 4 && (
            <div>
              <StepTitle title="Vos compétences" desc="Elles sont comparées à celles que demande chaque offre. Vous pourrez en ajouter d'autres et déposer votre CV depuis votre profil." />
              <div id="st-competences" tabIndex={-1} className="mt-8 outline-none">
                <TagInput id="st-competences-input" label="Compétences" value={student.competences} onChange={(competences) => { setStudent({ ...student, competences }); clear("st-competences"); }} suggestions={SKILL_SUGGESTIONS} />
                {errors["st-competences"] && <p className="mt-1.5 text-xs font-medium text-destructive">{errors["st-competences"]}</p>}
              </div>
            </div>
          )}

          {/* ---------------- Entreprise (cas FINCA RDC) ---------------- */}
          {role === "entreprise" && step === 2 && (
            <div>
              <StepTitle title="Votre entreprise" desc="Ces informations accompagnent vos offres auprès des étudiants." />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Field label="Nom de l'entreprise" htmlFor="co-name" required error={errors["co-name"]}>
                  <input id="co-name" autoComplete="organization" className={inputClass} placeholder="Ex. FINCA RDC" value={company.name} onChange={(e) => { setCompany({ ...company, name: e.target.value }); clear("co-name"); }} />
                </Field>
                <Field label="Secteur d'activité" htmlFor="co-sector" required error={errors["co-sector"]}>
                  <input id="co-sector" className={inputClass} placeholder="Ex. Microfinance" value={company.sector} onChange={(e) => { setCompany({ ...company, sector: e.target.value }); clear("co-sector"); }} />
                </Field>
                <Field label="Ville" htmlFor="co-city" required error={errors["co-city"]}>
                  <input id="co-city" className={inputClass} placeholder="Ex. Kinshasa" value={company.city} onChange={(e) => { setCompany({ ...company, city: e.target.value }); clear("co-city"); }} />
                </Field>
                <Field label="Adresse" htmlFor="co-address">
                  <input id="co-address" className={inputClass} placeholder="Ex. Avenue Tombalbaye, Gombe" value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
                </Field>
              </div>
            </div>
          )}

          {role === "entreprise" && step === 3 && (
            <div>
              <StepTitle title="Le responsable des stages" desc="La personne qui gère les stagiaires sur StageManager." />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Field label="Nom" htmlFor="co-rep" required error={errors["co-rep"]}>
                  <input id="co-rep" autoComplete="name" className={inputClass} placeholder="Ex. Marie Lukusa" value={company.representativeName} onChange={(e) => { setCompany({ ...company, representativeName: e.target.value }); clear("co-rep"); }} />
                </Field>
                <Field label="Fonction" htmlFor="co-role" required error={errors["co-role"]}>
                  <input id="co-role" className={inputClass} placeholder="Ex. Responsable des ressources humaines" value={company.representativeRole} onChange={(e) => { setCompany({ ...company, representativeRole: e.target.value }); clear("co-role"); }} />
                </Field>
                <Field label="Téléphone" htmlFor="co-phone" className="sm:col-span-2">
                  <input id="co-phone" type="tel" inputMode="tel" className={inputClass} placeholder="Ex. +243 81 000 0000" value={company.representativePhone} onChange={(e) => setCompany({ ...company, representativePhone: e.target.value })} />
                </Field>
              </div>
            </div>
          )}

          {role === "entreprise" && step === 4 && (
            <div>
              <StepTitle title="L'accueil des stagiaires" desc="Ces réponses décrivent votre façon d'accueillir des stagiaires." />
              <div className="mt-8 space-y-7">
                <Field label="Quels types de stagiaires accueillez-vous ?" htmlFor="co-types" required error={errors["co-types"]}>
                  <ChoiceGrid id="co-types" label="Types de stagiaires accueillis" options={INTERN_TYPES} value={hosting.internTypes} onChange={(update) => { setHosting((h) => ({ ...h, internTypes: update(h.internTypes) })); clear("co-types"); }} />
                </Field>
                <Field label="À quelle fréquence ?" htmlFor="co-frequency" required error={errors["co-frequency"]}>
                  <ChoiceGrid id="co-frequency" label="Fréquence d'accueil" multiple={false} options={FREQUENCIES} value={hosting.frequency ? [hosting.frequency] : []} onChange={(update) => { setHosting((h) => ({ ...h, frequency: update(h.frequency ? [h.frequency] : [])[0] ?? "" })); clear("co-frequency"); }} />
                </Field>
                <Field label="Quelles informations recueillez-vous à l'arrivée du stagiaire ?" htmlFor="co-arrival">
                  <ChoiceGrid id="co-arrival" label="Informations recueillies à l'arrivée" options={ARRIVAL_INFO} value={hosting.arrivalInfo} onChange={(update) => setHosting((h) => ({ ...h, arrivalInfo: update(h.arrivalInfo) }))} />
                </Field>
              </div>
            </div>
          )}

          {role === "entreprise" && step === 5 && (
            <div>
              <StepTitle title="L'affectation des stagiaires" desc="Le système expert s'appuie sur les critères que vous retenez ; la décision reste la vôtre." />
              <div className="mt-8 space-y-7">
                <Field label="Qui décide de l'affectation d'un stagiaire ?" htmlFor="co-deciders" required error={errors["co-deciders"]}>
                  <ChoiceGrid id="co-deciders" label="Qui décide de l'affectation" options={DECIDERS} value={hosting.deciders} onChange={(update) => { setHosting((h) => ({ ...h, deciders: update(h.deciders) })); clear("co-deciders"); }} />
                </Field>
                <Field label="Quels critères utilisez-vous pour affecter un stagiaire ?" htmlFor="co-criteria" required error={errors["co-criteria"]}>
                  <ChoiceGrid id="co-criteria" label="Critères d'affectation" options={CRITERIA} value={hosting.criteria} onChange={(update) => { setHosting((h) => ({ ...h, criteria: update(h.criteria) })); clear("co-criteria"); }} />
                </Field>
              </div>
            </div>
          )}

          {/* ---------------- Navigation ---------------- */}
          {step > 0 && (
            <div className="mt-10 flex items-center justify-between gap-3">
              {canGoBack ? (
                <Button variant="ghost" className="group" onClick={() => { setErrors({}); setStep((value) => value - 1); }}>
                  <ArrowLeft className="mr-2 size-4 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:-translate-x-1 motion-reduce:transition-none" />
                  Retour
                </Button>
              ) : (
                <span />
              )}
              <Button className="group min-w-40" onClick={next} disabled={pending}>
                {pending ? "Création du compte…" : last ? (role === "entreprise" ? "Ouvrir mon espace" : "Découvrir mes offres") : "Continuer"}
                {!pending && <ArrowRight className={cn("ml-2 size-4", ARROW_NUDGE)} />}
              </Button>
            </div>
          )}
        </Reveal>
      </main>
    </div>
  );
}
