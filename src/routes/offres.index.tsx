import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, Briefcase, CalendarClock, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StudentOfferCard, offersReturn } from "@/components/app/ui";
import {
  EmptyNote,
  FilterChips,
  PageIntro,
  SECTION_LINK,
  SearchInput,
  Select,
  StatCard,
} from "@/components/company/ui";
import { Reveal } from "@/components/ui/motion";
import { daysFromToday } from "@/lib/dates";
import { usePublishedOffers, useStore } from "@/lib/store";
import { matchOffer, rankOffers } from "@/lib/offer-matching";

type Filter = "toutes" | "pour_vous" | "enregistrees" | "postulees";
type Sort = "recentes" | "cloture" | "competences";
type OffersSearch = { q?: string; filtre?: Filter; tri?: Sort };

const FILTERS: Filter[] = ["toutes", "pour_vous", "enregistrees", "postulees"];
const SORTS: Sort[] = ["recentes", "cloture", "competences"];

/** Filtres, tri et recherche vivent dans l'adresse : ils survivent au retour depuis le détail d'une offre. */
export const Route = createFileRoute("/offres/")({
  validateSearch: (s: Record<string, unknown>): OffersSearch => ({
    ...(typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {}),
    ...(FILTERS.includes(s["filtre"] as Filter) && s["filtre"] !== "toutes" ? { filtre: s["filtre"] as Filter } : {}),
    ...(SORTS.includes(s["tri"] as Sort) && s["tri"] !== "recentes" ? { tri: s["tri"] as Sort } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Offres de stage — StageManager" },
      { name: "description", content: "Recherchez et filtrez les offres de stage disponibles sur StageManager." },
    ],
  }),
  component: Offers,
});

const CLOSING_DAYS = 14;
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

function Offers() {
  const { q = "", filtre: filter = "toutes", tri: sort = "recentes" } = Route.useSearch();
  const navigate = useNavigate({ from: "/offres/" });
  offersReturn.current = Route.useSearch();
  const { saved, applications, profile } = useStore();
  // Le texte tapé reste local (saisie fluide) et se recopie dans l'adresse.
  const [search, setSearchText] = useState(q);
  useEffect(() => setSearchText(q), [q]);
  const update = (patch: OffersSearch) =>
    navigate({
      search: (prev: OffersSearch) => {
        const next = { ...prev, ...patch };
        return {
          ...(next.q ? { q: next.q } : {}),
          ...(next.filtre && next.filtre !== "toutes" ? { filtre: next.filtre } : {}),
          ...(next.tri && next.tri !== "recentes" ? { tri: next.tri } : {}),
        };
      },
      replace: true,
    });
  const setSearch = (value: string) => {
    setSearchText(value);
    update({ q: value.trim() ? value : undefined });
  };
  const setFilter = (value: Filter) => update({ filtre: value });
  const setSort = (value: Sort) => update({ tri: value });

  const appliedBy = useMemo(() => new Map(applications.map((a) => [a.offerId, a.status])), [applications]);

  // Les offres publiées par l'entreprise : un brouillon ou une offre clôturée n'apparaît pas.
  const offers = usePublishedOffers();
  const open = offers.filter((o) => daysFromToday(o.deadline) >= 0);
  // « Pour vous » : les offres que le système expert recommande, auxquelles l'étudiant n'a pas encore postulé.
  const forYou = open.filter((o) => !appliedBy.has(o.id) && matchOffer(profile, o).verdict === "recommandee");
  const rank = new Map(rankOffers(profile, offers).map((entry, index) => [entry.offer.id, index]));
  const closingSoon = open.filter((o) => daysFromToday(o.deadline) <= CLOSING_DAYS);

  const inFilter = (id: string) =>
    filter === "toutes" ||
    (filter === "pour_vous" && forYou.some((o) => o.id === id)) ||
    (filter === "enregistrees" && saved.includes(id)) ||
    (filter === "postulees" && appliedBy.has(id));

  const query = search.trim().toLowerCase();
  const list = offers
    .filter((o) => inFilter(o.id))
    .filter((o) => !query || `${o.title} ${o.department} ${o.location} ${o.level} ${o.skills.join(" ")}`.toLowerCase().includes(query))
    .sort((a, b) => {
      if (sort === "cloture") return a.deadline.localeCompare(b.deadline);
      if (sort === "competences") return (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0);
      return b.published.localeCompare(a.published);
    });

  const reset = () => {
    setFilter("toutes");
    setSearch("");
  };

  return (
    <div className="space-y-6">
      <PageIntro desc="Parcourez les offres de stage, enregistrez celles qui vous intéressent et postulez en un clic. Les compétences que vous possédez sont cochées." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard key="ouvertes" label="Offres ouvertes" value={open.length} icon={Briefcase} motion="lift" foot={`sur ${plural(offers.length, "offre")} publiée${offers.length > 1 ? "s" : ""}`} />,
          <StatCard key="pour-vous" label="Pour votre profil" value={forYou.length} icon={Sparkles} motion="pop" foot="recommandées par le système expert" />,
          <StatCard key="enregistrees" label="Offres enregistrées" value={saved.length} icon={Bookmark} motion="lift" foot={saved.length ? "à relire avant de postuler" : "aucune pour le moment"} />,
          <StatCard
            key="cloture"
            label="Clôture proche"
            value={closingSoon.length}
            icon={CalendarClock}
            motion="tilt"
            foot={`sous ${CLOSING_DAYS} jours`}
            tone={closingSoon.length ? "alert" : "neutral"}
          />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label="Filtrer les offres"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "toutes", label: "Toutes", count: offers.length },
            { value: "pour_vous", label: "Pour vous", count: forYou.length },
            { value: "enregistrees", label: "Enregistrées", count: saved.length },
            { value: "postulees", label: "Postulées", count: appliedBy.size },
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput
            id="offres-recherche"
            label="Rechercher une offre"
            placeholder="Intitulé, service, ville, compétence"
            value={search}
            onChange={setSearch}
            className="w-full sm:w-72"
          />
          <Select
            aria-label="Trier les offres"
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="h-9 sm:w-52"
          >
            <option value="recentes">Plus récentes</option>
            <option value="cloture">Clôture la plus proche</option>
            <option value="competences">Pertinence (système expert)</option>
          </Select>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {`${plural(list.length, "offre")} affichée${list.length > 1 ? "s" : ""}`}
      </p>
      {filter === "pour_vous" && (
        <p className="-mt-3 text-pretty text-xs text-muted-foreground">
          Le système expert compare votre profil à chaque offre : niveau d'études, formation, compétences et date limite. Il recommande les offres ouvertes qui satisfont au moins 3 de ces 4 règles.
        </p>
      )}

      {list.length === 0 ? (
        <div className="card-surface">
          <EmptyNote
            icon={Briefcase}
            title={query ? "Aucune offre ne correspond à votre recherche" : "Aucune offre dans cette catégorie"}
            desc={query ? "Essayez un autre mot-clé." : "Changez de filtre pour voir d'autres offres."}
            className="py-12"
          />
          <div className="-mt-6 flex justify-center pb-10">
            <button type="button" onClick={reset} className={SECTION_LINK}>
              Tout afficher
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:gap-6 2xl:grid-cols-3">
          {list.map((offer, index) => (
            <Reveal key={offer.id} delay={index < 6 ? 80 + index * 50 : 0} className="min-w-0">
              <StudentOfferCard offer={offer} applied={appliedBy.get(offer.id)} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
