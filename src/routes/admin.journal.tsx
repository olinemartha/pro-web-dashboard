import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ScrollText } from "lucide-react";
import { LOG_KINDS, LogList } from "@/components/admin/log";
import { EmptyNote, FilterChips, PageIntro, SearchInput } from "@/components/company/ui";
import { Reveal } from "@/components/ui/motion";
import { useAdminData, type LogKind } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/journal")({
  head: () => ({ meta: [{ title: "Journal d'activité — Administration StageManager" }] }),
  component: JournalPage,
});

type Filter = "tout" | LogKind;

function JournalPage() {
  const { log } = useAdminData();
  const [filter, setFilter] = useState<Filter>("tout");
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(20);

  const query = search.trim().toLowerCase();
  const list = log
    .filter((entry) => filter === "tout" || entry.kind === filter)
    .filter((entry) => !query || `${entry.title} ${entry.detail}`.toLowerCase().includes(query));

  return (
    <div className="space-y-6">
      <PageIntro desc="Chaque événement de la plateforme, du plus récent au plus ancien : candidatures, entretiens, analyses du système expert, affectations et actions d'administration." />

      <Reveal as="section" className="card-surface overflow-hidden" aria-labelledby="journal-title">
        <div className="flex flex-col gap-3 border-b px-5 pb-3.5 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <h2 id="journal-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Journal
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">{list.length}</span>
            </h2>
            <FilterChips
              label="Filtrer par type d'événement"
              value={filter}
              onChange={(value) => {
                setFilter(value);
                setShown(20);
              }}
              options={[
                { value: "tout", label: "Tout", count: log.length },
                ...(Object.keys(LOG_KINDS) as LogKind[]).map((kind) => ({
                  value: kind,
                  label: LOG_KINDS[kind].label,
                  count: log.filter((entry) => entry.kind === kind).length,
                })),
              ]}
            />
          </div>
          <SearchInput id="journal-search" label="Rechercher dans le journal" placeholder="Nom, offre, service" value={search} onChange={setSearch} className="w-full lg:w-64" />
        </div>
        <p className="flex items-center gap-2 border-b bg-muted/30 px-5 py-2 text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" /> Journal en lecture seule : aucun événement ne peut être modifié ni supprimé.
        </p>

        {list.length === 0 ? (
          <EmptyNote icon={ScrollText} title="Aucun événement ne correspond" desc="Changez de filtre ou de mot-clé." className="py-12" />
        ) : (
          <>
            <LogList entries={list.slice(0, shown)} withTime />
            {list.length > shown && (
              <button
                type="button"
                onClick={() => setShown((value) => value + 20)}
                className="flex w-full items-center justify-center border-t px-5 py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Afficher {Math.min(20, list.length - shown)} événements de plus
              </button>
            )}
          </>
        )}
      </Reveal>
    </div>
  );
}
