import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShellPageTitleProvider } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { useCompanyStore } from "@/lib/company-store";

const NAV_ITEMS = [
  { href: "/entreprise", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/entreprise/profil", label: "Mon profil entreprise", icon: Building2 },
  { href: "/entreprise/offres", label: "Mes offres", icon: Briefcase },
  { href: "/entreprise/candidatures", label: "Candidatures", icon: Send },
  { href: "/entreprise/entretiens", label: "Entretiens", icon: CalendarClock },
  { href: "/entreprise/stagiaires", label: "Mes stagiaires", icon: Users },
  { href: "/entreprise/services", label: "Services et besoins", icon: FileText },
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
  return PAGE_TITLES[pathname] ?? "Espace entreprise";
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-accent" aria-hidden />
              )}
              <item.icon className={cn("size-4 shrink-0", active && "text-accent")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 pt-4">
        <Link
          to="/entreprise/parametres"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive(pathname, "/entreprise/parametres")
              ? "bg-white/10 text-white"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className={cn("size-4 shrink-0", isActive(pathname, "/entreprise/parametres") && "text-accent")} />
          Paramètres
        </Link>
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md border border-white/15 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <GraduationCap className="size-4 shrink-0" />
          Espace étudiant
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4 shrink-0" />
          Déconnexion
        </button>
      </div>
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-lg bg-accent text-lg font-semibold text-primary">
        S
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold leading-tight tracking-tight text-white">
          StageManager
        </p>
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-accent">
          Espace entreprise
        </p>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="px-1">
        <Brand />
      </div>
      <SidebarNav pathname={pathname} onNavigate={onNavigate} />
    </>
  );
}

function TopBar({ pathname }: { pathname: string }) {
  const router = useRouter();
  const navigate = useNavigate();
  const { profile, candidates } = useCompanyStore();
  const [query, setQuery] = useState("");
  const toExamine = candidates.filter((c) => c.status === "en_attente" || c.status === "examen").length;

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
      <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-foreground">
        {pageTitle(pathname)}
      </h1>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!query.trim()) {
              router.navigate({ to: "/entreprise/candidatures" });
              return;
            }
            navigate({
              to: "/entreprise/candidatures",
              search: { q: query.trim() },
            });
            setQuery("");
          }}
          role="search"
          className="relative hidden md:block"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une candidature..."
            aria-label="Rechercher une candidature"
            className="h-9 w-56 rounded-md border bg-muted px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-ring/20 lg:w-64"
          />
        </form>

        <Link
          to="/entreprise/candidatures"
          className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Candidatures à examiner"
        >
          <Bell className="size-5" />
          {toExamine > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-xs font-semibold leading-none tabular-nums text-destructive-foreground">
              {toExamine}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2.5 rounded-full border bg-card py-1 pl-1 pr-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {profile.initials || "E"}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="max-w-36 truncate text-sm font-medium leading-snug text-foreground">
              {profile.name}
            </p>
            <p className="text-xs leading-4 text-muted-foreground">Compte entreprise</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileBar({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const { candidates } = useCompanyStore();
  const toExamine = candidates.filter((c) => c.status === "en_attente" || c.status === "examen").length;

  return (
    <>
      <header className="flex h-14 items-center justify-between gap-2 border-b border-border bg-background px-3 md:hidden">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Ouvrir le menu"
          className="size-10 shrink-0 px-0"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold tracking-tight">
          {pageTitle(pathname)}
        </h1>
        <Link
          to="/entreprise/candidatures"
          className="relative grid size-10 shrink-0 place-items-center rounded-md text-muted-foreground"
          aria-label="Candidatures à examiner"
        >
          <Bell className="size-5" />
          {toExamine > 0 && (
            <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-xs font-semibold leading-none tabular-nums text-destructive-foreground">
              {toExamine}
            </span>
          )}
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-8 bg-primary p-6">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-white/70 hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
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
    <div className="flex h-dvh bg-background">
      <aside className="hidden w-64 flex-col bg-primary p-4 md:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden md:block">
          <TopBar pathname={pathname} />
        </div>
        <MobileBar pathname={pathname} />

        <main className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-8">
          <ShellPageTitleProvider title={title}>{children}</ShellPageTitleProvider>
        </main>
      </div>
    </div>
  );
}
