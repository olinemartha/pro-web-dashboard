import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  ChevronDown,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Send,
  Settings,
  Users,
  X,
} from "lucide-react";
import { ShellPageTitleProvider } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { useCompanyStore } from "@/lib/company-store";

type NavKey = "candidatures" | "entretiens" | "stagiaires";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: NavKey;
}[] = [
  { href: "/entreprise", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/entreprise/profil", label: "Mon profil entreprise", icon: Building2 },
  { href: "/entreprise/offres", label: "Mes offres", icon: Briefcase },
  { href: "/entreprise/candidatures", label: "Candidatures", icon: Send, count: "candidatures" },
  { href: "/entreprise/entretiens", label: "Entretiens", icon: CalendarClock, count: "entretiens" },
  { href: "/entreprise/stagiaires", label: "Mes stagiaires", icon: Users, count: "stagiaires" },
  { href: "/entreprise/services", label: "Services et besoins", icon: Layers },
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

function isActive(pathname: string, href: string) {
  if (href === "/entreprise") return pathname === "/entreprise" || pathname === "/entreprise/";
  return pathname.startsWith(href);
}

function pageTitle(pathname: string) {
  if (pathname.startsWith("/entreprise/stagiaires/")) return "Dossier stagiaire";
  return PAGE_TITLES[pathname.replace(/\/$/, "") || "/entreprise"] ?? "Espace entreprise";
}

/** Compteurs affichés dans le menu : uniquement des actions qui attendent l'entreprise. */
function useNavCounts(): Record<NavKey, number> {
  const { candidates, interviews, interns } = useCompanyStore();
  return {
    candidatures: candidates.filter((c) => c.status === "en_attente" || c.status === "examen").length,
    entretiens: interviews.filter((i) => i.status === "programme").length,
    stagiaires: interns.filter((i) => !i.confirmed).length,
  };
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  count,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  count?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
        active
          ? "bg-primary-soft text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary transition-all duration-300",
          active ? "opacity-100" : "scale-y-0 opacity-0"
        )}
      />
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="truncate">{label}</span>
      {count ? (
        <span
          className={cn(
            "ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
            active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const counts = useNavCounts();
  return (
    <>
      <nav className="flex-1 space-y-1" aria-label="Navigation principale">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
          Menu
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(pathname, item.href)}
            count={item.count ? counts[item.count] : undefined}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="space-y-1 border-t pt-4">
        <NavLink
          href="/entreprise/parametres"
          label="Paramètres"
          icon={Settings}
          active={isActive(pathname, "/entreprise/parametres")}
          onNavigate={onNavigate}
        />
        <NavLink
          href="/"
          label="Espace étudiant (démo)"
          icon={GraduationCap}
          active={false}
          onNavigate={onNavigate}
        />
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive-ink"
        >
          <LogOut className="size-[18px] shrink-0" />
          Déconnexion
        </button>
      </div>
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm">
        S
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[17px] font-semibold tracking-tight text-foreground">
          StageManager
        </p>
        <p className="text-[11px] font-medium text-muted-foreground">Espace entreprise</p>
      </div>
    </div>
  );
}

function SearchBox({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const q = query.trim();
        navigate({ to: "/entreprise/candidatures", search: q ? { q } : {} });
        setQuery("");
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher un candidat…"
        aria-label="Rechercher un candidat"
        className="h-10 w-full rounded-full border bg-card pl-9 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground focus:border-accent focus:ring-4 focus:ring-accent/15"
      />
    </form>
  );
}

function BellLink({ count }: { count: number }) {
  return (
    <Link
      to="/entreprise/candidatures"
      className="press relative grid size-10 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground"
      aria-label={`Candidatures à examiner : ${count}`}
    >
      <Bell className="size-[18px]" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none tabular-nums text-destructive-foreground ring-2 ring-canvas">
          {count}
        </span>
      )}
    </Link>
  );
}

function TopBar({ pathname }: { pathname: string }) {
  const { profile } = useCompanyStore();
  const counts = useNavCounts();
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const showPublish = !pathname.startsWith("/entreprise/offres");

  return (
    <header className="sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-border/60 bg-canvas/85 px-6 py-3.5 backdrop-blur-md lg:flex lg:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
          {pageTitle(pathname)}
        </h1>
        <p className="text-xs capitalize text-muted-foreground">{today}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <SearchBox className="w-56 xl:w-72" />
        <BellLink count={counts.candidatures} />
        {showPublish && (
          <Link
            to="/entreprise/offres"
            search={{ nouveau: true }}
            className="press inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <Plus className="size-4" />
            Publier une offre
          </Link>
        )}
        <Link
          to="/entreprise/profil"
          className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-2.5 transition-colors hover:border-accent/50"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {profile.initials || "E"}
          </span>
          <span className="hidden max-w-32 truncate text-sm font-medium xl:block">{profile.name}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Link>
      </div>
    </header>
  );
}

function MobileBar({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const counts = useNavCounts();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-card/90 px-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          aria-label="Ouvrir le menu"
          className="press grid size-10 shrink-0 place-items-center rounded-full text-foreground hover:bg-muted"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold tracking-tight">
          {pageTitle(pathname)}
        </h1>
        <BellLink count={counts.candidatures} />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="animate-slide-in-left absolute left-0 top-0 flex h-full w-[84%] max-w-xs flex-col gap-6 bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <SearchBox />
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto pl-3">
              <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export function CompanyShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = pageTitle(pathname);

  useEffect(() => {
    document.title = `${title} — StageManager Entreprise`;
  }, [title]);

  return (
    <div className="flex h-dvh bg-canvas">
      <aside className="hidden w-[260px] shrink-0 flex-col gap-8 border-r bg-card py-5 lg:flex">
        <div className="px-6">
          <Brand />
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3">
          <SidebarNav pathname={pathname} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <TopBar pathname={pathname} />
        <MobileBar pathname={pathname} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div key={pathname} className="page-enter mx-auto w-full max-w-[1400px]">
            <ShellPageTitleProvider title={title}>{children}</ShellPageTitleProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
