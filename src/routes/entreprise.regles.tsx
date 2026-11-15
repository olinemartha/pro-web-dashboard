import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpenCheck, CircleOff, GitBranch, Pencil, Plus, Power, Target, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import {
  ActionMenu,
  Badge,
  EmptyNote,
  Field,
  FilterChips,
  MenuItem,
  Modal,
  PageIntro,
  SECTION_LINK,
  Select,
  StatCard,
  inputClass,
} from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";
import type { ConditionOp, KnowledgeRule, RuleCondition } from "@/lib/company-data";
import {
  BASE_FACTS,
  GOAL_FACT,
  GOAL_LABEL,
  LEVELS,
  OPS_BY_TYPE,
  OP_LABELS,
  conditionText,
  derivedFacts,
  factDefinition,
  factKey,
  ruleText,
} from "@/lib/expert-engine";
import { relativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/entreprise/regles")({
  head: () => ({
    meta: [{ title: "Base de règles — Espace entreprise" }],
  }),
  component: RulesPage,
});

type Filter = "toutes" | "conclusion" | "intermediaires" | "desactivees";

interface RuleForm {
  label: string;
  conditions: RuleCondition[];
  /** « but » : la règle établit « service recommandé » ; « fait » : elle déduit un fait intermédiaire. */
  kind: "but" | "fait" | "";
  conclusionLabel: string;
}

const EMPTY_CONDITION: RuleCondition = { fact: "", op: "vrai", value: "" };
const EMPTY_FORM: RuleForm = { label: "", conditions: [{ ...EMPTY_CONDITION }], kind: "", conclusionLabel: "" };

const SOURCE_LABELS = { stagiaire: "Profil du stagiaire", service: "Besoins du service", comparaison: "Comparaison stagiaire et service" };

function toForm(rule: KnowledgeRule): RuleForm {
  return {
    label: rule.label,
    conditions: rule.conditions.map((condition) => ({ ...condition })),
    kind: rule.conclusion === GOAL_FACT ? "but" : "fait",
    conclusionLabel: rule.conclusion === GOAL_FACT ? "" : rule.conclusionLabel,
  };
}

/** La règle telle qu'elle sera enregistrée, à partir du formulaire. */
function fromForm(form: RuleForm) {
  const conclusionLabel = form.kind === "but" ? GOAL_LABEL : form.conclusionLabel.trim().replace(/^«\s*|\s*»$/g, "");
  return {
    label: form.label.trim(),
    conditions: form.conditions.map((c) => ({ ...c, value: c.value.trim() })),
    conclusion: form.kind === "but" ? GOAL_FACT : factKey(conclusionLabel),
    conclusionLabel,
  };
}

function RulesPage() {
  const { expertRules: rules, addRule, updateRule, removeRule } = useCompanyStore();
  const sorted = useMemo(() => [...rules].sort((a, b) => a.position - b.position), [rules]);

  const [filter, setFilter] = useState<Filter>("toutes");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const active = sorted.filter((rule) => rule.active);
  const goalRules = active.filter((rule) => rule.conclusion === GOAL_FACT);
  const intermediate = active.filter((rule) => rule.conclusion !== GOAL_FACT);
  const disabled = sorted.filter((rule) => !rule.active);
  const derived = derivedFacts(active);

  const visible = sorted.filter((rule) => {
    if (filter === "conclusion") return rule.active && rule.conclusion === GOAL_FACT;
    if (filter === "intermediaires") return rule.active && rule.conclusion !== GOAL_FACT;
    if (filter === "desactivees") return !rule.active;
    return true;
  });

  /** Faits utilisables dans une condition : faits de départ + faits déduits par les autres règles. */
  const usableDerived = derivedFacts(sorted.filter((rule) => rule.id !== editingId));

  const toDelete = sorted.find((rule) => rule.id === deleteId) ?? null;
  /** Règles qui ne pourraient plus se déclencher si l'on supprime ou désactive cette règle. */
  const dependents = (rule: KnowledgeRule) => {
    if (rule.conclusion === GOAL_FACT) return [];
    const otherProducers = active.some((r) => r.id !== rule.id && r.conclusion === rule.conclusion);
    if (otherProducers) return [];
    return active.filter((r) => r.id !== rule.id && r.conditions.some((c) => c.fact === rule.conclusion && c.op === "vrai"));
  };

  const set = (patch: Partial<RuleForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  };

  const setCondition = (index: number, patch: Partial<RuleCondition>) => {
    const conditions = form.conditions.map((condition, i) => (i === index ? { ...condition, ...patch } : condition));
    setForm((current) => ({ ...current, conditions }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`condition-${index}`];
      delete next.conditions;
      return next;
    });
  };

  const changeFact = (index: number, fact: string) => {
    const type = factDefinition(fact, sortedWithDerived(sorted, editingId))?.type ?? "booleen";
    setCondition(index, { fact, op: OPS_BY_TYPE[type][0], value: "" });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, conditions: [{ ...EMPTY_CONDITION }] });
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (rule: KnowledgeRule) => {
    setEditingId(rule.id);
    setForm(toForm(rule));
    setErrors({});
    setFormOpen(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!form.label.trim()) next.label = "Donnez un nom à la règle.";
    if (form.conditions.length === 0) next.conditions = "Ajoutez au moins une condition.";
    form.conditions.forEach((condition, index) => {
      const fact = factDefinition(condition.fact, sortedWithDerived(sorted, editingId));
      if (!condition.fact || !fact) next[`condition-${index}`] = "Choisissez un fait.";
      else if (fact.type === "nombre" && (condition.value === "" || !Number.isFinite(Number(condition.value))))
        next[`condition-${index}`] = "Indiquez un nombre.";
      else if (fact.type === "niveau" && !condition.value) next[`condition-${index}`] = "Choisissez un niveau.";
      else if (fact.type === "texte" && !condition.value.trim()) next[`condition-${index}`] = "Indiquez une valeur.";
    });
    if (!form.kind) next.kind = "Choisissez ce que la règle conclut.";
    else if (form.kind === "fait") {
      const label = form.conclusionLabel.trim();
      const key = factKey(label);
      if (!label) next.conclusionLabel = "Formulez le fait déduit.";
      else if (key === GOAL_FACT) next.kind = "Pour conclure « service recommandé », choisissez la conclusion finale.";
      else if (BASE_FACTS.some((fact) => fact.key === key)) next.conclusionLabel = "Ce fait existe déjà parmi les faits de départ.";
      else if (form.conditions.some((condition) => condition.fact === key))
        next.conclusionLabel = "Une règle ne peut pas conclure un fait qu'elle utilise dans ses conditions.";
    }
    setErrors(next);
    const order = ["label", ...form.conditions.map((_, i) => `condition-${i}`), "conditions", "kind", "conclusionLabel"];
    const first = order.find((key) => next[key]);
    if (first) {
      const target =
        first === "label"
          ? "regle-nom"
          : first.startsWith("condition-")
            ? `regle-fait-${first.split("-")[1]}`
            : first === "kind"
              ? "regle-conclusion-but"
              : first === "conclusionLabel"
                ? "regle-fait-deduit"
                : "regle-ajouter-condition";
      document.getElementById(target)?.focus();
      return;
    }

    const payload = fromForm(form);
    if (editingId) {
      updateRule(editingId, payload);
      toast.success("Règle modifiée", { description: payload.label });
    } else {
      addRule({ ...payload, active: true });
      toast.success("Règle ajoutée", { description: payload.label });
    }
    setFormOpen(false);
  };

  const toggle = (rule: KnowledgeRule) => {
    updateRule(rule.id, { active: !rule.active });
    toast.success(rule.active ? "Règle désactivée" : "Règle réactivée", {
      description: rule.active ? `${rule.code} ne sera plus utilisée par le moteur d'inférence.` : `${rule.code} est de nouveau utilisée.`,
    });
  };

  const preview = form.kind || form.conditions.some((c) => c.fact)
    ? ruleText(
        { ...fromForm(form), id: "apercu", code: "", active: true, position: 0, updatedAt: "", conclusionLabel: fromForm(form).conclusionLabel || "…" },
        sortedWithDerived(sorted, editingId)
      )
    : null;

  return (
    <div className="space-y-6">
      <PageIntro
        desc="Le module d'acquisition des connaissances : vous y écrivez les règles SI–ALORS que le moteur d'inférence applique en chaînage avant, des faits du stagiaire jusqu'à la conclusion « service recommandé »."
        action={
          <Button onClick={openCreate} className="group">
            <Plus className="mr-2 size-4 transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:rotate-90 motion-reduce:transition-none" />
            Ajouter une règle
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {[
          <StatCard key="actives" label="Règles actives" value={active.length} icon={BookOpenCheck} motion="lift" foot={`sur ${sorted.length} dans la base`} />,
          <StatCard key="but" label="Règles de conclusion" value={goalRules.length} icon={Target} motion="pop" foot={`établissent « ${GOAL_LABEL} »`} tone={goalRules.length ? "neutral" : "alert"} />,
          <StatCard key="faits" label="Faits déduits" value={derived.length} icon={GitBranch} motion="lift" foot="par les règles intermédiaires" />,
          <StatCard key="off" label="Règles désactivées" value={disabled.length} icon={CircleOff} motion="pop" foot={disabled.length ? "ignorées par le moteur" : "aucune"} />,
        ].map((card, index) => (
          <Reveal key={index} delay={index * 60} className="min-w-0">
            {card}
          </Reveal>
        ))}
      </div>

      {goalRules.length === 0 && (
        <p className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-pretty text-[13px] text-warning">
          Aucune règle active ne conclut « {GOAL_LABEL} » : le moteur ne pourra recommander aucun service.
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Reveal as="section" delay={120} className="card-surface overflow-hidden" aria-labelledby="regles-titre">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 pb-3.5 pt-4">
            <h2 id="regles-titre" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              Base de règles
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">{sorted.length}</span>
            </h2>
            <FilterChips
              label="Filtrer les règles"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "toutes" as Filter, label: "Toutes", count: sorted.length },
                { value: "intermediaires" as Filter, label: "Intermédiaires", count: intermediate.length },
                { value: "conclusion" as Filter, label: "Conclusion", count: goalRules.length },
                { value: "desactivees" as Filter, label: "Désactivées", count: disabled.length },
              ]}
            />
          </div>
          <p className="sr-only" aria-live="polite">{`${visible.length} règle${visible.length > 1 ? "s" : ""} affichée${visible.length > 1 ? "s" : ""}`}</p>

          {visible.length === 0 ? (
            <div className="pb-10">
              <EmptyNote
                icon={BookOpenCheck}
                title={sorted.length ? "Aucune règle dans cette catégorie" : "La base de règles est vide"}
                desc={sorted.length ? "Changez de filtre pour voir les autres règles." : "Ajoutez une première règle SI–ALORS."}
                className="pb-4 pt-12"
              />
              <div className="flex justify-center">
                {sorted.length ? (
                  <button type="button" onClick={() => setFilter("toutes")} className={SECTION_LINK}>
                    Tout afficher
                  </button>
                ) : (
                  <button type="button" onClick={openCreate} className={SECTION_LINK}>
                    <Plus className="size-3.5" /> Ajouter une règle
                  </button>
                )}
              </div>
            </div>
          ) : (
            <ol className="divide-y">
              {visible.map((rule, index) => {
                const goal = rule.conclusion === GOAL_FACT;
                return (
                  <Reveal as="li" key={rule.id} delay={index < 10 ? 160 + index * 40 : 0} className="flex items-start gap-3 px-5 py-4">
                    <span
                      className={cn(
                        "mt-0.5 grid h-6 min-w-8 shrink-0 place-items-center rounded-md px-1.5 text-[11px] font-semibold tabular-nums",
                        rule.active ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {rule.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className={cn("text-[13px] font-semibold", !rule.active && "text-muted-foreground")}>{rule.label}</h3>
                        {goal && <Badge label="Conclusion finale" tone="primary" className="px-1.5 py-0 text-[11px]" />}
                        {!rule.active && <Badge label="Désactivée" tone="muted" className="px-1.5 py-0 text-[11px]" />}
                      </div>
                      <p className={cn("mt-1 text-pretty text-[13px] leading-relaxed", !rule.active && "text-muted-foreground")}>
                        <span className="font-semibold text-primary">SI</span>{" "}
                        {rule.conditions.map((condition, i) => (
                          <span key={i}>
                            {i > 0 && <span className="font-semibold text-primary"> ET </span>}
                            {conditionText(condition, sorted)}
                          </span>
                        ))}{" "}
                        <span className="font-semibold text-primary">ALORS</span> « {rule.conclusionLabel} »
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Modifiée {relativeDay(rule.updatedAt.slice(0, 10))}</p>
                    </div>
                    <ActionMenu>
                      <MenuItem onSelect={() => openEdit(rule)}>
                        <Pencil className="size-3.5" /> Modifier
                      </MenuItem>
                      <MenuItem onSelect={() => toggle(rule)}>
                        <Power className="size-3.5" /> {rule.active ? "Désactiver" : "Réactiver"}
                      </MenuItem>
                      <MenuItem onSelect={() => setDeleteId(rule.id)}>
                        <Trash2 className="size-3.5" /> Supprimer
                      </MenuItem>
                    </ActionMenu>
                  </Reveal>
                );
              })}
            </ol>
          )}
        </Reveal>

        {/* La base de faits : ce que le moteur sait au départ */}
        <Reveal as="aside" delay={180} className="card-surface h-fit p-5" aria-labelledby="faits-titre">
          <h2 id="faits-titre" className="text-[15px] font-semibold tracking-tight">
            Faits de départ
          </h2>
          <p className="mt-0.5 text-pretty text-xs text-muted-foreground">
            La base de faits, établie pour chaque service à partir du profil du stagiaire et de vos services et besoins.
          </p>
          <ul className="mt-4 divide-y">
            {BASE_FACTS.map((fact) => (
              <li key={fact.key} className="py-2.5 text-[13px] first:pt-0">
                <p className="text-pretty first-letter:uppercase">{fact.label}</p>
                <p className="text-xs text-muted-foreground">{SOURCE_LABELS[fact.source]}</p>
              </li>
            ))}
          </ul>
          {derived.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className="text-[13px] font-semibold">Faits déduits par les règles</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {derived.map((fact) => (
                  <span key={fact.key} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                    {fact.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Reveal>
      </div>

      {/* ---------- Saisie d'une règle ---------- */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        icon={editingId ? Pencil : BookOpenCheck}
        title={editingId ? "Modifier la règle" : "Ajouter une règle"}
        description="Une règle combine des faits (SI) pour en déduire un nouveau fait (ALORS)."
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>{editingId ? "Enregistrer la règle" : "Ajouter la règle"}</Button>
          </>
        }
      >
        <div className="space-y-6">
          <Field label="Nom de la règle" htmlFor="regle-nom" required error={errors.label}>
            <input
              id="regle-nom"
              data-autofocus
              className={inputClass}
              placeholder="Ex. Profil pour la communication"
              value={form.label}
              onChange={(event) => set({ label: event.target.value })}
            />
          </Field>

          <fieldset>
            <legend className="text-[13px] font-semibold">
              SI <span className="font-normal text-muted-foreground">: toutes ces conditions sont vraies</span>
            </legend>
            <ul className="mt-3 space-y-3">
              {form.conditions.map((condition, index) => {
                const fact = factDefinition(condition.fact, sortedWithDerived(sorted, editingId));
                const derivedFact = usableDerived.some((d) => d.key === condition.fact);
                const ops = derivedFact ? (["vrai"] as ConditionOp[]) : OPS_BY_TYPE[fact?.type ?? "booleen"];
                const needsValue = fact && fact.type !== "booleen";
                const error = errors[`condition-${index}`];
                return (
                  <li key={index} className="rounded-xl border px-3.5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">{index === 0 ? "Condition 1" : `ET condition ${index + 1}`}</p>
                      {form.conditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => set({ conditions: form.conditions.filter((_, i) => i !== index) })}
                          className="press -m-1.5 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Retirer la condition ${index + 1}`}
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_150px]">
                      <Select
                        id={`regle-fait-${index}`}
                        aria-label={`Fait de la condition ${index + 1}`}
                        placeholder="Choisir un fait"
                        value={condition.fact}
                        onChange={(event) => changeFact(index, event.target.value)}
                        aria-invalid={Boolean(error)}
                      >
                        <optgroup label="Faits de départ">
                          {BASE_FACTS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </optgroup>
                        {usableDerived.length > 0 && (
                          <optgroup label="Faits déduits par d'autres règles">
                            {usableDerived.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </Select>
                      <Select
                        aria-label={`Comparaison de la condition ${index + 1}`}
                        value={condition.op}
                        disabled={!condition.fact}
                        onChange={(event) => setCondition(index, { op: event.target.value as ConditionOp })}
                      >
                        {ops.map((op) => (
                          <option key={op} value={op}>
                            {derivedFact ? "est établi" : OP_LABELS[op]}
                          </option>
                        ))}
                      </Select>
                      {needsValue ? (
                        fact.type === "niveau" ? (
                          <Select
                            aria-label={`Niveau de la condition ${index + 1}`}
                            placeholder="Niveau"
                            value={condition.value}
                            onChange={(event) => setCondition(index, { value: event.target.value })}
                          >
                            {LEVELS.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <input
                            aria-label={`Valeur de la condition ${index + 1}`}
                            className={cn(inputClass, fact.type === "nombre" && "tabular-nums")}
                            inputMode={fact.type === "nombre" ? "numeric" : undefined}
                            placeholder={fact.type === "nombre" ? "Ex. 2" : "Ex. Communication"}
                            value={condition.value}
                            onChange={(event) => setCondition(index, { value: event.target.value })}
                          />
                        )
                      ) : (
                        <span className="hidden sm:block" aria-hidden />
                      )}
                    </div>
                    {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
                  </li>
                );
              })}
            </ul>
            {errors.conditions && <p className="mt-1.5 text-xs text-destructive">{errors.conditions}</p>}
            <button
              id="regle-ajouter-condition"
              type="button"
              onClick={() => set({ conditions: [...form.conditions, { ...EMPTY_CONDITION }] })}
              className={cn(SECTION_LINK, "mt-3")}
            >
              <Plus className="size-3.5" /> Ajouter une condition (ET)
            </button>
          </fieldset>

          <fieldset>
            <legend className="text-[13px] font-semibold">
              ALORS <span className="font-normal text-muted-foreground">: ce que la règle ajoute à la base de faits</span>
            </legend>
            <div role="radiogroup" aria-label="Conclusion de la règle" className="mt-3 grid gap-2 sm:grid-cols-2">
              {(
                [
                  { value: "fait", title: "Un fait intermédiaire", desc: "Il pourra servir de condition à d'autres règles." },
                  { value: "but", title: `La conclusion « ${GOAL_LABEL} »`, desc: "Le service évalué est proposé à l'entreprise." },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                    form.kind === option.value ? "border-primary bg-primary-soft/50" : "hover:bg-muted/50"
                  )}
                >
                  <input
                    id={option.value === "but" ? "regle-conclusion-but" : "regle-conclusion-fait"}
                    type="radio"
                    name="regle-conclusion"
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                    checked={form.kind === option.value}
                    onChange={() => set({ kind: option.value })}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold">{option.title}</span>
                    <span className="block text-xs text-muted-foreground">{option.desc}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.kind && <p className="mt-1.5 text-xs text-destructive">{errors.kind}</p>}
            {form.kind === "fait" && (
              <Field
                label="Fait déduit"
                htmlFor="regle-fait-deduit"
                required
                error={errors.conclusionLabel}
                hint="Reprenez le même libellé pour qu'une autre règle puisse s'en servir."
                className="mt-4"
              >
                <input
                  id="regle-fait-deduit"
                  list="faits-deduits"
                  className={inputClass}
                  placeholder="Ex. maîtrise des langues"
                  value={form.conclusionLabel}
                  onChange={(event) => set({ conclusionLabel: event.target.value })}
                />
                <datalist id="faits-deduits">
                  {usableDerived.map((f) => (
                    <option key={f.key} value={f.label} />
                  ))}
                </datalist>
              </Field>
            )}
          </fieldset>

          {preview && (
            <div className="rounded-xl bg-muted/50 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Aperçu de la règle</p>
              <p className="mt-1 text-pretty text-[13px] leading-relaxed">{preview}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* ---------- Suppression ---------- */}
      <Modal
        open={Boolean(toDelete)}
        onClose={() => setDeleteId(null)}
        icon={Trash2}
        title="Supprimer cette règle ?"
        description={toDelete ? `${toDelete.code} · ${toDelete.label}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (toDelete) {
                  removeRule(toDelete.id);
                  toast.success("Règle supprimée", { description: `${toDelete.code} · ${toDelete.label}` });
                }
                setDeleteId(null);
              }}
            >
              <Trash2 className="mr-2 size-4" /> Supprimer
            </Button>
          </>
        }
      >
        {toDelete && dependents(toDelete).length > 0 && (
          <p className="mb-3 text-pretty text-[13px] leading-relaxed text-warning">
            {dependents(toDelete)
              .map((r) => r.code)
              .join(", ")}{" "}
            utilise{dependents(toDelete).length > 1 ? "nt" : ""} le fait « {toDelete.conclusionLabel} » : elle
            {dependents(toDelete).length > 1 ? "s" : ""} ne pourra{dependents(toDelete).length > 1 ? "nt" : ""} plus se déclencher.
          </p>
        )}
        <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
          Les analyses déjà faites gardent la règle dans leur trace. Pour la retirer sans la perdre, désactivez-la plutôt. La
          suppression est définitive.
        </p>
      </Modal>
    </div>
  );
}

/** Toutes les règles sauf celle en cours de modification : ses propres conclusions ne sont pas des faits disponibles. */
function sortedWithDerived(rules: KnowledgeRule[], editingId: string | null) {
  return rules.filter((rule) => rule.id !== editingId);
}
