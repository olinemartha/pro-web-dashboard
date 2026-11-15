import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, CircleSlash, FileText, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  ActionMenu,
  Badge,
  EmptyNote,
  Field,
  FilterChips,
  MenuItem,
  Modal,
  PageIntro,
  SearchInput,
  StatCard,
  textareaClass,
} from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { useAdminStore } from "@/lib/admin-store";
import { offerStatusLabels, type CompanyOffer, type OfferStatus } from "@/lib/company-data";
import { useCompanyStore } from "@/lib/company-store";
import { companyOf } from "@/lib/mock-data";
import { fmtDate } from "@/lib/dates";

export const Route = createFileRoute("/admin/offres")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s["q"] === "string" ? { q: s["q"] } : {}),
  head: () => ({ meta: [{ title: "Offres — Administration StageManager" }] }),
  component: OffersPage,
});

type Filter = "toutes" | OfferStatus;

function OffersPage() {
  const { offers, candidates, setOfferStatus } = useCompanyStore();
  const logOfferWithdrawal = useAdminStore((state) => state.logOfferWithdrawal);
  const { q } = Route.useSearch();
  const [filter, setFilter] = useState<Filter>("toutes");
  const [search, setSearch] = useState(q ?? "");
  const [target, setTarget] = useState<CompanyOffer | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setSearch(q ?? ""), [q]);

  const count = (status: OfferStatus) => offers.filter((o) => o.status === status).length;
  const applicants = (id: string) => candidates.filter((c) => c.offerId === id).length;
  const query = search.trim().toLowerCase();
  const list = offers
    .filter((o) => filter === "toutes" || o.status === filter)
    .filter((o) => !query || `${o.title} ${o.department} ${o.location}`.toLowerCase().includes(query))
    .sort((a, b) => b.published.localeCompare(a.published));

  const withdraw = () => {
    if (!target) return;
    if (!reason.trim()) {
      setError("Indiquez le motif du retrait : l'entreprise et le journal en gardent la trace.");
      document.getElementById("retrait-motif")?.focus();
      return;
    }
    setOfferStatus(target.id, "desactivee");
    logOfferWithdrawal(`${target.title} (${companyOf(target.companyId ?? "").name})`, reason.trim(), target.id);
    toast.success("Offre retirée", { description: "Elle n'est plus visible par les étudiants." });
    setTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageIntro desc="Toutes les offres publiées sur la plateforme. Les entreprises publient sans validation préalable ; une offre non conforme peut être retirée, avec un motif." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard key="p" label="Publiées" value={count("publiee")} icon={Briefcase} motion="lift" foot="visibles par les étudiants" />,
          <StatCard key="b" label="Brouillons" value={count("brouillon")} icon={FileText} motion="lift" foot="non publiés" />,
          <StatCard key="c" label="Clôturées" value={count("cloturee")} icon={Lock} motion="pop" foot="candidatures fermées" />,
          <StatCard key="d" label="Retirées ou désactivées" value={count("desactivee")} icon={CircleSlash} motion="pop" foot="hors ligne" tone={count("desactivee") ? "alert" : "neutral"} />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      <Reveal as="section" delay={120} className="card-surface overflow-hidden" aria-labelledby="offers-title">
        <div className="flex flex-col gap-3 border-b px-5 pb-3.5 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <h2 id="offers-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Offres
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">{offers.length}</span>
            </h2>
            <FilterChips
              label="Filtrer les offres par statut"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "toutes", label: "Toutes", count: offers.length },
                { value: "publiee", label: "Publiées", count: count("publiee") },
                { value: "brouillon", label: "Brouillons", count: count("brouillon") },
                { value: "cloturee", label: "Clôturées", count: count("cloturee") },
                { value: "desactivee", label: "Désactivées", count: count("desactivee") },
              ]}
            />
          </div>
          <SearchInput id="offers-search" label="Rechercher une offre" placeholder="Intitulé, service, ville" value={search} onChange={setSearch} className="w-full lg:w-64" />
        </div>

        {list.length === 0 ? (
          <EmptyNote icon={Briefcase} title="Aucune offre ne correspond" desc="Changez de filtre ou de mot-clé." className="py-12" />
        ) : (
          <ul className="divide-y">
            {list.map((offer, index) => {
              const status = offerStatusLabels[offer.status];
              return (
                <Reveal as="li" key={offer.id} delay={index < 8 ? 160 + index * 40 : 0}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5 transition-colors duration-200 hover:bg-muted/40 md:grid-cols-[minmax(0,1.4fr)_120px_120px_auto]">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">{offer.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {companyOf(offer.companyId ?? "").name} · {offer.department} · {offer.location}
                      </p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:hidden">
                        <Badge label={status.label} tone={status.tone} className="text-[11px]" />
                        {applicants(offer.id)} candidature{applicants(offer.id) > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="hidden md:block">
                      <Badge label={status.label} tone={status.tone} className="text-[11px]" />
                    </span>
                    <p className="hidden text-xs tabular-nums text-muted-foreground md:block">
                      <span className="font-semibold text-foreground">{applicants(offer.id)}</span> candidature{applicants(offer.id) > 1 ? "s" : ""}
                      <span className="block">clôture {fmtDate(offer.deadline, false)}</span>
                    </p>
                    <ActionMenu label={`Actions pour ${offer.title}`}>
                      <MenuItem
                        destructive
                        onSelect={() => {
                          if (offer.status === "desactivee") {
                            toast.info("Offre déjà hors ligne", { description: offer.title });
                            return;
                          }
                          setTarget(offer);
                          setReason("");
                          setError("");
                        }}
                      >
                        <CircleSlash className="size-4" /> Retirer l'offre
                      </MenuItem>
                    </ActionMenu>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        )}
      </Reveal>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        icon={CircleSlash}
        title="Retirer cette offre ?"
        description={target ? `${target.title} · ${companyOf(target.companyId ?? "").name}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={withdraw}>
              Retirer l'offre
            </Button>
          </>
        }
      >
        <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
          L'offre sera désactivée : les étudiants ne la verront plus. Les candidatures déjà reçues restent chez l'entreprise.
        </p>
        <Field label="Motif du retrait" htmlFor="retrait-motif" required error={error} className="mt-4">
          <textarea
            id="retrait-motif"
            className={textareaClass}
            placeholder="Ex. Contenu sans rapport avec un stage"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
          />
        </Field>
      </Modal>
    </div>
  );
}
