import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, KeyRound, LogOut, Save, Sparkles, UserRound, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Reveal } from "@/components/ui/motion";
import { ARROW_NUDGE, Badge, Field, Modal, PageIntro, SECTION_LINK, iconMotion, inputClass, type IconMotion } from "@/components/company/ui";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — StageManager" },
      { name: "description", content: "Gérez votre compte, sa sécurité et vos notifications." },
    ],
  }),
  component: SettingsPage,
});

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

function SettingsPage() {
  const { profile, updateProfile } = useStore();
  const signOut = useAuth((state) => state.signOut);
  const deactivate = useAuth((state) => state.deactivate);
  const [deactivatingPending, setDeactivatingPending] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState(profile.email);
  const [emailError, setEmailError] = useState<string>();
  const emailDirty = email.trim() !== profile.email;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});

  const [notify, setNotify] = useState({ answers: true, interviews: true, offers: true });
  const [deactivating, setDeactivating] = useState(false);

  const saveEmail = () => {
    const value = email.trim();
    const error = !value ? "L'e-mail du compte est obligatoire." : !/^\S+@\S+\.\S+$/.test(value) ? "Saisissez une adresse e-mail valide." : undefined;
    setEmailError(error);
    if (error) {
      document.getElementById("settings-email")?.focus();
      return;
    }
    updateProfile({ email: value });
    toast.success("E-mail du compte enregistré");
  };

  const savePassword = () => {
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
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Mot de passe modifié");
  };

  const toggleNotify = (key: keyof typeof notify, label: string) => (value: boolean) => {
    setNotify((state) => ({ ...state, [key]: value }));
    toast.success(value ? "Notification activée" : "Notification désactivée", { description: label });
  };

  const passwordField = (key: keyof PasswordErrors, value: string, setValue: (v: string) => void, autoComplete: string) => (
    <input
      id={`pwd-${key}`}
      type="password"
      autoComplete={autoComplete}
      className={inputClass}
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        setPasswordErrors((state) => ({ ...state, [key]: undefined }));
      }}
    />
  );

  return (
    <div className="space-y-6">
      <PageIntro desc="Votre compte, sa sécurité et les alertes que vous recevez. Vos informations de candidature se modifient dans votre profil." />

      {/* Deux colonnes qui finissent au même niveau : chaque dernière carte s'étire. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {/* Compte */}
          <Reveal as="section" className="card-surface flex flex-col overflow-hidden" aria-labelledby="compte-titre">
            <CardHeader id="compte-titre" title="Compte" desc="L'adresse utilisée pour vous connecter et recevoir les alertes." />
            <div className="grid gap-4 px-5 py-5">
              <Field label="E-mail du compte" htmlFor="settings-email" required error={emailError} hint="Sert à la connexion et aux notifications.">
                <input
                  id="settings-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={inputClass}
                  placeholder="Ex. prenom.nom@exemple.cd"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailError(undefined);
                  }}
                />
              </Field>
              <div className="flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">
                    {profile.prenom} {profile.nom}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">Nom, parcours et CV</p>
                </div>
                <Link to="/profil" className={SECTION_LINK}>
                  <UserRound className="size-3.5" /> Profil
                  <ArrowRight className={cn("size-3.5", ARROW_NUDGE)} />
                </Link>
              </div>
            </div>
            <div className="mt-auto flex justify-end border-t bg-muted/30 px-5 py-3">
              <Button onClick={saveEmail} disabled={!emailDirty}>
                <Save className="mr-2 size-4" /> Enregistrer
              </Button>
            </div>
          </Reveal>

          {/* Notifications */}
          <Reveal as="section" delay={120} className="card-surface flex flex-1 flex-col overflow-hidden" aria-labelledby="alertes-titre">
            <CardHeader
              id="alertes-titre"
              title="Notifications par e-mail"
              desc="Choisissez ce que vous recevez par e-mail."
              aside={<Badge label="Démonstration" tone="muted" className="shrink-0" />}
            />
            <div className="flex-1 divide-y">
              <SettingRow icon={CheckCircle2} motion="pop" title="Réponses des entreprises" desc="Quand une candidature est acceptée ou refusée.">
                <Switch checked={notify.answers} onCheckedChange={toggleNotify("answers", "Réponses des entreprises")} aria-label="Notifications : réponses des entreprises" />
              </SettingRow>
              <SettingRow icon={CalendarClock} motion="tilt" title="Rappels d'entretien" desc="La veille de chaque entretien programmé.">
                <Switch checked={notify.interviews} onCheckedChange={toggleNotify("interviews", "Rappels d'entretien")} aria-label="Notifications : rappels d'entretien" />
              </SettingRow>
              <SettingRow icon={Sparkles} motion="pop" title="Offres pour vous" desc="Quand une offre correspond à vos compétences.">
                <Switch checked={notify.offers} onCheckedChange={toggleNotify("offers", "Offres pour vous")} aria-label="Notifications : offres pour vous" />
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
                {passwordField("current", current, setCurrent, "current-password")}
              </Field>
              <Field label="Nouveau mot de passe" htmlFor="pwd-next" required error={passwordErrors.next} hint="8 caractères minimum.">
                {passwordField("next", next, setNext, "new-password")}
              </Field>
              <Field label="Confirmer" htmlFor="pwd-confirm" required error={passwordErrors.confirm}>
                {passwordField("confirm", confirm, setConfirm, "new-password")}
              </Field>
            </div>
            <div className="mt-auto flex justify-end border-t bg-muted/30 px-5 py-3">
              <Button variant="outline" onClick={savePassword}>
                <KeyRound className="mr-2 size-4" /> Modifier le mot de passe
              </Button>
            </div>
          </Reveal>

          {/* Session et compte */}
          <Reveal as="section" delay={180} className="card-surface flex flex-1 flex-col overflow-hidden" aria-labelledby="session-titre">
            <CardHeader id="session-titre" title="Session et compte" desc="Votre connexion et la fermeture du compte." />
            <div className="flex-1 divide-y">
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
              <SettingRow icon={UserX} motion="pop" title="Désactiver le compte" desc="Votre profil est masqué ; vos candidatures sont conservées.">
                <Button variant="outline" size="sm" onClick={() => setDeactivating(true)}>
                  Désactiver
                </Button>
              </SettingRow>
            </div>
          </Reveal>
        </div>
      </div>

      <Modal
        open={deactivating}
        onClose={() => setDeactivating(false)}
        icon={UserX}
        title="Désactiver votre compte ?"
        description="Vous pourrez le réactiver en vous reconnectant."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeactivating(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={deactivatingPending}
              onClick={async () => {
                setDeactivatingPending(true);
                const result = await deactivate();
                setDeactivatingPending(false);
                if (!result.ok) {
                  toast.error("Désactivation impossible", { description: result.error });
                  return;
                }
                setDeactivating(false);
                toast.success("Compte désactivé", { description: "Reconnectez-vous quand vous voulez pour le réactiver." });
                navigate({ to: "/connexion" });
              }}
            >
              {deactivatingPending ? "Désactivation…" : "Désactiver le compte"}
            </Button>
          </>
        }
      >
        <ul className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
          <li>Les entreprises ne verront plus votre profil.</li>
          <li>Vos candidatures en cours restent visibles par les entreprises concernées.</li>
          <li>Vos documents et votre historique sont conservés selon les règles de conservation des données.</li>
        </ul>
      </Modal>
    </div>
  );
}
