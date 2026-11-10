import { Link, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Briefcase,
  Building2,
  CalendarClock,
  ChevronsUpDown,
  ArrowLeftRight,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Send,
  Settings,
  Users,
  X,
} from "lucide-react";
import { ShellPageTitleProvider } from "@/components/app/ui";
import { CompanyLogo } from "@/components/company/company-logo";
import { NotificationBell, SearchCommand } from "@/components/company/topbar";
import { cn } from "@/lib/utils";
import { useCompanyStore } from "@/lib/company-store";

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

type NavKey = "candidatures" | "entretiens" | "stagiaires";
type Icon = React.ComponentType<{ className?: string }>;
/** Petit mouvement propre à chaque icône au survol (à la manière des icônes animées de ChatGPT). */
type IconMotion = "pop" | "lift" | "fly" | "tilt" | "bounce" | "stack" | "spin";
type NavItem = { href: string; label: string; icon: Icon; motion: IconMotion; count?: NavKey };

/**
 * Les 8 entrées du Design Brief, regroupées selon la vie d'un dossier :
 * on recrute, on suit le stage, on gère l'entreprise.
 */
const NAV_GROUPS: { title: string | null; items: NavItem[] }[] = [
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
      { href: "/entreprise/services", label: "Services et besoins", icon: Layers, motion: "stack" },
    ],
  },
  {
    title: "Entreprise",
    items: [
      { href: "/entreprise/profil", label: "Profil", icon: Building2, motion: "lift" },
      { href: "/entreprise/parametres", label: "Paramètres", icon: Settings, motion: "spin" },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/entreprise": "Tableau de bord",
  "/entreprise/profil": "Mon profil entreprise",
  "/entreprise/offres": "Mes offres",
  "/entreprise/candidatures": "Candidatures",
  "/entreprise/entretiens": "Entretiens",
  "/entreprise/stagiaires": "Mes stagiaires",
  "/entreprise/services": "Services et besoins",
  "/entreprise/parametres": "Paramètres",
};

function normalize(pathname: string) {
  return pathname.replace(/\/$/, "") || "/entreprise";
}

function isActive(pathname: string, href: string) {
  const path = normalize(pathname);
  if (href === "/entreprise") return path === "/entreprise";
  return path.startsWith(href);
}

function pageTitle(pathname: string) {
  if (pathname.startsWith("/entreprise/stagiaires/")) return "Dossier stagiaire";
  return PAGE_TITLES[normalize(pathname)] ?? "Espace entreprise";
}

/** Compteurs du menu : uniquement ce qui attend une action de l'entreprise. */
function useNavCounts(): Record<NavKey, number> {
  const { candidates, interviews, interns } = useCompanyStore();
  return {
    candidatures: candidates.filter((c) => c.status === "en_attente" || c.status === "examen").length,
    entretiens: interviews.filter((i) => i.status === "programme").length,
    stagiaires: interns.filter((i) => !i.confirmed).length,
  };
}

/* ------------------------------------------------------------------ */
/* Marque                                                              */
/* ------------------------------------------------------------------ */

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="hsl(var(--primary))" />
      {/* Le « S » parcours : un S tracé comme un chemin ; le point marque le départ,
          le stagiaire guidé jusqu'au bon service. Au survol, le S se redessine. */}
      <path
        className="logo-path"
        d="M21.5 10.5h-7a3.5 3.5 0 0 0 0 7h3a3.5 3.5 0 0 1 0 7h-7"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        pathLength={1}
      />
      <circle className="logo-dot" cx="22.5" cy="10.5" r="2.4" fill="hsl(218 85% 73%)" />
    </svg>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link to="/entreprise" className="group flex min-w-0 items-center gap-2.5" aria-label="StageManager — tableau de bord">
      <LogoMark />
      <span
        className={cn(
          "min-w-0 whitespace-nowrap leading-tight transition-opacity duration-200",
          collapsed ? "pointer-events-none hidden" : "opacity-100"
        )}
      >
        <span className="block text-[15px] font-semibold tracking-tight text-foreground">StageManager</span>
        <span className="block text-[11px] text-muted-foreground">Espace entreprise</span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Liens                                                               */
/* ------------------------------------------------------------------ */

function NavLink({
  item,
  active,
  count,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  count?: number;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      activeOptions={{ exact: item.href === "/entreprise" }}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      data-nav-link
      data-nav-active={active ? "true" : undefined}
      className={cn(
        "group relative z-10 flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        collapsed && "justify-center px-0",
        active ? "font-medium text-primary" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          `nav-icon nav-icon--${item.motion} size-[18px] shrink-0`,
          active ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"
        )}
      />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}

      {count ? (
        collapsed ? (
          <span className="absolute right-2 top-1.5 size-1.5 rounded-full bg-primary" aria-hidden />
        ) : (
          <span
            className={cn(
              "grid h-5 min-w-5 place-items-center rounded-md px-1.5 text-[11px] font-medium tabular-nums",
              active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {count}
          </span>
        )
      ) : null}

      {/* Info-bulle en mode replié */}
      {collapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
        >
          {item.label}
          {count ? ` · ${count}` : ""}
        </span>
      )}
    </Link>
  );
}

/**
 * La pastille active est un seul élément qui glisse d'un lien à l'autre,
 * plutôt qu'un fond qui apparaît d'un coup.
 */
function SidebarNav({
  pathname,
  collapsed = false,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const counts = useNavCounts();
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);

  const measure = useCallback(() => {
    const active = navRef.current?.querySelector<HTMLElement>("[data-nav-link][data-nav-active=true]");
    setPill(active ? { top: active.offsetTop, height: active.offsetHeight } : null);
  }, []);

  useLayoutEffect(measure, [measure, pathname, collapsed]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <nav ref={navRef} className="relative" aria-label="Navigation principale">
      {pill && (
        <span
          aria-hidden
          className="absolute inset-x-0 rounded-lg bg-primary-soft transition-[top,height] duration-300 [transition-timing-function:var(--ease-soft)] motion-reduce:transition-none"
          style={{ top: pill.top, height: pill.height }}
        >
          <span className="absolute -left-3 bottom-2 top-2 w-[3px] rounded-r-full bg-primary" />
        </span>
      )}
      {NAV_GROUPS.map((group, index) => (
        <div key={group.title ?? "root"} className={cn(index > 0 && "mt-5")}>
          {group.title &&
            (collapsed ? (
              <div className="mx-2 mb-2 h-px bg-border" aria-hidden />
            ) : (
              <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {group.title}
              </p>
            ))}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                count={item.count ? counts[item.count] : undefined}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Compte                                                              */
/* ------------------------------------------------------------------ */

/**
 * Passage visible vers l'espace étudiant, au même endroit que le lien
 * « Espace entreprise » de l'espace étudiant. Lien de démonstration : une fois
 * l'authentification en place, chaque compte n'accèdera qu'à son propre espace.
 */
function SwitchSpaceLink({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onNavigate}
      aria-label={collapsed ? "Espace étudiant" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-lg border px-2.5 text-[13.5px] font-medium text-foreground transition-colors duration-200 hover:border-foreground/20 hover:bg-muted/70",
        collapsed && "justify-center px-0"
      )}
    >
      <GraduationCap className="nav-icon nav-icon--tilt size-[18px] shrink-0 text-muted-foreground group-hover:text-foreground" />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">Espace étudiant</span>
          <ArrowLeftRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-500 [transition-timing-function:var(--ease-soft)] group-hover:rotate-180 group-hover:text-foreground motion-reduce:transition-none" />
        </>
      )}
      {collapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
        >
          Espace étudiant
        </span>
      )}
    </Link>
  );
}

function AccountMenu({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { profile } = useCompanyStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  const itemClass =
    "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Compte ${profile.name}`}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-muted/70",
          collapsed && "justify-center",
          open && "bg-muted/70"
        )}
      >
        <CompanyLogo className="size-8 rounded-lg text-xs" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-medium text-foreground">{profile.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">Compte entreprise</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "animate-scale-in absolute z-50 w-60 rounded-xl border bg-popover p-1.5 shadow-xl",
            collapsed ? "bottom-0 left-full ml-3" : "bottom-full left-0 mb-2"
          )}
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="truncate text-[13px] font-medium">{profile.name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link to="/entreprise/profil" role="menuitem" onClick={close} className={itemClass}>
            <Building2 className="nav-icon nav-icon--lift size-4 text-muted-foreground" /> Profil de l'entreprise
          </Link>
          <Link to="/entreprise/parametres" role="menuitem" onClick={close} className={itemClass}>
            <Settings className="nav-icon nav-icon--spin size-4 text-muted-foreground" /> Paramètres
          </Link>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={close}
            className={cn(itemClass, "text-destructive-ink hover:bg-destructive-soft")}
          >
            <LogOut className="nav-icon nav-icon--fly size-4" /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barre supérieure                                                    */
/* ------------------------------------------------------------------ */

function TopBar({ pathname }: { pathname: string }) {
  const { profile } = useCompanyStore();
  const isDashboard = normalize(pathname) === "/entreprise";
  const date = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const hour = new Date().getHours();
  const greeting = hour < 18 ? "Bonjour" : "Bonsoir";
  const showPublish = !pathname.startsWith("/entreprise/offres");

  return (
    <header className="sticky top-0 z-30 hidden h-[72px] shrink-0 items-center justify-between gap-6 border-b border-border/60 bg-canvas/75 px-6 backdrop-blur-xl backdrop-saturate-150 lg:flex xl:px-8">
      <div key={pathname} className="animate-fade-up min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground first-letter:uppercase">
          {isDashboard ? date : `Espace entreprise · ${date}`}
        </p>
        <h1 className="mt-0.5 truncate text-[20px] font-semibold leading-tight tracking-tight text-foreground">
          {isDashboard ? (
            <>
              {greeting}, <span className="text-primary">{profile.name}</span>
            </>
          ) : (
            pageTitle(pathname)
          )}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <SearchCommand />
        <NotificationBell />
        {showPublish && (
          <Link
            to="/entreprise/offres"
            search={{ nouveau: true }}
            className="press group inline-flex h-10 items-center gap-2 rounded-lg bg-primary pl-3.5 pr-4 text-sm font-medium text-primary-foreground shadow-[0_6px_16px_-6px_hsl(var(--primary)/0.55)] transition-all duration-200 hover:bg-primary-hover hover:shadow-[0_10px_22px_-8px_hsl(var(--primary)/0.6)]"
          >
            <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
            Publier une offre
          </Link>
        )}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile                                                              */
/* ------------------------------------------------------------------ */

function MobileBar({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-card/90 px-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          aria-label="Ouvrir le menu"
          className="press grid size-10 shrink-0 place-items-center rounded-lg text-foreground hover:bg-muted"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold tracking-tight">
          {pageTitle(pathname)}
        </h1>
        <div className="flex shrink-0 items-center gap-1.5">
          {!pathname.startsWith("/entreprise/offres") && (
            <Link
              to="/entreprise/offres"
              search={{ nouveau: true }}
              aria-label="Publier une offre"
              className="press grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
            >
              <Plus className="size-[18px]" />
            </Link>
          )}
          <NotificationBell />
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-overlay/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="animate-slide-in-left absolute left-0 top-0 flex h-full w-[84%] max-w-[300px] flex-col bg-card shadow-2xl">
            <div className="flex h-16 items-center justify-between pl-5 pr-3">
              <Brand />
              <button
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="px-4 pb-2">
              <SearchCommand compact />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="space-y-1 border-t p-3">
              <SwitchSpaceLink onNavigate={() => setOpen(false)} />
              <AccountMenu onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

const COLLAPSE_KEY = "sm.entreprise.sidebar-collapsed";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function CompanyShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Les pages défilent dans cette zone, pas dans la fenêtre : on la remet en haut à chaque changement de page.
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);
  const title = pageTitle(pathname);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    document.title = `${title} — StageManager Entreprise`;
  }, [title]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      /* stockage indisponible : le choix vaut pour la session */
    }
  };

  return (
    <div className="flex h-dvh bg-canvas">
      <aside
        className={cn(
          "relative hidden shrink-0 flex-col border-r bg-card transition-[width] duration-300 [transition-timing-function:var(--ease-soft)] motion-reduce:transition-none lg:flex",
          collapsed ? "w-[72px]" : "w-[256px]"
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center", collapsed ? "justify-center" : "justify-between pl-5 pr-3")}>
          <Brand collapsed={collapsed} />
          {!collapsed && (
            <button
              type="button"
              onClick={toggle}
              aria-label="Replier le menu"
              title="Replier le menu"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeftClose className="size-[18px]" />
            </button>
          )}
        </div>

        <div className={cn("flex-1 px-3 py-3", collapsed ? "overflow-visible" : "overflow-y-auto")}>
          <SidebarNav pathname={pathname} collapsed={collapsed} />
        </div>

        <div className="space-y-1 border-t p-3">
          {collapsed && (
            <button
              type="button"
              onClick={toggle}
              aria-label="Déplier le menu"
              title="Déplier le menu"
              className="grid h-9 w-full place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeftOpen className="size-[18px]" />
            </button>
          )}
          <SwitchSpaceLink collapsed={collapsed} />
          <AccountMenu collapsed={collapsed} />
        </div>
      </aside>

      <div ref={scrollRef} className="page-scroll flex min-w-0 flex-1 flex-col overflow-y-auto">
        <TopBar pathname={pathname} />
        <MobileBar pathname={pathname} />

        <main className="flex-1 p-4 sm:p-6 xl:p-8">
          <div key={pathname} className="page-enter mx-auto w-full max-w-[1360px]">
            <ShellPageTitleProvider title={title}>{children}</ShellPageTitleProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
