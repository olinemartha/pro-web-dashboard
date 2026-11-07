import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCompanyStore } from "@/lib/company-store";

const MAX_SIZE = 2 * 1024 * 1024; // 2 Mo
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/** Logo de l'entreprise, ou ses initiales lorsqu'aucun logo n'a été ajouté. */
export function CompanyLogo({ className }: { className?: string }) {
  const { profile } = useCompanyStore();
  return profile.logo ? (
    <img
      src={profile.logo}
      alt={`Logo ${profile.name}`}
      className={cn("shrink-0 bg-card object-cover", className)}
    />
  ) : (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-primary font-semibold text-primary-foreground",
        className
      )}
      aria-label={`Initiales ${profile.name}`}
    >
      {profile.initials || "E"}
    </span>
  );
}

/**
 * Logo cliquable : l'entreprise choisit une image depuis son appareil.
 * Pour l'instant le logo reste en mémoire (données fictives) ;
 * il sera enregistré dans Supabase Storage lors du branchement du backend.
 */
export function CompanyLogoUploader({
  className,
  radius = "rounded-2xl",
}: {
  className?: string;
  radius?: string;
}) {
  const { profile, updateProfile } = useCompanyStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Format non pris en charge", { description: "Utilisez une image PNG, JPG, WebP ou SVG." });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image trop lourde", { description: "La taille maximale est de 2 Mo." });
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ logo: String(reader.result) });
      setLoading(false);
      toast.success("Logo mis à jour");
    };
    reader.onerror = () => {
      setLoading(false);
      toast.error("Impossible de lire cette image");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("group relative", className)}>
      <CompanyLogo className={cn("size-full text-2xl", radius)} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={profile.logo ? "Changer le logo de l'entreprise" : "Ajouter le logo de l'entreprise"}
        className={cn("absolute inset-0 grid place-items-center bg-slate-900/0 text-white opacity-0 transition-all duration-200 hover:bg-slate-900/45 hover:opacity-100 focus-visible:bg-slate-900/45 focus-visible:opacity-100 focus-visible:outline-none", radius)}
      >
        <Camera className="size-5" />
      </button>
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border-2 border-card bg-accent text-primary shadow-sm transition-transform duration-200 group-hover:scale-110"
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
