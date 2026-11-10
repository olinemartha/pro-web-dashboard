import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, CheckCircle2, Send, UserSearch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CompanyMark, STUDENT_STATUS, StatusBadge } from "@/components/app/ui";
import {
  ARROW_NUDGE,
  EmptyNote,
  FilterChips,
  Modal,
  PageIntro,
  SECTION_LINK,
  SearchInput,
  StatCard,
  rowActionClass,
} from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { fmtDate } from "@/lib/dates";
import { companyOf, offerOf } from "@/lib/mock-data";
import type { AppStatus, Application } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/candidatures")({
  head: () => ({
    meta: [
      { title: "Mes candidatures — StageManager" },
      { name: "description", content: "Suivez le statut de toutes vos candidatures de stage." },
    ],
  }),
  component: Applications,
});

type Filter = "toutes" | "en_cours" | "acceptees" | "closes";

const GROUP: Record<AppStatus, Exclude<Filter, "toutes">> = {
  envoyee: "en_cours",
  examen: "en_cours",
  preselectionnee: "en_cours",
  entretien: "en_cours",
  acceptee: "acceptees",
  confirmee: "acceptees",
  refusee: "closes",
  declinee: "closes",
};

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

function RowAction({ application }: { application: Application }) {
  const offer = offerOf(application.offerId);
  if (application.status === "confirmee")
    return (
      <Link to="/stage" aria-label="Ouvrir le suivi de mon stage" className={cn(rowActionClass(), "group")}>
        <span className="hidden whitespace-nowrap sm:inline">Mon stage</span>
        <ArrowRight className={cn("size-3.5 shrink-0", ARROW_NUDGE)} />
      </Link>
    );
  return (
    <Link
      to="/offres/$id"
      params={{ id: offer.id }}
      aria-label={`Voir l'offre ${offer.title}`}
      className={cn(rowActionClass(), "group")}
    >
      <span className="hidden whitespace-nowrap sm:inline">Voir l'offre</span>
      <ArrowRight className={cn("size-3.5 shrink-0", ARROW_NUDGE)} />
    </Link>
  );
}

function Applications() {
  const { applications, confirm, confirmed } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("toutes");
  const [pick, setPick] = useState<string | null>(null);

  const accepted = applications.filter((a) => a.status === "acceptee");
  const confirmedApp = applications.find((a) => a.status === "confirmee");
  const count = (group: Exclude<Filter, "toutes">) => applications.filter((a) => GROUP[a.status] === group).length;
  const examining = applications.filter((a) => ["envoyee", "examen", "preselectionnee"].includes(a.status)).length;
  const interviews = applications.filter((a) => a.status === "entretien");

  const query = search.trim().toLowerCase();
  const list = [...applications]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((a) => filter === "toutes" || GROUP[a.status] === filter)
    .filter((a) => {
      const offer = offerOf(a.offerId);
      return !query || `${offer.title} ${offer.department} ${STUDENT_STATUS[a.status].label}`.toLowerCase().includes(query);
    });

  const pickApp = pick ? applications.find((a) => a.id === pick) : undefined;
  const pickOffer = pickApp ? offerOf(pickApp.offerId) : null;

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Suivez chaque candidature, de l'envoi à la réponse de l'entreprise. Quand une offre vous est acceptée, confirmez votre stage ici."
        action={
          <Button asChild variant="outline" className="group">
            <Link to="/offres">
              Parcourir les offres
              <ArrowRight className={cn("ml-2 size-4", ARROW_NUDGE)} />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard key="envoyees" label="Candidatures envoyées" value={applications.length} icon={Send} motion="fly" foot={`${plural(count("en_cours"), "candidature")} en cours`} />,
          <StatCard key="examen" label="En cours d'examen" value={examining} icon={UserSearch} motion="pop" foot={examining ? "réponse de l'entreprise attendue" : "aucune en attente"} />,
          <StatCard
            key="entretiens"
            label="Entretiens programmés"
            value={interviews.length}
            icon={CalendarClock}
            motion="tilt"
            foot={interviews[0]?.interview ? `prochain le ${fmtDate(interviews[0].interview.date, false)}` : "aucun à venir"}
          />,
          <StatCard
            key="acceptees"
            label="Propositions acceptées"
            value={count("acceptees")}
            icon={CheckCircle2}
            motion="pop"
            foot={confirmedApp ? "stage confirmé" : accepted.length ? "en attente de votre choix" : "aucune pour le moment"}
            tone={!confirmedApp && accepted.length ? "alert" : "neutral"}
          />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      {/* Décision : une seule proposition peut être confirmée */}
      {!confirmed && accepted.length > 0 && (
        <Reveal as="section" delay={120} className="card-surface overflow-hidden" aria-labelledby="choice-title">
          <div className="border-b px-5 pb-3.5 pt-4">
            <h2 id="choice-title" className="text-[15px] font-semibold tracking-tight">
              {accepted.length > 1 ? "Choisissez votre stage" : "Confirmez votre stage"}
            </h2>
            <p className="mt-0.5 text-pretty text-xs text-muted-foreground">
              {accepted.length > 1
                ? `${accepted.length} entreprises ont accepté votre candidature. Vous ne pouvez en confirmer qu'une : les autres propositions seront déclinées.`
                : "L'entreprise a accepté votre candidature. Confirmez-la pour démarrer le suivi de votre stage."}
            </p>
          </div>
          <ul className="divide-y">
            {accepted.map((a) => {
              const offer = offerOf(a.offerId);
              return (
                <li key={a.id} className="group flex items-center gap-3.5 bg-success-soft/50 px-5 py-3 shadow-[inset_3px_0_0_hsl(var(--success))]">
                  <CompanyMark id={offer.companyId} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-semibold sm:line-clamp-1">{offer.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {offer.department} · {offer.location} · {offer.duration}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPick(a.id)}
                    aria-label={`Choisir le stage ${offer.title}`}
                    className={cn(rowActionClass(true), "group")}
                  >
                    <span className="hidden whitespace-nowrap sm:inline">Choisir ce stage</span>
                    <ArrowRight className={cn("size-3.5 shrink-0", ARROW_NUDGE)} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Reveal>
      )}

      {/* Liste */}
      <Reveal as="section" delay={160} className="card-surface overflow-hidden" aria-labelledby="list-title">
        <div className="flex flex-col gap-3 border-b px-5 pb-3.5 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <h2 id="list-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Toutes mes candidatures
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {applications.length}
              </span>
            </h2>
            <FilterChips
              label="Filtrer les candidatures"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "toutes", label: "Toutes", count: applications.length },
                { value: "en_cours", label: "En cours", count: count("en_cours"), dot: "examen" },
                { value: "acceptees", label: "Acceptées", count: count("acceptees"), dot: "acceptee" },
                { value: "closes", label: "Closes", count: count("closes"), dot: "refusee" },
              ]}
            />
          </div>
          <SearchInput
            id="candidatures-recherche"
            label="Rechercher une candidature"
            placeholder="Rechercher une candidature"
            value={search}
            onChange={setSearch}
            className="w-full lg:w-64"
          />
        </div>
        <p className="sr-only" aria-live="polite">
          {`${plural(list.length, "candidature")} affichée${list.length > 1 ? "s" : ""}`}
        </p>

        {list.length === 0 ? (
          <div className="pb-8">
            <EmptyNote
              icon={Send}
              title={applications.length === 0 ? "Aucune candidature pour le moment" : "Aucune candidature ne correspond"}
              desc={applications.length === 0 ? "Postulez à une offre : elle apparaîtra ici." : "Changez de filtre ou de mot-clé."}
              className="py-10"
            />
            <div className="flex justify-center">
              {applications.length === 0 ? (
                <Link to="/offres" className={SECTION_LINK}>
                  Parcourir les offres
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFilter("toutes");
                    setSearch("");
                  }}
                  className={SECTION_LINK}
                >
                  Tout afficher
                </button>
              )}
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {list.map((a, index) => {
              const offer = offerOf(a.offerId);
              return (
                <Reveal as="li" key={a.id} delay={index < 8 ? 200 + index * 40 : 0} className="group">
                  <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5 transition-colors duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-muted/40 sm:grid-cols-[36px_minmax(0,1fr)_120px_130px_auto]">
                    <CompanyMark id={offer.companyId} className="size-9" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[13px] font-semibold sm:line-clamp-1">{offer.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {companyOf(offer.companyId).name} · {offer.department}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:hidden">
                        <StatusBadge status={a.status} />
                        <span className="text-xs text-muted-foreground">{fmtDate(a.date, false)}</span>
                      </div>
                      {a.interview && a.status === "entretien" && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                          <CalendarClock className="size-3.5 shrink-0" />
                          <span className="truncate">
                            Entretien le {fmtDate(a.interview.date, false)} à {a.interview.time} · {a.interview.place}
                          </span>
                        </p>
                      )}
                    </div>
                    <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                      <span className="sr-only">Envoyée le </span>
                      {fmtDate(a.date)}
                    </span>
                    <span className="hidden sm:block">
                      <StatusBadge status={a.status} />
                    </span>
                    <RowAction application={a} />
                  </div>
                </Reveal>
              );
            })}
          </ul>
        )}
      </Reveal>

      <Modal
        open={Boolean(pickOffer)}
        onClose={() => setPick(null)}
        icon={CheckCircle2}
        title="Confirmer ce stage ?"
        description={pickOffer ? `${pickOffer.title} · ${companyOf(pickOffer.companyId).name}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setPick(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!pick) return;
                confirm(pick);
                setPick(null);
                toast.success("Stage confirmé", { description: "Le suivi de votre stage est maintenant ouvert." });
              }}
            >
              Confirmer mon choix
            </Button>
          </>
        }
      >
        <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
          Ce choix est définitif.
          {accepted.length > 1 &&
            ` ${accepted.length - 1 > 1 ? `Les ${accepted.length - 1} autres propositions seront déclinées` : "L'autre proposition sera déclinée"} et les entreprises concernées en seront informées.`}
        </p>
        {pickOffer && (
          <dl className="mt-4 grid grid-cols-3 rounded-lg border py-3 text-[13px] sm:divide-x">
            {[
              { label: "Service", value: pickOffer.department },
              { label: "Lieu", value: pickOffer.location },
              { label: "Durée", value: pickOffer.duration },
            ].map((fact) => (
              <div key={fact.label} className="min-w-0 px-3.5">
                <dt className="text-[11px] font-medium text-muted-foreground">{fact.label}</dt>
                <dd className="mt-0.5 truncate font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  );
}
