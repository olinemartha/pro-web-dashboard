# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Étudiants** (primary supply side): students in the DRC looking for an academic internship. They need to build a credible profile, find relevant offers, apply, track status, then follow their internship, submit periodic reports and retrieve their end-of-internship certificate.
- **Entreprises** (primary customer side, current build priority): a company's single main account holder manages services and their internship needs, publishes offers, processes applications, schedules interviews, assigns selected interns to a department with the expert system's help, supervises interns and validates certificates. FINCA RDC is the first company; the platform is multi-company from the start, with each company's data strictly isolated.
- **Administrateur** (single main account): supervises the platform — accounts, company integration requests, offers, applications, expert-system runs, activity log and general settings. The administrator does not make recruitment or assignment decisions in the company's place.

## Product Purpose

StageManager is a French-language web platform that connects students seeking internships with companies offering them, and covers the whole lifecycle: profiles, offers, applications, interviews, assignment, internship supervision, evaluation and certification.

Its reason for existing is academic and operational at once: it is the implementation vehicle for the memoir "Mise en place d'un système expert d'aide à l'affectation des stagiaires chez FINCA RDC". Success means the platform can be demonstrated end to end and defended, and that the expert system produces explained, traceable assignment recommendations that a company actually uses.

## Positioning

The differentiator is the expert system for intern-to-department assignment: a documented facts base (intern profile, skills, training, department needs), a rules base derived from FINCA RDC's real criteria, an inference engine, and an explanation module that shows which criteria were satisfied and which were not.

It is explicitly not a chatbot or general conversational assistant. It recommends; the company decides. Every analysis and final decision is logged. A neighbouring internship board could copy the listings and applications, but not the documented rule base, its explanations and the audit trail around them.

## Operating Context

- The product is built and defended as an academic memoir project, with FINCA RDC in Kinshasa as the first real partner company.
- Users work in French, in a professional administrative setting; terminology follows the PRD (candidature, affectation, service, besoin, stagiaire, superviseur, attestation).
- The PRD and Design Brief require every space to be usable on desktop, tablet and phone; no role is exempt from the responsive requirement.
- Documents (CV, certificates, attestations) are part of the workflow and must respect role-based visibility.
- The platform is free for students and companies during the initial phase. Pricing and payment are explicitly post-defense subjects.

## Capabilities and Constraints

Confirmed functionality (PRD v1.1, three spaces):

- Student space: dashboard, six-section profile with completion indicator and visibility toggle, offer search and filters, favourites, applications and their statuses (En attente, En cours d'examen, En entretien, Acceptée, Refusée, Retirée), internship view, documents and certificate, settings.
- Company space (current priority): dashboard, company profile (six sections), offers (Brouillon, Publiée, Clôturée, Désactivée), applications per offer, interviews (Programmé, Réalisé, Annulé), interns and supervision, services and needs, settings. Offers are published without prior admin approval; the admin may withdraw non-compliant ones with a reason.
- Admin space: global dashboard, student/company/offer/application management, expert-system follow-up, immutable activity log, settings.
- Expert system: facts base, rules base, inference engine, explanation module; recommendations only, human validation required, every run and decision traced.
- Company data isolation is non-negotiable; privacy rules govern profile visibility, private email, phone released only after selection and confirmation, CV visible only after applying to that company's offer.
- Multi-company from the start, with one main account per company in v1 and one main administrator account.

Technical constraints and current state:

- Target architecture is React + TypeScript + Vite + Tailwind CSS, Supabase (Auth, PostgreSQL with Row Level Security, Edge Functions), deployed on Vercel. The user has confirmed this repo must become **connected to Supabase**, not stay a mock-data demo.
- Current repository evidence: student and company spaces exist as a Vite/React/TanStack Router prototype; data lives in client-side Zustand stores and mock fixtures; no Supabase client, auth, RLS or Edge Functions are wired yet; no admin routes exist yet.
- Language: **French only**, including all UI copy, statuses, documents and error messages.
- Animations must stay discreet and respect `prefers-reduced-motion`.

Explicitly undecided (must be settled with FINCA RDC, not invented):

- The exact expert-system rules, their priorities, tie-breaking and explanation wording.
- Required fields for each form.
- Notification channels and detailed preferences.
- Data-retention durations and the deletion procedure.
- QR-code verification mechanics for certificates.
- Periodic report frequency.
- Deployment and backup specifics.
- Pricing and billing (post-defense).

## Brand Commitments

- Product name: **StageManager**. First partner company: **FINCA RDC**.
- Voice: professional, sober, reassuring, direct; French administrative register without jargon. Button labels use precise verbs ("Publier une offre", "Envoyer ma candidature", "Valider l'affectation", "Enregistrer les modifications").
- `Design_Brief_StageManager_definitif.md` is the agreed visual reference for palette, typography, layout and component character. It is binding; consult it rather than restating it here.
- No logo, customer testimonials, benchmark figures or pricing may be invented.

## Evidence on Hand

- `PRD_StageManager_definitif.md` — consolidated v1.1 requirements, roles, rules (RG-01 to RG-24), acceptance criteria and priorities.
- `Design_Brief_StageManager_definitif.md` — agreed visual and UX direction, screen priority order.
- Working React prototype with student and company spaces, populated by fictional fixtures in `src/lib/mock-data.ts`, `src/lib/company-data.ts` and `src/lib/rules.ts`.
- Absent and not to be fabricated: real FINCA RDC expert rules, real customer or student testimonials, usage metrics, pricing, legal registrations, partner logos.
- FINCA RDC is a real first partner, but every name, offer and figure currently in the app is illustrative demo content.

## Product Principles

1. **Recommend, never decide.** The expert system explains and proposes; the company validates. Never present a recommendation as an automatic decision.
2. **Explainability is the product.** Every assignment proposal must show the facts used, the rules applied, the criteria met and the limits — a score without reasons is a failure.
3. **Isolation and privacy by default.** A company sees only its own data; a student controls profile visibility; private contact details and CVs follow the documented access rules. Interface hiding never substitutes for server-side enforcement.
4. **Clarity over decoration.** Statuses, next steps and permissions must be legible at a glance; the interface serves real administrative work, not visual effect.
5. **Nothing important happens untracked.** Assignment runs, recruitment decisions, withdrawals, suspensions and certificate validations leave an immutable trace.

## Accessibility & Inclusion

Follow the Design Brief's baseline: sufficient contrast, comfortable text size, full keyboard navigation with visible focus, labels tied to fields, understandable field-level errors, alt text for meaningful images, status never conveyed by colour alone, and `prefers-reduced-motion` respected. No additional product-specific accessibility standard has been established yet.
