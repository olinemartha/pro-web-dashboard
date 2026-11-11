import { useMemo } from "react";
import { Briefcase, Inbox, LayoutDashboard, ScrollText, Settings, Sparkles, Users } from "lucide-react";
import { AvatarInitials } from "@/components/company/ui";
import { SpaceShell, type SpaceConfig } from "@/components/shell/space-shell";
import { NoticeBell, SearchBox, type Notice, type SearchTarget } from "@/components/shell/topbar-widgets";
import { useAdminStore } from "@/lib/admin-store";
import { useAuth } from "@/lib/auth";
import { useCompanyStore } from "@/lib/company-store";
import { relativeDay } from "@/lib/dates";

/**
 * Espace administrateur : il supervise la plateforme (comptes, offres, système expert,
 * journal) sans jamais décider d'un recrutement ou d'une affectation à la place de l'entreprise.
 */

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Tableau de bord",
  "/admin/utilisateurs": "Utilisateurs",
  "/admin/offres": "Offres",
  "/admin/systeme-expert": "Système expert",
  "/admin/journal": "Journal d'activité",
  "/admin/parametres": "Paramètres",
};

function useAdminResults(query: string): SearchTarget[] {
  const { candidates, offers, profile } = useCompanyStore();
  return useMemo(() => {
    if (!query) return [];
    const people: SearchTarget[] = [...new Map(candidates.map((c) => [c.email, c])).values()]
      .filter((c) => `${c.name} ${c.email} ${c.filiere}`.toLowerCase().includes(query))
      .slice(0, 4)
      .map((c) => ({ id: `u-${c.email}`, label: c.name, meta: `Étudiant · ${c.filiere}`, initials: c.initials, to: "/admin/utilisateurs", search: { q: c.name } }));
    const jobs: SearchTarget[] = offers
      .filter((o) => `${o.title} ${o.department}`.toLowerCase().includes(query))
      .slice(0, 3)
      .map((o) => ({ id: `o-${o.id}`, label: o.title, meta: `${profile.name} · ${o.department}`, to: "/admin/offres", search: { q: o.title } }));
    return [...people, ...jobs];
  }, [query, candidates, offers, profile.name]);
}

function AdminSearch({ compact = false }: { compact?: boolean }) {
  return (
    <SearchBox
      compact={compact}
      placeholder="Rechercher un compte, une offre"
      useResults={useAdminResults}
      fallback={(query) => ({ to: "/admin/utilisateurs", search: { q: query } })}
    />
  );
}

/** Ce qui demande l'attention de l'administrateur : nouvelles candidatures et analyses du système expert. */
function AdminBell() {
  const { candidates, expertRuns, interns } = useCompanyStore();
  const { readNotices, markNoticesRead } = useAdminStore();
  const notices = useMemo<Notice[]>(() => {
    const runs = [...expertRuns]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((run) => ({
        id: `run-${run.id}`,
        icon: Sparkles,
        title: `Analyse du système expert · ${interns.find((i) => i.id === run.internId)?.name ?? "stagiaire"}`,
        meta: run.status === "prete" ? `Proposition : ${run.proposals[0]?.serviceName ?? "—"}` : "Données insuffisantes",
        when: relativeDay(run.createdAt.slice(0, 10)),
        to: "/admin/systeme-expert",
      }));
    const applications = [...candidates]
      .filter((c) => c.status === "en_attente")
      .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
      .slice(0, 4)
      .map((c) => ({ id: `c-${c.id}`, icon: Inbox, title: `Nouvelle candidature · ${c.name}`, meta: c.filiere, when: relativeDay(c.appliedAt), to: "/admin/journal" }));
    return [...runs, ...applications];
  }, [candidates, expertRuns, interns]);
  return (
    <NoticeBell
      notices={notices}
      isRead={(id) => readNotices.includes(id)}
      markRead={markNoticesRead}
      footer={{ to: "/admin/journal", label: "Ouvrir le journal d'activité" }}
    />
  );
}

const adminConfig: SpaceConfig = {
  home: "/admin",
  label: "Espace administrateur",
  navGroups: [
    { title: null, items: [{ href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, motion: "pop" }] },
    {
      title: "Plateforme",
      items: [
        { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users, motion: "bounce" },
        { href: "/admin/offres", label: "Offres", icon: Briefcase, motion: "lift" },
        { href: "/admin/systeme-expert", label: "Système expert", icon: Sparkles, motion: "pop" },
      ],
    },
    {
      title: "Contrôle",
      items: [
        { href: "/admin/journal", label: "Journal d'activité", icon: ScrollText, motion: "lift" },
        { href: "/admin/parametres", label: "Paramètres", icon: Settings, motion: "spin" },
      ],
    },
  ],
  useCounts: () => ({}),
  pageTitle: (pathname) => PAGE_TITLES[pathname.replace(/\/$/, "") || "/admin"] ?? "Espace administrateur",
  useGreetingName: () => "Administrateur",
  useAccount: () => {
    const session = useAuth((state) => state.session);
    return {
      name: session?.name || "Administrateur",
      subtitle: "Compte administrateur",
      email: session?.email ?? "",
      avatar: <AvatarInitials initials="AD" className="size-8 rounded-lg text-xs" />,
      links: [{ to: "/admin/parametres", label: "Paramètres", icon: Settings, motion: "spin" }],
    };
  },
  search: AdminSearch,
  bell: AdminBell,
  collapseKey: "sm.admin.sidebar-collapsed",
  documentTitleSuffix: "StageManager Administration",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <SpaceShell config={adminConfig}>{children}</SpaceShell>;
}
