import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BadgeCheck, ClipboardCheck, FileText, UserCheck, Users } from "lucide-react";
import { AvatarInitials, Badge, KpiCard, PageIntro } from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/entreprise/stagiaires")({
  head: () => ({
    meta: [{ title: "Mes stagiaires — Espace entreprise" }],
  }),
  component: CompanyInternsLayout,
});

function fmtDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CompanyInternsLayout() {
  const { interns } = useCompanyStore();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const dossierOpen = pathname.startsWith("/entreprise/stagiaires/");

  const pendingReports = interns.reduce(
    (sum, intern) => sum + intern.reports.filter((report) => report.status === "soumis").length,
    0
  );
  const evaluated = interns.filter((intern) => intern.evaluation).length;
  const confirmed = interns.filter((intern) => intern.confirmed).length;

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Chaque dossier rassemble l'affectation, le suivi, l'évaluation et l'attestation."
        action={<Badge label={`${interns.length} stagiaire(s)`} tone="primary" />}
      />

      {/* Les indicateurs de la liste s'effacent quand un dossier est ouvert :
          le rapport d'expertise doit tenir dans le premier écran. */}
      {!dossierOpen && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <KpiCard
            label="Stagiaires accueillis"
            value={interns.length}
            hint="Période en cours"
            icon={Users}
          />
          <KpiCard
            label="Affectations confirmées"
            value={confirmed}
            hint={`${interns.length - confirmed} à confirmer`}
            icon={UserCheck}
          />
          <KpiCard
            label="Rapports à examiner"
            value={pendingReports}
            hint="Soumis par les stagiaires"
            icon={FileText}
          />
          <KpiCard
            label="Évaluations saisies"
            value={evaluated}
            hint={`${interns.length - evaluated} en attente`}
            icon={ClipboardCheck}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* Sur téléphone et tablette, un dossier ouvert remplace la liste. */}
        <aside className={cn("space-y-2", dossierOpen && "hidden lg:block")}>
          {interns.length === 0 ? (
            <div className="card-surface p-5 text-sm text-muted-foreground">
              Aucun stagiaire enregistré. Les dossiers sont créés à l'acceptation d'une candidature.
            </div>
          ) : (
            interns.map((intern) => {
              const href = `/entreprise/stagiaires/${intern.id}`;
              const active = pathname === href;
              return (
                <Link
                  key={intern.id}
                  to="/entreprise/stagiaires/$internId"
                  params={{ internId: intern.id }}
                  className={
                    active
                      ? "block w-full rounded-lg border border-accent bg-accent-soft p-3 text-left ring-1 ring-accent"
                      : "block w-full rounded-lg border bg-card p-3 text-left transition-colors hover:border-accent/60"
                  }
                >
                  <div className="flex items-center gap-3">
                    <AvatarInitials initials={intern.initials} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-snug">{intern.name}</p>
                      <p className="truncate text-xs leading-4 text-muted-foreground">
                        {intern.service}
                      </p>
                    </div>
                    {intern.confirmed ? (
                      <BadgeCheck className="size-4 shrink-0 text-success" />
                    ) : (
                      <span
                        className="size-2 shrink-0 rounded-full bg-warning"
                        title="Affectation à confirmer"
                      />
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-4 tabular-nums text-muted-foreground">
                    {fmtDate(intern.start)} → {fmtDate(intern.end)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge label={`${intern.reports.length} rapport(s)`} tone="muted" />
                    {!intern.confirmed && <Badge label="À affecter" tone="accent" />}
                  </div>
                </Link>
              );
            })
          )}
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
