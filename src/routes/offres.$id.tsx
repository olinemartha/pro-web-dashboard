import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bookmark, Building2, CalendarClock, Send, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CompanyMark, StatusBadge, deadlineLabel, offersReturn } from "@/components/app/ui";
import { CriteriaList } from "@/components/app/assignment";
import { matchOffer, VERDICT_LABELS } from "@/lib/offer-matching";
import { ARROW_NUDGE, Badge, EmptyNote, Modal, SECTION_LINK, StatusDot, iconMotion } from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { daysFromToday, fmtDate } from "@/lib/dates";
import { companyOf, offerOf } from "@/lib/mock-data";
import { COMPLETION_FIELDS, canApply, missingEssentials } from "@/lib/rules";
import { useOfferIsOpen, usePublishedOffers, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/offres/$id")({
  head: ({ params }) => {
    const o = offerOf(params.id);
    return {
      meta: [
        { title: o ? `${o.title} — StageManager` : "Offre — StageManager" },
        { name: "description", content: o ? o.description : "" },
      ],
    };
  },
  component: OfferDetail,
});

/** Les étapes du recrutement, aux couleurs du pipeline (mêmes statuts que dans « Mes candidatures »). */
const RECRUITMENT_STEPS = [
  { title: "Envoyée", desc: "L'entreprise reçoit votre profil et votre CV.", dot: "en_attente" },
  { title: "En examen", desc: "Elle étudie votre profil.", dot: "examen" },
  { title: "Entretien", desc: "Si votre profil est retenu.", dot: "entretien" },
  { title: "Réponse", desc: "Vous confirmez ou non le stage.", dot: "acceptee" },
] as const;

function BackLink() {
  return (
    <Link
      to="/offres"
      search={offersReturn.current}
      className="press group inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:-translate-x-1 motion-reduce:transition-none" />
      Offres de stage
    </Link>
  );
}

function OfferDetail() {
  const { profile, applications, apply, saved, toggleSave } = useStore();
  const published = usePublishedOffers();
  const offerId = Route.useParams().id;
  const offer = offerOf(offerId);
  // L'entreprise peut clôturer ou désactiver l'offre : on ne peut plus y postuler.
  const isOpen = useOfferIsOpen(offerId);
  const [confirming, setConfirming] = useState(false);

  if (!offer) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="card-surface">
          <EmptyNote icon={Building2} title="Offre introuvable" desc="Cette offre a peut-être été retirée par l'entreprise." className="py-12" />
        </div>
      </div>
    );
  }

  const company = companyOf(offer.companyId);
  const application = applications.find((a) => a.offerId === offer.id);
  const can = canApply(profile, applications, offer.id);
  const deadline = deadlineLabel(offer.deadline);
  const closed = deadline.closed || !isOpen;
  const isSaved = saved.includes(offer.id);
  // Système expert : ce profil correspond-il à cette offre ? (règles O1 à O4, expliquées)
  const match = matchOffer(profile, offer);
  const missing = missingEssentials(profile).map((key) => COMPLETION_FIELDS.find((f) => f.key === key)?.label ?? key);

  const send = () => {
    apply(offer.id);
    setConfirming(false);
    toast.success("Candidature envoyée", { description: `${company.name} a reçu votre profil et votre CV.` });
  };

  const facts = [
    { label: "Lieu", value: offer.location },
    { label: "Durée", value: offer.duration },
    { label: "Niveau requis", value: offer.level },
    { label: "Date limite", value: fmtDate(offer.deadline) },
  ];

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ============================ L'offre ============================ */}
        <Reveal as="section" className="card-surface p-5 sm:p-6" aria-labelledby="offer-title">
          <div className="flex items-start gap-4">
            <CompanyMark id={offer.companyId} className="size-12 text-sm" />
            <div className="min-w-0 flex-1">
              <h2 id="offer-title" className="text-pretty text-xl font-semibold leading-snug tracking-tight">
                {offer.title}
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {company.name} · {offer.department}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Badge label={offer.type} tone="primary" />
                <Badge label={`Publiée le ${fmtDate(offer.published, false)}`} />
              </div>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-y-4 rounded-xl border py-3.5 sm:grid-cols-4 sm:divide-x">
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0 px-4">
                <dt className="text-[11px] font-medium text-muted-foreground">{fact.label}</dt>
                <dd className="mt-0.5 truncate text-[13px] font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-[13px] font-semibold">À propos du stage</h3>
              <p className="mt-1.5 max-w-[68ch] text-pretty text-sm leading-relaxed text-muted-foreground">{offer.description}</p>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold">Missions</h3>
              <ul className="mt-2 space-y-2">
                {offer.missions.map((mission) => (
                  <li key={mission} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {mission}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold">Profil recherché</h3>
              <p className="mt-1.5 max-w-[68ch] text-pretty text-sm leading-relaxed text-muted-foreground">{offer.profile}</p>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold">Après votre candidature</h3>
              <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                {RECRUITMENT_STEPS.map((step) => (
                  <li key={step.title} className="min-w-0 border-t pt-2.5">
                    <span className="flex items-center gap-1.5 text-[13px] font-medium">
                      <StatusDot status={step.dot} />
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-pretty text-xs leading-relaxed text-muted-foreground">{step.desc}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>

        {/* ============================ Colonne latérale ============================ */}
        <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2 xl:flex xl:flex-col">
          <Reveal delay={80} className="card-surface p-5">
            <h2 className="text-[15px] font-semibold tracking-tight">Votre candidature</h2>
            <div className="mt-4 border-b pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-[13px] font-semibold">
                  <Sparkles className="size-3.5 text-primary" aria-hidden />
                  Analyse du système expert
                </h3>
                <Badge
                  label={`${VERDICT_LABELS[match.verdict]} · ${match.met}/4`}
                  tone={match.verdict === "recommandee" ? "primary" : "muted"}
                  className="text-[11px]"
                />
              </div>
              <p className="mt-1 text-pretty text-xs text-muted-foreground">
                Votre profil comparé à cette offre, règle par règle.
              </p>
              <div className="mt-3">
                <CriteriaList criteria={match.criteria} />
              </div>
            </div>
            {application ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-muted-foreground">Envoyée le {fmtDate(application.date)}</span>
                  <StatusBadge status={application.status} />
                </div>
                {application.interview && (
                  <p className="flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2.5 text-[13px] text-primary">
                    <CalendarClock className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Entretien le <span className="font-semibold">{fmtDate(application.interview.date, false)}</span> à{" "}
                      {application.interview.time} · {application.interview.place}
                    </span>
                  </p>
                )}
                <Link to="/candidatures" className={cn(SECTION_LINK, "w-full justify-center")}>
                  Suivre mes candidatures
                  <ArrowRight className={cn("size-3.5", ARROW_NUDGE)} />
                </Link>
              </div>
            ) : closed ? (
              <p className="mt-4 text-[13px] text-muted-foreground">
                {deadline.closed
                  ? `Les candidatures sont closes depuis le ${fmtDate(offer.deadline)}.`
                  : "L'entreprise a clôturé cette offre : elle n'accepte plus de candidatures."}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                <p className={cn("text-[13px]", deadline.urgent ? "font-medium text-warning" : "text-muted-foreground")}>
                  {deadline.label} · {fmtDate(offer.deadline)}
                </p>
                {!can.ok && can.reason === "profil" && (
                  <div className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2.5 text-[13px]">
                    <p className="font-medium text-warning">Complétez votre profil pour postuler</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Il manque : {missing.join(", ").toLowerCase()}.</p>
                  </div>
                )}
                {can.ok ? (
                  <Button className="group w-full" onClick={() => setConfirming(true)}>
                    <Send className={iconMotion("fly", "mr-2 size-4")} />
                    Postuler à cette offre
                  </Button>
                ) : (
                  <Button asChild className="group w-full">
                    <Link to="/profil">
                      <UserRound className={iconMotion("pop", "mr-2 size-4")} />
                      Compléter mon profil
                    </Link>
                  </Button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                toggleSave(offer.id);
                toast.success(isSaved ? "Offre retirée de vos favoris" : "Offre enregistrée", { description: offer.title });
              }}
              aria-pressed={isSaved}
              className={cn(
                "press mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-colors",
                isSaved ? "text-primary hover:bg-primary-soft" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Bookmark className={cn("size-4", isSaved && "fill-current")} />
              {isSaved ? "Offre enregistrée" : "Enregistrer l'offre"}
            </button>
          </Reveal>

          <Reveal delay={140} className="card-surface p-5 xl:flex-1">
            <h2 className="text-[15px] font-semibold tracking-tight">L'entreprise</h2>
            <div className="mt-4 flex items-center gap-3">
              <CompanyMark id={offer.companyId} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{company.name}</p>
                <p className="truncate text-xs text-muted-foreground">Microfinance · {offer.location.split(",")[0]}</p>
              </div>
            </div>
            <p className="mt-3 text-pretty text-[13px] leading-relaxed text-muted-foreground">{company.about}</p>
            <dl className="mt-4 grid grid-cols-2 divide-x rounded-xl border py-3">
              <div className="px-3.5">
                <dt className="text-[11px] font-medium text-muted-foreground">Offres ouvertes</dt>
                <dd className="mt-0.5 text-[13px] font-semibold tabular-nums">
                  {published.filter((o) => o.companyId === offer.companyId && daysFromToday(o.deadline) >= 0).length}
                </dd>
              </div>
              <div className="min-w-0 px-3.5">
                <dt className="text-[11px] font-medium text-muted-foreground">Service</dt>
                <dd className="mt-0.5 truncate text-[13px] font-semibold">{offer.department}</dd>
              </div>
            </dl>
          </Reveal>
        </aside>
      </div>

      {/* Téléphone et tablette : l'action reste à portée de pouce pendant la lecture de l'offre */}
      {!application && !closed && (
        <div className="sticky bottom-3 z-20 xl:hidden">
          <div className="flex items-center gap-3 rounded-xl border bg-popover px-4 py-3 shadow-lg">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{can.ok ? "Cette offre vous intéresse ?" : "Profil à compléter"}</p>
              <p className={cn("truncate text-xs", deadline.urgent ? "font-medium text-warning" : "text-muted-foreground")}>{deadline.label}</p>
            </div>
            {can.ok ? (
              <Button size="sm" className="group shrink-0" onClick={() => setConfirming(true)}>
                <Send className={iconMotion("fly", "mr-1.5 size-4")} />
                Postuler
              </Button>
            ) : (
              <Button asChild size="sm" className="shrink-0">
                <Link to="/profil">Compléter</Link>
              </Button>
            )}
          </div>
        </div>
      )}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        icon={Send}
        title="Envoyer votre candidature ?"
        description={`${offer.title} · ${company.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Annuler
            </Button>
            <Button onClick={send}>Envoyer ma candidature</Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-muted-foreground">L'entreprise recevra :</p>
        <ul className="mt-2 divide-y rounded-lg border text-[13px]">
          <li className="flex justify-between gap-3 px-3.5 py-2.5">
            <span className="text-muted-foreground">Profil</span>
            <span className="truncate font-medium">
              {profile.prenom} {profile.nom} · {profile.filiere}
            </span>
          </li>
          <li className="flex justify-between gap-3 px-3.5 py-2.5">
            <span className="text-muted-foreground">CV</span>
            <span className="truncate font-medium">{profile.cv?.name ?? "—"}</span>
          </li>
          <li className="flex justify-between gap-3 px-3.5 py-2.5">
            <span className="text-muted-foreground">Compétences</span>
            <span className="truncate font-medium">{profile.competences.join(", ")}</span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Vous suivrez son avancement dans « Mes candidatures ».</p>
      </Modal>
    </div>
  );
}
