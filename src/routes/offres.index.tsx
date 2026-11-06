import { createFileRoute } from "@tanstack/react-router";
import { SearchX, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, OfferCard, PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { companies, offers } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/offres/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s["q"] === "string" ? { q: s["q"] } : {}),
  head: () => ({
    meta: [
      { title: "Offres de stage — StageManager" },
      { name: "description", content: "Recherchez et filtrez les offres de stage disponibles sur StageManager." },
      { property: "og:title", content: "Offres de stage — StageManager" },
      { property: "og:description", content: "Recherchez et filtrez les offres de stage disponibles sur StageManager." },
    ],
  }),
  component: Offers,
});

const uniq = (k: "department" | "location" | "level") => [...new Set(offers.map((o) => o[k]))];
const ALL = "all";

function Offers() {
  const { q: q0 } = Route.useSearch();
  const { saved } = useStore();
  const [q, setQ] = useState(q0 ?? "");
  const [company, setCompany] = useState(ALL);
  const [dept, setDept] = useState(ALL);
  const [loc, setLoc] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [sort, setSort] = useState("published");
  const [onlySaved, setOnlySaved] = useState(false);

  const list = useMemo(() => offers
    .filter((o) => o.title.toLowerCase().includes(q.toLowerCase()))
    .filter((o) => company === ALL || o.companyId === company)
    .filter((o) => dept === ALL || o.department === dept)
    .filter((o) => loc === ALL || o.location === loc)
    .filter((o) => level === ALL || o.level === level)
    .filter((o) => !onlySaved || saved.includes(o.id))
    .sort((a, b) => sort === "published" ? b.published.localeCompare(a.published) : a.deadline.localeCompare(b.deadline)),
  [q, company, dept, loc, level, sort, onlySaved, saved]);

  const F = ({ v, set, ph, items }: { v: string; set: (s: string) => void; ph: string; items: { v: string; l: string }[] }) => (
    <Select value={v} onValueChange={set}><SelectTrigger className="w-full bg-card"><SelectValue placeholder={ph} /></SelectTrigger>
      <SelectContent><SelectItem value={ALL}>{ph}</SelectItem>{items.map((i) => <SelectItem key={i.v} value={i.v}>{i.l}</SelectItem>)}</SelectContent></Select>
  );
  const reset = () => { setQ(""); setCompany(ALL); setDept(ALL); setLoc(ALL); setLevel(ALL); setOnlySaved(false); };

  return (
    <div>
      <PageHeader title="Offres de stage" desc={`${list.length} offre${list.length > 1 ? "s" : ""} correspondant à vos critères`}
        action={<div className="flex gap-2"><Button variant={onlySaved ? "default" : "outline"} onClick={() => setOnlySaved(!onlySaved)}>Enregistrées ({saved.length})</Button></div>} />
      <div className="card-surface mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Intitulé du stage…" className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-ring/30" /></div>
        <F v={company} set={setCompany} ph="Toutes entreprises" items={companies.map((c) => ({ v: c.id, l: c.name }))} />
        <F v={dept} set={setDept} ph="Tous services" items={uniq("department").map((v) => ({ v, l: v }))} />
        <F v={loc} set={setLoc} ph="Toutes localisations" items={uniq("location").map((v) => ({ v, l: v }))} />
        <F v={level} set={setLevel} ph="Tous niveaux" items={uniq("level").map((v) => ({ v, l: v }))} />
        <div className="flex items-center gap-2 text-sm text-muted-foreground lg:col-span-6">Trier par
          <Select value={sort} onValueChange={setSort}><SelectTrigger className="h-8 w-48 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="published">Date de publication</SelectItem><SelectItem value="deadline">Date limite</SelectItem></SelectContent></Select>
        </div>
      </div>
      {list.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((o) => <OfferCard key={o.id} offer={o} />)}</div>
        : <EmptyState icon={SearchX} title="Aucune offre trouvée" desc="Essayez d'élargir votre recherche ou de modifier vos filtres." action={<Button variant="outline" onClick={reset}>Réinitialiser les filtres</Button>} />}
    </div>
  );
}
