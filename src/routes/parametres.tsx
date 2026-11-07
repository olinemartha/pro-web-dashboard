import { createFileRoute } from "@tanstack/react-router";
import { Bell, UserCircle } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — StageManager" },
      { name: "description", content: "Gérez votre compte, sécurité et notifications." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <PageHeader title="Paramètres" desc="Gérez votre compte, votre sécurité et vos préférences de notification." />

      <SectionCard title="Informations du compte">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
          <UserCircle className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Compte étudiant</p>
            <p className="text-xs text-muted-foreground">grace.mukendi@exemple.cd</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Sécurité">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-2">
            <div>
              <p className="text-sm font-medium">Modifier le mot de passe</p>
              <p className="text-xs text-muted-foreground">Changez votre mot de passe régulièrement.</p>
            </div>
            <Button size="sm">Modifier</Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Notifications">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-2">
            <div>
              <p className="text-sm font-medium">Notifications par e-mail</p>
              <p className="text-xs text-muted-foreground">Recevez les alertes de recrutement par e-mail.</p>
            </div>
            <Bell className="size-4 text-muted-foreground" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Compte">
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full text-left">Demander la désactivation du compte</Button>
          <Button variant="outline" size="sm" className="w-full text-left text-destructive">Supprimer le compte</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Toute suppression prend en compte les obligations de conservation des données applicables.</p>
      </SectionCard>
    </div>
  );
}
