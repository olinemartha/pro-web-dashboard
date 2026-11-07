import * as React from "react";
import { cn } from "@/lib/utils";

export type KpiTone = "primary" | "accent" | "success" | "warning" | "muted" | "destructive";

const KPI_TONES: Record<KpiTone, string> = {
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-primary",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning",
  muted: "bg-muted text-muted-foreground",
  destructive: "bg-destructive-soft text-destructive-ink",
};

/**
 * Carte d'indicateur partagée par les trois espaces.
 * La teinte encode l'état de la mesure (activité, action requise, résultat
 * acquis) ; elle ne décore jamais la carte.
 */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "accent",
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: KpiTone;
}) {
  return (
    <div className="card-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium leading-4 text-muted-foreground">{label}</p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-md", KPI_TONES[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2.5 text-2xl font-semibold leading-none tracking-tight tabular-nums sm:text-3xl">
        {value}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}
