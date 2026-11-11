import * as React from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Clock, MoreHorizontal, Search, Sparkles, TrendingUp, X } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import type { CandidateStatus } from "@/lib/company-data";

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
  dot,
  className,
}: {
  label: string;
  tone?: Tone;
  /** Pastille de couleur du pipeline, devant le libellé (distingue les statuts de même ton). */
  dot?: CandidateStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TONE_CLASSES[tone],
        className
      )}
    >
      {dot && <StatusDot status={dot} className="size-1.5" />}
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Signature « système expert »                                        */
/* ------------------------------------------------------------------ */

/**
 * Badge des recommandations du système expert, le même dans les deux espaces :
 * étincelle qui scintille, reflet qui traverse le badge (index.css, .expert-badge).
 */
export function ExpertBadge({
  label = "Recommandé par le système expert",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "expert-badge inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/25 px-2.5 py-0.5 text-[11px] font-semibold text-primary",
        className
      )}
    >
      <Sparkles className="expert-sparkle size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Jauge des règles satisfaites : une case par règle, pleines en bleu (en vert si toutes). */
export function RuleMeter({
  met,
  total,
  className,
  showLabel = true,
}: {
  met: number;
  total: number;
  className?: string;
  showLabel?: boolean;
}) {
  const all = met === total;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn("animate-grow-x h-1.5 w-3 rounded-full", index < met ? (all ? "bg-success" : "bg-primary") : "bg-border")}
            style={{ ["--delay" as string]: `${200 + index * 80}ms` }}
          />
        ))}
      </span>
      {showLabel && (
        <span className={cn("whitespace-nowrap text-xs font-semibold tabular-nums", all ? "text-success-ink" : "text-primary")}>
          {met}/{total} règles
        </span>
      )}
    </span>
  );
}

/** Carte d'un élément recommandé : filet bleu et haut glacier (index.css, .expert-card). */
export const EXPERT_CARD = "expert-card";

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
  "h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground outline-none transition placeholder:text-muted-foreground hover:border-foreground/25 focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-ring/15 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-destructive/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

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
  // Le champ natif enfant reçoit l'état d'erreur et le lien vers son message.
  const messageId = htmlFor ? `${htmlFor}-${error ? "error" : "hint"}` : undefined;
  const control =
    htmlFor &&
    React.isValidElement(children) &&
    (["input", "select", "textarea"].includes(children.type as string) ||
      children.type === Select ||
      Boolean((children.type as { acceptsFieldProps?: boolean }).acceptsFieldProps))
      ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error || hint ? messageId : undefined,
          "aria-required": required || undefined,
        })
      : children;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium leading-4 text-foreground">
        {label}
        {/* Le rouge est réservé aux erreurs : l'astérisque reste neutre. */}
        {required && (
          <span className="ml-0.5 text-muted-foreground" aria-hidden>
            *
          </span>
        )}
      </label>
      {control}
      {hint && !error && (
        <p id={messageId} className="text-pretty text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={messageId} className="text-xs font-medium leading-relaxed text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Liste déroulante native habillée : chevron au trait des icônes et texte
 * gris tant qu'aucune option n'est choisie (le placeholder).
 */
export function Select({
  className,
  value,
  placeholder,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }) {
  return (
    <div className="relative">
      <select
        {...props}
        value={value}
        className={cn(inputClass, "cursor-pointer appearance-none pr-9", !value && "text-muted-foreground", className)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
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
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useOverlayBehaviour(
  open: boolean,
  onClose: () => void,
  panelRef?: React.RefObject<HTMLElement>
) {
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  React.useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const panel = panelRef?.current ?? null;

    // Focus initial : le champ marqué, sinon le premier champ, sinon la fenêtre.
    if (panel) {
      const first =
        panel.querySelector<HTMLElement>("[data-autofocus]") ??
        panel.querySelector<HTMLElement>(
          "input:not([disabled]), textarea:not([disabled]), select:not([disabled])"
        );
      (first ?? panel).focus({ preventScroll: true });
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return closeRef.current();
      if (event.key !== "Tab" || !panel) return;
      // Le focus reste dans la fenêtre : Tab boucle du dernier au premier élément.
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null
      );
      if (items.length === 0) return;
      const head = items[0];
      const tail = items[items.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === head || current === panel || !panel.contains(current))) {
        event.preventDefault();
        tail.focus();
      } else if (!event.shiftKey && (current === tail || !panel.contains(current))) {
        event.preventDefault();
        head.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      // Le focus revient au bouton qui a ouvert la fenêtre.
      if (trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
    };
  }, [open, panelRef]);
}

/** Voile flouté : l'arrière-plan reste lisible mais s'efface doucement. */
function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="animate-fade-in absolute inset-0 bg-overlay/25 backdrop-blur-[6px] backdrop-saturate-150"
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
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();
  useOverlayBehaviour(open, onClose, panelRef);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <Backdrop onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-scale-in relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border bg-card shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] outline-none sm:max-h-[86dvh] sm:rounded-2xl",
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
            <h2 id={titleId} className="text-pretty text-lg font-semibold leading-snug tracking-tight">{title}</h2>
            {description && (
              <p id={descId} className="mt-0.5 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
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
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();
  useOverlayBehaviour(open, onClose, panelRef);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <Backdrop onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full flex-col border-l bg-card shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] outline-none sm:max-w-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-pretty text-lg font-semibold leading-snug tracking-tight">{title}</h2>
            {description && (
              <p id={descId} className="mt-0.5 text-pretty text-[13px] leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
          <CloseButton onClose={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t bg-muted/30 px-5 py-3.5 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6 [&>*]:w-full sm:[&>*]:w-auto">{footer}</div>
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

/**
 * Menu « … ». Il s'affiche dans un portail, au-dessus de toute la page :
 * une ligne animée ou une carte « overflow-hidden » ne peut plus le couvrir
 * ni le couper. Il s'ouvre vers le haut quand la place manque en dessous ;
 * Échap, un clic à l'extérieur, le défilement ou un redimensionnement le ferment.
 */
export function ActionMenu({
  label = "Plus d'actions",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [place, setPlace] = React.useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const right = Math.max(8, window.innerWidth - rect.right);
    // Place estimée d'un menu de 3 ou 4 entrées.
    setPlace(window.innerHeight - rect.bottom < 200 && rect.top > 200
      ? { bottom: window.innerHeight - rect.top + 4, right }
      : { top: rect.bottom + 4, right });
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          open && "bg-muted text-foreground"
        )}
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} aria-hidden />
            <div
              role="menu"
              style={{ top: place.top, bottom: place.bottom, right: place.right }}
              className={cn(
                "animate-scale-in fixed z-[71] w-52 rounded-xl border bg-popover p-1 text-popover-foreground shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28)]",
                place.bottom !== undefined ? "origin-bottom-right" : "origin-top-right"
              )}
              onClick={() => setOpen(false)}
            >
              {children}
            </div>
          </>,
          document.body
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
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors hover:bg-muted",
        destructive && "text-destructive-ink hover:bg-destructive-soft"
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Système de design : mouvements et blocs du tableau de bord          */
/* À réutiliser sur toutes les pages (voir DESIGN.md et CLAUDE.md).    */
/* ------------------------------------------------------------------ */

/** Geste d'icône au survol de son parent `.group` (défini dans index.css). */
export type IconMotion = "pop" | "lift" | "fly" | "tilt" | "bounce" | "stack" | "spin";

/** Classe d'une icône animée : `<Icon className={iconMotion("lift")} />`. */
export function iconMotion(motion: IconMotion, className = "size-[18px]") {
  return cn("nav-icon", `nav-icon--${motion}`, className);
}

/** Flèche « → » qui glisse de 4 px au survol ou au focus de son parent `.group`. */
export const ARROW_NUDGE =
  "transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none";

/** Lien de section compact : contour, puis fond bleu roi et texte blanc au survol. */
export const SECTION_LINK =
  "press group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-card px-3 text-[13px] font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md";

/** Carte entièrement cliquable (une seule destination) : se soulève au survol. */
export const CARD_INTERACTIVE = "card-surface hover-lift group";

export function SectionLink({
  to,
  label = "Tout voir",
  context,
  className,
}: {
  to: string;
  label?: string;
  /** Section concernée, pour un nom accessible complet (« Tout voir — Pipeline »). */
  context?: string;
  className?: string;
}) {
  return (
    <Link to={to} aria-label={context ? `${label} — ${context}` : undefined} className={cn(SECTION_LINK, className)}>
      {label}
      <ArrowRight className={cn("size-3.5", ARROW_NUDGE)} />
    </Link>
  );
}

/** En-tête de carte : titre 15 px, compteur gris facultatif, phrase d'aide, lien à droite. */
export function SectionHeader({
  title,
  description,
  count,
  to,
  linkLabel = "Tout voir",
  as: Heading = "h2",
}: {
  title: string;
  description?: string;
  count?: number;
  to?: string;
  linkLabel?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <Heading className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          {title}
          {count !== undefined && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {count}
            </span>
          )}
        </Heading>
        {description && <p className="mt-0.5 text-pretty text-xs text-muted-foreground">{description}</p>}
      </div>
      {to && <SectionLink to={to} label={linkLabel} context={title} />}
    </div>
  );
}

/** État vide unique pour toutes les cartes : icône nue, titre, phrase courte. */
export function EmptyNote({
  icon: Icon,
  title,
  desc,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-5 py-8 text-center", className)}>
      <Icon className="size-6 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      {desc && <p className="mt-0.5 text-pretty text-xs text-muted-foreground">{desc}</p>}
    </div>
  );
}

/**
 * Carte indicateur (KPI) : libellé gris à gauche, icône nue animée à droite,
 * valeur 30 px qui compte jusqu'à sa valeur, précision sous un filet.
 * Toujours un lien vers la page qui détaille le chiffre.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  motion,
  foot,
  tone = "neutral",
  to,
  aside,
  suffix,
}: {
  label: string;
  value: number;
  /** Unité collée à la valeur (ex. « % »). */
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  motion: IconMotion;
  foot: string;
  /** neutral : gris · trend : vert avec flèche montante · alert : ambre avec horloge. */
  tone?: "neutral" | "trend" | "alert";
  /** Page qui détaille le chiffre (carte-lien). Sans lien : simple indicateur. */
  to?: string;
  /** Visuel facultatif à droite de la valeur (ex. une petite courbe). */
  aside?: React.ReactNode;
}) {
  // Lien seulement sur le tableau de bord ; ailleurs, un simple indicateur (les filtres sont dans les puces).
  const shell = cn(to ? CARD_INTERACTIVE : "card-surface", "flex h-full w-full flex-col gap-4 p-4 text-left sm:p-5");
  const body = (
    <>
      <div className="flex items-start justify-between gap-2.5">
        <span className="line-clamp-2 min-w-0 flex-1 text-[13px] font-medium leading-snug text-muted-foreground xl:line-clamp-1">
          {label}
        </span>
        <span className="grid size-5 shrink-0 place-items-center text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
          <Icon className={iconMotion(motion)} />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-[30px] font-semibold leading-none tracking-tight">
          <AnimatedNumber value={value} suffix={suffix} />
        </p>
        {aside}
      </div>
      <p
        className={cn(
          "mt-auto flex items-center gap-1 border-t pt-3 text-xs",
          tone === "trend" ? "font-medium text-success-ink" : tone === "alert" ? "font-medium text-warning" : "text-muted-foreground"
        )}
      >
        {tone === "trend" && <TrendingUp className="size-3.5 shrink-0" />}
        {tone === "alert" && <Clock className="size-3.5 shrink-0" />}
        <span className="line-clamp-2 xl:line-clamp-1">{foot}</span>
      </p>
    </>
  );
  if (to)
    return (
      <Link to={to} className={shell}>
        {body}
      </Link>
    );
  return <div className={shell}>{body}</div>;
}

/* ------------------------------------------------------------------ */
/* Listes : filtres, recherche, boutons de ligne, pipeline             */
/* ------------------------------------------------------------------ */

/**
 * Couleurs de sens du pipeline (tableau de bord, offres, candidatures) :
 * jaune attend, violet examen, bleu entretien, vert accepté, rouge refus.
 */
export const PIPELINE_COLORS: Record<CandidateStatus, string> = {
  en_attente: "hsl(40 80% 60%)",
  examen: "hsl(256 48% 66%)",
  entretien: "hsl(218 68% 60%)",
  acceptee: "hsl(156 42% 48%)",
  refusee: "hsl(356 62% 64%)",
  retiree: "hsl(220 12% 74%)",
};

/** Libellés courts pour les légendes étroites. */
export const PIPELINE_SHORT_LABELS: Record<CandidateStatus, string> = {
  en_attente: "En attente",
  examen: "En examen",
  entretien: "En entretien",
  acceptee: "Acceptée",
  refusee: "Refusée",
  retiree: "Retirée",
};

export const PIPELINE_ORDER: CandidateStatus[] = ["en_attente", "examen", "entretien", "acceptee", "refusee"];

/** Pastille ronde de 8 px à la couleur d'un statut. */
export function StatusDot({ status, className }: { status: CandidateStatus; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ background: PIPELINE_COLORS[status] }}
      aria-hidden
    />
  );
}

/** Barre empilée fine : répartition des candidatures d'une offre par statut. */
export function PipelineBar({
  counts,
  className,
}: {
  counts: Partial<Record<CandidateStatus, number>>;
  className?: string;
}) {
  const total = PIPELINE_ORDER.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
  return (
    <div className={cn("flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted", className)} aria-hidden>
      {total > 0 &&
        PIPELINE_ORDER.filter((status) => (counts[status] ?? 0) > 0).map((status, index) => (
          <span
            key={status}
            className="animate-grow-x h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${((counts[status] ?? 0) / total) * 100}%`,
              background: PIPELINE_COLORS[status],
              ["--delay" as string]: `${200 + index * 80}ms`,
            }}
          />
        ))}
    </div>
  );
}

/**
 * Filtres en puces (comme « À traiter ») : boutons à bascule de 28 px,
 * actif en bleu glacier, compteur discret, pastille de couleur facultative.
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: { value: T; label: string; count?: number; dot?: CandidateStatus }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-0.5 sm:gap-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "press inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-[13px] transition-colors duration-200 sm:px-2.5",
              active
                ? "bg-primary-soft font-semibold text-primary"
                : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {option.dot && <StatusDot status={option.dot} />}
            {option.label}
            {option.count !== undefined && (
              <span className={cn("text-xs tabular-nums", active ? "text-primary/70" : "text-muted-foreground/80")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Champ de recherche avec loupe, pour filtrer une liste. */
export function SearchInput({
  id,
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        id={id}
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(inputClass, "h-9 pl-9")}
      />
    </div>
  );
}

/**
 * Bouton de ligne : discret, largeur fixe (144 px) pour un bord droit régulier,
 * glacier au survol de la ligne ; flèche seule sur téléphone.
 * `primary` : le seul bouton plein d'une liste (l'action recommandée).
 */
export function rowActionClass(primary = false) {
  return cn(
    "press inline-flex h-8 w-8 shrink-0 items-center justify-center gap-1 rounded-lg text-xs transition-colors duration-200 sm:w-36 sm:px-3",
    primary
      ? "bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
      : "bg-muted/70 font-medium text-muted-foreground hover:bg-primary-soft hover:text-primary group-hover:bg-primary-soft group-hover:text-primary"
  );
}
