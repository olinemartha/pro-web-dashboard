import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bell, Briefcase, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Recherche et cloche de notifications communes aux espaces. Chaque espace
 * fournit ses données ; l'apparence et le comportement restent identiques.
 */

type Icon = React.ComponentType<{ className?: string }>;

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

export type SearchTarget = {
  id: string;
  label: string;
  meta: string;
  initials?: string;
  icon?: Icon;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
};

/**
 * Champ sobre qui s'élargit au focus ; les résultats n'apparaissent qu'une
 * fois la saisie commencée. Entrée sans résultat : `fallback`.
 */
export function SearchBox({
  compact = false,
  placeholder = "Rechercher",
  useResults,
  fallback,
}: {
  compact?: boolean;
  placeholder?: string;
  /** Hook : résultats pour la saisie en cours. */
  useResults: (query: string) => SearchTarget[];
  fallback?: (query: string) => { to: string; search?: Record<string, unknown> };
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useResults(query.trim().toLowerCase());

  const typed = query.trim().length > 0;
  const open = focused && typed;

  const reset = () => {
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
  };
  useOutside(wrapRef, focused, () => setFocused(false));
  useEffect(() => setCursor(0), [query]);

  const go = (target: SearchTarget) => {
    navigate({ to: target.to, params: target.params as never, search: target.search as never });
    reset();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => Math.min(results.length - 1, value + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => Math.max(0, value - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (results[cursor]) go(results[cursor]);
      else if (typed && fallback) {
        const target = fallback(query.trim());
        navigate({ to: target.to, search: target.search as never });
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
          placeholder={placeholder}
          aria-label={placeholder}
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
          className="animate-scale-in absolute left-0 right-0 top-full z-50 mt-2 origin-top overflow-hidden rounded-2xl border bg-popover p-1.5 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.22)]"
        >
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Aucun résultat</p>
          ) : (
            results.map((item, index) => {
              const active = index === cursor;
              const ItemIcon = item.icon ?? Briefcase;
              return (
                <button
                  key={item.id}
                  id={`search-option-${item.id}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setCursor(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => go(item)}
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
                    <ItemIcon className="nav-icon nav-icon--lift mx-2 size-4 shrink-0 text-muted-foreground" />
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

export type Notice = {
  id: string;
  icon: Icon;
  title: string;
  meta: string;
  when: string;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
};

/** Cloche translucide et discrète ; le panneau liste les notifications, non lues d'abord. */
export function NoticeBell({
  notices,
  isRead,
  markRead,
  footer,
  align = "right",
}: {
  notices: Notice[];
  isRead: (id: string) => boolean;
  markRead: (ids: string[]) => void;
  footer: { to: string; label: string };
  align?: "right" | "left";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, open, () => setOpen(false));

  const sorted = [...notices.filter((n) => !isRead(n.id)), ...notices.filter((n) => isRead(n.id))];
  const count = notices.filter((n) => !isRead(n.id)).length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={count ? `Notifications : ${count} non lue${count > 1 ? "s" : ""}` : "Notifications"}
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
            "animate-scale-in absolute top-full z-50 mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border bg-popover shadow-[0_16px_40px_-12px_rgba(15,23,42,0.22)]",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              Notifications
              {count > 0 && (
                <span className="whitespace-nowrap rounded-full bg-primary-soft px-1.5 py-px text-[11px] font-semibold tabular-nums text-primary">
                  {count} non lue{count > 1 ? "s" : ""}
                </span>
              )}
            </p>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markRead(notices.map((n) => n.id))}
                className="-mr-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          {notices.length === 0 ? (
            <p className="border-t px-4 py-8 text-center text-sm text-muted-foreground">Vous êtes à jour.</p>
          ) : (
            <ul className="space-y-0.5 border-t p-1.5">
              {sorted.slice(0, 8).map((n) => {
                const read = isRead(n.id);
                return (
                  <li key={n.id}>
                    <Link
                      to={n.to}
                      params={n.params as never}
                      search={n.search as never}
                      onClick={() => {
                        markRead([n.id]);
                        setOpen(false);
                      }}
                      className={cn(
                        "group relative flex items-start gap-3 rounded-xl py-2.5 pl-2.5 pr-6 transition-colors",
                        read ? "hover:bg-muted/60" : "bg-primary-soft/50 hover:bg-primary-soft"
                      )}
                    >
                      <n.icon
                        className={cn(
                          "nav-icon nav-icon--pop mt-0.5 size-4 shrink-0 transition-colors",
                          read ? "text-muted-foreground/70 group-hover:text-muted-foreground" : "text-primary"
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        {!read && <span className="sr-only">Non lue : </span>}
                        <span className={cn("block text-[13px] leading-snug", read ? "font-normal text-muted-foreground" : "font-semibold text-foreground")}>
                          {n.title}
                        </span>
                        <span className={cn("block truncate text-xs", read ? "text-muted-foreground/80" : "text-muted-foreground")}>{n.meta}</span>
                      </span>
                      <span className={cn("shrink-0 text-[11px]", read ? "text-muted-foreground/80" : "font-medium text-primary")}>{n.when}</span>
                      {!read && <span className="absolute right-2.5 top-[15px] size-2 rounded-full bg-accent" aria-hidden />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            to={footer.to}
            onClick={() => setOpen(false)}
            className="group flex items-center justify-center gap-1.5 border-t px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {footer.label}
            <ArrowRight className="size-3.5 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none" />
          </Link>
        </div>
      )}
    </div>
  );
}
