import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCircle2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { fmtRel, useStore } from "@/lib/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — StageManager" },
      { name: "description", content: "Consultez vos notifications de recrutement et de suivi de stage." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications } = useStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader title="Notifications" desc={`${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}`} />

      <SectionCard title="Toutes les notifications">
        <div className="divide-y">
          {notifications.map((n) => (
            <div key={n.id} className={cn("flex items-center gap-3 px-3 py-3 text-sm", !n.read && "bg-accent-soft/50")}>
              <div className={cn("grid size-7 place-items-center rounded-full", n.read ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")}>
                <Bell className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", !n.read ? "text-foreground" : "text-muted-foreground")}>{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="text-[11px] text-muted-foreground">{fmtRel(n.date)}</p>
              </div>
              {!n.read && <CheckCircle2 className="size-3 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
