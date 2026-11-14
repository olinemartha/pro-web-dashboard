/**
 * Vue d'ensemble de la plateforme pour l'administrateur : tout est calculé à partir
 * des données des espaces étudiant et entreprise (lecture seule).
 */
import { useMemo } from "react";
import { useAdminStore } from "./admin-store";
import type { CandidateStatus } from "./company-data";
import { useCompanyStore } from "./company-store";
import { DAY_MS, localIsoDate } from "./dates";

export type AdminStudent = {
  email: string;
  name: string;
  initials: string;
  filiere: string;
  niveau: string;
  universite: string;
  applications: number;
  lastActivity: string;
  suspended: boolean;
};

export type LogKind = "candidature" | "affectation" | "systeme_expert" | "entretien" | "administration";

export type LogEntry = { id: string; date: string; kind: LogKind; title: string; detail: string };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");

export function useAdminData() {
  const { candidates, offers, interns, interviews, expertRuns, decisions, profile } = useCompanyStore();
  const { suspended, actions, users, companies: companyRows } = useAdminStore();

  return useMemo(() => {
    /* ---------------- Étudiants : candidats connus et comptes inscrits ---------------- */
    const byEmail = new Map<string, AdminStudent>();
    for (const c of candidates) {
      const current = byEmail.get(c.email);
      const last = c.history.map((h) => h.date).sort().pop() ?? c.appliedAt;
      if (current) {
        current.applications += 1;
        if (last > current.lastActivity) current.lastActivity = last;
      } else {
        byEmail.set(c.email, {
          email: c.email,
          name: c.name,
          initials: c.initials,
          filiere: c.filiere,
          niveau: c.niveau,
          universite: c.universite,
          applications: 1,
          lastActivity: last,
          suspended: suspended.includes(c.email),
        });
      }
    }
    for (const account of users.filter((u) => u.role === "etudiant" && u.onboarded)) {
      const known = byEmail.get(account.email);
      if (known) {
        known.suspended = account.suspended || known.suspended;
        continue;
      }
      byEmail.set(account.email, {
        email: account.email,
        name: account.name,
        initials: initials(account.name),
        filiere: account.filiere,
        niveau: account.niveau,
        universite: account.universite,
        applications: 0,
        lastActivity: account.createdAt.slice(0, 10) || localIsoDate(),
        suspended: account.suspended || suspended.includes(account.email),
      });
    }
    const students = [...byEmail.values()].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));

    /* ---------------- Entreprises ---------------- */
    const companySuspended = (id: string, email: string) =>
      suspended.includes(email) || users.some((u) => u.companyId === id && u.role === "entreprise" && u.suspended);
    const companies = companyRows.length
      ? companyRows.map((c) => {
          const own = offers.filter((o) => o.companyId === c.id);
          return {
            email: c.email,
            name: c.name,
            initials: c.initials,
            sector: c.sector,
            city: c.city,
            offers: own.length,
            published: own.filter((o) => o.status === "publiee").length,
            interns: interns.filter((i) => own.some((o) => o.id === i.offerId)).length,
            suspended: companySuspended(c.id, c.email),
          };
        })
      : [
          {
            email: profile.email,
            name: profile.name,
            initials: profile.initials,
            sector: profile.sector,
            city: profile.city,
            offers: offers.length,
            published: offers.filter((o) => o.status === "publiee").length,
            interns: interns.length,
            suspended: suspended.includes(profile.email),
          },
        ];

    /* ---------------- Candidatures ---------------- */
    const today = localIsoDate();
    const now = new Date(`${today}T12:00:00`).getTime();
    const weekly = Array.from({ length: 8 }, (_, index) => {
      const end = now - (7 - index) * 7 * DAY_MS;
      const start = end - 7 * DAY_MS;
      const count = candidates.filter((c) => {
        const t = new Date(`${c.appliedAt}T12:00:00`).getTime();
        return t > start && t <= end;
      }).length;
      return { label: new Date(end).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), count };
    });
    const last30 = candidates.filter((c) => now - new Date(`${c.appliedAt}T12:00:00`).getTime() <= 30 * DAY_MS).length;
    const statusOrder: CandidateStatus[] = ["en_attente", "examen", "entretien", "acceptee", "refusee", "retiree"];
    const byStatus = statusOrder.map((status) => ({ status, count: candidates.filter((c) => c.status === status).length }));
    const decided = candidates.filter((c) => c.status === "acceptee" || c.status === "refusee").length;
    const acceptance = decided ? Math.round((candidates.filter((c) => c.status === "acceptee").length / decided) * 100) : 0;

    const filieres = [...candidates.reduce((map, c) => map.set(c.filiere, (map.get(c.filiere) ?? 0) + 1), new Map<string, number>())]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    /* ---------------- Système expert ---------------- */
    const followed = decisions.filter((d) => d.source === "recommandation").length;
    const manual = decisions.filter((d) => d.source === "manuel").length;
    const adoption = decisions.length ? Math.round((followed / decisions.length) * 100) : 0;
    const insufficient = expertRuns.filter((run) => run.status !== "prete").length;

    /* ---------------- Journal (lecture seule) ---------------- */
    const offerTitle = (id: string) => offers.find((o) => o.id === id)?.title ?? "Offre";
    const internName = (id: string) => interns.find((i) => i.id === id)?.name ?? "Stagiaire";
    const STATUS_TEXT: Record<CandidateStatus, string> = {
      en_attente: "Candidature reçue",
      examen: "Candidature en examen",
      entretien: "Entretien programmé",
      acceptee: "Candidature acceptée",
      refusee: "Candidature refusée",
      retiree: "Candidature retirée",
    };
    const log: LogEntry[] = [
      ...candidates.flatMap((c) =>
        c.history.map((h, index) => ({
          id: `h-${c.id}-${index}`,
          date: h.date,
          kind: (h.status === "entretien" ? "entretien" : "candidature") as LogKind,
          title: `${STATUS_TEXT[h.status]} · ${c.name}`,
          detail: `${offerTitle(c.offerId)}${h.note && h.note !== STATUS_TEXT[h.status] ? ` · ${h.note}` : ""}`,
        }))
      ),
      ...expertRuns.map((run) => ({
        id: `r-${run.id}`,
        date: run.createdAt,
        kind: "systeme_expert" as LogKind,
        title: `Analyse du système expert · ${internName(run.internId)}`,
        detail:
          run.status === "prete"
            ? `${run.proposals.length} service(s) évalué(s), proposition : ${run.proposals[0]?.serviceName ?? "—"} (moteur ${run.engineVersion})`
            : "Données insuffisantes pour recommander",
      })),
      ...decisions.map((d, index) => ({
        id: `d-${d.internId}-${index}`,
        date: d.decidedAt,
        kind: "affectation" as LogKind,
        title: `Affectation validée · ${internName(d.internId)} → ${d.service}`,
        detail: `${d.source === "recommandation" ? "Recommandation du système suivie" : `Décision manuelle${d.reason ? ` : ${d.reason}` : ""}`} · par ${d.decidedBy}`,
      })),
      ...interviews
        .filter((i) => i.status === "annule")
        .map((i) => ({
          id: `i-${i.id}`,
          date: i.date,
          kind: "entretien" as LogKind,
          title: `Entretien annulé · ${candidates.find((c) => c.id === i.candidateId)?.name ?? "Candidat"}`,
          detail: `${i.time} · ${i.location}`,
        })),
      ...actions.map((a) => ({
        id: a.id,
        date: a.date,
        kind: "administration" as LogKind,
        title:
          a.kind === "suspension" ? `Compte suspendu · ${a.target}` : a.kind === "reactivation" ? `Compte réactivé · ${a.target}` : `Offre retirée · ${a.target}`,
        detail: a.reason ? `Motif : ${a.reason}` : "Action de l'administrateur",
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    return {
      registered: users.filter((u) => u.role !== "admin" && u.onboarded).length,
      students,
      companies,
      offers,
      candidates,
      weekly,
      last30,
      byStatus,
      acceptance,
      filieres,
      expert: { runs: expertRuns.length, followed, manual, adoption, insufficient, decisions: decisions.length },
      interns,
      log,
    };
  }, [candidates, offers, interns, interviews, expertRuns, decisions, profile, users, companyRows, suspended, actions]);
}
