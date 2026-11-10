import { useMemo } from "react";
import {
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Search,
  Send,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AvatarInitials } from "@/components/company/ui";
import { SpaceShell, type SpaceConfig } from "@/components/shell/space-shell";
import { NoticeBell, SearchBox, type Notice, type SearchTarget } from "@/components/shell/topbar-widgets";
import { offerOf, offers } from "@/lib/mock-data";
import { STATUS_LABELS } from "@/lib/rules";
import { useStore } from "@/lib/store";

/**
 * Espace étudiant : la même coque que l'espace entreprise.
 * Le menu suit le parcours : on cherche un stage, on le suit, on gère son compte.
 */

const PAGE_TITLES: Record<string, string> = {
  "/": "Tableau de bord",
  "/offres": "Offres de stage",
  "/candidatures": "Mes candidatures",
  "/stage": "Mon stage",
  "/documents": "Mes documents",
  "/profil": "Mon profil",
  "/notifications": "Notifications",
  "/parametres": "Paramètres",
  "/aide": "Aide",
};

/** « aujourd'hui », « hier », « il y a 3 j » : format compact du panneau. */
function relativeTime(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const initialsOf = (prenom: string, nom: string) => `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase() || "É";

/* ------------------------------------------------------------------ */
/* Recherche : offres et candidatures                                  */
/* ------------------------------------------------------------------ */

function useStudentResults(query: string): SearchTarget[] {
  const { applications } = useStore();
  return useMemo(() => {
    if (!query) return [];
    const jobs: SearchTarget[] = offers
      .filter((o) => `${o.title} ${o.department} ${o.location} ${o.skills.join(" ")}`.toLowerCase().includes(query))
      .slice(0, 5)
      .map((o) => ({ id: `o-${o.id}`, label: o.title, meta: `${o.department} · ${o.location}`, to: "/offres/$id", params: { id: o.id } }));
    const mine: SearchTarget[] = applications
      .filter((a) => offerOf(a.offerId).title.toLowerCase().includes(query))
      .slice(0, 3)
      .map((a) => ({
        id: `a-${a.id}`,
        label: `Candidature · ${offerOf(a.offerId).title}`,
        meta: STATUS_LABELS[a.status].label,
        icon: Send,
        to: "/candidatures",
      }));
    return [...jobs, ...mine];
  }, [query, applications]);
}

function StudentSearch({ compact = false }: { compact?: boolean }) {
  return (
    <SearchBox
      compact={compact}
      placeholder="Rechercher un stage"
      useResults={useStudentResults}
      fallback={(query) => ({ to: "/offres", search: { q: query } })}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

const NOTICE_ROUTE: Record<string, { to: string; icon: React.ComponentType<{ className?: string }> }> = {
  candidature: { to: "/candidatures", icon: CheckCircle2 },
  entretien: { to: "/candidatures", icon: CalendarClock },
  offre: { to: "/offres", icon: Sparkles },
  stage: { to: "/stage", icon: GraduationCap },
  document: { to: "/documents", icon: FileText },
  rapport: { to: "/stage", icon: FileText },
};

function StudentBell() {
  const { notifications, markNotificationsRead } = useStore();
  const notices = useMemo<Notice[]>(
    () =>
      notifications.map((n) => ({
        id: n.id,
        icon: NOTICE_ROUTE[n.kind]?.icon ?? Bell,
        title: n.title,
        meta: n.body,
        when: relativeTime(n.date),
        to: NOTICE_ROUTE[n.kind]?.to ?? "/notifications",
      })),
    [notifications]
  );
  return (
    <NoticeBell
      notices={notices}
      isRead={(id) => notifications.find((n) => n.id === id)?.read ?? true}
      markRead={markNotificationsRead}
      footer={{ to: "/notifications", label: "Voir toutes les notifications" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

const studentConfig: SpaceConfig = {
  home: "/",
  label: "Espace étudiant",
  navGroups: [
    { title: null, items: [{ href: "/", label: "Tableau de bord", icon: LayoutDashboard, motion: "pop" }] },
    {
      title: "Recherche de stage",
      items: [
        { href: "/offres", label: "Offres de stage", icon: Briefcase, motion: "lift" },
        { href: "/candidatures", label: "Mes candidatures", icon: Send, motion: "fly", count: "decisions" },
      ],
    },
    {
      title: "Mon stage",
      items: [
        { href: "/stage", label: "Suivi du stage", icon: GraduationCap, motion: "tilt" },
        { href: "/documents", label: "Documents", icon: FileText, motion: "lift" },
      ],
    },
    {
      title: "Compte",
      items: [
        { href: "/profil", label: "Profil", icon: UserRound, motion: "pop" },
        { href: "/parametres", label: "Paramètres", icon: Settings, motion: "spin" },
        { href: "/aide", label: "Aide", icon: LifeBuoy, motion: "spin" },
      ],
    },
  ],
  /** Compteur : les propositions acceptées qui attendent le choix de l'étudiant. */
  useCounts: () => {
    const { applications } = useStore();
    return { decisions: applications.filter((a) => a.status === "acceptee").length };
  },
  pageTitle: (pathname) => {
    if (pathname.startsWith("/offres/")) return "Détail de l'offre";
    return PAGE_TITLES[pathname.replace(/\/$/, "") || "/"] ?? "Espace étudiant";
  },
  useGreetingName: () => useStore().profile.prenom || "à vous",
  useAccount: () => {
    const { profile } = useStore();
    const name = `${profile.prenom} ${profile.nom}`.trim() || "Étudiant";
    return {
      name,
      subtitle: "Compte étudiant",
      email: profile.email,
      avatar: profile.photo ? (
        <img src={profile.photo} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
      ) : (
        <AvatarInitials initials={initialsOf(profile.prenom, profile.nom)} className="size-8 rounded-lg text-xs" />
      ),
      links: [
        { to: "/profil", label: "Mon profil", icon: UserRound, motion: "pop" },
        { to: "/parametres", label: "Paramètres", icon: Settings, motion: "spin" },
      ],
    };
  },
  switchTo: { to: "/entreprise", label: "Espace entreprise", icon: Building2, motion: "lift" },
  search: StudentSearch,
  bell: StudentBell,
  primaryAction: {
    to: "/offres",
    label: "Trouver un stage",
    icon: Search,
    hideOn: (pathname) => pathname.startsWith("/offres"),
  },
  collapseKey: "sm.etudiant.sidebar-collapsed",
  documentTitleSuffix: "StageManager",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  return <SpaceShell config={studentConfig}>{children}</SpaceShell>;
}
