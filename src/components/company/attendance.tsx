import { useState } from "react";
import { CalendarCheck, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/company/date-picker";
import { ActionMenu, EmptyNote, Field, MenuItem, Modal, inputClass, textareaClass } from "@/components/company/ui";
import { Reveal } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import type { AttendanceWeek, Intern } from "@/lib/company-data";
import { useCompanyStore } from "@/lib/company-store";
import { fmtDate, localIsoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Lundi de la semaine d'une date (AAAA-MM-JJ, heure locale). */
export function mondayOf(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  const shift = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - shift);
  return localIsoDate(date);
}

/** Totaux de présence d'un stagiaire (en jours). */
export function attendanceTotals(weeks: AttendanceWeek[]) {
  return weeks.reduce((sum, w) => ({ present: sum.present + w.present, late: sum.late + w.late, absent: sum.absent + w.absent }), { present: 0, late: 0, absent: 0 });
}

/** Les trois totaux, en ligne : même présentation pour l'entreprise et pour le stagiaire. */
export function AttendanceTotals({ weeks, className }: { weeks: AttendanceWeek[]; className?: string }) {
  const totals = attendanceTotals(weeks);
  return (
    <dl className={cn("grid grid-cols-3 divide-x rounded-xl border py-3 text-center", className)}>
      {[
        { label: "Présent", value: totals.present },
        { label: "Retard", value: totals.late },
        { label: "Absent", value: totals.absent },
      ].map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] font-medium text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">{item.value} j</dd>
        </div>
      ))}
    </dl>
  );
}

/** Une ligne de relevé : « Semaine du 16 nov. · 5 j présent · 1 retard · 0 absence ». */
export function AttendanceRow({ week, actions }: { week: AttendanceWeek; actions?: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-5 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold">Semaine du {fmtDate(week.weekStart, false)}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {week.present} j présent · {week.late} retard{week.late > 1 ? "s" : ""} · {week.absent} absence{week.absent > 1 ? "s" : ""}
          {week.note && <span className="block truncate">{week.note}</span>}
        </p>
      </div>
      {actions}
    </li>
  );
}

type Draft = { weekStart: string; present: string; late: string; absent: string; note: string };
const EMPTY: Draft = { weekStart: "", present: "", late: "", absent: "", note: "" };

/** Dossier du stagiaire (entreprise) : saisie hebdomadaire de la présence. */
export function AttendanceSection({ intern }: { intern: Intern }) {
  const { attendance, saveAttendance, removeAttendance } = useCompanyStore();
  const weeks = attendance.filter((a) => a.internId === intern.id).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  const start = (week?: AttendanceWeek) => {
    setDraft(
      week
        ? { weekStart: week.weekStart, present: String(week.present), late: String(week.late), absent: String(week.absent), note: week.note }
        : EMPTY
    );
    setErrors({});
    setOpen(true);
  };
  const set = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      (Object.keys(patch) as (keyof Draft)[]).forEach((key) => delete next[key]);
      return next;
    });
  };

  const save = () => {
    const next: typeof errors = {};
    const days = (value: string) => (value.trim() === "" ? Number.NaN : Number(value));
    const present = days(draft.present);
    const late = draft.late.trim() === "" ? 0 : days(draft.late);
    const absent = draft.absent.trim() === "" ? 0 : days(draft.absent);
    if (!draft.weekStart) next.weekStart = "Choisissez un jour de la semaine concernée.";
    if (!Number.isInteger(present) || present < 0 || present > 7) next.present = "Indiquez un nombre de jours entre 0 et 7.";
    if (!Number.isInteger(absent) || absent < 0 || absent > 7) next.absent = "Entre 0 et 7 jours.";
    else if (Number.isInteger(present) && present + absent > 7) next.absent = "Présences et absences dépassent 7 jours.";
    if (!Number.isInteger(late) || late < 0) next.late = "Indiquez un nombre de jours.";
    else if (Number.isInteger(present) && late > present) next.late = "Un retard compte parmi les jours de présence.";
    setErrors(next);
    const first = (["weekStart", "present", "late", "absent"] as const).find((key) => next[key]);
    if (first) {
      document.getElementById(`presence-${first}`)?.focus();
      return;
    }
    const weekStart = mondayOf(draft.weekStart);
    saveAttendance({ internId: intern.id, weekStart, present, late, absent, note: draft.note.trim() });
    setOpen(false);
    toast.success("Présence enregistrée", { description: `${intern.name} · semaine du ${fmtDate(weekStart, false)}` });
  };

  return (
    <Reveal as="section" delay={80} id="presence" className="card-surface scroll-mt-6 overflow-hidden" aria-labelledby="presence-titre">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 pb-3.5 pt-4">
        <div className="min-w-0">
          <h2 id="presence-titre" className="text-[15px] font-semibold tracking-tight">
            Présence
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Un relevé par semaine : le stagiaire le voit dans son suivi.</p>
        </div>
        {intern.confirmed && (
          <Button size="sm" onClick={() => start()}>
            <CalendarCheck className="mr-1.5 size-3.5" /> Saisir une semaine
          </Button>
        )}
      </div>
      {!intern.confirmed ? (
        <p className="px-5 py-5 text-[13px] text-muted-foreground">La présence se saisit une fois l'affectation validée.</p>
      ) : weeks.length === 0 ? (
        <EmptyNote icon={CalendarCheck} title="Aucun relevé" desc="Saisissez chaque semaine les jours de présence, les retards et les absences." className="py-10" />
      ) : (
        <>
          <AttendanceTotals weeks={weeks} className="mx-5 mt-4" />
          <ul className="mt-3 divide-y border-t">
            {weeks.map((week) => (
              <AttendanceRow
                key={week.id}
                week={week}
                actions={
                  <ActionMenu label={`Actions — semaine du ${fmtDate(week.weekStart, false)}`}>
                    <MenuItem onSelect={() => start(week)}>
                      <Pencil className="size-3.5" /> Modifier
                    </MenuItem>
                    <MenuItem
                      destructive
                      onSelect={() => {
                        removeAttendance(week.id);
                        toast.success("Relevé supprimé", { description: `Semaine du ${fmtDate(week.weekStart, false)}` });
                      }}
                    >
                      <Trash2 className="size-3.5" /> Supprimer
                    </MenuItem>
                  </ActionMenu>
                }
              />
            ))}
          </ul>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon={CalendarCheck}
        title="Présence de la semaine"
        description={`${intern.name} · une semaine déjà saisie est remplacée`}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={save}>Enregistrer</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Semaine du" htmlFor="presence-weekStart" required error={errors.weekStart} hint="Un jour de la semaine suffit." className="sm:col-span-3">
            <DatePicker id="presence-weekStart" value={draft.weekStart} placeholder="Choisir un jour" onChange={(weekStart) => set({ weekStart })} />
          </Field>
          <Field label="Jours présents" htmlFor="presence-present" required error={errors.present}>
            <input id="presence-present" type="number" inputMode="numeric" min={0} max={7} className={inputClass} placeholder="Ex. 5" value={draft.present} onChange={(e) => set({ present: e.target.value })} />
          </Field>
          <Field label="Dont retards" htmlFor="presence-late" error={errors.late}>
            <input id="presence-late" type="number" inputMode="numeric" min={0} max={7} className={inputClass} placeholder="Ex. 0" value={draft.late} onChange={(e) => set({ late: e.target.value })} />
          </Field>
          <Field label="Absences" htmlFor="presence-absent" error={errors.absent}>
            <input id="presence-absent" type="number" inputMode="numeric" min={0} max={7} className={inputClass} placeholder="Ex. 0" value={draft.absent} onChange={(e) => set({ absent: e.target.value })} />
          </Field>
          <Field label="Observation" htmlFor="presence-note" className="sm:col-span-3">
            <textarea id="presence-note" className={cn(textareaClass, "[field-sizing:content]")} placeholder="Ex. Absence justifiée mardi (examen)" value={draft.note} onChange={(e) => set({ note: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </Reveal>
  );
}
