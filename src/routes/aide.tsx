import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, FileText, Lock, ShieldCheck, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { ARROW_NUDGE, PageIntro, SectionHeader } from "@/components/company/ui";
import { Reveal } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aide")({
  head: () => ({
    meta: [
      { title: "Aide — StageManager" },
      { name: "description", content: "Centre d'aide et questions fréquentes de StageManager." },
    ],
  }),
  component: AidePage,
});

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Comment postuler à une offre ?",
    a: (
      <>
        Ouvrez <Link to="/offres" className="font-medium text-primary underline-offset-2 hover:underline">Offres de stage</Link>, choisissez une offre,
        puis « Postuler à cette offre ». L'entreprise reçoit votre profil, vos compétences et votre CV. Vous suivez ensuite la réponse dans
        « Mes candidatures ».
      </>
    ),
  },
  {
    q: "Pourquoi le bouton « Postuler » n'apparaît-il pas ?",
    a: "Il faut d'abord renseigner les informations essentielles de votre profil : nom, prénom, e-mail, téléphone, université, filière, niveau d'études et CV. Le détail de l'offre indique ce qui manque. Vous ne pouvez pas non plus postuler deux fois à la même offre.",
  },
  {
    q: "Plusieurs entreprises m'ont accepté : que faire ?",
    a: "Vous ne pouvez confirmer qu'un seul stage. Dans « Mes candidatures », choisissez la proposition qui vous convient : les autres sont déclinées automatiquement et les entreprises concernées en sont informées. Ce choix est définitif.",
  },
  {
    q: "Comment fonctionne le système expert ?",
    a: "Une fois votre stage confirmé, le système expert compare votre profil (filière, niveau, compétences) aux besoins des services de l'entreprise et propose une affectation, avec son explication. La décision finale appartient toujours à l'entreprise.",
  },
  {
    q: "Où trouver mon attestation de fin de stage ?",
    a: "Dans « Documents », après l'évaluation finale et sa validation par l'entreprise. Elle porte une référence unique et un code QR qui permet d'en vérifier l'authenticité.",
  },
];

const PRIVACY = [
  { icon: Lock, text: "Votre e-mail et votre téléphone restent privés par défaut." },
  { icon: UserCheck, text: "Votre numéro de téléphone n'est communiqué à une entreprise qu'après votre sélection et votre confirmation." },
  { icon: FileText, text: "Votre CV n'est accessible qu'aux entreprises auxquelles vous avez postulé." },
  { icon: Users, text: "Les données de chaque entreprise sont isolées : une entreprise ne voit pas celles d'une autre." },
];

const STEPS = [
  { title: "Compléter mon profil", desc: "Parcours, compétences et CV", to: "/profil" },
  { title: "Postuler aux offres", desc: "Les compétences en commun sont cochées", to: "/offres" },
  { title: "Confirmer mon stage", desc: "Une seule proposition acceptée", to: "/candidatures" },
  { title: "Suivre mon stage", desc: "Calendrier, encadreur, documents", to: "/stage" },
];

function AidePage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      <PageIntro desc="Les réponses aux questions les plus fréquentes sur la recherche et le suivi de votre stage." />

      <div className="flex flex-col gap-6">
        <Reveal as="section" className="card-surface overflow-hidden" aria-labelledby="faq-title">
          <div className="border-b px-5 pb-3.5 pt-4">
            <h2 id="faq-title" className="text-[15px] font-semibold tracking-tight">
              Questions fréquentes
            </h2>
          </div>
          <ul className="divide-y">
            {FAQ.map((item, index) => {
              const expanded = open === index;
              return (
                <li key={item.q}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`faq-${index}`}
                      onClick={() => setOpen(expanded ? null : index)}
                      className="group flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-sm font-semibold transition-colors duration-200 hover:bg-muted/40 hover:text-primary focus-visible:outline-offset-[-3px]"
                    >
                      {item.q}
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground transition-[transform,color] duration-300 group-hover:text-primary [transition-timing-function:var(--ease-soft)]",
                          expanded && "rotate-180"
                        )}
                      />
                    </button>
                  </h3>
                  <div id={`faq-${index}`} hidden={!expanded} className="px-5 pb-4">
                    <p className="max-w-[68ch] text-pretty text-[13px] leading-relaxed text-muted-foreground">{item.a}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <aside className="order-first grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
          <Reveal delay={80} className="card-surface p-5">
            <SectionHeader title="Votre parcours" description="Les quatre étapes, dans l'ordre" />
            <ol className="-mx-5 mt-4 divide-y border-t">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <Link to={step.to} className="group flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-offset-[-3px]">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold tabular-nums text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold transition-colors group-hover:text-primary">{step.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{step.desc}</span>
                    </span>
                    <ArrowRight className={cn("size-3.5 shrink-0 text-muted-foreground group-hover:text-primary", ARROW_NUDGE)} />
                  </Link>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={140} className="card-surface p-5">
            <SectionHeader title="Confidentialité" />
            <ul className="mt-4 space-y-3">
              {PRIVACY.map((item) => (
                <li key={item.text} className="flex gap-3 text-[13px] leading-relaxed text-muted-foreground">
                  <item.icon className="mt-0.5 size-4 shrink-0" />
                  {item.text}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex gap-3 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0" />
              Vous pouvez masquer votre profil à tout moment depuis la page Profil.
            </p>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
