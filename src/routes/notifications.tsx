import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CalendarClock, CheckCheck, CheckCircle2, FileText, GraduationCap, Sparkles } from "lucide-react";
import { useState } from "react";
import { EmptyNote, FilterChips, PageIntro, SECTION_LINK, type IconMotion } from "@/components/company/ui";
import { Reveal } from "@/components/ui/motion";
import { relativeDay } from "@/lib/dates";
import type { Notification } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — StageManager" },
      { name: "description", content: "Consultez vos notifications de recrutement et de suivi de stage." },
    ],
  }),
  component: NotificationsPage,
});

const KIND: Record<Notification["kind"], { icon: React.ComponentType<{ className?: string }>; motion: IconMotion; to: string }> = {
  candidature: { icon: CheckCircle2, motion: "pop", to: "/candidatures" },
  entretien: { icon: CalendarClock, motion: "tilt", to: "/candidatures" },
  offre: { icon: Sparkles, motion: "pop", to: "/offres" },
  stage: { icon: GraduationCap, motion: "tilt", to: "/stage" },
  document: { icon: FileText, motion: "lift", to: "/documents" },
  rapport: { icon: FileText, motion: "lift", to: "/stage" },
};

const time = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function NotificationsPage() {
  const { notifications, markNotificationsRead } = useStore();
  const [filter, setFilter] = useState<"toutes" | "non_lues">("toutes");
  const unread = notifications.filter((n) => !n.read);
  const list = [...notifications]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((n) => filter === "toutes" || !n.read);

  return (
    <div className="space-y-6">
      <PageIntro desc="Les réponses des entreprises, vos entretiens et les nouvelles offres qui correspondent à votre profil." />

      <Reveal as="section" className="card-surface overflow-hidden" aria-labelledby="notif-title">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b px-5 pb-3.5 pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <h2 id="notif-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Notifications
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {notifications.length}
              </span>
            </h2>
            <FilterChips
              label="Filtrer les notifications"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "toutes", label: "Toutes", count: notifications.length },
                { value: "non_lues", label: "Non lues", count: unread.length },
              ]}
            />
          </div>
          <button
            type="button"
            disabled={unread.length === 0}
            onClick={() => markNotificationsRead(unread.map((n) => n.id))}
            className={cn(SECTION_LINK, "disabled:pointer-events-none disabled:opacity-50")}
          >
            <CheckCheck className="size-3.5" />
            Tout marquer comme lu
          </button>
        </div>

        {list.length === 0 ? (
          <EmptyNote
            icon={Bell}
            title={filter === "non_lues" ? "Aucune notification non lue" : "Aucune notification"}
            desc="Vous êtes à jour."
            className="py-12"
          />
        ) : (
          <ul className="divide-y">
            {list.map((n, index) => {
              const meta = KIND[n.kind] ?? KIND.candidature;
              return (
                <Reveal as="li" key={n.id} delay={80 + index * 40}>
                  <Link
                    to={meta.to}
                    onClick={() => !n.read && markNotificationsRead([n.id])}
                    className={cn(
                      "group grid grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-x-3.5 px-5 py-3.5 transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-offset-[-3px]",
                      !n.read && "bg-primary-soft/40"
                    )}
                  >
                    <meta.icon
                      className={cn(
                        `nav-icon nav-icon--${meta.motion} mt-0.5 size-[18px]`,
                        n.read ? "text-muted-foreground" : "text-primary"
                      )}
                    />
                    <span className="min-w-0">
                      <span className={cn("block text-[13px]", n.read ? "font-medium text-muted-foreground" : "font-semibold text-foreground")}>
                        {n.title}
                        {!n.read && <span className="sr-only"> (non lue)</span>}
                      </span>
                      <span className="mt-0.5 block text-pretty text-xs leading-relaxed text-muted-foreground">{n.body}</span>
                    </span>
                    <span className="flex items-center gap-2 whitespace-nowrap pt-0.5 text-[11px] tabular-nums text-muted-foreground">
                      <span>
                        {relativeDay(n.date.slice(0, 10))}
                        <span className="hidden sm:inline"> · {time(n.date)}</span>
                      </span>
                      <span className={cn("size-2 rounded-full", n.read ? "bg-transparent" : "bg-accent")} aria-hidden />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        )}
      </Reveal>
    </div>
  );
}
