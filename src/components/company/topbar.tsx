import { useMemo } from "react";
import { CalendarClock, FileText, Inbox, Sparkles } from "lucide-react";
import { NoticeBell, SearchBox, type Notice, type SearchTarget } from "@/components/shell/topbar-widgets";
import { useCompanyStore } from "@/lib/company-store";
import { localIsoDate } from "@/lib/dates";

/** « aujourd'hui », « hier », « dans 5 j », « il y a 3 j » : format compact du panneau. */
function relativeDay(value: string) {
  const days = Math.round((Date.now() - new Date(`${value}T12:00:00`).getTime()) / 86_400_000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days === -1) return "demain";
  if (days < 0) return `dans ${-days} j`;
  if (days < 7) return `il y a ${days} j`;
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/* ------------------------------------------------------------------ */
/* Recherche : candidats et offres                                     */
/* ------------------------------------------------------------------ */

function useCompanyResults(query: string): SearchTarget[] {
  const { candidates, offers } = useCompanyStore();
  return useMemo(() => {
    if (!query) return [];
    const offerTitle = (id: string) => offers.find((o) => o.id === id)?.title ?? "";
    const people: SearchTarget[] = candidates
      .filter((c) => `${c.name} ${c.filiere} ${c.universite}`.toLowerCase().includes(query))
      .slice(0, 4)
      .map((c) => ({
        id: `c-${c.id}`,
        label: c.name,
        meta: `${c.filiere} · ${offerTitle(c.offerId)}`,
        initials: c.initials,
        to: "/entreprise/candidatures",
        search: { q: c.name },
      }));
    const jobs: SearchTarget[] = offers
      .filter((o) => `${o.title} ${o.department}`.toLowerCase().includes(query))
      .slice(0, 3)
      .map((o) => ({ id: `o-${o.id}`, label: o.title, meta: o.department, to: "/entreprise/offres", search: { offre: o.id } }));
    return [...people, ...jobs];
  }, [query, candidates, offers]);
}

export function SearchCommand({ compact = false }: { compact?: boolean }) {
  return (
    <SearchBox
      compact={compact}
      useResults={useCompanyResults}
      fallback={(query) => ({ to: "/entreprise/candidatures", search: { q: query } })}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Notifications : ce qui demande une attention                        */
/* ------------------------------------------------------------------ */

export function NotificationBell({ align = "right" }: { align?: "right" | "left" }) {
  const { candidates, offers, interns, interviews, readNotices, markNoticesRead } = useCompanyStore();

  const notices = useMemo<Notice[]>(() => {
    const offerTitle = (id: string) => offers.find((o) => o.id === id)?.title ?? "";
    const name = (id: string) => candidates.find((c) => c.id === id)?.name ?? "Candidat";
    const today = localIsoDate();
    const list: Notice[] = [];
    interns
      .filter((i) => !i.confirmed)
      .forEach((i) =>
        list.push({
          id: `a-${i.id}`,
          icon: Sparkles,
          title: `Affectation de ${i.name} à valider`,
          meta: offerTitle(i.offerId),
          when: "à traiter",
          to: "/entreprise/stagiaires/$internId",
          params: { internId: i.id },
        })
      );
    candidates
      .filter((c) => c.status === "en_attente" || c.status === "examen")
      .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
      .forEach((c) =>
        list.push({
          id: `c-${c.id}`,
          icon: Inbox,
          title: `Nouvelle candidature de ${c.name}`,
          meta: offerTitle(c.offerId),
          when: relativeDay(c.appliedAt),
          to: "/entreprise/candidatures",
          search: { q: c.name },
        })
      );
    interviews
      .filter((i) => i.status === "programme" && i.date >= today)
      .forEach((i) =>
        list.push({
          id: `e-${i.id}`,
          icon: CalendarClock,
          title: `Entretien avec ${name(i.candidateId)}`,
          meta: `${i.time} · ${i.location}`,
          when: relativeDay(i.date),
          to: "/entreprise/entretiens",
        })
      );
    interns.forEach((i) => {
      const report = i.reports.find((r) => r.status === "soumis");
      if (report)
        list.push({
          id: `r-${i.id}`,
          icon: FileText,
          title: `Rapport de ${i.name} déposé`,
          meta: report.period,
          when: relativeDay(report.date),
          to: "/entreprise/stagiaires/$internId",
          params: { internId: i.id },
        });
    });
    return list;
  }, [candidates, offers, interns, interviews]);

  return (
    <NoticeBell
      notices={notices}
      isRead={(id) => readNotices.includes(id)}
      markRead={markNoticesRead}
      footer={{ to: "/entreprise/candidatures", label: "Voir toutes les candidatures" }}
      align={align}
    />
  );
}
