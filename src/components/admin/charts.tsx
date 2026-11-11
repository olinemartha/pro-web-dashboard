import { useState } from "react";
import { StatusDot } from "@/components/company/ui";
import type { CandidateStatus } from "@/lib/company-data";
import { cn } from "@/lib/utils";

/**
 * Graphiques de l'espace administrateur, sans bibliothèque.
 * Une seule teinte (bleu roi) : l'identité passe par les libellés, jamais par la couleur seule.
 * Chaque graphique a sa table de données pour les lecteurs d'écran.
 */

/** Barres verticales (une série) : survol ou focus = info-bulle ; la dernière valeur est étiquetée. */
export function WeeklyBars({ data, unit = "candidature" }: { data: { label: string; count: number }[]; unit?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const plural = (n: number) => `${n} ${unit}${n > 1 ? "s" : ""}`;
  return (
    <figure className="mt-4">
      <div className="relative flex h-40 items-end gap-1.5 border-b sm:gap-2.5" role="presentation">
        {/* Repères horizontaux discrets */}
        {[0.5, 1].map((ratio) => (
          <span key={ratio} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/70" style={{ bottom: `${ratio * 100}%` }} aria-hidden />
        ))}
        {data.map((d, index) => {
          const last = index === data.length - 1;
          return (
            <button
              key={d.label}
              type="button"
              aria-label={`Semaine du ${d.label} : ${plural(d.count)}`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
            >
              {(active === index || (active === null && last)) && (
                <span className="animate-fade-in absolute bottom-full mb-1.5 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium tabular-nums text-background shadow-lg" style={{ bottom: `${(d.count / max) * 100}%` }}>
                  {plural(d.count)}
                </span>
              )}
              <span
                className={cn(
                  "animate-grow-y w-full max-w-9 rounded-t-[4px] transition-colors duration-200",
                  active === index || (active === null && last) ? "bg-primary" : "bg-primary/35 group-hover:bg-primary/60",
                  "group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-accent"
                )}
                style={{ height: `${Math.max(d.count ? 6 : 2, (d.count / max) * 100)}%`, ["--delay" as string]: `${120 + index * 50}ms` }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2.5" aria-hidden>
        {data.map((d, index) => (
          <span key={d.label} className={cn("flex-1 truncate text-center text-[11px] tabular-nums text-muted-foreground", index % 2 === 1 && "max-sm:invisible")}>
            {d.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Candidatures reçues par semaine</caption>
        <thead>
          <tr>
            <th>Semaine se terminant le</th>
            <th>Candidatures</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Barres horizontales étiquetées : libellé, barre, valeur et part du total. */
export function LabeledBars({
  rows,
  caption,
}: {
  rows: { label: string; count: number; dot?: CandidateStatus }[];
  caption: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <figure className="mt-4">
      <ul className="space-y-2.5" aria-hidden>
        {rows.map((row, index) => (
          <li key={row.label} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_3.5rem] items-center gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2">
              {row.dot && <StatusDot status={row.dot} />}
              <span className="truncate">{row.label}</span>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span
                className="animate-grow-x block h-full rounded-full bg-primary"
                style={{ width: `${(row.count / max) * 100}%`, ["--delay" as string]: `${150 + index * 60}ms` }}
              />
            </span>
            <span className="text-right tabular-nums">
              <span className="font-semibold">{row.count}</span>
              <span className="ml-1 text-xs text-muted-foreground">{total ? Math.round((row.count / total) * 100) : 0} %</span>
            </span>
          </li>
        ))}
      </ul>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Barre partagée en deux (recommandation suivie / choix manuel), avec sa légende. */
export function SplitBar({ first, second }: { first: { label: string; count: number }; second: { label: string; count: number } }) {
  const total = Math.max(1, first.count + second.count);
  return (
    <div className="mt-4">
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        {first.count > 0 && <span className="animate-grow-x h-full rounded-l-full bg-primary" style={{ width: `${(first.count / total) * 100}%` }} />}
        {second.count > 0 && <span className="animate-grow-x h-full rounded-r-full bg-muted-foreground/40" style={{ width: `${(second.count / total) * 100}%`, ["--delay" as string]: "260ms" }} />}
      </div>
      <ul className="mt-3 space-y-1.5 text-xs">
        {[
          { ...first, swatch: "bg-primary" },
          { ...second, swatch: "bg-muted-foreground/40" },
        ].map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className={cn("size-2 rounded-full", item.swatch)} aria-hidden />
              {item.label}
            </span>
            <span className="font-semibold tabular-nums">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
