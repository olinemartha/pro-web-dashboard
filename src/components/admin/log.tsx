import { CalendarClock, Inbox, ShieldCheck, Sparkles, UserRoundCheck } from "lucide-react";
import type { IconMotion } from "@/components/company/ui";
import type { LogEntry, LogKind } from "@/lib/admin-data";
import { fmtDate, relativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const LOG_KINDS: Record<LogKind, { label: string; icon: React.ComponentType<{ className?: string }>; motion: IconMotion }> = {
  candidature: { label: "Candidatures", icon: Inbox, motion: "bounce" },
  entretien: { label: "Entretiens", icon: CalendarClock, motion: "tilt" },
  affectation: { label: "Affectations", icon: UserRoundCheck, motion: "pop" },
  systeme_expert: { label: "Système expert", icon: Sparkles, motion: "pop" },
  administration: { label: "Administration", icon: ShieldCheck, motion: "pop" },
};

/** Lignes du journal : icône du type d'événement, titre, détail, date. Lecture seule. */
export function LogList({ entries, withTime = false, className }: { entries: LogEntry[]; withTime?: boolean; className?: string }) {
  return (
    <ul className={cn("divide-y", className)}>
      {entries.map((entry) => {
        const meta = LOG_KINDS[entry.kind];
        const time = entry.date.length > 10 ? new Date(entry.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
        return (
          <li key={entry.id} className="group flex items-start gap-3 px-5 py-3 transition-colors duration-200 hover:bg-muted/40">
            <meta.icon className={`nav-icon nav-icon--${meta.motion} mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground`} />
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate font-medium">{entry.title}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {withTime ? `${fmtDate(entry.date.slice(0, 10))}${time ? ` · ${time}` : ""}` : relativeDay(entry.date.slice(0, 10))}
                </span>
              </p>
              <p className="mt-0.5 text-pretty text-xs text-muted-foreground">{entry.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
