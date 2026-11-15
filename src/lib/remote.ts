/**
 * Synchronisation avec Supabase.
 *
 * 1. À la connexion, on charge tout ce que le compte a le droit de voir (les règles RLS filtrent).
 * 2. Chaque modification faite dans l'application (stores Zustand) est comparée à l'état précédent :
 *    seuls les éléments modifiés sont enregistrés en base. Les pages n'ont rien à savoir.
 * 3. Les changements faits ailleurs (l'autre espace) arrivent en temps réel et rechargent les données.
 */
import { toast } from "sonner";
import { useAdminStore, type AdminUser } from "./admin-store";
import { COMPANY_TAKEN, PHONE_TAKEN, type HostingProfile, type Session } from "./auth";
import type {
  AssignmentDecision,
  AttendanceWeek,
  Candidate,
  CandidateStatus,
  CompanyOffer,
  CompanyProfile,
  ExpertRun,
  Intern,
  KnowledgeRule,
  Interview,
  OfferStatus,
  Service,
  Supervisor,
} from "./company-data";
import { useCompanyStore } from "./company-store";
import { DEFAULT_RULES } from "./expert-engine";
import type { Json, Tables } from "./database.types";
import { setCompanies, type Notification } from "./mock-data";
import { remoteState } from "./remote-flag";
import { READ_ONLY_MESSAGE, useViewAs } from "./view-as";
import { profileCompletion, type AppStatus, type Application, type Profile } from "./rules";
import { useStore } from "./store";
import { supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/* Conversions base → application                                      */
/* ------------------------------------------------------------------ */

const initials = (name: string) =>
  name
    .replace(/^(M\.|Mme|Mlle)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("") || "?";

const toOffer = (row: Tables<"offers">, count: number): CompanyOffer => ({
  id: row.id,
  title: row.title,
  department: row.department,
  location: row.location,
  type: row.type,
  duration: row.duration,
  level: row.level,
  deadline: row.deadline,
  published: row.published,
  status: row.status as OfferStatus,
  description: row.description,
  missions: row.missions,
  skills: row.skills,
  applicationsCount: count,
  companyId: row.company_id,
});

const toCompanyProfile = (row: Tables<"companies">): Partial<CompanyProfile> => ({
  name: row.name,
  initials: row.initials,
  logo: row.logo_url,
  sector: row.sector,
  description: row.description,
  address: row.address,
  city: row.city,
  phone: row.phone,
  email: row.email,
  registration: row.registration,
  legalRefs: row.legal_refs,
  activities: row.activities,
  domains: row.domains,
  website: row.website,
  representativeName: row.representative_name,
  representativeRole: row.representative_role,
  representativeEmail: row.representative_email,
  representativePhone: row.representative_phone,
  documents: [],
});

type Applicant = { profile?: Tables<"profiles">; student?: Tables<"student_profiles"> };

const toStudentProfile = (email: string, row: Tables<"student_profiles"> | null): Profile => ({
  nom: row?.nom ?? "",
  postnom: row?.postnom ?? "",
  prenom: row?.prenom ?? "",
  adresse: row?.adresse ?? "",
  email,
  telephone: row?.telephone ?? "",
  photo: row?.photo_url ?? null,
  universite: row?.universite ?? "",
  faculte: row?.faculte ?? "",
  filiere: row?.filiere ?? "",
  niveau: row?.niveau ?? "",
  competences: row?.competences ?? [],
  experiences: row?.experiences ?? "",
  projets: row?.projets ?? "",
  infos: row?.infos ?? "",
  cv: (row?.cv as Profile["cv"]) ?? null,
  visible: row?.visible ?? true,
});

const STATUS_FOR_STUDENT: Record<CandidateStatus, AppStatus> = {
  en_attente: "envoyee",
  examen: "examen",
  entretien: "entretien",
  acceptee: "acceptee",
  refusee: "refusee",
  retiree: "retiree",
};

const toRule = (r: Tables<"expert_rules">): KnowledgeRule => ({
  id: r.id,
  code: r.code,
  label: r.label,
  conditions: (r.conditions as unknown as KnowledgeRule["conditions"]) ?? [],
  conclusion: r.conclusion,
  conclusionLabel: r.conclusion_label,
  active: r.active,
  position: r.position,
  updatedAt: r.updated_at,
});

const fromRule = (r: Omit<KnowledgeRule, "id" | "updatedAt">) => ({
  code: r.code,
  label: r.label,
  conditions: r.conditions as unknown as Json,
  conclusion: r.conclusion,
  conclusion_label: r.conclusionLabel,
  active: r.active,
  position: r.position,
});

/* ------------------------------------------------------------------ */
/* Chargement                                                          */
/* ------------------------------------------------------------------ */

/** Remplacement des données en cours : la comparaison ne doit pas renvoyer ce qu'on vient de lire. */
let applying = false;

async function must<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

type Rows = {
  offers: Tables<"offers">[];
  applications: Tables<"applications">[];
  interviews: Tables<"interviews">[];
  interns: Tables<"interns">[];
  runs: Tables<"expert_runs">[];
  decisions: Tables<"assignment_decisions">[];
  notifications: Tables<"notifications">[];
};

/**
 * L'administrateur lit toute la base : en consultation, on ne garde que ce que voit le titulaire
 * de l'espace ouvert (son entreprise, ou ses propres candidatures d'étudiant).
 */
function scopeRows(session: Session, rows: Rows): Rows {
  const notifications = rows.notifications.filter((n) => n.user_id === session.userId);
  // Une entreprise lit aussi les offres publiées des autres (règle de lecture publique) : son espace ne garde que les siennes.
  if (!session.viewing && session.role === "entreprise")
    return { ...rows, offers: rows.offers.filter((o) => o.company_id === session.companyId), notifications };
  if (!session.viewing) return { ...rows, notifications };
  const applications =
    session.role === "entreprise"
      ? rows.applications.filter((a) => rows.offers.some((o) => o.id === a.offer_id && o.company_id === session.companyId))
      : rows.applications.filter((a) => a.student_id === session.userId);
  const appIds = new Set(applications.map((a) => a.id));
  const interns = rows.interns.filter((i) => appIds.has(i.application_id) && (session.role !== "entreprise" || i.company_id === session.companyId));
  const internIds = new Set(interns.map((i) => i.id));
  const offers =
    session.role === "entreprise"
      ? rows.offers.filter((o) => o.company_id === session.companyId)
      : rows.offers.filter((o) => o.status === "publiee" || applications.some((a) => a.offer_id === o.id));
  return {
    offers,
    applications,
    interviews: rows.interviews.filter((i) => appIds.has(i.application_id)),
    interns,
    runs: rows.runs.filter((r) => internIds.has(r.intern_id)),
    decisions: rows.decisions.filter((d) => internIds.has(d.intern_id)),
    notifications: session.role === "entreprise" ? [] : notifications,
  };
}

export async function loadForSession(session: Session) {
  const [allOffers, allApplications, allInterviews, allInterns, allRuns, allDecisions, allNotifications] = await Promise.all([
    must(supabase.from("offers").select("*").order("published", { ascending: false })),
    must(supabase.from("applications").select("*").order("applied_at", { ascending: false })),
    must(supabase.from("interviews").select("*")),
    must(supabase.from("interns").select("*")),
    must(supabase.from("expert_runs").select("*").order("created_at", { ascending: false })),
    must(supabase.from("assignment_decisions").select("*").order("decided_at", { ascending: false })),
    must(supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(200)),
  ]);
  const { offers, applications, interviews, interns, runs, decisions, notifications } = scopeRows(session, {
    offers: allOffers,
    applications: allApplications,
    interviews: allInterviews,
    interns: allInterns,
    runs: allRuns,
    decisions: allDecisions,
    notifications: allNotifications,
  });

  const counts = new Map<string, number>();
  applications.forEach((a) => counts.set(a.offer_id, (counts.get(a.offer_id) ?? 0) + 1));
  const companyOffers = offers.map((row) => toOffer(row, counts.get(row.id) ?? 0));

  applying = true;
  try {
    // L'étudiant lit aussi son dossier de stage (affectation, analyse, encadreur) : mêmes conversions.
    await loadCompanyOrAdmin(session, companyOffers, applications, interviews, interns, runs, decisions);
    if (session.role === "etudiant") await loadStudent(session, applications, interviews, notifications, companyOffers);
  } finally {
    applying = false;
  }
}

async function loadStudent(
  session: Session,
  applications: Tables<"applications">[],
  interviews: Tables<"interviews">[],
  notifications: Tables<"notifications">[],
  offers: CompanyOffer[]
) {
  const { data: student } = await supabase.from("student_profiles").select("*").eq("id", session.userId).maybeSingle();
  const profile = toStudentProfile(session.email, student);
  const apps: Application[] = applications.map((a) => {
    const next = interviews
      .filter((i) => i.application_id === a.id && i.status === "programme")
      .sort((x, y) => `${x.date}${x.time}`.localeCompare(`${y.date}${y.time}`))[0];
    const status: AppStatus = (a.student_choice as AppStatus | null) ?? STATUS_FOR_STUDENT[a.status as CandidateStatus];
    return {
      id: a.id,
      offerId: a.offer_id,
      date: a.applied_at,
      status,
      candidateId: a.id,
      interview: status === "entretien" && next ? { date: next.date, time: next.time, place: next.location } : undefined,
    };
  });
  const KINDS: Notification["kind"][] = ["offre", "candidature", "entretien", "stage", "document", "rapport"];
  useCompanyStore.setState({ offers });
  useStore.setState({
    profile,
    completion: profileCompletion(profile),
    applications: apps,
    // Les offres d'exemple gardées en mémoire n'existent pas en base : on ne garde que les vraies.
    saved: useStore.getState().saved.filter((id) => offers.some((offer) => offer.id === id)),
    confirmed: apps.some((a) => a.status === "confirmee"),
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      date: n.created_at.slice(0, 19),
      read: n.read,
      kind: KINDS.includes(n.kind as Notification["kind"]) ? (n.kind as Notification["kind"]) : "candidature",
    })),
    activity: [],
  });
}

async function loadCompanyOrAdmin(
  session: Session,
  offers: CompanyOffer[],
  applications: Tables<"applications">[],
  interviews: Tables<"interviews">[],
  internRows: Tables<"interns">[],
  runRows: Tables<"expert_runs">[],
  decisionRows: Tables<"assignment_decisions">[]
) {
  const studentIds = [...new Set(applications.map((a) => a.student_id))];
  const [companies, allServices, allSupervisors, people, students, allRuleRows, allAttendance] = await Promise.all([
    must(session.role === "entreprise" && session.companyId ? supabase.from("companies").select("*").eq("id", session.companyId) : supabase.from("companies").select("*")),
    must(supabase.from("services").select("*").order("name")),
    must(supabase.from("supervisors").select("*").order("name")),
    must(
      session.role === "admin"
        ? supabase.from("profiles").select("*")
        : studentIds.length
          ? supabase.from("profiles").select("*").in("id", studentIds)
          : supabase.from("profiles").select("*").eq("id", session.userId)
    ),
    must(
      session.role === "admin"
        ? supabase.from("student_profiles").select("*")
        : studentIds.length
          ? supabase.from("student_profiles").select("*").in("id", studentIds)
          : supabase.from("student_profiles").select("*").eq("id", session.userId)
    ),
    must(supabase.from("expert_rules").select("*").order("position")),
    must(supabase.from("attendance").select("*").order("week_start")),
  ]);
  // Consultation : l'administrateur lit tout, on ne garde que l'entreprise ou le dossier de l'étudiant ouvert.
  const inScope = <T extends { company_id: string; id: string }>(rows: T[], ids: (string | null)[]) =>
    !session.viewing ? rows : session.role === "entreprise" ? rows.filter((r) => r.company_id === session.companyId) : rows.filter((r) => ids.includes(r.id));
  const services = inScope(allServices, internRows.map((i) => i.service_id));
  const supervisors = inScope(allSupervisors, internRows.map((i) => i.supervisor_id));
  const ruleRows = inScope(allRuleRows, []);
  // Présence : seulement celle des stagiaires chargés (consultation comprise).
  const internIds = new Set(internRows.map((i) => i.id));
  const attendance: AttendanceWeek[] = allAttendance
    .filter((a) => internIds.has(a.intern_id))
    .map((a) => ({ id: a.id, internId: a.intern_id, weekStart: a.week_start, present: a.present, late: a.late, absent: a.absent, note: a.note }));

  const applicant = (id: string): Applicant => ({ profile: people.find((p) => p.id === id), student: students.find((s) => s.id === id) });
  const nameOf = (a: Applicant) =>
    [a.student?.prenom, a.student?.nom].filter(Boolean).join(" ") || a.profile?.full_name || a.profile?.email || "Étudiant";

  const candidates: Candidate[] = applications.map((a) => {
    const who = applicant(a.student_id);
    const name = nameOf(who);
    return {
      id: a.id,
      offerId: a.offer_id,
      name,
      initials: initials(name),
      universite: who.student?.universite ?? "",
      filiere: who.student?.filiere ?? "",
      niveau: who.student?.niveau ?? "",
      email: who.profile?.email ?? "",
      phone: who.student?.telephone ?? "",
      competences: who.student?.competences ?? [],
      photo: who.student?.photo_url ?? null,
      cvName: ((who.student?.cv as { name?: string } | null)?.name) ?? "",
      appliedAt: a.applied_at,
      // Une proposition déclinée par l'étudiant vaut retrait pour l'entreprise.
      status: (a.student_choice === "declinee" ? "retiree" : a.status) as CandidateStatus,
      history: (a.history as unknown as Candidate["history"]) ?? [],
      refusalReason: a.refusal_reason ?? undefined,
      studentAppId: a.id,
      studentId: a.student_id,
    };
  });

  const serviceList: Service[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    internsNeeded: s.interns_needed,
    profiles: s.profiles,
    education: s.education,
    skills: s.skills,
    updatedAt: s.updated_at,
  }));

  const decisions: AssignmentDecision[] = decisionRows.map((d) => ({
    internId: d.intern_id,
    serviceId: d.service_id ?? "",
    service: d.service,
    decidedAt: d.decided_at,
    decidedBy: d.decided_by,
    source: d.source as AssignmentDecision["source"],
    reason: d.reason,
    runId: d.run_id ?? "",
    engineVersion: d.engine_version,
  }));

  const interns: Intern[] = internRows.map((i) => {
    const app = applications.find((a) => a.id === i.application_id);
    const who = app ? applicant(app.student_id) : {};
    const name = nameOf(who);
    return {
      id: i.id,
      candidateId: i.application_id,
      name,
      initials: initials(name),
      offerId: app?.offer_id ?? "",
      serviceId: i.service_id ?? undefined,
      service: serviceList.find((s) => s.id === i.service_id)?.name ?? "À affecter",
      supervisorId: i.supervisor_id ?? undefined,
      start: i.start_date ?? "",
      end: i.end_date ?? "",
      missions: i.missions,
      objectives: i.objectives,
      confirmed: i.confirmed,
      assignmentSource: (i.assignment_source as Intern["assignmentSource"]) ?? undefined,
      assignmentReason: i.assignment_reason,
      assignmentDecidedAt: i.decided_at ?? undefined,
      assignmentDecidedBy: i.decided_by ?? undefined,
      expertRunId: decisions.find((d) => d.internId === i.id)?.runId || undefined,
      reports: (i.reports as unknown as Intern["reports"]) ?? [],
      evaluation: (i.evaluation as Intern["evaluation"]) ?? null,
      certificate: i.certificate as Intern["certificate"],
      certificateGeneratedAt: i.certificate_generated_at ?? undefined,
      certificateValidatedAt: i.certificate_validated_at ?? undefined,
    };
  });

  // Base de règles : une entreprise qui n'en a pas encore reçoit les règles de départ, enregistrées
  // en base pour qu'elle puisse ensuite les modifier dans le module d'acquisition des connaissances.
  let rules: KnowledgeRule[] = ruleRows.map(toRule);
  if (session.role === "entreprise" && session.companyId && rules.length === 0 && !session.viewing) {
    const companyId = session.companyId;
    const { data } = await supabase
      .from("expert_rules")
      .insert(DEFAULT_RULES.map(({ id: _id, updatedAt: _u, ...r }) => ({ ...fromRule(r), company_id: companyId })))
      .select("*");
    rules = (data ?? []).map(toRule);
  }

  // Annuaire de l'espace étudiant : le vrai nom et la présentation de chaque entreprise.
  setCompanies(companies.map((c) => ({ id: c.id, name: c.name, initials: c.initials || initials(c.name), about: c.description })));

  const company = session.role === "entreprise" ? companies.find((c) => c.id === session.companyId) : companies[0];
  useCompanyStore.setState((state) => ({
    profile: company ? { ...state.profile, ...toCompanyProfile(company) } : state.profile,
    hosting: (company?.hosting as HostingProfile | null) ?? null,
    spaceActive: !company?.deactivated_at,
    offers,
    candidates,
    interviews: interviews.map(
      (i): Interview => ({ id: i.id, candidateId: i.application_id, date: i.date, time: i.time, location: i.location, status: i.status as Interview["status"] })
    ),
    interns,
    services: serviceList,
    supervisors: supervisors.map(
      (s): Supervisor => ({ id: s.id, name: s.name, initials: s.initials, role: s.role, serviceId: s.service_id, email: s.email, phone: s.phone, capacity: s.capacity })
    ),
    expertRuns: runRows.map(
      (r): ExpertRun => ({
        id: r.id,
        internId: r.intern_id,
        createdAt: r.created_at,
        engineVersion: r.engine_version,
        status: r.status as ExpertRun["status"],
        facts: r.facts as unknown as ExpertRun["facts"],
        rules: r.rules as unknown as ExpertRun["rules"],
        proposals: r.proposals as unknown as ExpertRun["proposals"],
        missingFacts: r.missing_facts,
      })
    ),
    decisions,
    expertRules: rules,
    attendance,
    readNotices: [],
  }));

  if (session.role === "admin") {
    const users: AdminUser[] = people.map((p) => {
      const student = students.find((s) => s.id === p.id);
      return {
        id: p.id,
        email: p.email,
        role: p.role as AdminUser["role"],
        name: (student && [student.prenom, student.nom].filter(Boolean).join(" ")) || p.full_name || p.email,
        companyId: p.company_id,
        suspended: p.suspended,
        onboarded: p.onboarded,
        createdAt: p.created_at,
        filiere: student?.filiere ?? "",
        niveau: student?.niveau ?? "",
        universite: student?.universite ?? "",
      };
    });
    const actions = await must(supabase.from("admin_actions").select("*").order("created_at", { ascending: false }));
    useAdminStore.setState({
      users,
      companies: companies.map((c) => ({ id: c.id, name: c.name, initials: c.initials, sector: c.sector, city: c.city, email: c.email })),
      suspended: users.filter((u) => u.suspended).map((u) => u.email),
      actions: actions.map((a) => ({
        id: a.id,
        date: a.created_at.slice(0, 19),
        kind: a.kind as "suspension" | "reactivation" | "retrait_offre",
        target: a.target,
        reason: a.reason,
      })),
    });
  }
}

/* ------------------------------------------------------------------ */
/* Enregistrement des modifications                                    */
/* ------------------------------------------------------------------ */

/** Éléments ajoutés ou modifiés (comparaison par référence : Zustand recrée seulement ce qui change). */
function changed<T extends { id: string }>(prev: T[], next: T[]) {
  const before = new Map(prev.map((item) => [item.id, item]));
  return next.filter((item) => before.get(item.id) !== item);
}
function removed<T extends { id: string }>(prev: T[], next: T[]) {
  const after = new Set(next.map((item) => item.id));
  return prev.filter((item) => !after.has(item.id));
}

let queue: Promise<unknown> = Promise.resolve();
/** Les écritures partent dans l'ordre ; une erreur prévient et recharge l'état réel. */
function push(label: string, run: () => PromiseLike<{ error: { message: string } | null; data?: unknown }>, session: Session) {
  queue = queue.then(async () => {
    const { error, data } = await run();
    // Une mise à jour suivie de .select() qui ne renvoie aucune ligne a été refusée sans erreur (droits).
    const refused = !error && Array.isArray(data) && data.length === 0;
    if (error || refused) {
      // Une personne = un compte : la base refuse un téléphone ou un nom d'entreprise déjà pris.
      const reason = error?.message.includes("student_profiles_phone_unique")
        ? PHONE_TAKEN
        : error?.message.includes("companies_name_unique")
          ? COMPANY_TAKEN
          : (error?.message ?? "modification refusée (droits insuffisants)");
      toast.error("Enregistrement impossible", { description: `${label} : ${reason}` });
      await loadForSession(session).catch(() => undefined);
    }
  });
}

function syncCompany(session: Session) {
  const companyId = session.companyId;
  return useCompanyStore.subscribe((next, prev) => {
    if (applying || !companyId) return;

    if (next.profile !== prev.profile) {
      const p = next.profile;
      push("Profil de l'entreprise", () =>
        supabase.from("companies").update({
          name: p.name, initials: p.initials, logo_url: p.logo ?? null, sector: p.sector, description: p.description,
          address: p.address, city: p.city, phone: p.phone, email: p.email, registration: p.registration,
          legal_refs: p.legalRefs, activities: p.activities, domains: p.domains, website: p.website,
          representative_name: p.representativeName, representative_role: p.representativeRole,
          representative_email: p.representativeEmail, representative_phone: p.representativePhone,
        }).eq("id", companyId).select("id"), session);
    }
    if (next.spaceActive !== prev.spaceActive) {
      const deactivated_at = next.spaceActive ? null : new Date().toISOString();
      push("Espace entreprise", () => supabase.from("companies").update({ deactivated_at }).eq("id", companyId).select("id"), session);
    }
    if (next.hosting !== prev.hosting && next.hosting) {
      const hosting = next.hosting;
      push("Accueil des stagiaires", () => supabase.from("companies").update({ hosting: hosting as unknown as Json }).eq("id", companyId).select("id"), session);
    }

    for (const o of changed(prev.offers, next.offers))
      push("Offre", () => supabase.from("offers").upsert({
        id: o.id, company_id: companyId, title: o.title, department: o.department, location: o.location, type: o.type,
        duration: o.duration, level: o.level, deadline: o.deadline, published: o.published, status: o.status,
        description: o.description, missions: o.missions, skills: o.skills,
      }), session);
    for (const o of removed(prev.offers, next.offers)) push("Suppression d'offre", () => supabase.from("offers").delete().eq("id", o.id), session);

    const before = new Map(prev.candidates.map((c) => [c.id, c]));
    for (const c of changed(prev.candidates, next.candidates)) {
      const old = before.get(c.id);
      if (!old || (old.status === c.status && old.refusalReason === c.refusalReason)) continue;
      push("Candidature", () => supabase.from("applications").update({ status: c.status, refusal_reason: c.refusalReason ?? null }).eq("id", c.id), session);
    }

    for (const i of changed(prev.interviews, next.interviews))
      push("Entretien", () => supabase.from("interviews").upsert({
        id: i.id, application_id: i.candidateId, date: i.date, time: i.time, location: i.location, status: i.status,
      }), session);

    for (const s of changed(prev.services, next.services))
      push("Service", () => supabase.from("services").upsert({
        id: s.id, company_id: companyId, name: s.name, interns_needed: s.internsNeeded, education: s.education,
        skills: s.skills, profiles: s.profiles, updated_at: s.updatedAt,
      }), session);
    for (const s of removed(prev.services, next.services)) push("Suppression de service", () => supabase.from("services").delete().eq("id", s.id), session);

    for (const s of changed(prev.supervisors, next.supervisors))
      push("Encadreur", () => supabase.from("supervisors").upsert({
        id: s.id, company_id: companyId, service_id: s.serviceId, name: s.name, initials: s.initials, role: s.role,
        email: s.email, phone: s.phone, capacity: s.capacity,
      }), session);
    for (const s of removed(prev.supervisors, next.supervisors)) push("Suppression d'encadreur", () => supabase.from("supervisors").delete().eq("id", s.id), session);

    for (const i of changed(prev.interns, next.interns))
      push("Dossier stagiaire", () => supabase.from("interns").upsert({
        id: i.id, application_id: i.candidateId, company_id: companyId, service_id: i.serviceId ?? null,
        supervisor_id: i.supervisorId ?? null, start_date: i.start || null, end_date: i.end || null,
        missions: i.missions, objectives: i.objectives, confirmed: i.confirmed,
        assignment_source: i.assignmentSource ?? null, assignment_reason: i.assignmentReason ?? "",
        decided_at: i.assignmentDecidedAt ?? null, decided_by: i.assignmentDecidedBy ?? null,
        reports: i.reports as unknown as Json, evaluation: i.evaluation as unknown as Json, certificate: i.certificate,
        certificate_generated_at: i.certificateGeneratedAt ?? null, certificate_validated_at: i.certificateValidatedAt ?? null,
      }), session);
    for (const i of removed(prev.interns, next.interns)) push("Suppression de dossier", () => supabase.from("interns").delete().eq("id", i.id), session);

    for (const r of changed(prev.expertRuns, next.expertRuns))
      push("Analyse du système expert", () => supabase.from("expert_runs").upsert({
        id: r.id, intern_id: r.internId, engine_version: r.engineVersion, status: r.status, created_at: r.createdAt,
        facts: r.facts as unknown as Json, rules: r.rules as unknown as Json, proposals: r.proposals as unknown as Json,
        missing_facts: r.missingFacts,
      }), session);

    for (const r of changed(prev.expertRules, next.expertRules))
      push("Règle du système expert", () => supabase.from("expert_rules").upsert({
        id: r.id, company_id: companyId, ...fromRule(r), updated_at: r.updatedAt,
      }), session);
    for (const r of removed(prev.expertRules, next.expertRules))
      push("Suppression de règle", () => supabase.from("expert_rules").delete().eq("id", r.id), session);

    for (const a of changed(prev.attendance, next.attendance))
      push("Présence", () => supabase.from("attendance").upsert({
        id: a.id, intern_id: a.internId, company_id: companyId, week_start: a.weekStart, present: a.present, late: a.late,
        absent: a.absent, note: a.note, updated_at: new Date().toISOString(),
      }), session);
    for (const a of removed(prev.attendance, next.attendance)) push("Suppression de relevé", () => supabase.from("attendance").delete().eq("id", a.id), session);

    for (const d of next.decisions.filter((d) => !prev.decisions.includes(d)))
      push("Décision d'affectation", () => supabase.from("assignment_decisions").insert({
        intern_id: d.internId, service_id: d.serviceId || null, service: d.service, source: d.source, reason: d.reason,
        run_id: d.runId || null, engine_version: d.engineVersion, decided_by: d.decidedBy, decided_at: d.decidedAt,
      }), session);
  });
}

function syncStudent(session: Session) {
  return useStore.subscribe((next, prev) => {
    if (applying) return;
    if (next.profile !== prev.profile) {
      const p = next.profile;
      push("Profil", () => supabase.from("student_profiles").upsert({
        id: session.userId, nom: p.nom, postnom: p.postnom, prenom: p.prenom, adresse: p.adresse, telephone: p.telephone,
        photo_url: p.photo, universite: p.universite, faculte: p.faculte, filiere: p.filiere, niveau: p.niveau,
        competences: p.competences, experiences: p.experiences, projets: p.projets, infos: p.infos,
        cv: p.cv as unknown as Json, visible: p.visible, updated_at: new Date().toISOString(),
      }), session);
    }
    const before = new Map(prev.applications.map((a) => [a.id, a]));
    for (const a of changed(prev.applications, next.applications)) {
      const old = before.get(a.id);
      if (!old) {
        push("Candidature", () => supabase.from("applications").insert({ id: a.id, offer_id: a.offerId, student_id: session.userId }), session);
      } else if (old.status !== a.status) {
        if (a.status === "retiree") push("Retrait", () => supabase.from("applications").update({ status: "retiree" }).eq("id", a.id), session);
        if (a.status === "confirmee" || a.status === "declinee")
          push("Choix du stage", () => supabase.from("applications").update({ student_choice: a.status }).eq("id", a.id), session);
      }
    }
    const read = next.notifications.filter((n) => n.read && prev.notifications.find((p) => p.id === n.id)?.read === false);
    if (read.length) push("Notifications", () => supabase.from("notifications").update({ read: true }).in("id", read.map((n) => n.id)), session);
  });
}

/**
 * Consultation par l'administrateur : rien n'est enregistré au nom du titulaire. Une modification
 * tentée dans l'espace consulté est signalée puis annulée (les vraies données sont relues).
 */
function readOnly(reload: () => void) {
  const refuse = () => {
    // Le message de réussite de la page (« Candidature retirée »…) part juste après : on le remplace.
    setTimeout(() => {
      toast.dismiss();
      toast.info("Modification non enregistrée", { id: "lecture-seule", description: READ_ONLY_MESSAGE });
    }, 60);
    reload();
  };
  const COMPANY_KEYS = ["profile", "spaceActive", "hosting", "offers", "candidates", "interviews", "services", "supervisors", "interns", "expertRuns", "expertRules", "decisions", "attendance"] as const;
  const STUDENT_KEYS = ["profile", "applications", "notifications"] as const;
  const stopCompany = useCompanyStore.subscribe((next, prev) => {
    if (!applying && COMPANY_KEYS.some((key) => next[key] !== prev[key])) refuse();
  });
  const stopStudent = useStore.subscribe((next, prev) => {
    if (!applying && STUDENT_KEYS.some((key) => next[key] !== prev[key])) refuse();
  });
  return () => {
    stopCompany();
    stopStudent();
  };
}

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

/** Démarre le chargement, l'enregistrement et l'écoute en temps réel. Renvoie la fonction d'arrêt. */
export function startRemote(session: Session, onReady: () => void): () => void {
  remoteState.active = true;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const reload = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!stopped) void loadForSession(session).catch((error: Error) => toast.error("Chargement impossible", { description: error.message }));
    }, 400);
  };

  loadForSession(session)
    .catch((error: Error) => toast.error("Chargement impossible", { description: error.message }))
    .finally(() => !stopped && onReady());

  const unsubscribe = session.viewing
    ? readOnly(reload)
    : session.role === "etudiant"
      ? syncStudent(session)
      : session.role === "entreprise"
        ? syncCompany(session)
        : () => undefined;

  const channel = supabase
    .channel(`stagemanager-${session.userId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, reload)
    .on("postgres_changes", { event: "*", schema: "public", table: "interviews" }, reload)
    .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, reload)
    .on("postgres_changes", { event: "*", schema: "public", table: "interns" }, reload)
    .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, reload)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "companies" }, reload)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${session.userId}` }, (payload) => {
      const n = payload.new as Tables<"notifications">;
      // En consultation, la notification est celle du titulaire : elle s'ajoute à la liste sans alerte.
      if (!session.viewing) toast(n.title, { description: n.body });
      reload();
    })
    .subscribe();

  return () => {
    stopped = true;
    clearTimeout(timer);
    unsubscribe();
    void supabase.removeChannel(channel);
    remoteState.active = false;
  };
}

/* ------------------------------------------------------------------ */
/* Actions de l'étudiant                                               */
/* ------------------------------------------------------------------ */

export type ReportInput = { period: string; activites: string; difficultes: string; competences: string };

/**
 * Dépôt d'un rapport de stage (ou de sa version corrigée). La base vérifie que le dossier est
 * bien celui de l'étudiant et que son affectation est validée, puis prévient l'entreprise.
 */
export async function submitInternReport(internId: string, input: ReportInput, replaces?: string): Promise<string | null> {
  if (useViewAs.getState().target) return READ_ONLY_MESSAGE;
  const { data, error } = await supabase.rpc("submit_report", {
    intern: internId,
    period: input.period,
    activites: input.activites,
    difficultes: input.difficultes,
    competences: input.competences,
    ...(replaces ? { replaces } : {}),
  });
  if (error) return error.message;
  const report = data as unknown as Intern["reports"][number];
  applying = true;
  try {
    useCompanyStore.setState((state) => ({
      interns: state.interns.map((intern) =>
        intern.id !== internId
          ? intern
          : { ...intern, reports: replaces ? intern.reports.map((r) => (r.id === replaces ? report : r)) : [...intern.reports, report] }
      ),
    }));
  } finally {
    applying = false;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Actions de l'administrateur                                         */
/* ------------------------------------------------------------------ */

export async function adminSetSuspended(userId: string, suspended: boolean) {
  return supabase.from("profiles").update({ suspended }).eq("id", userId);
}
export async function adminLog(kind: "suspension" | "reactivation" | "retrait_offre", target: string, reason: string, adminId: string) {
  return supabase.from("admin_actions").insert({ kind, target, reason, admin_id: adminId });
}
export async function adminWithdrawOffer(offerId: string) {
  return supabase.from("offers").update({ status: "desactivee" }).eq("id", offerId);
}
