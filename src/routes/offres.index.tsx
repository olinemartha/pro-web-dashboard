import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, Briefcase, CalendarClock, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { StudentOfferCard } from "@/components/app/ui";
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
import { offers } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/offres/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s["q"] === "string" ? { q: s["q"] } : {}),
  head: () => ({
    meta: [
      { title: "Offres de stage — StageManager" },
      { name: "description", content: "Recherchez et filtrez les offres de stage disponibles sur StageManager." },
    ],
  }),
  component: Offers,
});

type Filter = "toutes" | "pour_vous" | "enregistrees" | "postulees";
type Sort = "recentes" | "cloture" | "competences";

const CLOSING_DAYS = 14;
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

function Offers() {
  const { q: initialQuery } = Route.useSearch();
  const { saved, applications, profile } = useStore();
  const [search, setSearch] = useState(initialQuery ?? "");
  const [filter, setFilter] = useState<Filter>("toutes");
  const [sort, setSort] = useState<Sort>("recentes");

  const mine = useMemo(() => new Set(profile.competences.map((skill) => skill.toLowerCase())), [profile.competences]);
  const appliedBy = useMemo(() => new Map(applications.map((a) => [a.offerId, a.status])), [applications]);
  const matchOf = (skills: string[]) => skills.filter((skill) => mine.has(skill.toLowerCase())).length;

  const open = offers.filter((o) => daysFromToday(o.deadline) >= 0);
  const forYou = open.filter((o) => matchOf(o.skills) >= 2 && !appliedBy.has(o.id));
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
      if (sort === "competences") return matchOf(b.skills) - matchOf(a.skills) || b.published.localeCompare(a.published);
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
          <StatCard key="pour-vous" label="Pour votre profil" value={forYou.length} icon={Sparkles} motion="pop" foot="au moins 2 compétences en commun" />,
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
            <option value="competences">Plus de compétences en commun</option>
          </Select>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {`${plural(list.length, "offre")} affichée${list.length > 1 ? "s" : ""}`}
      </p>

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
