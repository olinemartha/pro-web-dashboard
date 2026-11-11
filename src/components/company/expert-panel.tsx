import { useState } from "react";
import {
  Check,
  ChevronDown,
  FileSearch,
  GraduationCap,
  Info,
  Mail,
  Minus,
  Phone,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ExpertBadge, AvatarInitials, Badge, Field, Modal, SECTION_LINK, Select, textareaClass, type Tone } from "@/components/company/ui";
import { Stamp, stampDate } from "@/components/company/stamp";
import { useCompanyStore } from "@/lib/company-store";
import { fmtDate } from "@/lib/dates";
import type { Candidate, ExpertProposal, ExpertRun, Intern } from "@/lib/company-data";
import { cn } from "@/lib/utils";
import { isRecommendedService, latestRunFor } from "@/lib/expert-engine";

/* ------------------------------------------------------------------ */
/* Outils de rédaction                                                 */
/* ------------------------------------------------------------------ */

function fmtDateTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} à ${date
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    .replace(":", " h ")}`;
}

/** Référence courte et lisible d’une analyse : 6 caractères. */
const shortRef = (id: string) => id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();

const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count > 1 ? many : word}`;

/** Indice d'adéquation à partir des critères satisfaits par la proposition retenue. */
function adequacy(met: number, total: number): { label: string; tone: Tone; bar: string } {
  const ratio = total ? met / total : 0;
  if (ratio >= 1) return { label: "Adéquation forte", tone: "success", bar: "bg-success" };
  if (ratio >= 0.75) return { label: "Bonne adéquation", tone: "primary", bar: "bg-primary" };
  if (ratio >= 0.5) return { label: "Adéquation partielle", tone: "warning", bar: "bg-warning" };
  return { label: "Adéquation faible", tone: "destructive", bar: "bg-destructive" };
}

const metOf = (proposal: ExpertProposal) => proposal.satisfied.filter((criterion) => criterion.satisfied).length;

/** « de Grâce » mais « d’Amina » : élision devant une voyelle ou un h muet. */
const de = (name: string) => (/^[aeiouyhàâäéèêëîïôöûüAEIOUYHÀÂÉÈÊÎÔÛ]/.test(name) ? `d’${name}` : `de ${name}`);

/** Liste française : « a, b et c ». */
function joinFr(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

/** Une raison lisible par règle satisfaite. */
function reasonFor(proposal: ExpertProposal, ruleId: string): string | null {
  const criterion = proposal.satisfied.find((entry) => entry.ruleId === ruleId);
  if (!criterion?.satisfied) return null;
  switch (ruleId) {
    case "R1":
      return "une formation conforme aux attentes du service";
    case "R2": {
      const list = criterion.detail.split(":")[1]?.trim();
      return list ? `des compétences communes (${list})` : "des compétences communes";
    }
    case "R3": {
      const left = proposal.capacityAtRun.left;
      return `${plural(left, "place encore disponible", "places encore disponibles")}`;
    }
    case "R4":
      return "la continuité avec l'offre à laquelle la candidature a été déposée";
    default:
      return criterion.label.toLowerCase();
  }
}

/** Conclusion rédigée du rapport, à partir des seuls résultats du moteur. */
function synthesis(run: ExpertRun, name: string, servicesCount: number) {
  const [top, second] = run.proposals;
  const reasons = run.rules.map((rule) => reasonFor(top, rule.id)).filter(Boolean) as string[];
  const total = top.satisfied.length;
  const met = metOf(top);
  const opening =
    met === 0
      ? `Après comparaison de ${plural(servicesCount, "service")} selon ${plural(run.rules.length, "règle")}, aucun service ne satisfait les critères du profil ${de(name)}. ${top.serviceName} reste le moins éloigné du profil.`
      : `Après comparaison de ${plural(servicesCount, "service")} selon ${plural(run.rules.length, "règle")}, ${top.serviceName} présente la meilleure adéquation avec le profil ${de(name)} : ${joinFr(reasons)}.`;
  let follow = "";
  if (second) {
    const metSecond = metOf(second);
    follow =
      metSecond === met
        ? `${second.serviceName} obtient le même nombre de critères (${met} sur ${total}) ; la capacité et la continuité de l'offre départagent les deux services.`
        : `${second.serviceName} arrive en deuxième position, avec ${metSecond} critère${metSecond > 1 ? "s" : ""} sur ${total}.`;
  }
  return { opening, follow, met, total };
}

/* ------------------------------------------------------------------ */
/* Profil analysé                                                      */
/* ------------------------------------------------------------------ */

function AnalyzedProfile({
  intern,
  candidate,
  offerTitle,
  expectedSkills,
  recommended,
}: {
  intern: Intern;
  candidate?: Candidate;
  offerTitle: string;
  expectedSkills: string[];
  recommended?: string;
}) {
  const expected = new Set(expectedSkills.map((skill) => skill.toLowerCase()));
  const skills = candidate?.competences ?? [];
  const matching = skills.filter((skill) => expected.has(skill.toLowerCase())).length;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4">
        {candidate?.photo ? (
          <img
            src={candidate.photo}
            alt={`Photo de ${intern.name}`}
            className="size-16 shrink-0 rounded-2xl object-cover ring-4 ring-primary-soft"
          />
        ) : (
          <AvatarInitials initials={intern.initials} className="size-16 shrink-0 rounded-2xl text-lg ring-4 ring-primary-soft" />
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight">{intern.name}</p>
          <p className="truncate text-[13px] text-muted-foreground">{offerTitle}</p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-[13px]">
        <div className="flex items-start gap-2.5">
          <GraduationCap className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <dt className="sr-only">Formation</dt>
            <dd className="font-medium">
              {candidate?.filiere ?? "Filière non renseignée"} · {candidate?.niveau ?? "Niveau non renseigné"}
            </dd>
            <dd className="text-xs text-muted-foreground">{candidate?.universite ?? "Université non renseignée"}</dd>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t pt-3">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Période de stage</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {intern.start ? `${fmtDate(intern.start, false)} → ${fmtDate(intern.end, false)}` : "À définir"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Candidature reçue</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{candidate ? fmtDate(candidate.appliedAt) : "—"}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-4 border-t pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs text-muted-foreground">Compétences déclarées</p>
          {recommended && expectedSkills.length > 0 && (
            <p className="text-xs tabular-nums text-muted-foreground">
              <span className="font-semibold text-primary">{matching}</span> utiles à {recommended}
            </p>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.length === 0 ? (
            <span className="text-[13px] font-medium text-warning">Non renseignées</span>
          ) : (
            skills.map((skill) => {
              const hit = expected.has(skill.toLowerCase());
              return (
                <span
                  key={skill}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs",
                    hit ? "bg-primary-soft font-medium text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {hit && <Check className="size-3" aria-label="attendue par le service recommandé" />}
                  {skill}
                </span>
              );
            })
          )}
        </div>
      </div>

      {candidate && (
        <div className="mt-auto space-y-1.5 border-t pt-4 text-xs">
          <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
            <Mail className="size-3.5 shrink-0" /> <span className="truncate">{candidate.email}</span>
          </a>
          <a href={`tel:${candidate.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
            <Phone className="size-3.5 shrink-0" /> {candidate.phone}
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rapport                                                             */
/* ------------------------------------------------------------------ */

export function ExpertPanel({ intern }: { intern: Intern }) {
  const { offers, services, candidates, expertRuns, decisions, runExpertAnalysis, validateAssignment } = useCompanyStore();

  const offer = offers.find((entry) => entry.id === intern.offerId);
  const candidate = candidates.find((entry) => entry.id === intern.candidateId);
  const latestRun = latestRunFor(expertRuns, intern.id);
  const decision = decisions.find((entry) => entry.internId === intern.id);
  const top = latestRun?.status === "prete" ? latestRun.proposals[0] : undefined;
  const topService = top ? services.find((service) => service.id === top.serviceId) : undefined;
  const retainedId = decision?.serviceId ?? (intern.confirmed ? intern.serviceId : undefined);

  const recommendedId = latestRun?.proposals[0]?.serviceId ?? "";
  const [selected, setSelected] = useState(recommendedId);
  const [otherServiceId, setOtherServiceId] = useState("");
  const [custom, setCustom] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [traceOpen, setTraceOpen] = useState(false);
  const [openDetail, setOpenDetail] = useState<string | null>(null);

  const targetServiceId = custom ? otherServiceId : selected;
  const targetIsRecommended = isRecommendedService(latestRun, targetServiceId);

  const relaunch = () => {
    const run = runExpertAnalysis(intern.id);
    if (!run) return;
    setCustom(false);
    setOtherServiceId("");
    setSelected(run.proposals[0]?.serviceId ?? "");
    setError("");
    toast.success("Analyse relancée", {
      description: `Nouvelle analyse : ${plural(run.proposals.length, "proposition")}.`,
    });
  };

  const submitDecision = () => {
    if (!targetServiceId) {
      setError("Choisissez un service d'affectation.");
      return;
    }
    if (!targetIsRecommended && !reason.trim()) {
      setError("Un motif est requis lorsque vous vous écartez de la recommandation du système expert.");
      return;
    }
    const service = services.find((entry) => entry.id === targetServiceId);
    const result = validateAssignment(intern.id, targetServiceId, reason);
    if (!result.ok) {
      setError(result.error ?? "L'affectation n'a pas pu être validée.");
      return;
    }
    setError("");
    toast.success("Affectation validée", { description: `${intern.name} — ${service?.name ?? "service retenu"}` });
  };

  const summary = top && latestRun ? synthesis(latestRun, intern.name, services.length) : null;
  const level = summary ? adequacy(summary.met, summary.total) : null;
  const profile = (
    <AnalyzedProfile
      intern={intern}
      candidate={candidate}
      offerTitle={offer?.title ?? "Offre introuvable"}
      expectedSkills={topService?.skills ?? []}
      recommended={top?.serviceName}
    />
  );

  return (
    <section id="affectation" className="scroll-mt-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ================= Le rapport ================= */}
        <article className="card-surface flex flex-col overflow-hidden" aria-labelledby={`rapport-${intern.id}`}>
          {/* En-tête du document */}
          <header className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" aria-hidden /> Système expert StageManager
              </p>
              <h2 id={`rapport-${intern.id}`} className="mt-1 text-lg font-semibold tracking-tight">
                Rapport d'expertise d'affectation
              </h2>
              {latestRun && (
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  Généré le {fmtDateTime(latestRun.createdAt)} · Réf. {shortRef(latestRun.id)} · Version {latestRun.engineVersion}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {intern.confirmed ? (
                <Badge label="Affectation confirmée" tone="success" />
              ) : (
                <Badge label="Affectation à valider" tone="warning" />
              )}
              <button type="button" onClick={relaunch} className={cn(SECTION_LINK, "group/relance")}>
                <RefreshCw className="size-3.5 transition-transform duration-500 [transition-timing-function:var(--ease-soft)] group-hover/relance:rotate-180 motion-reduce:transition-none" />
                Relancer l'analyse
              </button>
            </div>
          </header>

          {/* Sur téléphone et tablette, le profil analysé ouvre le rapport. */}
          <div className="border-b px-6 py-5 xl:hidden">{profile}</div>

          {!latestRun ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <FileSearch className="size-7 text-muted-foreground" />
              <p className="mt-3 text-[15px] font-semibold">Aucune analyse pour ce dossier</p>
              <p className="mt-1 max-w-[52ch] text-pretty text-[13px] text-muted-foreground">
                Lancez l'analyse pour comparer les services et leurs besoins au profil du stagiaire.
              </p>
              <Button className="mt-4" onClick={relaunch}>
                <Sparkles className="mr-2 size-4" /> Lancer l'analyse
              </Button>
            </div>
          ) : latestRun.status !== "prete" ? (
            <div className="flex flex-1 items-start gap-3 px-6 py-6">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
              <div>
                <h3 className="text-[15px] font-semibold">
                  {latestRun.status === "donnees_insuffisantes" ? "Données insuffisantes pour recommander" : "Aucune proposition disponible"}
                </h3>
                <p className="mt-1 max-w-[68ch] text-pretty text-[13px] leading-relaxed text-muted-foreground">
                  Le système ne produit pas de recommandation sans données fiables. Complétez les informations manquantes, ou
                  procédez à une affectation manuelle motivée.
                </p>
                {latestRun.missingFacts.length > 0 && (
                  <ul className="mt-3 space-y-1 text-[13px]">
                    {latestRun.missingFacts.map((fact) => (
                      <li key={fact} className="flex items-center gap-2 text-warning">
                        <TriangleAlert className="size-3.5 shrink-0" /> {fact}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            top &&
            summary &&
            level && (
              <>
                {/* Synthèse : la conclusion d'abord */}
                <section className="border-b bg-primary-soft/40 px-6 py-6" aria-labelledby={`synthese-${intern.id}`}>
                  <h3 id={`synthese-${intern.id}`}>
                    <ExpertBadge label="Recommandation du système expert" />
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-end justify-between gap-4">
                    <p className="text-2xl font-semibold tracking-tight text-primary">{top.serviceName}</p>
                    <div className="min-w-[180px]">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <Badge label={level.label} tone={level.tone} />
                        <span className="font-semibold tabular-nums">
                          {summary.met}/{summary.total} critères
                        </span>
                      </div>
                      <div className="mt-2 flex gap-1" aria-hidden>
                        {Array.from({ length: summary.total }, (_, index) => (
                          <span
                            key={index}
                            className={cn("animate-grow-x h-1.5 flex-1 rounded-full", index < summary.met ? level.bar : "bg-border")}
                            style={{ ["--delay" as string]: `${150 + index * 90}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 max-w-[72ch] text-pretty text-sm leading-relaxed text-foreground/85">{summary.opening}</p>
                  {summary.follow && (
                    <p className="mt-2 max-w-[72ch] text-pretty text-[13px] leading-relaxed text-muted-foreground">{summary.follow}</p>
                  )}
                  {top.limits.length > 0 ? (
                    <ul className="mt-4 space-y-1.5">
                      {top.limits.map((limit) => (
                        <li key={limit} className="flex items-start gap-2 text-[13px] text-warning">
                          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {limit}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 flex items-center gap-2 text-[13px] font-medium text-success-ink">
                      <Check className="size-3.5" /> Aucun point d'attention : toutes les règles sont satisfaites.
                    </p>
                  )}
                </section>

                {/* Matrice de décision */}
                <section className="px-6 py-6" aria-labelledby={`matrice-${intern.id}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 id={`matrice-${intern.id}`} className="text-[15px] font-semibold tracking-tight">
                      Comparaison des services
                    </h3>
                    <p className="text-xs text-muted-foreground">{plural(latestRun.proposals.length, "service évalué", "services évalués")}</p>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl border">
                    <table className="w-full table-fixed text-[13px]">
                      <thead>
                        <tr className="bg-muted/40 text-left text-xs text-muted-foreground">
                          <th className="w-10 px-3 py-2.5 text-center font-medium">Rang</th>
                          <th className="px-3 py-2.5 font-medium">Service</th>
                          {latestRun.rules.map((rule) => (
                            <th key={rule.id} className="hidden w-12 px-1 py-2.5 text-center font-medium tabular-nums md:table-cell" title={`${rule.label} — ${rule.description}`}>
                              <span aria-hidden>{rule.id}</span>
                              <span className="sr-only">{rule.label}</span>
                            </th>
                          ))}
                          <th className="w-16 px-3 py-2.5 text-right font-medium">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {latestRun.proposals.map((proposal) => {
                          const first = proposal.rank === 1;
                          const retained = retainedId === proposal.serviceId;
                          const met = metOf(proposal);
                          const open = openDetail === proposal.serviceId;
                          return (
                            <tr key={proposal.serviceId} className={cn("align-middle", first && "bg-primary-soft/40")}>
                              <td className="px-3 py-3 text-center">
                                <span
                                  className={cn(
                                    "inline-grid size-6 place-items-center rounded-full text-xs font-semibold tabular-nums",
                                    first ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {proposal.rank}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                  <span className="font-semibold">{proposal.serviceName}</span>
                                  {first && <ExpertBadge label="Recommandé" className="px-1.5 py-0" />}
                                  {retained && <Badge label="Retenu" tone="success" className="px-1.5 py-0 text-[11px]" />}
                                </div>
                                <p className="text-xs tabular-nums text-muted-foreground">
                                  {plural(proposal.capacityAtRun.left, "place libre", "places libres")} sur {proposal.capacityAtRun.needed}
                                </p>
                                {/* Téléphone : les règles en pastilles */}
                                <div className="mt-1.5 flex gap-1 md:hidden" aria-hidden>
                                  {proposal.satisfied.map((criterion) => (
                                    <span
                                      key={criterion.ruleId}
                                      className={cn("size-1.5 rounded-full", criterion.satisfied ? "bg-success" : "bg-border")}
                                    />
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setOpenDetail(open ? null : proposal.serviceId)}
                                  aria-expanded={open}
                                  className="mt-1.5 inline-flex items-center gap-1 text-left text-xs font-medium text-primary hover:underline"
                                >
                                  {open ? "Masquer le raisonnement" : "Voir le raisonnement"}
                                  <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} />
                                </button>
                                {open && (
                                  <ul className="animate-fade-in mt-2 space-y-1.5">
                                    {proposal.satisfied.map((criterion) => (
                                      <li key={criterion.ruleId} className="flex items-start gap-2 text-xs">
                                        {criterion.satisfied ? (
                                          <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                                        ) : (
                                          <Minus className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                        )}
                                        <span>
                                          <span className="font-medium">{criterion.label}</span>
                                          <span className="text-muted-foreground"> — {criterion.detail}</span>
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                              {proposal.satisfied.map((criterion) => (
                                <td key={criterion.ruleId} className="hidden px-2 py-3 text-center md:table-cell">
                                  {criterion.satisfied ? (
                                    <Check className="mx-auto size-4 text-success" aria-label="Satisfait" />
                                  ) : (
                                    <Minus className="mx-auto size-4 text-muted-foreground/60" aria-label="Non satisfait" />
                                  )}
                                </td>
                              ))}
                              <td className="px-3 py-3 text-right">
                                <span className={cn("font-semibold tabular-nums", first ? "text-primary" : "text-foreground")}>
                                  {met}/{proposal.satisfied.length}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Légende des règles */}
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {latestRun.rules.map((rule) => (
                      <li key={rule.id} title={rule.description}>
                        <span className="font-semibold tabular-nums text-foreground">{rule.id}</span> {rule.label}
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )
          )}

          {/* Méthode : ce qui a servi à l'analyse, et sa limite */}
          {latestRun && (
            <footer className="mt-auto flex flex-col gap-3 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-pretty text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                Analyse fondée sur {plural(latestRun.facts.length, "fait")} et {plural(latestRun.rules.length, "règle")} de
                démonstration, qui ne reflètent pas encore les règles réelles de FINCA RDC. Le système recommande ; la décision
                vous appartient.
              </p>
              <button type="button" onClick={() => setTraceOpen(true)} className={cn(SECTION_LINK, "shrink-0")}>
                <FileSearch className="size-3.5" /> Consulter la trace
              </button>
            </footer>
          )}
        </article>

        {/* ================= Colonne : profil et décision ================= */}
        <aside className="flex flex-col gap-6">
          <div className="card-surface hidden flex-1 px-5 py-5 xl:block">
            <h3 className="mb-4 text-xs font-medium text-muted-foreground">Profil analysé</h3>
            {profile}
          </div>

          {/* Votre décision : même contenu, alignements et espacements revus */}
          <div className="card-surface px-5 py-5">
            <div className="flex items-center gap-2">
              <Scale className="size-[18px] text-primary" />
              <h3 className="text-[15px] font-semibold tracking-tight">Votre décision</h3>
            </div>

            {intern.confirmed && decision ? (
              <div className="mt-4 rounded-xl border border-success/30 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge label="Décision enregistrée" tone="success" className="px-1.5 py-0 text-[11px]" />
                    <p className="mt-2 text-[15px] font-semibold leading-snug">{decision.service}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      Par {decision.decidedBy}, le {fmtDateTime(decision.decidedAt)}
                    </p>
                  </div>
                  <Stamp label="Affectation validée" detail={stampDate(decision.decidedAt)} className="shrink-0" />
                </div>
                <dl className="mt-4 space-y-2 border-t border-success/20 pt-3 text-xs">
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
                    <dt className="text-muted-foreground">Source</dt>
                    <dd>{decision.source === "recommandation" ? "Recommandation du système" : "Décision manuelle"}</dd>
                  </div>
                  {decision.reason && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
                      <dt className="text-muted-foreground">Motif</dt>
                      <dd className="text-pretty">{decision.reason}</dd>
                    </div>
                  )}
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
                    <dt className="text-muted-foreground">Analyse</dt>
                    <dd className="truncate tabular-nums">
                      Version {decision.engineVersion} · Réf. {decision.runId ? shortRef(decision.runId) : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : intern.confirmed ? (
              <p className="mt-4 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-[13px] leading-relaxed text-success-ink">
                Affectation confirmée. La trace détaillée de la décision n'est pas disponible pour ce dossier.
              </p>
            ) : latestRun ? (
              <div className="mt-4 space-y-4">
                <div role="radiogroup" aria-label="Service retenu" className="space-y-2">
                  {latestRun.proposals.map((proposal) => {
                    const checked = !custom && selected === proposal.serviceId;
                    return (
                      <label
                        key={proposal.serviceId}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                          checked ? "border-primary bg-primary-soft/50" : "hover:bg-muted/50"
                        )}
                      >
                        <input
                          type="radio"
                          name={`decision-${intern.id}`}
                          className="mt-0.5 size-4 shrink-0 accent-primary"
                          checked={checked}
                          onChange={() => {
                            setCustom(false);
                            setSelected(proposal.serviceId);
                            setError("");
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-[13px] font-semibold">{proposal.serviceName}</span>
                            {proposal.rank === 1 && <Badge label="Recommandé" tone="primary" className="shrink-0 px-1.5 py-0 text-[11px]" />}
                          </span>
                          <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">{proposal.summary}</span>
                        </span>
                      </label>
                    );
                  })}
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                      custom ? "border-primary bg-primary-soft/50" : "hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="radio"
                      name={`decision-${intern.id}`}
                      className="size-4 shrink-0 accent-primary"
                      checked={custom}
                      onChange={() => {
                        setCustom(true);
                        setError("");
                      }}
                    />
                    <span className="text-[13px] font-semibold">Choisir un autre service</span>
                  </label>
                </div>

                {custom && (
                  <Field label="Service retenu" htmlFor={`service-${intern.id}`} required>
                    <Select
                      id={`service-${intern.id}`}
                      placeholder="Choisir un service"
                      value={otherServiceId}
                      onChange={(event) => {
                        setOtherServiceId(event.target.value);
                        setError("");
                      }}
                    >
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}

                <Field
                  label="Motif"
                  htmlFor={`motif-${intern.id}`}
                  required={!targetIsRecommended}
                  error={error}
                  hint="Requis si vous vous écartez de la recommandation."
                >
                  <textarea
                    id={`motif-${intern.id}`}
                    className={textareaClass}
                    placeholder="Ex. Besoin urgent de renfort à la Direction IT ce trimestre."
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value);
                      setError("");
                    }}
                  />
                </Field>

                <div className="space-y-2 border-t pt-4">
                  <Button className="w-full" onClick={submitDecision}>
                    Valider l'affectation
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">Le système recommande ; la décision finale vous appartient.</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-[13px] text-muted-foreground">Lancez l'analyse pour obtenir des propositions.</p>
            )}
          </div>
        </aside>
      </div>

      {latestRun && (
        <Modal
          open={traceOpen}
          onClose={() => setTraceOpen(false)}
          icon={FileSearch}
          title="Trace de l'analyse"
          description={`Générée le ${fmtDateTime(latestRun.createdAt)} · Réf. ${shortRef(latestRun.id)} · Version ${latestRun.engineVersion}`}
          wide
        >
          <div className="grid gap-8 sm:grid-cols-2">
            <section>
              <h3 className="text-[13px] font-semibold">Faits utilisés</h3>
              <dl className="mt-3 divide-y rounded-xl border">
                {latestRun.facts.map((fact) => (
                  <div key={fact.label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-3.5 py-2.5 text-[13px]">
                    <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                    <dd className="min-w-0 text-pretty">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section>
              <h3 className="text-[13px] font-semibold">Règles appliquées</h3>
              <ol className="mt-3 space-y-3">
                {latestRun.rules.map((rule) => (
                  <li key={rule.id} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                      {rule.id}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium">{rule.label}</p>
                      <p className="text-pretty text-xs leading-relaxed text-muted-foreground">{rule.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </Modal>
      )}
    </section>
  );
}
