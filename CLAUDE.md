# StageManager : règles du projet

Application web de gestion des stages (mémoire de fin d'études), premier client FINCA RDC. Interface en français. Le tableau de bord entreprise (`src/routes/entreprise.index.tsx`) est la **référence visuelle** : toute nouvelle page, tout nouveau composant, dans tous les espaces (entreprise, étudiant, admin), doit lui ressembler et se comporter pareil.

## Avant de toucher à l'interface

1. Lire `DESIGN.md` (palette, typographie, mouvements, composants) et `PRODUCT.md`.
2. Réutiliser les composants existants avant d'en écrire un nouveau (liste ci-dessous). Un nouveau motif utilisé 3 fois ou plus va dans `src/components/company/ui.tsx` et dans `DESIGN.md`.
3. Après chaque modification visible : `npm run check:design`, `npx tsc --noEmit`, puis **vérifier dans le navigateur** à 375 px et 1280 px avant d'annoncer que c'est fait.
4. Faire exactement ce qui est demandé : pas d'ajout non demandé (proposer d'abord).

`npm run check:design` est aussi lancé par `npm run build` : une page qui contourne le système bloque la construction et le déploiement.

## Boîte à outils obligatoire

| Besoin | Utiliser | Import |
|---|---|---|
| Carte | classe `card-surface` (rayon 12 px, filet, fond blanc), `p-5` | `index.css` |
| Carte cliquable (une seule destination) | `CARD_INTERACTIVE` + un seul lien étiré | `@/components/company/ui` |
| En-tête de carte | `SectionHeader` (titre 15 px, compteur, lien « Tout voir ») | idem |
| Lien de section | `SectionLink` / `SECTION_LINK` (contour → bleu roi plein au survol) | idem |
| Indicateur chiffré | `StatCard` : avec `to` (tableau de bord seulement), lien vers la page qui détaille ; sans `to`, simple indicateur non cliquable | idem |
| Filtres de liste | `FilterChips` (puces glacier, compteurs, pastille de couleur) + `SearchInput` | idem |
| Bouton de ligne | `rowActionClass()` (discret, 144 px, flèche seule sur téléphone) | idem |
| Couleurs de statut | `PIPELINE_COLORS`, `StatusDot`, `PipelineBar`, `PIPELINE_SHORT_LABELS` | idem |
| Programmer un entretien | `InterviewFields` + `validateInterview` | `interview-fields` |
| État vide | `EmptyNote` | idem |
| Statut | `Badge` avec un `Tone` | idem |
| Formulaire | `Field`, `inputClass`, `textareaClass`, `Select`, `DatePicker` | `ui`, `date-picker` |
| Fenêtre / tiroir | `Modal`, `Drawer` (portail, voile flouté, focus géré) | `ui` |
| Menu d'actions | `ActionMenu`, `MenuItem` | `ui` |
| Avatar | `AvatarInitials`, `CompanyLogo` | `ui`, `company-logo` |
| Bouton | `Button` | `@/components/ui/button` |
| Entrée animée, compteur | `Reveal`, `AnimatedNumber` | `@/components/ui/motion` |
| Icône animée | `iconMotion("lift")` sur une icône lucide dans un parent `group` | `ui` |
| Flèche « → » qui glisse | `ARROW_NUDGE` | `ui` |
| Dates | `fmtDate`, `relativeDay`, `shortDay`, `daysFromToday`, `localIsoDate` | `@/lib/dates` |

## Gabarit d'une page de liste

Mes offres, Candidatures et Entretiens suivent ce gabarit ; toute nouvelle page de liste aussi (voir DESIGN.md, « Gabarit des pages de liste »).

## Règles non négociables

**Couleurs**
- Uniquement les jetons : `primary` (bleu roi #1E3A8A), `accent` (bleu vif #2F6FED), `primary-soft` (bleu glacier #E8F0FE), `muted`, `border`, `success`, `warning`, `destructive`, `popover`, `overlay`. Jamais `blue-500`, `gray-100`, `amber-50`, ni de code hexadécimal dans un composant.
- Le sens des couleurs ne change pas : vert = accepté / validé ; ambre = à traiter / urgent ; rouge = refus / erreur uniquement (pas pour un astérisque) ; bleu = action, nouveau, sélection.
- Panneaux flottants (recherche, notifications, menus, calendrier) : `bg-popover` **opaque**, sans transparence ni flou.

**Icônes**
- `lucide-react` uniquement, **nues et monochromes** (gris, bleu roi à l'état actif) : jamais de carré coloré ni de bordure derrière une icône, jamais d'émoji.
- Tailles : 16 px (`size-4`) dans le texte, 18 px (`size-[18px]`) dans les listes et cartes.
- Chaque icône d'un élément survolable est animée selon son sens :

| Geste | Pour |
|---|---|
| `lift` | mallette, bâtiment, document (offres, profil, rapports) |
| `fly` | avion en papier, envoi, déconnexion |
| `tilt` | calendrier, balance, toque (entretiens, affectation, espace étudiant) |
| `bounce` | personnes, boîte de réception (stagiaires, candidatures) |
| `pop` | tableau de bord, recherche de profil, notifications |
| `stack` | couches (services) |
| `spin` | engrenage (paramètres) |

**Typographie** (échelle 11 à 30 px, graisses 400 / 500 / 600 seulement)
- Valeur KPI 30 px semibold · titre de page via `PageIntro` · titre de carte 15 px semibold · texte de ligne 13 px · précision 12 px · micro-étiquette 11 px.
- Chiffres en `tabular-nums` dans les tableaux et indicateurs.

**Mouvements**
- Une seule courbe : `var(--ease-soft)` (`[transition-timing-function:var(--ease-soft)]`), durées 140 à 900 ms. Jamais `ease-in`, `ease-out`, `ease-linear`.
- Entrée des cartes : `Reveal` en cascade de 40 à 80 ms. Compteurs : `AnimatedNumber`.
- Boutons faits main (puces, liens-boutons) : classe `press` (enfoncement à 97 %). Cartes cliquables : `hover-lift` (soulèvement de 2 px). Flèches : `ARROW_NUDGE`.
- Toute nouvelle animation va dans `src/index.css`, avec sa garde `prefers-reduced-motion`.

**Mise en page**
- Pas de barre de défilement dans une carte : le contenu passe à la ligne ou se replie (« Afficher plus »).
- Aucun débordement horizontal à 320 px. Points de rupture vérifiés : 375, 768, 1024, 1280, 1440.
- Pas de cartes imbriquées : des lignes séparées par un filet (`divide-y`).
- Peu d'éléments cliquables : une carte entière n'est cliquable que si elle mène à une seule destination (cartes d'offre, lignes de liste, indicateurs du tableau de bord). Les indicateurs des pages de liste ne sont pas cliquables : les filtres sont dans les puces. Jamais pour une carte qui contient filtres ou plusieurs actions.

**Formulaires**
- Placeholders (« Ex. Kinshasa, Gombe », « Choisir une durée »), **jamais de valeur préremplie** que l'utilisateur n'a pas choisie.
- Champs obligatoires marqués d'un astérisque gris ; erreurs en rouge sous le champ via `Field` ; à l'envoi, focus sur le premier champ en erreur.
- Dates avec `DatePicker`, listes avec `Select`, listes de mots avec des étiquettes (comme les compétences).

**Accessibilité et texte**
- Focus clavier visible partout (anneau bleu vif) ; noms accessibles rédigés en phrase ; `sr-only` pour ce qui n'est que visuel.
- Textes en français, phrase simple, vocabulaire du produit (candidature, affectation, service, stagiaire).

## Exceptions

Une exception volontaire se note sur la ligne concernée avec `design-ok: <raison>` (ex. le lettrage du tampon officiel), puis s'explique dans `DESIGN.md`. Les pages de l'espace étudiant non encore refaites sont listées dans `scripts/check-design.mjs` (`LEGACY`) : retirer chaque page de la liste quand elle est refaite, ne jamais en ajouter.

## Environnement

- Windows : lancer le serveur avec `npm.cmd run dev` (PowerShell bloque `npm.ps1`).
- Ne pas pousser sur GitHub sans le demander.
