import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarClock,
  CornerDownLeft,
  FileText,
  Inbox,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyStore } from "@/lib/company-store";

const DAY = 86_400_000;

function relativeDay(value: string) {
  const days = Math.round((Date.now() - new Date(`${value}T12:00:00`).getTime()) / DAY);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days === -1) return "demain";
  if (days < 0) return `dans ${-days} j`;
  if (days < 7) return `il y a ${days} j`;
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function useOutside(ref: React.RefObject<HTMLElement>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, onClose]);
}

/* ------------------------------------------------------------------ */
/* Recherche                                                           */
/* ------------------------------------------------------------------ */

type Result = {
  id: string;
  group: "Candidats" | "Offres" | "Raccourcis";
  label: string;
  meta: string;
  icon?: React.ComponentType<{ className?: string }>;
  initials?: string;
  go: () => void;
};

/**
 * Recherche « palette » : au repos, une pastille discrète ; au focus, elle
 * s'élargit en douceur et propose des résultats en direct (candidats, offres)
 * ou des raccourcis. Ctrl/⌘ + K l'ouvre depuis n'importe où.
 */
export function SearchCommand({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { candidates, offers } = useCompanyStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setOpen(false);
    inputRef.current?.blur();
  };
  useOutside(wrapRef, open, close);

  useEffect(() => {
    if (compact) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compact]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const after = () => {
      setQuery("");
      close();
    };
    if (!q) {
      return [
        {
          id: "r-publier",
          group: "Raccourcis",
          label: "Publier une offre",
          meta: "Créer une nouvelle offre de stage",
          icon: Plus,
          go: () => {
            navigate({ to: "/entreprise/offres", search: { nouveau: true } });
            after();
          },
        },
        {
          id: "r-candidatures",
          group: "Raccourcis",
          label: "Candidatures à examiner",
          meta: "Ouvrir la liste des candidatures",
          icon: Inbox,
          go: () => {
            navigate({ to: "/entreprise/candidatures" });
            after();
          },
        },
        {
          id: "r-entretiens",
          group: "Raccourcis",
          label: "Planifier un entretien",
          meta: "Ouvrir l'agenda des entretiens",
          icon: CalendarClock,
          go: () => {
            navigate({ to: "/entreprise/entretiens" });
            after();
          },
        },
      ];
    }
    const offerTitle = (id: string) => offers.find((o) => o.id === id)?.title ?? "";
    const people: Result[] = candidates
      .filter((c) => `${c.name} ${c.filiere} ${c.universite}`.toLowerCase().includes(q))
      .slice(0, 4)
      .map((c) => ({
        id: `c-${c.id}`,
        group: "Candidats",
        label: c.name,
        meta: `${c.filiere} · ${offerTitle(c.offerId)}`,
        initials: c.initials,
        go: () => {
          navigate({ to: "/entreprise/candidatures", search: { q: c.name } });
          after();
        },
      }));
    const jobs: Result[] = offers
      .filter((o) => `${o.title} ${o.department}`.toLowerCase().includes(q))
      .slice(0, 3)
      .map((o) => ({
        id: `o-${o.id}`,
        group: "Offres",
        label: o.title,
        meta: o.department,
        icon: Briefcase,
        go: () => {
          navigate({ to: "/entreprise/offres" });
          after();
        },
      }));
    return [...people, ...jobs];
  }, [query, candidates, offers, navigate]);

  useEffect(() => setCursor(0), [query]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => Math.min(results.length - 1, value + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => Math.max(0, value - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (results[cursor]) results[cursor].go();
      else if (query.trim()) {
        navigate({ to: "/entreprise/candidatures", search: { q: query.trim() } });
        setQuery("");
        close();
      }
    }
  };

  const groups = ["Raccourcis", "Candidats", "Offres"] as const;

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={cn(
          "relative flex h-10 items-center rounded-xl border bg-card transition-[width,box-shadow,border-color] duration-300 [transition-timing-function:var(--ease-soft)]",
          compact ? "w-full" : open ? "w-[min(440px,40vw)]" : "w-60 xl:w-72",
          open ? "border-accent shadow-[0_0_0_4px_hsl(var(--accent)/0.15)]" : "hover:border-foreground/20"
        )}
      >
        <Search
          className={cn(
            "pointer-events-none absolute left-3 size-4 transition-colors duration-200",
            open ? "text-primary" : "text-muted-foreground"
          )}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher un candidat, une offre…"
          aria-label="Rechercher"
          aria-expanded={open}
          aria-controls="search-results"
          role="combobox"
          className="h-full w-full rounded-xl bg-transparent pl-9 pr-16 text-sm outline-none placeholder:text-muted-foreground"
        />
        {query ? (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          !compact && (
            <kbd className="pointer-events-none absolute right-2.5 hidden rounded-md border bg-muted/60 px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline-block">
              Ctrl K
            </kbd>
          )
        )}
      </div>

      {open && (
        <div
          id="search-results"
          role="listbox"
          className="animate-scale-in absolute left-0 right-0 top-full z-50 mt-2 origin-top overflow-hidden rounded-xl border bg-popover shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)]"
        >
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium">Aucun résultat pour « {query} »</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Essayez un nom, une filière ou un titre d'offre.</p>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto p-1.5">
              {groups.map((group) => {
                const items = results.filter((r) => r.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group} className="py-1">
                    <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
                      {group}
                    </p>
                    {items.map((item) => {
                      const index = results.indexOf(item);
                      const active = index === cursor;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setCursor(index)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={item.go}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-100",
                            active ? "bg-muted" : "hover:bg-muted/60"
                          )}
                        >
                          {item.initials ? (
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
                              {item.initials}
                            </span>
                          ) : (
                            item.icon && (
                              <span className="grid size-8 shrink-0 place-items-center rounded-lg border bg-card text-muted-foreground">
                                <item.icon className="size-4" />
                              </span>
                            )
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{item.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">{item.meta}</span>
                          </span>
                          {active && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-3 border-t bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            <span>
              <kbd className="font-sans font-medium">↑ ↓</kbd> naviguer
            </span>
            <span>
              <kbd className="font-sans font-medium">Entrée</kbd> ouvrir
            </span>
            <span>
              <kbd className="font-sans font-medium">Échap</kbd> fermer
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

type Notice = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  meta: string;
  when: string;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
};

/** Cloche : un point qui pulse doucement, et un panneau des événements à traiter. */
export function NotificationBell({ align = "right" }: { align?: "right" | "left" }) {
  const { candidates, offers, interns, interviews } = useCompanyStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, open, () => setOpen(false));

  const notices = useMemo<Notice[]>(() => {
    const offerTitle = (id: string) => offers.find((o) => o.id === id)?.title ?? "";
    const name = (id: string) => candidates.find((c) => c.id === id)?.name ?? "Candidat";
    const today = new Date().toISOString().split("T")[0];
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
    return list.slice(0, 6);
  }, [candidates, offers, interns, interviews]);

  const count = notices.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={count ? `Notifications : ${count} à consulter` : "Notifications"}
        aria-expanded={open}
        className={cn(
          "press relative grid size-10 shrink-0 place-items-center rounded-xl border bg-card text-muted-foreground transition-all duration-200 hover:border-foreground/20 hover:text-foreground",
          open && "border-foreground/20 text-foreground"
        )}
      >
        <Bell className={cn("size-[18px] transition-transform duration-300", open && "rotate-[14deg]")} />
        {count > 0 && (
          <span className="absolute right-2 top-2 flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-destructive ring-2 ring-card" />
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "animate-scale-in absolute top-full z-50 mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-xl border bg-popover shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)]",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {count > 0 && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {count} nouvelle{count > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {count === 0 ? (
            <p className="border-t px-4 py-8 text-center text-sm text-muted-foreground">Vous êtes à jour.</p>
          ) : (
            <ul className="max-h-[360px] divide-y overflow-y-auto border-t">
              {notices.map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.to}
                    params={n.params as never}
                    search={n.search as never}
                    onClick={() => setOpen(false)}
                    className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border bg-card text-muted-foreground group-hover:text-foreground">
                      <n.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-snug">{n.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{n.meta}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{n.when}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/entreprise/candidatures"
            onClick={() => setOpen(false)}
            className="group flex items-center justify-center gap-1.5 border-t bg-muted/30 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-foreground hover:text-background"
          >
            Voir toutes les candidatures
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
