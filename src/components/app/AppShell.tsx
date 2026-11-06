import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, Briefcase, ChevronsLeft, FileText, FolderOpen, GraduationCap, HelpCircle, LayoutDashboard, LogOut, Menu, Search, Settings, User, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useStore, fmtRel } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/offres", label: "Offres de stage", icon: Briefcase },
  { to: "/candidatures", label: "Mes candidatures", icon: FileText },
  { to: "/stage", label: "Mon stage", icon: GraduationCap },
  { to: "/documents", label: "Mes documents", icon: FolderOpen },
  { to: "/profil", label: "Mon profil", icon: User },
] as const;
const BOTTOM = [
  { to: "/parametres", label: "Paramètres", icon: Settings },
  { to: "/aide", label: "Aide et assistance", icon: HelpCircle },
] as const;

const TITLES: Record<string, string> = { "/": "Tableau de bord", "/offres": "Offres de stage", "/candidatures": "Mes candidatures", "/stage": "Mon stage", "/documents": "Mes documents", "/profil": "Mon profil", "/parametres": "Paramètres", "/aide": "Aide et assistance", "/notifications": "Notifications" };

function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">S</div>
      {!collapsed && <span className="font-semibold tracking-tight text-sidebar-accent-foreground">StageManager</span>}
    </div>
  );
}

function NavList({ collapsed, onNav }: { collapsed?: boolean; onNav?: () => void }) {
  const { pathname } = useLocation();
  const item = (n: (typeof NAV)[number] | (typeof BOTTOM)[number]) => {
    const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
    return (
      <Link key={n.to} to={n.to} onClick={onNav} title={collapsed ? n.label : undefined}
        className={cn("group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground", collapsed && "justify-center px-0")}>
        {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-sidebar-primary" />}
        <n.icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} />{!collapsed && n.label}
      </Link>
    );
  };
  return (
    <>
      <nav className="flex flex-1 flex-col gap-1">{NAV.map(item)}</nav>
      <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
        {BOTTOM.map(item)}
        <button onClick={() => toast.info("Déconnexion indisponible", { description: "L'authentification sera activée lors de la connexion au backend." })}
          className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground", collapsed && "justify-center px-0")}>
          <LogOut className="size-4" />{!collapsed && "Déconnexion"}
        </button>
      </div>
    </>
  );
}

function Notifications() {
  const { notifications, unread, markRead, markAllRead } = useStore();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3"><p className="text-sm font-semibold">Notifications</p>{unread > 0 && <button onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">Tout marquer comme lu</button>}</div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.slice(0, 6).map((n) => (
            <button key={n.id} onClick={() => markRead(n.id)} className={cn("flex w-full gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted", !n.read && "bg-accent-soft/50")}>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} />
              <span className="min-w-0"><span className="block text-sm font-medium">{n.title}</span><span className="block text-xs text-muted-foreground">{n.body}</span><span className="mt-1 block text-[11px] text-muted-foreground">{fmtRel(n.date)}</span></span>
            </button>
          ))}
        </div>
        <Link to="/notifications" className="block border-t px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted">Voir toutes les notifications</Link>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [q, setQ] = useState("");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile } = useStore();
  const title = TITLES[pathname] ?? (pathname.startsWith("/offres/") ? "Détail de l'offre" : "StageManager");
  const initials = `${profile.prenom[0] ?? ""}${profile.nom[0] ?? ""}`;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col gap-6 bg-sidebar p-3 text-sidebar-foreground transition-[width] duration-300 lg:flex", collapsed ? "w-[68px]" : "w-64")}>
        <div className={cn("flex items-center justify-between px-2 pt-2", collapsed && "flex-col gap-3 px-0")}>
          <Logo collapsed={collapsed} />
          <button onClick={() => setCollapsed(!collapsed)} aria-label="Réduire la barre latérale" className="rounded-md p-1 hover:bg-sidebar-accent"><ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} /></button>
        </div>
        <NavList collapsed={collapsed} />
      </aside>

      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobile(false)} />
          <aside className="page-enter relative flex h-full w-72 flex-col gap-6 bg-sidebar p-3 text-sidebar-foreground">
            <div className="flex items-center justify-between px-2 pt-2"><Logo /><button onClick={() => setMobile(false)} aria-label="Fermer le menu" className="rounded-md p-1 hover:bg-sidebar-accent"><X className="size-5" /></button></div>
            <NavList onNav={() => setMobile(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(true)} aria-label="Ouvrir le menu"><Menu className="size-5" /></Button>
          <h2 className="truncate font-semibold">{title}</h2>
          <form className="ml-auto hidden md:block" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/offres", search: { q } }); }}>
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un stage…" className="h-9 w-64 rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-ring/30" /></div>
          </form>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Notifications />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-md p-1 pr-2 transition-colors hover:bg-muted">
                {profile.photo ? <img src={profile.photo} alt="" className="size-8 rounded-full object-cover" /> : <span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{initials}</span>}
                <span className="hidden text-sm font-medium sm:block">{profile.prenom} {profile.nom}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate({ to: "/profil" })}><User className="size-4" />Mon profil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/parametres" })}><Settings className="size-4" />Paramètres</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="border-b bg-warning-soft px-4 py-1.5 text-center text-xs text-warning sm:px-6">Mode démonstration — toutes les données affichées sont fictives.</div>
        <main key={pathname} className="page-enter mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
