import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bookmark, Building2, CalendarClock, Check, Send, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CompanyMark, StatusBadge, deadlineLabel } from "@/components/app/ui";
import { ARROW_NUDGE, Badge, EmptyNote, Modal, SECTION_LINK, iconMotion } from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { fmtDate, localIsoDate } from "@/lib/dates";
import { companyOf, offerOf } from "@/lib/mock-data";
import { COMPLETION_FIELDS, canApply, missingEssentials } from "@/lib/rules";
import { useStore } from "@/lib/store";
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

function BackLink() {
  return (
    <Link
      to="/offres"
      className="press group inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:-translate-x-1 motion-reduce:transition-none" />
      Offres de stage
    </Link>
  );
}

function OfferDetail() {
  const { profile, applications, addApplication, saved, toggleSave } = useStore();
  const offer = offerOf(Route.useParams().id);
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
  const isSaved = saved.includes(offer.id);
  const mine = new Set(profile.competences.map((skill) => skill.toLowerCase()));
  const matching = offer.skills.filter((skill) => mine.has(skill.toLowerCase())).length;
  const missing = missingEssentials(profile).map((key) => COMPLETION_FIELDS.find((f) => f.key === key)?.label ?? key);

  const send = () => {
    addApplication({ id: `a-${Date.now()}`, offerId: offer.id, date: localIsoDate(), status: "envoyee" });
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
              <h3 className="flex items-baseline justify-between gap-3 text-[13px] font-semibold">
                Compétences demandées
                <span className="text-xs font-normal tabular-nums text-muted-foreground">
                  {matching}/{offer.skills.length} en commun avec votre profil
                </span>
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {offer.skills.map((skill) => {
                  const hit = mine.has(skill.toLowerCase());
                  return (
                    <span
                      key={skill}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs",
                        hit ? "bg-primary-soft font-medium text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {hit && <Check className="size-3" aria-label="Vous possédez cette compétence" />}
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ============================ Colonne latérale ============================ */}
        <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2 xl:flex xl:flex-col">
          <Reveal delay={80} className="card-surface p-5">
            <h2 className="text-[15px] font-semibold tracking-tight">Votre candidature</h2>
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
            ) : deadline.closed ? (
              <p className="mt-3 text-[13px] text-muted-foreground">Les candidatures sont closes depuis le {fmtDate(offer.deadline)}.</p>
            ) : (
              <div className="mt-3 space-y-3">
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
          </Reveal>
        </aside>
      </div>

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
