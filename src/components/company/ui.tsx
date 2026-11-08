import * as React from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type Tone = "muted" | "primary" | "accent" | "success" | "warning" | "destructive";

const TONE_CLASSES: Record<Tone, string> = {
  muted: "border-border bg-muted text-muted-foreground",
  primary: "border-primary/30 bg-primary-soft text-primary",
  accent: "border-accent/30 bg-accent-soft text-primary",
  success: "border-success/30 bg-success-soft text-success-ink",
  warning: "border-warning/30 bg-warning-soft text-warning",
  destructive: "border-destructive/30 bg-destructive-soft text-destructive-ink",
};

export function Badge({
  label,
  tone = "muted",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TONE_CLASSES[tone],
        className
      )}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Indicateurs                                                         */
/* ------------------------------------------------------------------ */

export type KpiTone = "primary" | "accent" | "success" | "warning" | "muted" | "destructive";

export { KpiCard } from "@/components/ui/kpi-card";

/* ------------------------------------------------------------------ */
/* Entrée de page                                                      */
/* ------------------------------------------------------------------ */

/**
 * Le titre de page vit dans la barre supérieure du shell (rôle Title 18 px).
 * L'entrée de page ne répète donc que l'intention et l'action principale.
 */
export function PageIntro({ desc, action }: { desc: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-[68ch] text-pretty text-sm leading-relaxed text-muted-foreground">{desc}</p>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Libellé de section : 12 px / 600 / capitales. Il se distingue des
 * métadonnées par la graisse et les capitales, jamais par une taille de plus.
 */
export function SectionLabel({
  as: Tag = "h2",
  className,
  children,
}: {
  as?: "h2" | "h3" | "h4";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-muted-foreground",
        className
      )}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Champs de formulaire                                                */
/* ------------------------------------------------------------------ */

/**
 * 16 px sur téléphone : en dessous, Safari iOS zoome le champ au focus.
 * La densité revient à 14 px dès 640 px, conformément au Design Brief.
 */
export const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

export const textareaClass = cn(inputClass, "h-auto min-h-[90px] py-2 leading-relaxed");

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium leading-4 text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs font-medium leading-relaxed text-destructive">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fenêtres : socle commun                                             */
/* ------------------------------------------------------------------ */

/**
 * Les fenêtres sont rendues dans <body> (portail) : elles couvrent tout
 * l'écran, barre latérale comprise, quel que soit l'endroit où elles sont
 * déclarées. Échap ferme, et la page derrière ne défile plus.
 */
function useOverlayBehaviour(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);
}

/** Voile flouté : l'arrière-plan reste lisible mais s'efface doucement. */
function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="animate-fade-in absolute inset-0 bg-slate-900/25 backdrop-blur-[6px] backdrop-saturate-150"
      onClick={onClick}
      aria-hidden
    />
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Fermer"
      onClick={onClose}
      className="press grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <X className="size-4" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Modale                                                              */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  wide,
  icon: Icon,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  useOverlayBehaviour(open, onClose);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <Backdrop onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-scale-in relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border bg-card shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] sm:max-h-[86dvh] sm:rounded-2xl",
          wide ? "sm:max-w-[720px]" : "sm:max-w-lg"
        )}
      >
        {/* Poignée sur téléphone */}
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden />
        <div className="flex items-start gap-3.5 px-5 pb-4 pt-4 sm:px-6 sm:pt-5">
          {Icon && (
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center text-muted-foreground">
              <Icon className="size-[18px]" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-pretty text-lg font-semibold leading-snug tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          <CloseButton onClose={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto border-t px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t bg-muted/30 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6 [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}


/* ------------------------------------------------------------------ */
/* Divers                                                              */
/* ------------------------------------------------------------------ */

export function AvatarInitials({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-primary",
        className
      )}
    >
      {initials || "?"}
    </span>
  );
}

export function EmptyBlock({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-dashed border-accent/40 bg-accent-soft/30 p-8 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-[60ch] text-pretty text-sm leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panneau latéral                                                     */
/* ------------------------------------------------------------------ */

export function Drawer({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useOverlayBehaviour(open, onClose);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <Backdrop onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full flex-col border-l bg-background shadow-2xl sm:max-w-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-pretty text-lg font-semibold leading-snug tracking-tight">{title}</h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/* Menu d'actions secondaires                                          */
/* ------------------------------------------------------------------ */

export function ActionMenu({
  label = "Plus d'actions",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="animate-scale-in absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
            onClick={() => setOpen(false)}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onSelect,
  destructive,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted",
        destructive && "text-destructive-ink hover:bg-destructive-soft"
      )}
    >
      {children}
    </button>
  );
}
