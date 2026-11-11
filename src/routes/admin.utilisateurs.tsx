import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ban, Building2, RotateCcw, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import {
  ActionMenu,
  AvatarInitials,
  Badge,
  EmptyNote,
  Field,
  FilterChips,
  MenuItem,
  Modal,
  PageIntro,
  SearchInput,
  StatCard,
  textareaClass,
} from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { useAdminData } from "@/lib/admin-data";
import { useAdminStore } from "@/lib/admin-store";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/dates";

export const Route = createFileRoute("/admin/utilisateurs")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s["q"] === "string" ? { q: s["q"] } : {}),
  head: () => ({ meta: [{ title: "Utilisateurs — Administration StageManager" }] }),
  component: UsersPage,
});

type Tab = "etudiants" | "entreprises";
type Target = { email: string; name: string; suspended: boolean };

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

function UsersPage() {
  const data = useAdminData();
  const { q } = Route.useSearch();
  const { suspend, reactivate, suspended } = useAdminStore();
  const accounts = useAuth((state) => state.accounts);
  const [tab, setTab] = useState<Tab>("etudiants");
  const [search, setSearch] = useState(q ?? "");
  const [target, setTarget] = useState<Target | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setSearch(q ?? ""), [q]);

  const query = search.trim().toLowerCase();
  const students = data.students.filter((s) => !query || `${s.name} ${s.email} ${s.filiere} ${s.universite}`.toLowerCase().includes(query));
  const companies = data.companies.filter((c) => !query || `${c.name} ${c.email} ${c.sector}`.toLowerCase().includes(query));
  const rows = tab === "etudiants" ? students : companies;

  const confirmSuspension = () => {
    if (!target) return;
    if (!reason.trim()) {
      setError("Indiquez le motif de la suspension : il est inscrit au journal.");
      document.getElementById("suspension-motif")?.focus();
      return;
    }
    suspend(target.email, target.name, reason.trim());
    toast.success("Compte suspendu", { description: `${target.name} ne peut plus se connecter.` });
    setTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageIntro desc="Les comptes des étudiants et des entreprises. Une suspension bloque la connexion ; elle est motivée et inscrite au journal d'activité." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard key="e" label="Étudiants" value={data.students.length} icon={Users} motion="bounce" foot={`${plural(data.students.filter((s) => s.applications > 0).length, "candidat")} actif${data.students.filter((s) => s.applications > 0).length > 1 ? "s" : ""}`} />,
          <StatCard key="c" label="Entreprises" value={data.companies.length} icon={Building2} motion="lift" foot="données isolées par entreprise" />,
          <StatCard key="n" label="Inscrits sur la plateforme" value={accounts.filter((a) => a.onboarded).length} icon={UserPlus} motion="bounce" foot="comptes créés depuis l'inscription" />,
          <StatCard key="s" label="Comptes suspendus" value={suspended.length} icon={Ban} motion="pop" foot={suspended.length ? "connexion bloquée" : "aucun compte suspendu"} tone={suspended.length ? "alert" : "neutral"} />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      <Reveal as="section" delay={120} className="card-surface overflow-hidden" aria-labelledby="users-title">
        <div className="flex flex-col gap-3 border-b px-5 pb-3.5 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <h2 id="users-title" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Comptes
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">{rows.length}</span>
            </h2>
            <FilterChips
              label="Type de compte"
              value={tab}
              onChange={setTab}
              options={[
                { value: "etudiants", label: "Étudiants", count: students.length },
                { value: "entreprises", label: "Entreprises", count: companies.length },
              ]}
            />
          </div>
          <SearchInput id="users-search" label="Rechercher un compte" placeholder="Nom, e-mail, filière" value={search} onChange={setSearch} className="w-full lg:w-64" />
        </div>

        {rows.length === 0 ? (
          <EmptyNote icon={Users} title="Aucun compte ne correspond" desc="Essayez un autre mot-clé." className="py-12" />
        ) : (
          <ul className="divide-y">
            {tab === "etudiants"
              ? students.map((s, index) => (
                  <Reveal as="li" key={s.email} delay={index < 8 ? 160 + index * 40 : 0}>
                    <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5 transition-colors duration-200 hover:bg-muted/40 md:grid-cols-[36px_minmax(0,1.3fr)_minmax(0,1fr)_110px_auto]">
                      <AvatarInitials initials={s.initials} className="size-9 text-xs" />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-[13px] font-semibold">
                          {s.name}
                          {s.suspended && <Badge label="Suspendu" tone="destructive" className="text-[11px]" />}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                      </div>
                      <p className="hidden min-w-0 text-xs md:block">
                        <span className="block truncate">{[s.filiere, s.niveau].filter(Boolean).join(" · ") || "Profil incomplet"}</span>
                        <span className="block truncate text-muted-foreground">{s.universite}</span>
                      </p>
                      <p className="hidden text-xs tabular-nums text-muted-foreground md:block">
                        <span className="font-semibold text-foreground">{s.applications}</span> candidature{s.applications > 1 ? "s" : ""}
                        <span className="block">actif {fmtDate(s.lastActivity, false)}</span>
                      </p>
                      <ActionMenu label={`Actions pour ${s.name}`}>
                        {s.suspended ? (
                          <MenuItem
                            onSelect={() => {
                              reactivate(s.email, s.name);
                              toast.success("Compte réactivé", { description: s.name });
                            }}
                          >
                            <RotateCcw className="size-4 text-muted-foreground" /> Réactiver le compte
                          </MenuItem>
                        ) : (
                          <MenuItem
                            destructive
                            onSelect={() => {
                              setTarget({ email: s.email, name: s.name, suspended: s.suspended });
                              setReason("");
                              setError("");
                            }}
                          >
                            <Ban className="size-4" /> Suspendre le compte
                          </MenuItem>
                        )}
                      </ActionMenu>
                    </div>
                  </Reveal>
                ))
              : companies.map((c) => (
                  <li key={c.email}>
                    <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5 transition-colors duration-200 hover:bg-muted/40 md:grid-cols-[36px_minmax(0,1.3fr)_minmax(0,1fr)_110px_auto]">
                      <span className="grid size-9 place-items-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground" aria-hidden>
                        {c.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-[13px] font-semibold">
                          {c.name}
                          {c.suspended && <Badge label="Suspendu" tone="destructive" className="text-[11px]" />}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                      </div>
                      <p className="hidden min-w-0 truncate text-xs md:block">
                        {c.sector} · {c.city}
                      </p>
                      <p className="hidden text-xs tabular-nums text-muted-foreground md:block">
                        <span className="font-semibold text-foreground">{c.published}</span> offre{c.published > 1 ? "s" : ""} publiée{c.published > 1 ? "s" : ""}
                        <span className="block">{plural(c.interns, "stagiaire")}</span>
                      </p>
                      <ActionMenu label={`Actions pour ${c.name}`}>
                        {c.suspended ? (
                          <MenuItem
                            onSelect={() => {
                              reactivate(c.email, c.name);
                              toast.success("Compte réactivé", { description: c.name });
                            }}
                          >
                            <RotateCcw className="size-4 text-muted-foreground" /> Réactiver le compte
                          </MenuItem>
                        ) : (
                          <MenuItem
                            destructive
                            onSelect={() => {
                              setTarget({ email: c.email, name: c.name, suspended: c.suspended });
                              setReason("");
                              setError("");
                            }}
                          >
                            <Ban className="size-4" /> Suspendre le compte
                          </MenuItem>
                        )}
                      </ActionMenu>
                    </div>
                  </li>
                ))}
          </ul>
        )}
      </Reveal>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        icon={Ban}
        title="Suspendre ce compte ?"
        description={target ? `${target.name} · ${target.email}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmSuspension}>
              Suspendre le compte
            </Button>
          </>
        }
      >
        <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
          La personne ne pourra plus se connecter. Ses données sont conservées et le compte peut être réactivé à tout moment.
        </p>
        <Field label="Motif" htmlFor="suspension-motif" required error={error} className="mt-4">
          <textarea
            id="suspension-motif"
            className={textareaClass}
            placeholder="Ex. Profil frauduleux signalé par l'université"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
          />
        </Field>
      </Modal>
    </div>
  );
}
