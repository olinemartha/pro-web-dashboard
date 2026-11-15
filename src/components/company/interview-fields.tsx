import { DatePicker } from "@/components/company/date-picker";
import { Field, Select, inputClass } from "@/components/company/ui";
import { useCompanyStore } from "@/lib/company-store";
import { localIsoDate } from "@/lib/dates";

/**
 * Champs communs pour programmer un entretien (page Entretiens et
 * page Candidatures) : date au calendrier, créneau, lieu. Aucun champ
 * prérempli : le lieu propose des suggestions, l'heure des créneaux.
 */

export type InterviewDraft = { date: string; time: string; location: string };

export const EMPTY_INTERVIEW: InterviewDraft = { date: "", time: "", location: "" };

/** Créneaux de 30 minutes, de 8 h à 17 h 30. */
export const TIME_SLOTS = Array.from({ length: 20 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

/** Lieux proposés : le siège de l'entreprise connectée, puis la visio. */
const locationSuggestions = (company: string) => [`Siège ${company} — Salle 1`, `Siège ${company} — Salle 2`, `Siège ${company} — Salle 3`, "Visio"];

export function validateInterview(draft: InterviewDraft, allowPast = false) {
  const errors: Partial<Record<keyof InterviewDraft, string>> = {};
  if (!draft.date) errors.date = "Choisissez la date de l'entretien.";
  else if (!allowPast && draft.date < localIsoDate()) errors.date = "Choisissez une date à partir d'aujourd'hui.";
  if (!draft.time) errors.time = "Choisissez un créneau.";
  if (!draft.location.trim()) errors.location = "Indiquez le lieu ou « Visio ».";
  return errors;
}

export function InterviewFields({
  value,
  onChange,
  errors,
  idPrefix = "entretien",
  allowPast = false,
}: {
  value: InterviewDraft;
  onChange: (patch: Partial<InterviewDraft>) => void;
  errors: Partial<Record<keyof InterviewDraft, string>>;
  idPrefix?: string;
  allowPast?: boolean;
}) {
  const company = useCompanyStore((state) => state.profile.name) || "de l'entreprise";
  const slots = value.time && !TIME_SLOTS.includes(value.time) ? [value.time, ...TIME_SLOTS] : TIME_SLOTS;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor={`${idPrefix}-date`} required error={errors.date}>
          <DatePicker
            id={`${idPrefix}-date`}
            min={allowPast ? undefined : localIsoDate()}
            value={value.date}
            onChange={(date) => onChange({ date })}
          />
        </Field>
        <Field label="Heure" htmlFor={`${idPrefix}-heure`} required error={errors.time}>
          <Select
            id={`${idPrefix}-heure`}
            placeholder="Choisir un créneau"
            value={value.time}
            onChange={(event) => onChange({ time: event.target.value })}
          >
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {slot.replace(":", " h ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field
        label="Lieu"
        htmlFor={`${idPrefix}-lieu`}
        required
        error={errors.location}
        hint="Salle, adresse ou « Visio » pour un entretien à distance."
      >
        <input
          id={`${idPrefix}-lieu`}
          list={`${idPrefix}-lieux`}
          autoComplete="off"
          className={inputClass}
          placeholder={`Ex. Siège ${company} — Salle 1`}
          value={value.location}
          onChange={(event) => onChange({ location: event.target.value })}
        />
      </Field>
      <datalist id={`${idPrefix}-lieux`}>
        {locationSuggestions(company).map((place) => (
          <option key={place} value={place} />
        ))}
      </datalist>
    </>
  );
}
