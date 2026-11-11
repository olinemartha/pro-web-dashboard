import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Field } from "@/components/company/ui";

/**
 * Liste de mots en étiquettes (compétences, mots-clés) : Entrée ou virgule
 * ajoute, la croix retire, Retour arrière sur un champ vide retire la
 * dernière. Pas de doublon ; suggestions facultatives.
 */
export function TagInput({
  id,
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = "Ex. Excel, Analyse financière",
  addPlaceholder = "Ajouter",
  hint = "Appuyez sur Entrée ou tapez une virgule pour ajouter.",
  className,
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  addPlaceholder?: string;
  hint?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    parts.forEach((part) => {
      if (!next.some((entry) => entry.toLowerCase() === part.toLowerCase())) next.push(part);
    });
    onChange(next);
    setDraft("");
  };

  const remove = (entry: string) => {
    onChange(value.filter((item) => item !== entry));
    inputRef.current?.focus();
  };

  const available = suggestions.filter(
    (suggestion) => !value.some((entry) => entry.toLowerCase() === suggestion.toLowerCase())
  );

  return (
    <Field label={label} htmlFor={id} hint={hint} className={className}>
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 transition hover:border-foreground/25 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-ring/15"
      >
        {value.map((entry) => (
          <span
            key={entry}
            className="animate-scale-in inline-flex h-7 items-center gap-1 rounded-full bg-accent-soft pl-2.5 pr-1 text-xs font-medium text-primary"
          >
            {entry}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                remove(entry);
              }}
              aria-label={`Retirer ${entry}`}
              className="relative grid size-5 place-items-center rounded-full text-primary/70 transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-primary hover:text-primary-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          list={`${id}-list`}
          autoComplete="off"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="h-7 min-w-[10rem] flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
          placeholder={value.length ? addPlaceholder : placeholder}
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            if (next.includes(",")) add(next);
            else setDraft(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
        />
      </div>
      <datalist id={`${id}-list`}>
        {available.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </Field>
  );
}
