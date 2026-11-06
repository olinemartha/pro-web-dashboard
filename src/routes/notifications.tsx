import { createFileRoute } from "@tanstack/react-router";
import { BellOff } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { fmtRel, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — StageManager" },
      { name: "description", content: "Toutes vos notifications StageManager." },
      { property: "og:title", content: "Notifications — StageManager" },
      { property: "og:description", content: "Toutes vos notifications StageManager." },
    ],
  }),
  component: Notifs,
});

function Notifs() {
  const { notifications, unread, markRead, markAllRead } = useStore();
  return (
    <div>
      <PageHeader title="Notifications" desc={`${unread} non lue${unread > 1 ? "s" : ""}`} action={unread > 0 && <Button variant="outline" onClick={markAllRead}>Tout marquer comme lu</Button>} />
      {notifications.length === 0 ? <EmptyState icon={BellOff} title="Aucune notification" desc="Vous êtes à jour." /> : (
        <div className="card-surface divide-y">{notifications.map((n) => (
          <div key={n.id} className={cn("flex items-start gap-3 p-4", !n.read && "bg-accent-soft/40")}>
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-border" : "bg-accent")} />
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{n.title}</p><p className="text-sm text-muted-foreground">{n.body}</p><p className="mt-1 text-xs text-muted-foreground">{fmtRel(n.date)}</p></div>
            {!n.read && <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>Marquer comme lu</Button>}
          </div>))}</div>
      )}
    </div>
  );
}
