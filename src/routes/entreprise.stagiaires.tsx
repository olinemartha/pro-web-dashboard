import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ClipboardCheck, FileText, UserCheck, Users } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import { AvatarInitials, EmptyNote, PageIntro, SECTION_LINK, StatCard } from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";
import { daysFromToday, fmtDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Intern } from "@/lib/company-data";

export const Route = createFileRoute("/entreprise/stagiaires")({
  head: () => ({
    meta: [{ title: "Mes stagiaires — Espace entreprise" }],
  }),
  component: CompanyInternsLayout,
});

type Filter = "tous" | "a_affecter" | "rapports" | "a_evaluer";

const pendingReports = (intern: Intern) => intern.reports.filter((report) => report.status === "soumis").length;

/** Avancement du stage entre la date de début et la date de fin (0 à 100). */
function progressOf(intern: Intern) {
  if (!intern.start || !intern.end) return 0;
  const total = -daysFromToday(intern.start) + daysFromToday(intern.end);
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((-daysFromToday(intern.start) / total) * 100)));
}

function CompanyInternsLayout() {
  const { interns } = useCompanyStore();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const dossierOpen = pathname.startsWith("/entreprise/stagiaires/");
  const [filter, setFilter] = useState<Filter>("tous");

  const toAssign = interns.filter((intern) => !intern.confirmed);
  const withReports = interns.filter((intern) => pendingReports(intern) > 0);
  const reportsCount = withReports.reduce((sum, intern) => sum + pendingReports(intern), 0);
  const toEvaluate = interns.filter((intern) => !intern.evaluation);

  const visible = interns.filter((intern) => {
    if (filter === "a_affecter") return !intern.confirmed;
    if (filter === "rapports") return pendingReports(intern) > 0;
    if (filter === "a_evaluer") return !intern.evaluation;
    return true;
  });

  const toggle = (value: Filter) => setFilter((current) => (current === value ? "tous" : value));

  if (dossierOpen) {
    return (
      <div className="space-y-6">
        <Reveal as="section" className="card-surface flex flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3" aria-label="Changer de dossier">
          <Link
            to="/entreprise/stagiaires"
            className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:-translate-x-1 motion-reduce:transition-none" />
            Tous les dossiers
          </Link>
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
          <nav aria-label="Dossiers stagiaires" className="flex min-w-0 flex-wrap gap-1">
            {interns.map((intern) => {
              const active = pathname === `/entreprise/stagiaires/${intern.id}`;
              const reports = pendingReports(intern);
              return (
                <Link
                  key={intern.id}
                  to="/entreprise/stagiaires/$internId"
                  params={{ internId: intern.id }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "press inline-flex h-9 items-center gap-2 rounded-lg pl-1.5 pr-3 text-[13px] transition-colors duration-200",
                    active ? "bg-primary-soft font-semibold text-primary" : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <AvatarInitials initials={intern.initials} className="size-6 text-[10px]" />
                  {intern.name}
                  {!intern.confirmed && (
                    <span className="size-1.5 rounded-full bg-warning" aria-label="affectation à confirmer" />
                  )}
                  {reports > 0 && (
                    <span
                      className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground"
                      aria-label={`${reports} rapport${reports > 1 ? "s" : ""} à relire`}
                    >
                      {reports}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </Reveal>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro desc="Un dossier par stagiaire : affectation recommandée par le système expert, suivi des rapports, évaluation et attestation." />

      {(
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {[
            <StatCard
              key="tous"
              label="Stagiaires accueillis"
              value={interns.length}
              icon={Users}
              motion="bounce"
              foot={`${interns.length - toAssign.length} affectation${interns.length - toAssign.length > 1 ? "s" : ""} confirmée${interns.length - toAssign.length > 1 ? "s" : ""}`}
              onClick={() => setFilter("tous")}
            />,
            <StatCard
              key="affecter"
              label="À affecter"
              value={toAssign.length}
              icon={UserCheck}
              motion="bounce"
              foot={toAssign.length ? "recommandation à valider" : "toutes confirmées"}
              tone={toAssign.length ? "alert" : "neutral"}
              onClick={() => toggle("a_affecter")}
              pressed={filter === "a_affecter"}
            />,
            <StatCard
              key="rapports"
              label="Rapports à relire"
              value={reportsCount}
              icon={FileText}
              motion="lift"
              foot={reportsCount ? `chez ${withReports.length} stagiaire${withReports.length > 1 ? "s" : ""}` : "aucun en attente"}
              tone={reportsCount ? "alert" : "neutral"}
              onClick={() => toggle("rapports")}
              pressed={filter === "rapports"}
            />,
            <StatCard
              key="evaluer"
              label="Évaluations à saisir"
              value={toEvaluate.length}
              icon={ClipboardCheck}
              motion="pop"
              foot={`${interns.length - toEvaluate.length} saisie${interns.length - toEvaluate.length > 1 ? "s" : ""}`}
              onClick={() => toggle("a_evaluer")}
              pressed={filter === "a_evaluer"}
            />,
          ].map((card, index) => (
            <Reveal key={index} delay={index * 60} className="min-w-0">
              {card}
            </Reveal>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <Reveal
          as="aside"
          delay={120}
          className="card-surface overflow-hidden"
          aria-labelledby="dossiers-titre"
        >
          <div className="flex items-center justify-between gap-3 border-b px-5 pb-3.5 pt-4">
            <h2 id="dossiers-titre" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Dossiers
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {visible.length}
              </span>
            </h2>
            {filter !== "tous" && (
              <button type="button" onClick={() => setFilter("tous")} className="text-xs font-medium text-primary hover:underline">
                Tout afficher
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <EmptyNote
              icon={Users}
              title={interns.length ? "Aucun dossier ici" : "Aucun stagiaire"}
              desc={interns.length ? "Changez de filtre pour voir les autres dossiers." : "Un dossier est créé à l'acceptation d'une candidature."}
            />
          ) : (
            <ul className="divide-y">
              {visible.map((intern, index) => {
                const active = pathname === `/entreprise/stagiaires/${intern.id}`;
                const reports = pendingReports(intern);
                const progress = progressOf(intern);
                return (
                  <Reveal as="li" key={intern.id} delay={index < 8 ? 160 + index * 40 : 0}>
                    <Link
                      to="/entreprise/stagiaires/$internId"
                      params={{ internId: intern.id }}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 px-5 py-3.5 transition-colors duration-150 focus-visible:outline-offset-[-3px]",
                        active ? "bg-primary-soft shadow-[inset_3px_0_0_hsl(var(--primary))]" : "hover:bg-muted/50"
                      )}
                    >
                      <AvatarInitials initials={intern.initials} />
                      <span className="min-w-0">
                        <span className={cn("block truncate text-sm font-semibold transition-colors", active ? "text-primary" : "group-hover:text-primary")}>
                          {intern.name}
                        </span>
                        <span className={cn("block truncate text-xs", intern.confirmed ? "text-muted-foreground" : "font-medium text-warning")}>
                          {intern.confirmed ? intern.service : "Affectation à confirmer"}
                        </span>
                        {/* Avancement du stage */}
                        <span className="mt-2 flex items-center gap-2">
                          <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                            <span className="animate-grow-x block h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                          </span>
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {intern.end ? `→ ${fmtDate(intern.end, false)}` : "dates à fixer"}
                          </span>
                        </span>
                      </span>
                      {reports > 0 ? (
                        <span
                          className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold tabular-nums text-primary-foreground"
                          aria-label={`${reports} rapport${reports > 1 ? "s" : ""} à relire`}
                        >
                          {reports}
                        </span>
                      ) : (
                        <span className="w-5" aria-hidden />
                      )}
                    </Link>
                  </Reveal>
                );
              })}
            </ul>
          )}
          {interns.length === 0 && (
            <div className="flex justify-center pb-6">
              <Link to="/entreprise/candidatures" className={SECTION_LINK}>
                Voir les candidatures
              </Link>
            </div>
          )}
        </Reveal>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
