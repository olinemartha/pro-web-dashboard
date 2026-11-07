import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Briefcase,
  Building2,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Send,
  Settings,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShellPageTitleProvider } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/offres", label: "Offres de stage", icon: Briefcase },
  { href: "/candidatures", label: "Mes candidatures", icon: Send },
  { href: "/stage", label: "Mon stage", icon: FileText },
  { href: "/documents", label: "Mes documents", icon: FileText },
  { href: "/profil", label: "Mon profil", icon: User },
];

const NAV_FOOTER_ITEMS = [
  { href: "/parametres", label: "Paramètres", icon: Settings },
  { href: "/aide", label: "Aide et assistance", icon: HelpCircle },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Tableau de bord",
  "/offres": "Offres de stage",
  "/candidatures": "Mes candidatures",
  "/stage": "Mon stage",
  "/documents": "Mes documents",
  "/profil": "Mon profil",
  "/notifications": "Notifications",
  "/parametres": "Paramètres",
  "/aide": "Aide et assistance",
};

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              {active && <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-white" aria-hidden />}
              <item.icon className={cn("size-4 shrink-0", active && "text-white")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 pt-4">
        <Link
          to="/entreprise"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md border border-white/15 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Building2 className="size-4 shrink-0" />
          Espace entreprise
        </Link>
        {NAV_FOOTER_ITEMS.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(item.href)
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon
              className={cn(
                "size-4 shrink-0",
                pathname.startsWith(item.href) && "text-white"
              )}
            />
            {item.label}
          </Link>
        ))}
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

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-1">
        <span className="grid size-9 place-items-center rounded-lg bg-white text-lg font-bold text-primary">S</span>
        <span className="text-lg font-bold tracking-tight">StageManager</span>
      </div>
      <SidebarNav pathname={pathname} onNavigate={onNavigate} />
    </>
  );
}

function TopBar({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { notifications, profile } = useStore();
  const unread = notifications.filter((n) => !n.read).length;
  const initials = `${profile.prenom[0] ?? ""}${profile.nom[0] ?? ""}`.toUpperCase();
  const fullName = `${profile.prenom} ${profile.nom}`.trim() || "Utilisateur";
  const [q, setQ] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({ to: "/offres", search: { q } });
  };

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">{PAGE_TITLES[pathname] ?? "StageManager"}</h1>

      <div className="flex items-center gap-3 sm:gap-4">
        <form onSubmit={submitSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un stage..."
            className="h-9 w-56 rounded-md border bg-muted px-9 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-ring/20 lg:w-72"
          />
        </form>

        <Link
          to="/notifications"
          className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-primary">
            {initials || "U"}
          </span>
          <span className="hidden text-sm font-medium text-foreground sm:block">{fullName}</span>
        </div>
      </div>
    </header>
  );
}

function TopBarMobile({ pathname }: { pathname: string }) {
  const { notifications } = useStore();
  const unread = notifications.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);
  const title = PAGE_TITLES[pathname] ?? "StageManager";

  return (
    <>
      <header className="flex h-14 items-center justify-between gap-2 border-b border-border bg-background px-3">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Ouvrir le menu"
          className="size-10 shrink-0 px-0"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold tracking-tight text-foreground">
          {title}
        </p>
        <Link
          to="/notifications"
          className="relative grid size-10 shrink-0 place-items-center rounded-md text-muted-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-8 bg-primary p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-white text-lg font-bold text-primary">S</span>
                <span className="text-lg font-bold tracking-tight text-white">StageManager</span>
              </div>
              <button aria-label="Fermer le menu" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-md text-white/70 hover:bg-white/10">
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    document.title = `${PAGE_TITLES[pathname] ?? "StageManager"} — StageManager`;
  }, [pathname]);

  return (
    <div className="flex h-dvh bg-background">
      {/* Navigation latérale — bleu marine (Design Brief §3.1) — visible dès 768px */}
      <aside className="hidden md:flex w-64 flex-col bg-primary p-4">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Zone principale */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre supérieure desktop */}
        <div className="hidden md:block">
          <TopBar pathname={pathname} />
        </div>
        {/* Barre supérieure mobile (téléphone) */}
        <div className="md:hidden">
          <TopBarMobile pathname={pathname} />
        </div>

        <main className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-8">
          <ShellPageTitleProvider title={PAGE_TITLES[pathname] ?? null}>
            {children}
          </ShellPageTitleProvider>
        </main>
      </div>
    </div>
  );
}
