import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatedNumber, Reveal } from "@/components/ui/motion";

export type KpiTone = "primary" | "accent" | "success" | "warning" | "muted" | "destructive";

const KPI_TONES: Record<KpiTone, string> = {
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-primary",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning",
  muted: "bg-muted text-muted-foreground",
  destructive: "bg-destructive-soft text-destructive-ink",
};

const CHIP_TONES: Record<KpiTone, string> = {
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
 * acquis) ; elle ne décore jamais la carte. Les barres, quand elles sont
 * fournies, montrent une vraie série (ex. candidatures par semaine).
 */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "accent",
  chip,
  bars,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: KpiTone;
  chip?: { label: string; tone?: KpiTone; icon?: React.ComponentType<{ className?: string }> };
  bars?: number[];
  delay?: number;
}) {
  const max = bars ? Math.max(1, ...bars) : 1;
  const ChipIcon = chip?.icon;

  return (
    <Reveal delay={delay} className="card-surface hover-lift relative overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-5 text-muted-foreground">{label}</p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", KPI_TONES[tone])}>
          <Icon className="size-4" />
        </span>
      </div>

      <p className="mt-2 text-[30px] font-semibold leading-none tracking-tight">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </p>

      {chip && (
        <span
          className={cn(
            "mt-2.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
            CHIP_TONES[chip.tone ?? "muted"]
          )}
        >
          {ChipIcon && <ChipIcon className="size-3" />}
          {chip.label}
        </span>
      )}

      <p className={cn("text-xs leading-relaxed text-muted-foreground", chip ? "mt-2" : "mt-3", bars && "sm:pr-16")}>
        {hint}
      </p>

      {bars && bars.length > 0 && (
        <div
          className="pointer-events-none absolute bottom-4 right-4 hidden h-12 items-end gap-1 sm:flex"
          aria-hidden
        >
          {bars.map((bar, index) => (
            <span
              key={index}
              className={cn(
                "animate-grow-y w-2 rounded-sm",
                index === bars.length - 1 ? "bg-accent" : "bg-accent/25"
              )}
              style={{
                height: `${Math.max(8, (bar / max) * 100)}%`,
                ["--delay" as string]: `${delay + 200 + index * 60}ms`,
              }}
            />
          ))}
        </div>
      )}
    </Reveal>
  );
}
