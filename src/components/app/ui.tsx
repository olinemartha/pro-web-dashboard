import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Check, Clock, GraduationCap, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Badge, CARD_INTERACTIVE, type Tone } from "@/components/company/ui";
import type { CandidateStatus } from "@/lib/company-data";
import { daysFromToday, fmtDate } from "@/lib/dates";
import { companyOf, type Offer } from "@/lib/mock-data";
import type { AppStatus } from "@/lib/rules";
import { STATUS_LABELS } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Titre de page porté par la coque                                    */
/* ------------------------------------------------------------------ */

/**
 * Chaque coque nomme la page courante dans sa barre supérieure persistante.
 * Le contexte transmet ce titre aux pages.
 */
const ShellPageTitleContext = React.createContext<string | null>(null);

export function ShellPageTitleProvider({ title, children }: { title: string | null; children: React.ReactNode }) {
  return <ShellPageTitleContext.Provider value={title}>{children}</ShellPageTitleContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Statuts de candidature                                              */
/* ------------------------------------------------------------------ */

/** Statut étudiant → ton du badge et couleur du pipeline (mêmes couleurs que l'espace entreprise). */
export const STUDENT_STATUS: Record<AppStatus, { label: string; tone: Tone; dot: CandidateStatus }> = {
  envoyee: { label: STATUS_LABELS.envoyee.label, tone: "muted", dot: "en_attente" },
  examen: { label: STATUS_LABELS.examen.label, tone: "primary", dot: "examen" },
  preselectionnee: { label: STATUS_LABELS.preselectionnee.label, tone: "primary", dot: "examen" },
  entretien: { label: STATUS_LABELS.entretien.label, tone: "primary", dot: "entretien" },
  acceptee: { label: STATUS_LABELS.acceptee.label, tone: "success", dot: "acceptee" },
  confirmee: { label: STATUS_LABELS.confirmee.label, tone: "success", dot: "acceptee" },
  refusee: { label: STATUS_LABELS.refusee.label, tone: "destructive", dot: "refusee" },
  declinee: { label: STATUS_LABELS.declinee.label, tone: "muted", dot: "retiree" },
};

export function StatusBadge({ status, className }: { status: AppStatus; className?: string }) {
  const meta = STUDENT_STATUS[status];
  return <Badge label={meta.label} tone={meta.tone} className={cn("whitespace-nowrap", className)} />;
}

/* ------------------------------------------------------------------ */
/* Entreprise                                                          */
/* ------------------------------------------------------------------ */

export function CompanyMark({ id, className }: { id: string; className?: string }) {
  const company = companyOf(id);
  return (
    <span
      className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground", className)}
      aria-hidden
    >
      {company?.initials ?? "E"}
    </span>
  );
}

/** « Clôture dans 18 j », « Clôturée ». */
export function deadlineLabel(deadline: string) {
  const left = daysFromToday(deadline);
  if (left < 0) return { label: "Candidatures closes", urgent: false, closed: true };
  if (left === 0) return { label: "Clôture aujourd'hui", urgent: true, closed: false };
  if (left === 1) return { label: "Clôture demain", urgent: true, closed: false };
  return { label: `Clôture dans ${left} j`, urgent: left <= 7, closed: false };
}

/* ------------------------------------------------------------------ */
/* Carte d'offre                                                       */
/* ------------------------------------------------------------------ */

/**
 * Carte d'offre de l'espace étudiant : toute la carte ouvre l'offre ;
 * le signet (enregistrer) reste un bouton à part. Les compétences que
 * l'étudiant possède sont cochées.
 */
export function StudentOfferCard({ offer, applied }: { offer: Offer; applied?: AppStatus }) {
  const { saved, toggleSave, profile } = useStore();
  const isSaved = saved.includes(offer.id);
  const mine = new Set(profile.competences.map((skill) => skill.toLowerCase()));
  const matching = offer.skills.filter((skill) => mine.has(skill.toLowerCase())).length;
  const deadline = deadlineLabel(offer.deadline);

  return (
    <article className={cn(CARD_INTERACTIVE, "relative flex h-full cursor-pointer flex-col p-5")}>
      <div className="flex items-start gap-3">
        <CompanyMark id={offer.companyId} />
        <div className="min-w-0 flex-1">
          <h3 className="text-pretty text-[15px] font-semibold leading-snug tracking-tight">
            <Link
              to="/offres/$id"
              params={{ id: offer.id }}
              className="transition-colors after:absolute after:inset-0 after:rounded-xl after:content-[''] group-hover:text-primary focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
            >
              {offer.title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {companyOf(offer.companyId)?.name} · {offer.department}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            toggleSave(offer.id);
            toast.success(isSaved ? "Offre retirée de vos favoris" : "Offre enregistrée", { description: offer.title });
          }}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Retirer ${offer.title} des offres enregistrées` : `Enregistrer ${offer.title}`}
          className={cn(
            "press group/save relative z-10 -mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
            isSaved ? "text-primary hover:bg-primary-soft" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Bookmark className={cn("size-[18px] transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover/save:-translate-y-0.5 motion-reduce:transition-none", isSaved && "fill-current")} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {offer.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" /> {offer.duration}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <GraduationCap className="size-3.5" /> {offer.level}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-pretty text-[13px] leading-relaxed text-muted-foreground">{offer.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {offer.skills.map((skill) => {
          const hit = mine.has(skill.toLowerCase());
          return (
            <span
              key={skill}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                hit ? "bg-primary-soft font-medium text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {hit && <Check className="size-3" aria-label="Vous possédez cette compétence" />}
              {skill}
            </span>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3.5 text-xs">
        {applied ? (
          <StatusBadge status={applied} />
        ) : (
          <span className="tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">{matching}</span>/{offer.skills.length} compétences en commun
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap tabular-nums",
            deadline.urgent ? "font-semibold text-warning" : "text-muted-foreground"
          )}
          title={`Date limite : ${fmtDate(offer.deadline)}`}
        >
          {deadline.urgent && <Clock className="size-3" />}
          {deadline.label}
        </span>
      </div>
    </article>
  );
}
