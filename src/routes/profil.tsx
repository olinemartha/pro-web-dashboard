import { createFileRoute } from "@tanstack/react-router";
import { Camera, FileUp, Plus, ShieldCheck, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/rules";
import { fmtDate, useStore } from "@/lib/store";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Mon profil — StageManager" },
      { name: "description", content: "Gérez votre profil académique et professionnel, votre CV et sa visibilité." },
      { property: "og:title", content: "Mon profil — StageManager" },
      { property: "og:description", content: "Gérez votre profil académique et professionnel, votre CV et sa visibilité." },
    ],
  }),
  component: ProfilePage,
});

const inputCls = "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-ring/30";

function ProfilePage() {
  const { profile, updateProfile, completion } = useStore();
  const [d, setD] = useState<Profile>(profile);
  const [err, setErr] = useState<Partial<Record<keyof Profile, string>>>({});
  const [skill, setSkill] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof Profile, v: unknown) => setD({ ...d, [k]: v });
  const F = (k: keyof Profile, label: string, type = "text") => (
    <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input type={type} value={d[k] as string} onChange={(e) => set(k, e.target.value)} className={inputCls} />
      {err[k] && <span className="mt-1 block text-xs text-destructive">{err[k]}</span>}</label>
  );

  const save = () => {
    const e: typeof err = {};
    if (!d.nom.trim()) e.nom = "Le nom est requis.";
    if (!d.prenom.trim()) e.prenom = "Le prénom est requis.";
    if (!/^\S+@\S+\.\S+$/.test(d.email)) e.email = "Adresse email invalide.";
    if (d.telephone && !/^[+\d\s]{8,}$/.test(d.telephone)) e.telephone = "Numéro invalide.";
    setErr(e);
    if (Object.keys(e).length) return toast.error("Veuillez corriger les champs signalés");
    updateProfile(d); toast.success("Profil enregistré");
  };
  const addSkill = () => { const s = skill.trim(); if (!s || d.competences.includes(s)) return; set("competences", [...d.competences, s]); setSkill(""); };
  const onPhoto = (f?: File) => { if (!f) return; if (!f.type.startsWith("image/")) return toast.error("Format d'image non pris en charge"); const r = new FileReader(); r.onload = () => { set("photo", r.result as string); updateProfile({ photo: r.result as string }); toast.success("Photo mise à jour"); }; r.readAsDataURL(f); };
  const onCv = (f?: File) => { if (!f) return; if (f.type !== "application/pdf") return toast.error("Le CV doit être au format PDF"); if (f.size > 5e6) return toast.error("Fichier trop volumineux (5 Mo max)"); const cv = { name: f.name, size: f.size, date: new Date().toISOString() }; set("cv", cv); updateProfile({ cv }); toast.success("CV téléversé"); };
  const initials = `${d.prenom[0] ?? ""}${d.nom[0] ?? ""}`;

  return (
    <div>
      <PageHeader title="Mon profil" desc="Ces informations sont transmises uniquement aux entreprises auxquelles vous postulez." action={<Button onClick={save}>Enregistrer les modifications</Button>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Informations personnelles">
            <div className="mb-5 flex items-center gap-4">
              {d.photo ? <img src={d.photo} alt="" className="size-16 rounded-full object-cover" /> : <span className="grid size-16 place-items-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">{initials}</span>}
              <Button variant="outline" size="sm" onClick={() => photoRef.current?.click()}><Camera className="size-4" />Changer la photo</Button>
              <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">{F("nom", "Nom")}{F("postnom", "Postnom")}{F("prenom", "Prénom")}</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">{F("email", "Email", "email")}{F("telephone", "Téléphone", "tel")}</div>
            <div className="mt-4">{F("adresse", "Adresse")}</div>
          </SectionCard>
          <SectionCard title="Informations académiques">
            <div className="grid gap-4 sm:grid-cols-2">{F("universite", "Université")}{F("faculte", "Faculté")}{F("filiere", "Filière")}{F("niveau", "Niveau d'études")}</div>
          </SectionCard>
          <SectionCard title="Compétences">
            <div className="mb-3 flex flex-wrap gap-2">{d.competences.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pl-3 pr-1.5 text-xs font-medium text-primary">{s}
                <button aria-label={`Retirer ${s}`} onClick={() => set("competences", d.competences.filter((x) => x !== s))} className="rounded-full p-0.5 hover:bg-accent/30"><X className="size-3" /></button></span>))}
              {d.competences.length === 0 && <p className="text-sm text-muted-foreground">Aucune compétence ajoutée.</p>}</div>
            <div className="flex gap-2"><input value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Ajouter une compétence…" className={inputCls} /><Button variant="outline" onClick={addSkill}><Plus className="size-4" />Ajouter</Button></div>
          </SectionCard>
          <SectionCard title="Expériences et parcours">
            <div className="space-y-4">{([["experiences", "Expériences professionnelles"], ["projets", "Projets pertinents"], ["infos", "Informations complémentaires"]] as const).map(([k, l]) => (
              <label key={k} className="block"><span className="mb-1.5 block text-sm font-medium">{l}</span><Textarea rows={3} value={d[k]} onChange={(e) => set(k, e.target.value)} /></label>))}</div>
          </SectionCard>
        </div>
        <div className="space-y-6">
          <SectionCard title="Complétion du profil"><div className="flex items-end justify-between"><span className="text-3xl font-semibold">{completion}%</span><span className="text-xs text-muted-foreground">après enregistrement</span></div><Progress value={completion} className="mt-3 h-2" /></SectionCard>
          <SectionCard title="CV">
            {d.cv ? <div className="mb-3 rounded-lg border p-3"><p className="truncate text-sm font-medium">{d.cv.name}</p><p className="text-xs text-muted-foreground">{Math.round(d.cv.size / 1000)} Ko · {fmtDate(d.cv.date)}</p></div> : <p className="mb-3 text-sm text-destructive">Aucun CV — requis pour postuler.</p>}
            <button onClick={() => cvRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onCv(e.dataTransfer.files[0]); }}
              className="flex w-full flex-col items-center gap-1 rounded-lg border border-dashed p-5 text-sm text-muted-foreground transition hover:border-accent hover:bg-accent-soft/40">
              <FileUp className="size-5 text-accent" />{d.cv ? "Remplacer le CV" : "Téléverser mon CV"}<span className="text-xs">PDF, 5 Mo max</span></button>
            <input ref={cvRef} type="file" accept="application/pdf" hidden onChange={(e) => onCv(e.target.files?.[0])} />
          </SectionCard>
          <SectionCard title="Visibilité du profil">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">Visible par les entreprises</p><p className="text-xs text-muted-foreground">Les entreprises peuvent découvrir votre profil (sans coordonnées).</p></div>
              <Switch checked={d.visible} onCheckedChange={(v) => { set("visible", v); updateProfile({ visible: v }); toast.success(v ? "Profil visible" : "Profil masqué"); }} /></div>
            <div className="mt-4 flex gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-success" />Votre CV n'est accessible qu'aux entreprises auxquelles vous avez soumis une candidature.</div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
