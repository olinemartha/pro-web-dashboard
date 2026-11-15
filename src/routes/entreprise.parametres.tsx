import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, CalendarClock, FileText, Inbox, KeyRound, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Reveal } from "@/components/ui/motion";
import { Badge, Field, PageIntro, iconMotion, inputClass, type IconMotion } from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/entreprise/parametres")({
  head: () => ({
    meta: [{ title: "Paramètres — Espace entreprise" }],
  }),
  component: CompanySettingsPage,
});

/** En-tête de carte : titre 15 px, phrase d'aide, élément facultatif à droite. */
function CardHeader({ id, title, desc, aside }: { id: string; title: string; desc: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b px-5 pb-3.5 pt-4">
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-0.5 text-pretty text-xs text-muted-foreground">{desc}</p>
      </div>
      {aside}
    </div>
  );
}

/** Ligne de réglage : icône nue animée, intitulé, explication, interrupteur. */
function SettingRow({
  icon: Icon,
  motion,
  title,
  desc,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  motion: IconMotion;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5 transition-colors duration-150 hover:bg-muted/40">
      <Icon className={iconMotion(motion, "size-[18px] text-muted-foreground group-hover:text-foreground")} />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-pretty text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

type PasswordErrors = Partial<Record<"current" | "next" | "confirm", string>>;

function CompanySettingsPage() {
  const { profile, updateProfile, spaceActive, setSpaceActive } = useCompanyStore();
  const signOut = useAuth((state) => state.signOut);
  const navigate = useNavigate();

  const accountEmail = useAuth((state) => state.session?.email) ?? "";
  const [name, setName] = useState(profile.name);
  const [accountErrors, setAccountErrors] = useState<{ name?: string }>({});
  const accountDirty = name.trim() !== profile.name;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});

  const [passwordPending, setPasswordPending] = useState(false);

  const saveAccount = () => {
    const errors: typeof accountErrors = {};
    if (!name.trim()) errors.name = "Le nom de l'entreprise est obligatoire.";
    setAccountErrors(errors);
    if (errors.name) {
      document.getElementById("settings-name")?.focus();
      return;
    }
    updateProfile({ name: name.trim() });
    toast.success("Nom de l'entreprise enregistré");
  };

  const savePassword = async () => {
    const errors: PasswordErrors = {};
    if (!current) errors.current = "Saisissez votre mot de passe actuel.";
    if (!next) errors.next = "Choisissez un nouveau mot de passe.";
    else if (next.length < 8) errors.next = "8 caractères minimum.";
    if (next && confirm !== next) errors.confirm = "Les deux saisies ne correspondent pas.";
    setPasswordErrors(errors);
    const first = (["current", "next", "confirm"] as const).find((key) => errors[key]);
    if (first) {
      document.getElementById(`pwd-${first}`)?.focus();
      return;
    }
    setPasswordPending(true);
    const result = await useAuth.getState().changePassword(current, next);
    setPasswordPending(false);
    if (!result.ok) {
      const field = result.field ?? "next";
      setPasswordErrors({ [field]: result.error });
      document.getElementById(`pwd-${field}`)?.focus();
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Mot de passe modifié", { description: "Utilisez-le à votre prochaine connexion." });
  };

  return (
    <div className="space-y-6">
      <PageIntro desc="Votre compte, sa sécurité, les alertes que vous recevez et l'état de votre espace entreprise." />

      {/* Deux colonnes qui finissent au même niveau : chaque dernière carte s'étire. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {/* Compte */}
          <Reveal as="section" className="card-surface flex flex-col overflow-hidden" aria-labelledby="compte-titre">
            <CardHeader id="compte-titre" title="Compte" desc="Le nom affiché aux étudiants et l'adresse utilisée pour vous connecter." />
            <div className="grid gap-4 px-5 py-5">
              <Field label="Nom de l'entreprise" htmlFor="settings-name" required error={accountErrors.name}>
                <input
                  id="settings-name"
                  className={inputClass}
                  placeholder="Ex. FINCA RDC"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setAccountErrors((state) => ({ ...state, name: undefined }));
                  }}
                />
              </Field>
              <Field
                label="E-mail de connexion"
                htmlFor="settings-email"
                hint="Une personne, un compte : l'adresse de connexion ne se change pas ici. L'e-mail de contact se modifie dans le profil de l'entreprise."
              >
                <input id="settings-email" type="email" readOnly className={cn(inputClass, "bg-muted/40 text-muted-foreground")} value={accountEmail} />
              </Field>
            </div>
            <div className="mt-auto flex justify-end border-t bg-muted/30 px-5 py-3">
              <Button onClick={saveAccount} disabled={!accountDirty}>
                <Save className="mr-2 size-4" /> Enregistrer
              </Button>
            </div>
          </Reveal>

          {/* Notifications : elles arrivent dans StageManager (cloche), à chaque étape */}
          <Reveal as="section" delay={120} className="card-surface flex flex-1 flex-col overflow-hidden" aria-labelledby="alertes-titre">
            <CardHeader id="alertes-titre" title="Notifications" desc="Vous êtes prévenu dans StageManager, sur la cloche, à chaque étape." />
            <div className="flex-1 divide-y">
              <SettingRow icon={Inbox} motion="bounce" title="Candidatures" desc="Nouvelle candidature, retrait, stage confirmé ou proposition déclinée.">
                <Badge label="Activée" tone="success" className="shrink-0" />
              </SettingRow>
              <SettingRow icon={CalendarClock} motion="tilt" title="Entretiens à venir" desc="Rappel des entretiens programmés.">
                <Badge label="Activée" tone="success" className="shrink-0" />
              </SettingRow>
              <SettingRow icon={FileText} motion="lift" title="Rapports de stagiaires" desc="Quand un rapport est déposé ou corrigé.">
                <Badge label="Activée" tone="success" className="shrink-0" />
              </SettingRow>
            </div>
          </Reveal>
        </div>

        <div className="flex flex-col gap-6">
          {/* Sécurité */}
          <Reveal as="section" delay={60} className="card-surface flex flex-col overflow-hidden" aria-labelledby="securite-titre">
            <CardHeader id="securite-titre" title="Sécurité" desc="Changez régulièrement votre mot de passe." />
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              <Field label="Mot de passe actuel" htmlFor="pwd-current" required error={passwordErrors.current} className="sm:col-span-2">
                <input
                  id="pwd-current"
                  type="password"
                  autoComplete="current-password"
                  className={inputClass}
                  value={current}
                  onChange={(event) => {
                    setCurrent(event.target.value);
                    setPasswordErrors((state) => ({ ...state, current: undefined }));
                  }}
                />
              </Field>
              <Field label="Nouveau mot de passe" htmlFor="pwd-next" required error={passwordErrors.next} hint="8 caractères minimum.">
                <input
                  id="pwd-next"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  value={next}
                  onChange={(event) => {
                    setNext(event.target.value);
                    setPasswordErrors((state) => ({ ...state, next: undefined }));
                  }}
                />
              </Field>
              <Field label="Confirmer" htmlFor="pwd-confirm" required error={passwordErrors.confirm}>
                <input
                  id="pwd-confirm"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  value={confirm}
                  onChange={(event) => {
                    setConfirm(event.target.value);
                    setPasswordErrors((state) => ({ ...state, confirm: undefined }));
                  }}
                />
              </Field>
            </div>
            <div className="mt-auto flex justify-end border-t bg-muted/30 px-5 py-3">
              <Button variant="outline" onClick={savePassword} disabled={passwordPending}>
                <KeyRound className="mr-2 size-4" /> {passwordPending ? "Vérification…" : "Modifier le mot de passe"}
              </Button>
            </div>
          </Reveal>

          {/* Espace entreprise et session */}
          <Reveal as="section" delay={180} className="card-surface flex flex-1 flex-col overflow-hidden" aria-labelledby="espace-titre">
            <CardHeader id="espace-titre" title="Espace entreprise" desc="La visibilité de vos offres et votre session." />
            <div className="flex-1 divide-y">
              <SettingRow
                icon={Building2}
                motion="lift"
                title={spaceActive ? "Espace actif" : "Espace désactivé"}
                desc={
                  spaceActive
                    ? "Vos offres sont visibles par les étudiants."
                    : "Offres masquées ; tout l'historique est conservé."
                }
              >
                <Switch
                  checked={spaceActive}
                  onCheckedChange={(value) => {
                    setSpaceActive(value);
                    toast.success(value ? "Espace réactivé" : "Espace désactivé temporairement", {
                      description: value
                        ? "Vos offres et candidatures sont à nouveau visibles."
                        : "Vos offres ne sont plus visibles par les étudiants.",
                    });
                  }}
                  aria-label="Activer ou désactiver l'espace entreprise"
                />
              </SettingRow>
              <SettingRow icon={LogOut} motion="fly" title="Déconnexion" desc="Vous devrez vous reconnecter pour revenir.">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    signOut();
                    navigate({ to: "/connexion" });
                  }}
                >
                  Se déconnecter
                </Button>
              </SettingRow>
            </div>
            {!spaceActive && (
              <p className={cn("flex items-start gap-2 border-t bg-warning-soft px-5 py-3 text-pretty text-xs font-medium text-warning")}>
                <Building2 className="mt-0.5 size-3.5 shrink-0" />
                Espace désactivé : vos données sont conservées et réapparaîtront à la réactivation.
              </p>
            )}
          </Reveal>
        </div>
      </div>
    </div>
  );
}
