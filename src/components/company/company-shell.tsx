import { BookOpenCheck, Briefcase, Building2, CalendarClock, Layers, LayoutDashboard, Send, Settings, UserRoundCheck, Users } from "lucide-react";
import { CompanyLogo } from "@/components/company/company-logo";
import { NotificationBell, SearchCommand } from "@/components/company/topbar";
import { SpaceShell, type SpaceConfig } from "@/components/shell/space-shell";
import { useCompanyStore } from "@/lib/company-store";

/**
 * Espace entreprise : la configuration de la coque commune.
 * Le menu suit la vie d'un dossier : on recrute, on suit le stage, on gère l'entreprise.
 */

const PAGE_TITLES: Record<string, string> = {
  "/entreprise": "Tableau de bord",
  "/entreprise/profil": "Mon profil entreprise",
  "/entreprise/offres": "Mes offres",
  "/entreprise/candidatures": "Candidatures",
  "/entreprise/entretiens": "Entretiens",
  "/entreprise/stagiaires": "Mes stagiaires",
  "/entreprise/encadreurs": "Encadreurs",
  "/entreprise/services": "Services et besoins",
  "/entreprise/regles": "Base de règles",
  "/entreprise/parametres": "Paramètres",
};

const companyConfig: SpaceConfig = {
  home: "/entreprise",
  label: "Espace entreprise",
  navGroups: [
    { title: null, items: [{ href: "/entreprise", label: "Tableau de bord", icon: LayoutDashboard, motion: "pop" }] },
    {
      title: "Recrutement",
      items: [
        { href: "/entreprise/offres", label: "Mes offres", icon: Briefcase, motion: "lift" },
        { href: "/entreprise/candidatures", label: "Candidatures", icon: Send, motion: "fly", count: "candidatures" },
        { href: "/entreprise/entretiens", label: "Entretiens", icon: CalendarClock, motion: "tilt", count: "entretiens" },
      ],
    },
    {
      title: "Suivi des stages",
      items: [
        { href: "/entreprise/stagiaires", label: "Mes stagiaires", icon: Users, motion: "bounce", count: "stagiaires" },
        { href: "/entreprise/encadreurs", label: "Encadreurs", icon: UserRoundCheck, motion: "bounce", count: "encadreurs" },
        { href: "/entreprise/services", label: "Services et besoins", icon: Layers, motion: "stack" },
        { href: "/entreprise/regles", label: "Base de règles", icon: BookOpenCheck, motion: "lift" },
      ],
    },
    {
      title: "Entreprise",
      items: [
        { href: "/entreprise/profil", label: "Profil", icon: Building2, motion: "lift" },
        { href: "/entreprise/parametres", label: "Paramètres", icon: Settings, motion: "spin" },
      ],
    },
  ],
  /** Compteurs : uniquement ce qui attend une action de l'entreprise. */
  useCounts: () => {
    const { candidates, interviews, interns } = useCompanyStore();
    return {
      candidatures: candidates.filter((c) => c.status === "en_attente" || c.status === "examen").length,
      entretiens: interviews.filter((i) => i.status === "programme").length,
      stagiaires: interns.filter((i) => !i.confirmed).length,
      // Stagiaires affectés à un service mais sans encadreur.
      encadreurs: interns.filter((i) => i.confirmed && !i.supervisorId).length,
    };
  },
  pageTitle: (pathname) => {
    if (pathname.startsWith("/entreprise/stagiaires/")) return "Dossier stagiaire";
    return PAGE_TITLES[pathname.replace(/\/$/, "") || "/entreprise"] ?? "Espace entreprise";
  },
  useGreetingName: () => useCompanyStore().profile.name,
  useAccount: () => {
    const { profile } = useCompanyStore();
    return {
      name: profile.name,
      subtitle: "Compte entreprise",
      email: profile.email,
      avatar: <CompanyLogo className="size-8 rounded-lg text-xs" />,
      links: [
        { to: "/entreprise/profil", label: "Profil de l'entreprise", icon: Building2, motion: "lift" },
        { to: "/entreprise/parametres", label: "Paramètres", icon: Settings, motion: "spin" },
      ],
    };
  },
  search: SearchCommand,
  bell: () => <NotificationBell />,
  primaryAction: {
    to: "/entreprise/offres",
    search: { nouveau: true },
    label: "Publier une offre",
    hideOn: (pathname) => pathname.startsWith("/entreprise/offres"),
  },
  collapseKey: "sm.entreprise.sidebar-collapsed",
  documentTitleSuffix: "StageManager Entreprise",
};

export function CompanyShell({ children }: { children: React.ReactNode }) {
  return <SpaceShell config={companyConfig}>{children}</SpaceShell>;
}
