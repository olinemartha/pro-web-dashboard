import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClass } from "@/components/company/ui";

/* ------------------------------------------------------------------ */
/* Outils de dates (AAAA-MM-JJ, heure locale)                          */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function toIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fromIso(value: string) {
  return new Date(`${value}T00:00:00`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function monthLabel(date: Date) {
  const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function displayLabel(value: string) {
  return fromIso(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/** Semaines du mois affiché, du lundi au dimanche (5 ou 6 lignes). */
function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const end = addDays(last, 6 - ((last.getDay() + 6) % 7));
  const days: Date[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
  return days;
}

/* ------------------------------------------------------------------ */
/* Calendrier                                                          */
/* ------------------------------------------------------------------ */

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
};

/**
 * Champ date : un bouton qui ouvre un calendrier épuré (mois, flèches,
 * jours en cercles). Jour choisi en bleu roi plein, aujourd'hui en gris
 * clair avec un point. Clavier : flèches, Page préc./suiv., Entrée, Échap.
 */
export function DatePicker({
  id,
  value,
  onChange,
  min,
  placeholder = "Choisir une date",
  ...aria
}: DatePickerProps) {
  const today = toIso(new Date());
  const [open, setOpen] = React.useState(false);
  const [above, setAbove] = React.useState(false);
  const [month, setMonth] = React.useState(() => fromIso(value || min || today));
  const [focused, setFocused] = React.useState(value || min || today);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const dialogId = React.useId();

  const isDisabled = (iso: string) => Boolean(min && iso < min);

  const openPicker = () => {
    const start = value || (min && min > today ? min : today);
    setMonth(fromIso(start));
    setFocused(start);
    // S'ouvre vers le haut si la place manque en dessous.
    const rect = triggerRef.current?.getBoundingClientRect();
    setAbove(Boolean(rect && window.innerHeight - rect.bottom < 360 && rect.top > 360));
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const select = (iso: string) => {
    if (isDisabled(iso)) return;
    onChange(iso);
    close();
  };

  // Clic à l'extérieur : ferme sans voler le focus.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Le focus suit le jour actif.
  React.useEffect(() => {
    if (!open) return;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focused}"]`)?.focus({ preventScroll: true });
  }, [open, focused, month]);

  const moveFocus = (iso: string) => {
    const date = fromIso(iso);
    setFocused(iso);
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const shiftMonth = (delta: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    setMonth(next);
    const day = Math.min(fromIso(focused).getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate());
    setFocused(toIso(new Date(next.getFullYear(), next.getMonth(), day)));
  };

  const onGridKey = (event: React.KeyboardEvent) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in steps) {
      event.preventDefault();
      moveFocus(toIso(addDays(fromIso(focused), steps[event.key])));
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      shiftMonth(event.key === "PageUp" ? -1 : 1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const date = fromIso(focused);
      const offset = (date.getDay() + 6) % 7;
      moveFocus(toIso(addDays(date, event.key === "Home" ? -offset : 6 - offset)));
    }
  };

  const days = monthGrid(month);
  const minMonth = min ? fromIso(min) : null;
  const prevDisabled = Boolean(
    minMonth && month.getFullYear() * 12 + month.getMonth() <= minMonth.getFullYear() * 12 + minMonth.getMonth()
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        {...aria}
        onClick={() => (open ? close() : openPicker())}
        className={cn(
          inputClass,
          "flex items-center justify-between gap-2 text-left",
          !value && "text-muted-foreground",
          open && "border-accent ring-[3px] ring-ring/15"
        )}
      >
        <span className="truncate">{value ? displayLabel(value) : placeholder}</span>
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-label="Choisir une date"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              // Ferme le calendrier seulement, pas la fenêtre qui le contient.
              event.stopPropagation();
              close();
            }
          }}
          className={cn(
            "animate-scale-in absolute left-0 z-30 w-[292px] rounded-2xl border bg-popover p-4 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.22)]",
            above ? "bottom-full mb-2 origin-bottom-left" : "top-full mt-2 origin-top-left"
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              disabled={prevDisabled}
              aria-label="Mois précédent"
              className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-semibold tracking-tight" aria-live="polite">
              {monthLabel(month)}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Mois suivant"
              className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div ref={gridRef} role="grid" onKeyDown={onGridKey} className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS.map((day) => (
              <span key={day} role="columnheader" className="pb-1.5 text-xs font-semibold text-foreground">
                {day}
              </span>
            ))}
            {days.map((day) => {
              const iso = toIso(day);
              const outside = day.getMonth() !== month.getMonth();
              const selected = iso === value;
              const isToday = iso === today;
              const disabled = isDisabled(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  data-iso={iso}
                  tabIndex={iso === focused ? 0 : -1}
                  aria-selected={selected}
                  aria-disabled={disabled || undefined}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  onClick={() => select(iso)}
                  className={cn(
                    "relative mx-auto grid size-9 place-items-center rounded-full text-[13px] tabular-nums transition-colors duration-150 focus-visible:outline-offset-0",
                    selected
                      ? "bg-primary font-semibold text-primary-foreground"
                      : isToday
                        ? "bg-muted font-semibold text-foreground"
                        : outside
                          ? "text-muted-foreground/50"
                          : "text-foreground",
                    !selected && !disabled && "hover:bg-primary-soft hover:text-primary",
                    disabled && "cursor-not-allowed text-muted-foreground/35 hover:bg-transparent"
                  )}
                >
                  {day.getDate()}
                  {isToday && (
                    <span
                      className={cn(
                        "absolute bottom-1 size-1 rounded-full",
                        selected ? "bg-primary-foreground" : "bg-foreground"
                      )}
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Le composant Field lui transmet l'état d'erreur et la description.
(DatePicker as unknown as { acceptsFieldProps: boolean }).acceptsFieldProps = true;
