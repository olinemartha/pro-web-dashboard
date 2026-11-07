import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, Badge, PageIntro, SectionLabel, inputClass } from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";

export const Route = createFileRoute("/entreprise/parametres")({
  head: () => ({
    meta: [{ title: "Paramètres — Espace entreprise" }],
  }),
  component: CompanySettingsPage,
});

function SettingRow({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function CompanySettingsPage() {
  const { profile, updateProfile } = useCompanyStore();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [notifyApplications, setNotifyApplications] = useState(true);
  const [notifyInterviews, setNotifyInterviews] = useState(true);
  const [notifyReports, setNotifyReports] = useState(false);

  const [spaceActive, setSpaceActive] = useState(true);

  const saveAccount = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Champs obligatoires", { description: "Le nom et l'e-mail sont requis." });
      return;
    }
    updateProfile({ name: name.trim(), email: email.trim() });
    toast.success("Informations du compte enregistrées");
  };

  const savePassword = () => {
    if (!current || !next) {
      setPasswordError("Renseignez le mot de passe actuel et le nouveau mot de passe.");
      return;
    }
    if (next.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (next !== confirm) {
      setPasswordError("Les deux saisies du nouveau mot de passe ne correspondent pas.");
      return;
    }
    setPasswordError("");
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Mot de passe modifié");
  };

  return (
    <div className="space-y-6">
      <PageIntro desc="Compte, sécurité, notifications et gestion de l'espace entreprise." />

      {/* Compte */}
      <section className="card-surface p-5 sm:p-6">
        <SectionLabel className="mb-4">Informations du compte</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom de l'entreprise" htmlFor="settings-name" required>
            <input
              id="settings-name"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="E-mail du compte" htmlFor="settings-email" required hint="Utilisé pour la connexion.">
            <input
              id="settings-email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={saveAccount}>
            <Save className="mr-2 size-4" /> Enregistrer
          </Button>
        </div>
      </section>

      {/* Sécurité */}
      <section className="card-surface p-5 sm:p-6">
        <SectionLabel className="mb-4 flex items-center gap-2">
          <ShieldCheck className="size-4" /> Sécurité
        </SectionLabel>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Mot de passe actuel" htmlFor="pwd-current" required>
            <input
              id="pwd-current"
              type="password"
              className={inputClass}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field label="Nouveau mot de passe" htmlFor="pwd-new" required hint="8 caractères minimum.">
            <input
              id="pwd-new"
              type="password"
              className={inputClass}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </Field>
          <Field label="Confirmer" htmlFor="pwd-confirm" required>
            <input
              id="pwd-confirm"
              type="password"
              className={inputClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
        </div>
        {passwordError && <p className="mt-3 text-sm font-medium text-destructive">{passwordError}</p>}
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={savePassword}>
            Modifier le mot de passe
          </Button>
        </div>
      </section>

      {/* Notifications */}
      <section className="card-surface p-5 sm:p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <SectionLabel>Notifications</SectionLabel>
          <Badge label="Démonstration" tone="muted" />
        </div>
        <p className="mb-3 max-w-[70ch] text-xs leading-relaxed text-muted-foreground">
          Les canaux de notification ne sont pas encore branchés. Les réglages ci-dessous sont
          présentés à titre de démonstration.
        </p>
        <div className="divide-y">
          <SettingRow title="Nouvelles candidatures" desc="Recevoir une alerte à chaque dépôt de candidature.">
            <Switch
              checked={notifyApplications}
              onCheckedChange={(v) => {
                setNotifyApplications(v);
                toast.success(v ? "Notifications activées" : "Notifications désactivées", {
                  description: "Nouvelles candidatures",
                });
              }}
              aria-label="Nouvelles candidatures"
            />
          </SettingRow>
          <SettingRow title="Rappels d'entretien" desc="Être notifié avant chaque entretien programmé.">
            <Switch
              checked={notifyInterviews}
              onCheckedChange={(v) => {
                setNotifyInterviews(v);
                toast.success(v ? "Rappels activés" : "Rappels désactivés", {
                  description: "Entretiens",
                });
              }}
              aria-label="Rappels d'entretien"
            />
          </SettingRow>
          <SettingRow title="Rapports de stagiaires" desc="Être alerté lorsqu'un rapport périodique est déposé.">
            <Switch
              checked={notifyReports}
              onCheckedChange={(v) => {
                setNotifyReports(v);
                toast.success(v ? "Alertes activées" : "Alertes désactivées", {
                  description: "Rapports de stagiaires",
                });
              }}
              aria-label="Rapports de stagiaires"
            />
          </SettingRow>
        </div>
      </section>

      {/* Espace entreprise */}
      <section className="card-surface p-5 sm:p-6">
        <SectionLabel className="mb-2">Gestion de l'espace entreprise</SectionLabel>
        <SettingRow
          title={spaceActive ? "Espace actif" : "Espace désactivé"}
          desc="La désactivation est temporaire et ne supprime aucun historique."
        >
          <Switch
            checked={spaceActive}
            onCheckedChange={(v) => {
              setSpaceActive(v);
              toast.success(v ? "Espace réactivé" : "Espace désactivé temporairement", {
                description: v
                  ? "Vos offres et candidatures sont à nouveau visibles."
                  : "Vos offres ne sont plus visibles par les étudiants.",
              });
            }}
            aria-label="Activer ou désactiver l'espace entreprise"
          />
        </SettingRow>
        {!spaceActive && (
          <p className="mt-3 max-w-[70ch] rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-800">
            Votre espace est actuellement désactivé. Les données sont conservées et pourront être restaurées à la
            réactivation.
          </p>
        )}
      </section>

      {/* Déconnexion */}
      <section className="card-surface flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div>
          <h2 className="text-sm font-semibold">Déconnexion</h2>
          <p className="text-xs text-muted-foreground">Vous devrez vous reconnecter pour accéder à votre espace.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => toast.info("Déconnexion", { description: "Fonction de démonstration." })}
        >
          <LogOut className="mr-2 size-4" /> Se déconnecter
        </Button>
      </section>
    </div>
  );
}
