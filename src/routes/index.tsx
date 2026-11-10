import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  Send,
  UserRound,
  XCircle,
} from "lucide-react";
import { CompanyMark, StatusBadge, deadlineLabel } from "@/components/app/ui";
import {
  ARROW_NUDGE,
  EmptyNote,
  SECTION_LINK,
  SectionHeader,
  StatCard,
  rowActionClass,
  type IconMotion,
} from "@/components/company/ui";
import { AnimatedNumber, Reveal } from "@/components/ui/motion";
import { daysFromToday, fmtDate, relativeDay } from "@/lib/dates";
import { companyOf, internshipExtras, offerOf, offers } from "@/lib/mock-data";
import { missingFields } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — StageManager" },
      { name: "description", content: "Vue d'ensemble de vos candidatures, offres et stage sur StageManager." },
    ],
  }),
  component: Dashboard,
});

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

const ACTIVITY_ICON: Record<string, { icon: React.ComponentType<{ className?: string }>; motion: IconMotion }> = {
  envoi: { icon: Send, motion: "fly" },
  vue: { icon: Eye, motion: "pop" },
  entretien: { icon: CalendarClock, motion: "tilt" },
  acceptee: { icon: CheckCircle2, motion: "pop" },
  refusee: { icon: XCircle, motion: "pop" },
};

type Todo = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  motion: IconMotion;
  subject: string;
  task: string;
  context: string;
  when: string;
  urgent: boolean;
  action: string;
  primary?: boolean;
  to: string;
  params?: Record<string, string>;
};

function Dashboard() {
  const { profile, applications, saved, activity, completion, confirmed } = useStore();
  const missing = missingFields(profile);
  const accepted = applications.filter((a) => a.status === "acceptee");
  const interviews = applications.filter((a) => a.status === "entretien");
  const inProgress = applications.filter((a) => ["envoyee", "examen", "preselectionnee", "entretien"].includes(a.status));
  const confirmedApp = applications.find((a) => a.status === "confirmee");

  /* ---- À faire : ce qui attend l'étudiant ---- */
  const todos: Todo[] = [];
  if (!confirmed && accepted.length > 0) {
    todos.push({
      id: "choix",
      icon: CheckCircle2,
      motion: "pop",
      subject: accepted.length > 1 ? `${accepted.length} propositions acceptées` : "Proposition acceptée",
      task: accepted.length > 1 ? "Choisissez votre stage" : "Confirmez votre stage",
      context: accepted.map((a) => offerOf(a.offerId).title.replace(/^Stagiaire\s+/i, "")).join(" · "),
      when: "à décider",
      urgent: true,
      action: "Choisir",
      primary: true,
      to: "/candidatures",
    });
  }
  if (confirmedApp) {
    const start = daysFromToday(internshipExtras.start);
    todos.push({
      id: "stage",
      icon: GraduationCap,
      motion: "tilt",
      subject: offerOf(confirmedApp.offerId).title,
      task: start > 0 ? "Stage confirmé" : "Stage en cours",
      context: `Encadreur : ${internshipExtras.supervisor.name}`,
      when: start > 0 ? `début dans ${start} j` : "en cours",
      urgent: false,
      action: "Mon stage",
      to: "/stage",
    });
  }
  interviews.forEach((a) => {
    const offer = offerOf(a.offerId);
    const inDays = a.interview ? daysFromToday(a.interview.date) : null;
    todos.push({
      id: `entretien-${a.id}`,
      icon: CalendarClock,
      motion: "tilt",
      subject: offer.title,
      task: "Entretien à préparer",
      context: a.interview ? `${fmtDate(a.interview.date, false)} à ${a.interview.time} · ${a.interview.place}` : companyOf(offer.companyId).name,
      when: inDays === null ? "à venir" : inDays <= 0 ? "aujourd'hui" : inDays === 1 ? "demain" : `dans ${inDays} j`,
      urgent: inDays !== null && inDays <= 2,
      action: "Revoir l'offre",
      to: "/offres/$id",
      params: { id: offer.id },
    });
  });

  /* ---- Offres recommandées : le plus de compétences en commun, encore ouvertes ---- */
  const mine = new Set(profile.competences.map((skill) => skill.toLowerCase()));
  const appliedIds = new Set(applications.map((a) => a.offerId));
  const recommended = offers
    .filter((o) => !appliedIds.has(o.id) && daysFromToday(o.deadline) >= 0)
    .map((o) => ({ offer: o, match: o.skills.filter((skill) => mine.has(skill.toLowerCase())).length }))
    .sort((a, b) => b.match - a.match || a.offer.deadline.localeCompare(b.offer.deadline))
    .slice(0, 3);

  const recent = [...applications].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  const stats: {
    label: string;
    value: number;
    suffix?: string;
    icon: React.ComponentType<{ className?: string }>;
    motion: IconMotion;
    foot: string;
    tone?: "neutral" | "trend" | "alert";
  }[] = [
    {
      label: "Candidatures envoyées",
      value: applications.length,
      icon: Send,
      motion: "fly",
      foot: `${inProgress.length} en cours d'examen`,
    },
    {
      label: "Propositions acceptées",
      value: accepted.length + (confirmedApp ? 1 : 0),
      icon: CheckCircle2,
      motion: "pop",
      foot: confirmedApp ? "stage confirmé" : accepted.length ? "en attente de votre choix" : "aucune pour le moment",
      tone: !confirmedApp && accepted.length ? "alert" : "neutral",
    },
    {
      label: "Entretiens programmés",
      value: interviews.length,
      icon: CalendarClock,
      motion: "tilt",
      foot: interviews[0]?.interview ? `prochain le ${fmtDate(interviews[0].interview.date, false)}` : "aucun à venir",
    },
    {
      label: "Offres enregistrées",
      value: saved.length,
      icon: Bookmark,
      motion: "lift",
      foot: `sur ${plural(offers.length, "offre")} disponible${offers.length > 1 ? "s" : ""}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ============================ Indicateurs ============================ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {stats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 60} className="min-w-0">
            <StatCard {...stat} />
          </Reveal>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Colonne principale : les deux colonnes finissent au même niveau */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* À faire */}
          <Reveal as="section" delay={80} className="card-surface overflow-hidden" aria-labelledby="todo-title">
            <div className="border-b px-5 pb-3.5 pt-4">
              <h2 id="todo-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                À faire
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {todos.length}
                </span>
              </h2>
            </div>
            {todos.length === 0 ? (
              <EmptyNote icon={CheckCircle2} title="Tout est à jour" desc="Aucune action ne vous attend pour le moment." />
            ) : (
              <ul className="divide-y">
                {todos.map((todo, index) => (
                  <Reveal as="li" key={todo.id} delay={120 + index * 40}>
                    <div
                      className={cn(
                        "group grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3 transition-colors duration-200 sm:grid-cols-[20px_minmax(0,1fr)_auto_auto]",
                        todo.primary ? "" : "hover:bg-muted/40",
                        todo.primary && "bg-primary-soft shadow-[inset_3px_0_0_hsl(var(--primary))]"
                      )}
                    >
                      <todo.icon
                        className={cn(
                          `nav-icon nav-icon--${todo.motion} size-[18px]`,
                          todo.primary ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-sm leading-5 sm:line-clamp-1 xl:line-clamp-2">
                          <span className="font-semibold">{todo.subject}</span>
                          <span className="text-muted-foreground"> · {todo.task}</span>
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="truncate">{todo.context}</span>
                          <span className={cn("shrink-0 whitespace-nowrap sm:hidden", todo.urgent && "font-medium text-warning")}>
                            · {todo.when}
                          </span>
                        </span>
                      </span>
                      <span
                        className={cn(
                          "hidden items-center justify-end gap-1 whitespace-nowrap text-xs tabular-nums sm:flex",
                          todo.urgent ? "font-semibold text-warning" : "font-medium text-muted-foreground"
                        )}
                      >
                        {todo.urgent && <Clock className="size-3" />}
                        {todo.when}
                      </span>
                      <Link
                        to={todo.to}
                        params={todo.params}
                        aria-label={`${todo.action} — ${todo.subject}`}
                        className={cn(rowActionClass(todo.primary), "group")}
                      >
                        <span className="hidden whitespace-nowrap sm:inline">{todo.action}</span>
                        <ArrowRight className={cn("size-3.5 shrink-0", ARROW_NUDGE)} />
                      </Link>
                    </div>
                  </Reveal>
                ))}
              </ul>
            )}
          </Reveal>

          {/* Offres recommandées */}
          <Reveal as="section" delay={140} className="card-surface p-5">
            <SectionHeader
              title="Offres recommandées"
              description="Les offres ouvertes qui partagent le plus de compétences avec votre profil"
              to="/offres"
              linkLabel="Toutes les offres"
            />
            {recommended.length === 0 ? (
              <EmptyNote icon={Send} title="Aucune nouvelle offre" desc="Vous avez déjà postulé à toutes les offres ouvertes." className="mt-4 rounded-lg border border-dashed" />
            ) : (
              <ul className="-mx-5 mt-4 divide-y border-t">
                {recommended.map(({ offer, match }) => {
                  const deadline = deadlineLabel(offer.deadline);
                  return (
                    <li key={offer.id} className="group flex items-center gap-3.5 px-5 py-3 transition-colors duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-muted/40">
                      <CompanyMark id={offer.companyId} className="size-9" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[13px] font-semibold sm:line-clamp-1">{offer.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {offer.department}
                          <span className="hidden tabular-nums sm:inline"> · {match}/{offer.skills.length} compétences en commun</span>
                        </p>
                        <p className="mt-0.5 truncate text-xs tabular-nums text-muted-foreground sm:hidden">
                          {match}/{offer.skills.length} en commun ·{" "}
                          <span className={cn(deadline.urgent && "font-medium text-warning")}>{deadline.label}</span>
                        </p>
                      </div>
                      <span
                        className={cn(
                          "hidden whitespace-nowrap text-xs tabular-nums sm:block",
                          deadline.urgent ? "font-semibold text-warning" : "text-muted-foreground"
                        )}
                      >
                        {deadline.label}
                      </span>
                      <Link
                        to="/offres/$id"
                        params={{ id: offer.id }}
                        aria-label={`Voir l'offre ${offer.title}`}
                        className={cn(rowActionClass(), "group")}
                      >
                        <span className="hidden whitespace-nowrap sm:inline">Voir l'offre</span>
                        <ArrowRight className={cn("size-3.5 shrink-0", ARROW_NUDGE)} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>

          {/* Candidatures récentes */}
          <Reveal as="section" delay={200} className="card-surface flex flex-col p-5 xl:flex-1">
            <SectionHeader title="Mes candidatures" count={applications.length} to="/candidatures" />
            {recent.length === 0 ? (
              <EmptyNote icon={Send} title="Aucune candidature" desc="Vos candidatures apparaîtront ici." className="mt-4 rounded-lg border border-dashed" />
            ) : (
              <ul className="-mx-5 mt-4 divide-y border-t">
                {recent.map((a) => {
                  const offer = offerOf(a.offerId);
                  return (
                    <li key={a.id} className="group flex items-center gap-3.5 px-5 py-3 transition-colors duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-muted/40">
                      <CompanyMark id={offer.companyId} className="size-9" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[13px] font-semibold sm:line-clamp-1">{offer.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {companyOf(offer.companyId).name} · envoyée le {fmtDate(a.date, false)}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>
        </div>

        {/* Colonne latérale */}
        <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2 xl:flex xl:flex-col">
          {/* Mon profil */}
          <Reveal delay={120} className="card-surface p-5">
            <SectionHeader title="Mon profil" to="/profil" linkLabel="Modifier" />
            <div className="mt-4 flex items-center gap-3.5">
              {profile.photo ? (
                <img src={profile.photo} alt="" className="size-12 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground" aria-hidden>
                  {`${profile.prenom[0] ?? ""}${profile.nom[0] ?? ""}`.toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {profile.prenom} {profile.nom}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.filiere} · {profile.niveau}
                </p>
                <p className="truncate text-xs text-muted-foreground">{profile.universite}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-muted-foreground">Profil complété</span>
                <span className="text-sm font-semibold tabular-nums">
                  <AnimatedNumber value={completion} suffix="%" />
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div
                  className={cn("animate-grow-x h-full rounded-full", missing.length ? "bg-warning" : "bg-success")}
                  style={{ width: `${completion}%`, ["--delay" as string]: "200ms" }}
                />
              </div>
              <p className="mt-2.5 text-pretty text-xs text-muted-foreground">
                {missing.length
                  ? `À compléter : ${missing.map((field) => field.label.toLowerCase()).join(", ")}.`
                  : "Votre profil est complet : les entreprises voient toutes vos informations."}
              </p>
            </div>
          </Reveal>

          {/* Activité récente */}
          <Reveal delay={180} className="card-surface p-5 xl:flex-1">
            <SectionHeader title="Activité récente" />
            {activity.length === 0 ? (
              <EmptyNote icon={UserRound} title="Aucune activité" className="mt-4 rounded-lg border border-dashed" />
            ) : (
              <ul className="-mx-5 mt-4 divide-y border-t">
                {activity.slice(0, 5).map((item) => {
                  const meta = ACTIVITY_ICON[item.kind] ?? ACTIVITY_ICON.envoi;
                  return (
                    <li key={item.id} className="group flex items-start gap-3 px-5 py-3 transition-colors duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-muted/40">
                      <meta.icon className={`nav-icon nav-icon--${meta.motion} mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground`} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-baseline justify-between gap-2 text-[13px]">
                          <span className="truncate font-medium">{item.label}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{relativeDay(item.date.slice(0, 10))}</span>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link to="/notifications" className={cn(SECTION_LINK, "mt-4 w-full justify-center")}>
              Voir les notifications
              <ArrowRight className={cn("size-3.5", ARROW_NUDGE)} />
            </Link>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
