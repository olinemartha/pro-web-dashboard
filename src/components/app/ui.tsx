import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AppStatus } from "@/lib/rules";
import { STATUS_LABELS } from "@/lib/rules";

export const STATUS = STATUS_LABELS;

export interface StatusBadgeProps {
  status: AppStatus;
  size?: "sm" | "default";
}

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const { label, color } = STATUS_LABELS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-tighter",
        color === "success" && "border-success/30 bg-success-soft text-success-ink",
        color === "destructive" && "border-destructive/30 bg-destructive-soft text-destructive-ink",
        color === "primary" && "border-primary/30 bg-primary-soft text-primary",
        color === "accent" && "border-accent/30 bg-accent-soft text-primary",
        color === "muted" && "border-muted/30 bg-muted text-muted-foreground",
        size === "sm" && "px-2 py-0.5 text-[10px]"
      )}
    >
      {label}
    </span>
  );
}

export interface CompanyLogoProps {
  id: string;
  size?: "sm" | "default";
}

export function CompanyLogo({ id, size = "default" }: CompanyLogoProps) {
  const company: Record<string, { name: string; initials: string }> = {
    finca: { name: "FINCA RDC", initials: "FR" },
  };
  const info = company[id] ?? { name: "Entreprise", initials: "E" };

  return (
    <div className={cn("grid size-7 place-items-center rounded-full bg-primary-soft text-primary font-medium text-xs", size === "sm" && "size-6 text-[10px]")}>
      {info.initials}
    </div>
  );
}

export interface OfferCardProps {
  offer: {
    id: string;
    title: string;
    department: string;
    location: string;
    duration: string;
    level: string;
    deadline: string;
    published: string;
    skills: string[];
    companyId: string;
  };
}

export function OfferCard({ offer }: OfferCardProps) {
  return (
    <div className="card-surface p-4">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-medium text-muted-foreground">{offer.level}</p>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/offres/$id" params={{ id: offer.id }}>
            <Bookmark className="size-4 text-muted-foreground hover:text-primary" />
          </Link>
        </Button>
      </div>
      <h3 className="text-sm font-semibold mb-1">{offer.title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{offer.department} · {offer.location}</p>
      <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
        <span>⏱ {offer.duration}</span>
        <span>•</span>
        <span>📅 {offer.deadline}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {offer.skills.map((s) => (
          <span key={s} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-primary">{s}</span>
        ))}
      </div>
    </div>
  );
}

/**
 * Chaque shell nomme la page courante dans sa barre supérieure persistante.
 * Le contexte transmet ce titre : une page qui le répète n'affiche pas de
 * second titre, elle ne garde que sa description et ses actions.
 */
const ShellPageTitleContext = React.createContext<string | null>(null);

export function ShellPageTitleProvider({
  title,
  children,
}: {
  title: string | null;
  children: React.ReactNode;
}) {
  return (
    <ShellPageTitleContext.Provider value={title}>{children}</ShellPageTitleContext.Provider>
  );
}

export interface PageHeaderProps {
  title: string;
  desc: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, desc, action }: PageHeaderProps) {
  const shellTitle = React.useContext(ShellPageTitleContext);
  const repeatsShellTitle = shellTitle
    ? shellTitle.trim().localeCompare(title.trim(), "fr", { sensitivity: "base" }) === 0
    : false;

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {!repeatsShellTitle && (
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        )}
        <p className={cn("text-sm text-muted-foreground", !repeatsShellTitle && "mt-1")}>{desc}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export interface SectionCardProps {
  title: string;
  className?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({ title, className, action, children }: SectionCardProps) {
  return (
    <section className={cn("card-surface p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, desc, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="mb-3 rounded-full bg-accent-soft p-3 text-primary">{icon}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
