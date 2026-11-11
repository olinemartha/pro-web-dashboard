import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Database, LogOut, ShieldCheck } from "lucide-react";
import { iconMotion, PageIntro } from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { useAuth } from "@/lib/auth";
import { EXPERT_ENGINE_VERSION } from "@/lib/expert-engine";
import { OFFER_MATCHING_VERSION } from "@/lib/offer-matching";

export const Route = createFileRoute("/admin/parametres")({
  head: () => ({ meta: [{ title: "Paramètres — Administration StageManager" }] }),
  component: AdminSettingsPage,
});

function Row({ icon: Icon, title, desc, children }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="group grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5 transition-colors duration-150 hover:bg-muted/40">
      <Icon className={iconMotion("pop", "size-[18px] text-muted-foreground group-hover:text-foreground")} />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-pretty text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function AdminSettingsPage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageIntro desc="Votre compte administrateur et l'état de la plateforme." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal as="section" className="card-surface overflow-hidden" aria-labelledby="admin-compte">
          <div className="border-b px-5 pb-3.5 pt-4">
            <h2 id="admin-compte" className="text-[15px] font-semibold tracking-tight">
              Compte
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Un seul compte administrateur principal (PRD).</p>
          </div>
          <div className="divide-y">
            <Row icon={ShieldCheck} title={session?.name ?? "Administrateur"} desc={session?.email ?? ""} />
            <Row icon={LogOut} title="Déconnexion" desc="Vous devrez vous reconnecter pour revenir.">
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
            </Row>
          </div>
        </Reveal>
        <Reveal as="section" delay={60} className="card-surface overflow-hidden" aria-labelledby="admin-plateforme">
          <div className="border-b px-5 pb-3.5 pt-4">
            <h2 id="admin-plateforme" className="text-[15px] font-semibold tracking-tight">
              Plateforme
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Versions et stockage des données.</p>
          </div>
          <div className="divide-y">
            <Row icon={ShieldCheck} title="Moteurs du système expert" desc={`Affectation ${EXPERT_ENGINE_VERSION} · recommandation d'offres ${OFFER_MATCHING_VERSION}`} />
            <Row icon={Database} title="Données" desc="Stockées dans ce navigateur (démonstration). La connexion à Supabase remplacera ce stockage." />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
