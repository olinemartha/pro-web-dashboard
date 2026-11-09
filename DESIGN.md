---
name: StageManager
description: Plateforme professionnelle de gestion des stages — espaces étudiant, entreprise et administrateur.
colors:
  royal-blue: "#1E3A8A"
  royal-blue-hover: "#18306F"
  vivid-blue: "#2F6FED"
  glacier-blue: "#E8F0FE"
  paper-white: "#FFFFFF"
  canvas: "#F5F7FA"
  ink: "#191F2E"
  text-muted: "#616B7F"
  line-border: "#DDE1E9"
  muted-surface: "#F1F4F8"
  success-green: "#27865A"
  success-soft: "#E7F8F0"
  warning-amber: "#B45309"
  warning-soft: "#FFFBEB"
  destructive-red: "#DC2828"
  destructive-soft: "#FBE9E9"
  pipeline-waiting: "hsl(220 25% 85%)"
  pipeline-review: "hsl(218 90% 78%)"
  pipeline-interview: "#2F6FED"
  pipeline-accepted: "#1E3A8A"
  pipeline-refused: "hsl(220 12% 64%)"
typography:
  kpi:
    fontFamily: "Inter, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  page-title:
    fontFamily: "Inter, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  section:
    fontFamily: "Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  ui:
    fontFamily: "Inter, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
  micro:
    fontFamily: "Inter, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.royal-blue}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.royal-blue-hover}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.lg}"
  button-outline:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "32px"
  section-link-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  search:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "40px"
  card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success-green}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  nav-item-active:
    backgroundColor: "{colors.glacier-blue}"
    textColor: "{colors.royal-blue}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "36px"
---

# Design System: StageManager

## Overview

**Creative North Star : « Le Guichet de confiance »**

StageManager est un service administratif moderne : un guichet calme, lisible et fiable où l'étudiant, l'entreprise et l'administrateur savent immédiatement où ils se trouvent et quelle est la prochaine action. Le cadre est institutionnel — bleu roi, blanc, typographie Inter — mais jamais froid ni bureaucratique. La confiance vient de la précision : hiérarchie nette, statuts explicites, formulaires guidés, aucune décoration qui détourne de la tâche.

La composition repose sur une navigation latérale blanche et une surface de travail posée sur un canevas gris très clair, légèrement bleuté. Les actions principales sont en bleu roi, le bleu vif signale les liens, le focus et les données des graphiques, et le bleu glacier marque la sélection. Les couleurs fonctionnelles (vert, ambre, rouge) restent réservées aux statuts. Les icônes sont neutres, monochromes et posées seules, sans tuile ni cadre.

Le système est sobre par doctrine. Il privilégie la lisibilité, les libellés français explicites et la constance entre les trois espaces. La couleur ne porte jamais seule une information ; chaque badge associe une teinte et un texte. Les animations sont douces, courtes et fonctionnelles, et respectent `prefers-reduced-motion`.

**Key Characteristics:**
- Accents bleu roi, surface blanche, canevas gris froid très clair.
- Inter uniquement, avec une échelle compacte de 11 à 30 px (une exception à 36 px, voir Typography).
- Cartes à 12 px de rayon, modales à 16 px, pilules complètes réservées aux badges, avatars, recherche et barres de progression.
- Bordures 1 px systématiques, ombres rares et douces.
- Bleu vif en accent (liens, focus, graphiques), jamais en grands aplats.
- Icônes Lucide monochromes, sans fond ni bordure, alignées comme dans la barre latérale.
- Statuts toujours exprimés par un badge texte + couleur.

## Colors

La palette est institutionnelle et à faible distraction : trois bleus de marque, un blanc dominant, des gris froids pour la structure et des couleurs fonctionnelles strictement réservées au statut.

### Primary
- **Bleu roi** (#1E3A8A) : identité (logo), boutons principaux, titres forts, élément actif du menu, série « Acceptée » du pipeline. C'est la couleur d'autorité et d'action. Au survol, il s'assombrit (#18306F).
- **Bleu glacier** (#E8F0FE) : pastille de l'élément actif du menu, badges primaires, fond de la carte entreprise, ligne mise en avant dans « À traiter » (recommandation du système expert).

### Secondary
- **Bleu vif** (#2F6FED) : liens, anneau de focus clavier, courbe des candidatures, série « En entretien » du pipeline, indicateurs d'activité. Le texte posé sur le bleu vif est blanc.

### Pipeline (gamme de données)
Une seule famille de bleus, du plus clair au plus foncé, le refus restant en gris neutre plutôt qu'en rouge : En attente `hsl(220 25% 85%)` · En cours d'examen `hsl(218 90% 78%)` · En entretien #2F6FED · Acceptée #1E3A8A · Refusée `hsl(220 12% 64%)`. Les chiffres sont toujours écrits en texte à côté du graphique : la teinte claire d'« En attente » n'a pas à porter l'information seule.

### Tertiary
- **Vert validation** (#27865A) sur fond **vert très clair** (#E7F8F0) : accepter, valider, réussir, attestation validée, tendance positive.
- **Ambre vigilance** (#B45309) sur fond **ambre très clair** (#FFFBEB) : action à traiter, affectation à confirmer, places libres, avertissements non bloquants.
- **Rouge destructif** (#DC2828) sur fond **rouge très clair** (#FBE9E9) : refus, suppression, erreur, échéance à moins de 7 jours.

### Neutral
- **Blanc papier** (#FFFFFF) : cartes, barre latérale, champs, fenêtres.
- **Canevas** (#F5F7FA) : fond de la zone de travail, derrière les cartes.
- **Encre bleu nuit** (#191F2E) : texte principal ; aussi le fond « inversé » au survol des liens de section.
- **Gris texte secondaire** (#616B7F) : descriptions, métadonnées, libellés secondaires, icônes au repos.
- **Surface atténuée** (#F1F4F8) : en-têtes de tableaux, pistes de barres, survol des lignes.
- **Ligne discrète** (#DDE1E9) : bordures de cartes, champs, tableaux et séparateurs.

### Named Rules
**The Royal Frame Rule.** Le bleu roi encadre et commande ; il ne remplit jamais une grande zone de contenu. Logo, action principale, élément actif et données « acquises » uniquement.
**The Vivid Accent Rule.** Le bleu vif occupe moins de 10 % de l'écran. Il marque les liens, le focus et les données ; il n'est jamais utilisé en grand aplat de fond.
**The Status Is Never Colour Alone Rule.** Un statut est toujours un badge avec un libellé français explicite. La teinte renforce le texte, elle ne le remplace pas.
**The Bare Icon Rule.** Une icône est un trait monochrome posé seul. Pas de tuile colorée, pas de carré bordé derrière : la couleur vient du contexte (actif, survol), jamais d'un fond décoratif.

## Typography

**Display Font :** Inter (avec `sans-serif`)
**Body Font :** Inter (avec `sans-serif`)

**Character :** Une seule famille, plusieurs graisses. Inter donne un rendu net, contemporain et administratif ; les graisses 500 et 600 structurent la hiérarchie sans recourir à des tailles excessives. Les chiffres sont toujours tabulaires (`tabular-nums`).

### Hierarchy
- **KPI** (600, 30 px, interligne 1) : valeur des quatre indicateurs du tableau de bord.
- **Page title** (600, 20 px) : salutation et titre de page dans la barre supérieure (« Bonjour, FINCA RDC »), précédés de la date en 11 px.
- **Title** (600, 18 px) : titres de fenêtres.
- **Section** (600, 15 px) : titres des cartes (« Pipeline de recrutement », « Offres publiées »).
- **Body** (400, 14 px, interligne 1,5) : texte courant, lignes de liste, formulaires. Viser 65–75 caractères par ligne.
- **UI** (500, 13 px) : libellés de navigation, boutons compacts, onglets, légendes de graphiques.
- **Label** (500, 12 px) : libellés de champs, métadonnées, descriptions de section, en-têtes de tableaux.
- **Micro** (500, 11 px) : compteurs, badges compacts, mois des pastilles de date, intitulés de groupes du menu (en capitales). **Aucun texte porteur de sens sous 11 px.**

### Named Rules
**The One Family Rule.** Inter est la seule famille. La hiérarchie se construit par la taille et la graisse, jamais par une seconde police décorative.
**The Compact Scale Rule.** Aucun texte d'interface ne dépasse 30 px, à une exception près : le chiffre « places de stage à pourvoir » de la carte entreprise (36 px), qui en est le point focal. Les titres de page restent entre 18 et 20 px.
**The 11-Pixel Floor Rule.** 11 px est le plancher absolu pour un texte lisible ; 10 px n'est toléré que dans un compteur numérique à l'intérieur d'une pastille de 18 px.

## Layout

Le modèle est un shell d'application à deux colonnes : navigation latérale de 256 px, repliable à 72 px (choix mémorisé), et zone principale fluide plafonnée à 1 360 px. La barre latérale apparaît à partir de **1024 px** (`lg`) ; en dessous, elle devient un tiroir de 300 px ouvert par le bouton menu. La barre supérieure mesure 72 px sur ordinateur (date + salutation, recherche, cloche, « Publier une offre ») et 56 px sur mobile (menu, titre, bouton « + » de publication, cloche).

Le contenu a un padding de 16 px sur mobile, 24 px sur tablette et 32 px à partir de 1280 px. Les sections sont espacées de 24 px (`space-y-6`). Les grilles ont toujours une colonne explicite `minmax(0, 1fr)` pour qu'aucun contenu ne déborde sur téléphone.

**Tableau de bord entreprise :** une ligne de 4 KPI séparés (2 colonnes sur mobile, 4 dès 1024 px), puis une grille `minmax(0,1fr) | 340px` à partir de 1280 px, en trois lignes :
1. Pipeline puis « À traiter » à gauche ; carte entreprise puis « Prochains entretiens » à droite. Les deux colonnes finissent au même niveau : la dernière carte de chaque colonne s'étire ; dans « À traiter », les lignes se partagent l'espace à partir de 4 lignes (en dessous, elles gardent leur hauteur naturelle, icône centrée sur le texte).
2. « Offres publiées » et « Activité récente », alignées en haut, chacune à sa hauteur naturelle (jamais étirées).
3. « Dossiers stagiaires » sur toute la largeur.

Points de rupture : 640 px (`sm`), 768 px (`md`, tableaux en colonnes à largeurs fixes, `table-fixed`), 1024 px (`lg`, barre latérale, KPI sur une ligne, carte entreprise et entretiens côte à côte en 2 × 340 px), 1280 px (`xl`, colonne de droite de 340 px).

### Named Rules
**The 1024 Rule.** La navigation latérale n'apparaît qu'à partir de 1024 px. En dessous, le tiroir et la barre compacte sont la seule navigation, et l'action principale reste accessible (bouton « + »).
**The 24-Pixel Rhythm Rule.** Une seule gouttière de 24 px, horizontale et verticale, y compris entre les cartes KPI (dès 1024 px) ; à l'intérieur d'une carte, 20 px de marge et 16 px entre l'en-tête et le contenu.
**The No Hole Rule.** Une ligne de grille ne laisse jamais une colonne vide : un bloc seul sur sa ligne s'étend sur toute la largeur.
**The No Scrollbar-in-Card Rule.** Pas de barre de défilement horizontale dans une carte : les filtres et puces passent à la ligne.

## Elevation & Depth

Les surfaces sont légèrement surélevées par une bordure de 1 px et une ombre ambiante très douce (`0 1px 2px` à 4 %). Le canevas forme le premier plan ; les cartes blanches le second ; les menus, panneaux et fenêtres passent au-dessus avec une ombre plus marquée et un léger verre dépoli.

### Shadow Vocabulary
- **Carte au repos** : `0 1px 2px hsl(224 40% 20% / 0.04)` + bordure #DDE1E9.
- **Carte cliquable au survol** : soulèvement de 2 px, bordure teintée de bleu vif, ombre `0 10px 24px -12px` en bleu roi à 20 %.
- **Menu, recherche, notifications** : `0 16px 40px -12px rgba(15, 23, 42, 0.22)`, fond à 90–95 % d'opacité avec flou d'arrière-plan.
- **Fenêtre (modale)** : `0 24px 64px -16px rgba(15, 23, 42, 0.35)`.

### Named Rules
**The One-Step Elevation Rule.** Une carte ne s'élève que d'un cran. Seules les cartes cliquables (KPI, offres) se soulèvent de 2 px au survol ; les cartes de contenu restent immobiles.
**The Border Does the Work Rule.** La séparation vient d'abord de la bordure 1 px ; l'ombre confirme, elle ne structure pas.

## Shapes

Formes calmes et arrondies avec mesure. Cartes : 12 px (`xl`). Boutons, éléments de navigation, onglets et lignes de liste : 8 px (`lg`). Champs : 6 px (`md`). Fenêtres, menus et panneaux flottants : 16 px (`2xl`). Les pilules complètes sont réservées aux badges de statut, avatars, champ de recherche, cloche et barres de progression.

L'indicateur actif de la navigation est une pastille bleu glacier qui glisse d'un lien à l'autre, avec un liseré bleu roi de 3 px au bord gauche de la barre. Les icônes sont des traits Lucide de 16 à 18 px, jamais illustratives.

## Motion

Courbe unique « ease-out quint » (`cubic-bezier(0.22, 1, 0.36, 1)`), durées de 140 à 900 ms.
- **Entrée de page** : fondu + glissement de 10 px, en cascade courte (40 à 60 ms entre éléments).
- **Données** : compteurs qui montent jusqu'à leur valeur, barres qui grandissent, anneau et courbe qui se dessinent. Les lecteurs d'écran lisent directement la valeur finale.
- **Interactions** : pression à 97 % au clic, soulèvement des cartes cliquables, rotation du « + » du bouton « Publier », pastille de navigation qui glisse.
- **Fenêtres** : voile flouté qui apparaît en fondu, fenêtre qui monte légèrement en s'agrandissant ; tiroirs qui glissent depuis le bord.

Tout s'immobilise sous `prefers-reduced-motion`.

## Components

### Buttons
- **Primary** : fond bleu roi, texte blanc, rayon 8 px, hauteur 40 px (36 px dans les barres), légère ombre teintée. Une seule action principale par zone.
- **Bouton de ligne** (« Examiner », « Relire », « Mettre à jour ») : discret, fond gris atténué, texte gris, largeur fixe (136 px) pour un bord droit régulier ; au survol de la ligne, fond glacier et texte bleu roi. Sur téléphone, flèche seule. **Exception :** le bouton « Voir l'explication » de la recommandation du système expert est plein, en bleu roi : c'est le seul bouton plein de la carte.
- **Lien de section** (« Tout voir », « Gérer les offres ») : bouton compact à contour ; au survol, fond encre bleu nuit et texte blanc. Son nom accessible précise la section (« Tout voir — Pipeline de recrutement »).
- **Focus** : anneau bleu vif de 2 px avec décalage de 2 px sur tout élément interactif.

### Chips & filtres
- **Filtres de la file « À traiter »** : 4 au maximum (Tout, Recrutement, Stagiaires, Services), alignés à droite du titre, boutons à bascule (`aria-pressed`) de 28 px ; actif en bleu glacier avec texte bleu roi, inactifs en texte gris. Le compteur n'apparaît que sur les groupes (le titre porte le total).
- **Badges de statut** : pilule, fond très clair de la teinte, bordure à 30 %, texte 12 px (11 px dans les listes compactes).

### Cards / Containers
- **Corner Style** : 12 px. **Background** : blanc sur canevas #F5F7FA. **Border** : 1 px #DDE1E9. **Padding** : 20 px.
- Les listes dans une carte utilisent des lignes séparées par un filet, pas des cartes imbriquées.

### KPI Cards
Quatre cartes séparées et espacées. En haut : icône monochrome nue + libellé 13 px (deux lignes autorisées sur téléphone). Au centre : valeur 30 px, avec une courbe pour les candidatures. En bas, séparée par un filet : une précision de 12 px (tendance verte, alerte ambre ou contexte gris).

### File « À traiter »
Titre « À traiter » avec un compteur, filtres sur la même ligne, filet dessous. Chaque ligne : icône nue de sens · **la personne (ou le service) en gras**, suivie de la tâche en gris (« Rachel Ilunga · Candidature à examiner ») · contexte en dessous · **colonne de délai** alignée à droite (« 14 j d'attente », « demain ») · bouton. Le délai passe en **ambre avec une horloge** quand c'est urgent (attente de 7 jours ou plus, entretien aujourd'hui ou demain). Les rappels de services ont un sujet gris, moins appuyé. La ligne d'affectation est le seul élément teinté : fond glacier plein, liseré bleu roi de 3 px à gauche, icône balance, « Recommandé : **Direction IT** », jauge de critères (pastilles bleu roi) et « 4/4 critères » ; elle mène à l'explication et ne décide jamais à la place de l'entreprise. Tri par urgence réelle ; au-delà de 5 lignes, un bouton déplie la liste sur place. Chaque lien a un nom accessible rédigé en phrase.

### Inputs / Fields
- Fond blanc, bordure 1 px, rayon 6 px, hauteur 40 px, texte 14 px (16 px sur téléphone pour éviter le zoom iOS).
- **Focus** : bordure bleu vif + anneau de 3–4 px à 12–15 %.
- **Recherche** : pilule de 40 px marquée « Rechercher », qui s'élargit doucement au focus ; les résultats n'apparaissent qu'à la saisie.

### Navigation
- Barre latérale blanche, liens groupés par métier (Recrutement, Suivi des stages, Entreprise), compteurs d'actions en attente, lien visible « Espace étudiant » au-dessus de la carte de compte (lien de démonstration).
- Mode replié : icônes seules avec info-bulle au survol et au focus.
- Mobile : tiroir blanc avec voile flouté, fermeture par X, clic extérieur ou Échap.

### Notifications
Cloche ronde translucide avec compteur bleu roi ; panneau en verre dépoli listant les événements à traiter, chaque ligne menant à l'objet concerné.

### Modals
Rendues au niveau de la page entière (portail) : voile `slate-900/25` flouté de 6 px sur tout l'écran, barre latérale comprise. Panneau blanc de 16 px de rayon, largeur 512 px (720 px pour les formulaires longs), centré à l'écran ; sur mobile, ancré en bas avec une poignée. En-tête avec icône nue, titre et fermeture ; pied d'actions sur fond atténué. Échap ferme, la page derrière ne défile plus. Les formulaires longs sont découpés en sections titrées.

## Do's and Don'ts

### Do:
- **Do** utiliser le bleu roi #1E3A8A pour l'action principale, le bleu vif #2F6FED pour les liens, le focus et les données, et le bleu glacier #E8F0FE pour la sélection.
- **Do** accompagner chaque statut d'un libellé français explicite dans un badge.
- **Do** poser les icônes seules, monochromes, comme dans la barre latérale.
- **Do** trier les actions par urgence réelle et dire le délai en clair.
- **Do** employer des verbes précis en français : « Publier une offre », « Valider l'affectation », « Voir l'explication ».
- **Do** garder une colonne de grille `minmax(0, 1fr)` et vérifier chaque écran à 375, 1024, 1280 et 1440 px.
- **Do** laisser l'action principale accessible sur téléphone.

### Don't:
- **Don't** mettre une tuile colorée ou un cadre derrière une icône.
- **Don't** utiliser le bleu vif en grands aplats de fond.
- **Don't** laisser une colonne vide dans une grille, ni étirer une carte pour égaliser des hauteurs.
- **Don't** afficher une barre de défilement à l'intérieur d'une carte.
- **Don't** descendre sous 11 px pour un texte porteur de sens.
- **Don't** coder un statut uniquement par la couleur.
- **Don't** ajouter de carte promotionnelle : le système expert se montre dans les décisions elles-mêmes.
- **Don't** utiliser une seconde police ou des tailles supérieures à 30 px (hors chiffre focal de la carte entreprise).
