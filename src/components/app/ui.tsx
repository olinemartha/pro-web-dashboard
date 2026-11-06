import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, CalendarClock, MapPin, Clock, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { companyOf, type Offer } from "@/lib/mock-data";
import type { AppStatus } from "@/lib/rules";
import { fmtDate, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const STATUS: Record<AppStatus, { label: string; cls: string }> = {
  envoyee: { label: "Envoyée", cls: "bg-muted text-muted-foreground" },
  examen: { label: "En cours d'examen", cls: "bg-warning-soft text-warning" },
  preselectionnee: { label: "Présélectionnée", cls: "bg-accent-soft text-primary" },
  entretien: { label: "Entretien programmé", cls: "bg-accent-soft text-primary" },
  acceptee: { label: "Acceptée", cls: "bg-success-soft text-success" },
  refusee: { label: "Refusée", cls: "bg-danger-soft text-destructive" },
  declinee: { label: "Déclinée par vous", cls: "bg-muted text-muted-foreground" },
  confirmee: { label: "Stage confirmé", cls: "bg-primary text-primary-foreground" },
};

export function StatusBadge({ status }: { status: AppStatus }) {
  const s = STATUS[status];
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}><span className="size-1.5 rounded-full bg-current" />{s.label}</span>;
}

export function CompanyLogo({ id, size = "md" }: { id: string; size?: "sm" | "md" | "lg" }) {
  const c = companyOf(id);
  return <div className={cn("grid shrink-0 place-items-center rounded-lg bg-primary font-semibold text-primary-foreground", size === "sm" && "size-8 text-[11px]", size === "md" && "size-10 text-xs", size === "lg" && "size-14 text-base")}>{c.initials}</div>;
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}</div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, desc, action }: { icon: LucideIcon; title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-accent-soft text-primary"><Icon className="size-5" /></div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionCard({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card-surface p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-semibold">{title}</h2>{action}</div>
      {children}
    </section>
  );
}

export function SaveButton({ id, className }: { id: string; className?: string }) {
  const { saved, toggleSave } = useStore();
  const on = saved.includes(id);
  return (
    <Button variant="outline" size="icon" aria-label={on ? "Retirer des favoris" : "Enregistrer l'offre"} className={cn(on && "border-accent bg-accent-soft text-primary", className)} onClick={(e) => { e.preventDefault(); toggleSave(id); }}>
      {on ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
    </Button>
  );
}

export function OfferCard({ offer }: { offer: Offer }) {
  const c = companyOf(offer.companyId);
  return (
    <article className="card-surface card-hover flex flex-col p-5">
      <div className="flex items-start gap-3">
        <CompanyLogo id={offer.companyId} />
        <div className="min-w-0 flex-1"><p className="text-xs font-medium text-muted-foreground">{c.name} · {offer.department}</p><h3 className="mt-0.5 font-semibold leading-snug">{offer.title}</h3></div>
        <SaveButton id={offer.id} />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{offer.location}</span>
        <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{offer.type} · {offer.duration}</span>
        <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" />Avant le {fmtDate(offer.deadline)}</span>
      </div>
      <div className="mt-5 flex-1" />
      <Button asChild variant="secondary" className="w-full"><Link to="/offres/$id" params={{ id: offer.id }}>Voir l'offre</Link></Button>
    </article>
  );
}
