import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Bell, Briefcase, CalendarClock, FileText, Inbox, Search, Sparkles, X } from "lucide-react";
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
  label: string;
  meta: string;
  initials?: string;
  go: () => void;
};

/**
 * Recherche simple : un champ sobre qui s'élargit légèrement au focus.
 * Les résultats n'apparaissent qu'une fois la saisie commencée.
 */
export function SearchCommand({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { candidates, offers } = useCompanyStore();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const typed = query.trim().length > 0;
  const open = focused && typed;

  const reset = () => {
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
  };
  useOutside(wrapRef, focused, () => setFocused(false));

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const offerTitle = (id: string) => offers.find((o) => o.id === id)?.title ?? "";
    const people: Result[] = candidates
      .filter((c) => `${c.name} ${c.filiere} ${c.universite}`.toLowerCase().includes(q))
      .slice(0, 4)
      .map((c) => ({
        id: `c-${c.id}`,
        label: c.name,
        meta: `${c.filiere} · ${offerTitle(c.offerId)}`,
        initials: c.initials,
        go: () => {
          navigate({ to: "/entreprise/candidatures", search: { q: c.name } });
          reset();
        },
      }));
    const jobs: Result[] = offers
      .filter((o) => `${o.title} ${o.department}`.toLowerCase().includes(q))
      .slice(0, 3)
      .map((o) => ({
        id: `o-${o.id}`,
        label: o.title,
        meta: o.department,
        go: () => {
          navigate({ to: "/entreprise/offres" });
          reset();
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
      else if (typed) {
        navigate({ to: "/entreprise/candidatures", search: { q: query.trim() } });
        reset();
      }
    } else if (event.key === "Escape") {
      reset();
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={cn(
          "relative flex h-10 items-center rounded-full border bg-card/70 transition-all duration-300 [transition-timing-function:var(--ease-soft)]",
          compact ? "w-full" : focused ? "w-80" : "w-56",
          focused ? "border-accent/60 bg-card shadow-[0_0_0_3px_hsl(var(--accent)/0.12)]" : "border-border/80 hover:bg-card"
        )}
      >
        <Search
          className={cn(
            "pointer-events-none absolute left-3.5 size-4 transition-colors duration-200",
            focused ? "text-accent" : "text-muted-foreground"
          )}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher"
          aria-label="Rechercher"
          aria-expanded={open}
          aria-controls="search-results"
          aria-activedescendant={open && results[cursor] ? `search-option-${results[cursor].id}` : undefined}
          aria-autocomplete="list"
          role="combobox"
          className="h-full w-full rounded-full bg-transparent pl-10 pr-9 text-sm outline-none placeholder:text-muted-foreground"
        />
        {typed && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="animate-fade-in absolute right-2 grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          id="search-results"
          role="listbox"
          className="animate-scale-in absolute left-0 right-0 top-full z-50 mt-2 origin-top overflow-hidden rounded-2xl border bg-popover/95 p-1.5 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.22)] backdrop-blur-xl"
        >
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Aucun résultat</p>
          ) : (
            results.map((item, index) => {
              const active = index === cursor;
              return (
                <button
                  key={item.id}
                  id={`search-option-${item.id}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setCursor(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={item.go}
                  style={{ animationDelay: `${index * 35}ms` }}
                  className={cn(
                    "search-item group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-100",
                    active ? "bg-muted" : "hover:bg-muted/60"
                  )}
                >
                  {item.initials ? (
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
                      {item.initials}
                    </span>
                  ) : (
                    <Briefcase className="nav-icon nav-icon--lift mx-2 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.meta}</span>
                  </span>
                </button>
              );
            })
          )}
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

/** Cloche translucide et discrète ; le panneau liste ce qui demande une attention. */
export function NotificationBell({ align = "right" }: { align?: "right" | "left" }) {
  const { candidates, offers, interns, interviews } = useCompanyStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, open, () => setOpen(false));

  const notices = useMemo<Notice[]>(() => {
    const offerTitle = (id: string) => offers.find((o) => o.id === id)?.title ?? "";
    const name = (id: string) => candidates.find((c) => c.id === id)?.name ?? "Candidat";
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

  const count = notices.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={count ? `Notifications : ${count} à consulter` : "Notifications"}
        aria-expanded={open}
        className={cn(
          "press group relative grid size-10 shrink-0 place-items-center rounded-full bg-card/60 text-muted-foreground ring-1 ring-inset ring-border/70 backdrop-blur-md transition-all duration-200 hover:bg-card hover:text-foreground hover:ring-accent/40",
          open && "bg-card text-foreground ring-accent/40"
        )}
      >
        {/* Au survol, la cloche sonne : un balancement amorti depuis son attache. */}
        <Bell className="bell-ring size-[18px]" strokeWidth={1.75} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none tabular-nums text-primary-foreground ring-2 ring-canvas">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "animate-scale-in absolute top-full z-50 mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border bg-popover/90 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.22)] backdrop-blur-xl",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {count > 0 && <span className="text-xs text-muted-foreground">{count} à consulter</span>}
          </div>
          {count === 0 ? (
            <p className="border-t px-4 py-8 text-center text-sm text-muted-foreground">Vous êtes à jour.</p>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto border-t p-1.5">
              {notices.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.to}
                    params={n.params as never}
                    search={n.search as never}
                    onClick={() => setOpen(false)}
                    className="group flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-muted/60"
                  >
                    <n.icon className="nav-icon nav-icon--pop mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
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
            className="group flex items-center justify-center gap-1.5 border-t px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Voir toutes les candidatures
            <ArrowRight className="size-3.5 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none" />
          </Link>
        </div>
      )}
    </div>
  );
}
