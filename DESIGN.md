---
name: StageManager
description: Plateforme professionnelle de gestion des stages — espaces étudiant, entreprise et administrateur.
colors:
  navy-institutional: "#142D4E"
  navy-soft: "#E7EEF9"
  sky-indicator: "#75B8E7"
  sky-soft: "#DCEDF9"
  paper-white: "#FFFFFF"
  warm-ink: "#2C2421"
  slate-muted: "#F1F5F9"
  slate-text-muted: "#65758B"
  line-border: "#DAE0E7"
  success-green: "#27865A"
  success-soft: "#E7F8F0"
  warning-amber: "#B45309"
  warning-soft: "#FFFBEB"
  destructive-red: "#DC2828"
  destructive-soft: "#FBE9E9"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
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
    backgroundColor: "{colors.navy-institutional}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "#2C4260"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
  button-outline:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  input:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success-green}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  nav-item-active:
    backgroundColor: "#FFFFFF1A"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: StageManager

## Overview

**Creative North Star: « Le Guichet de confiance »**

StageManager est un service administratif moderne : un guichet calme, lisible et fiable où l'étudiant, l'entreprise et l'administrateur savent immédiatement où ils se trouvent et quelle est la prochaine action. Le cadre est institutionnel — bleu marine, blanc, typographie Inter — mais jamais froid ni bureaucratique. La confiance vient de la précision : hiérarchie nette, statuts explicites, formulaires guidés, aucune décoration qui détourne de la tâche.

La composition repose sur un cadre navy fixe (navigation latérale) et une surface de travail blanche posée sur un canevas gris très clair. Les actions principales sont marine, les accents bleu ciel signalent la sélection et l'activité, et les couleurs fonctionnelles (vert, ambre, rouge) restent réservées aux statuts. Les cartes sont légèrement surélevées : bordure fine et ombre discrète suffisent à séparer les plans sans transformer l'interface en tableau de bord décoratif.

Le système est sobre par doctrine. Il privilégie la lisibilité, les libellés français explicites et la constance entre les trois espaces. La couleur ne porte jamais seule une information ; chaque badge associe une teinte et un texte. Les animations restent courtes et fonctionnelles, et respectent `prefers-reduced-motion`.

**Key Characteristics:**
- Cadre bleu marine, surface blanche, canevas gris froid très clair.
- Inter uniquement, avec une échelle compacte de 12 à 30 px.
- Coins légèrement arrondis (6–8 px), pilules complètes réservées aux badges et avatars.
- Bordures 1 px systématiques, ombres rares et douces.
- Bleu ciel en accent de sélection, jamais en texte courant.
- Statuts toujours exprimés par un badge texte + couleur.
- Densité professionnelle : 20–24 px de padding dans les cartes, sections espacées de 24 px.

## Colors

La palette est institutionnelle et à faible distraction : deux bleus de marque, un blanc dominant, des gris froids pour la structure et quatre couleurs fonctionnelles strictement réservées au statut.

### Primary
- **Bleu marine institutionnel** (#142D4E) : fond de la navigation latérale, boutons principaux, titres forts, élément actif, focus clavier. C'est la couleur d'autorité et d'action.
- **Marine adouci** (#E7EEF9) : fond des tuiles d'icônes, badges primaires et zones d'information calmes.

### Secondary
- **Bleu ciel indicateur** (#75B8E7) : liseré vertical de l'élément de navigation actif, carré du logo, cercles décoratifs des en-têtes de tableau de bord, accents de survol. Il signale l'activité et la sélection.
- **Bleu ciel adouci** (#DCEDF9) : fond des puces de compétences, des badges d'accent et des zones d'aide.

### Tertiary
- **Vert validation** (#27865A) sur fond **vert très clair** (#E7F8F0) : accepter, valider, réussir, attestation validée.
- **Ambre vigilance** (#B45309) sur fond **ambre très clair** (#FFFBEB) : mode démonstration, affectation à confirmer, avertissements non bloquants.
- **Rouge destructif** (#DC2828) sur fond **rouge très clair** (#FBE9E9) : refus, suppression, erreur, action irréversible.

### Neutral
- **Blanc papier** (#FFFFFF) : cartes, barres supérieures, champs, surfaces de travail.
- **Encre chaude** (#2C2421) : texte principal. Un noir légèrement chaud, plus humain que le noir pur.
- **Gris ardoise très clair** (#F1F5F9) : fond de page, séparateurs de tableaux, états désactivés.
- **Gris texte secondaire** (#65758B) : descriptions, métadonnées, libellés secondaires.
- **Ligne discrète** (#DAE0E7) : toutes les bordures de cartes, champs, tableaux et séparateurs.

### Named Rules
**The Navy Frame Rule.** Le marine encadre et commande ; il ne remplit jamais une grande zone de contenu. Navigation, action principale et focus uniquement.
**The Sky Accent Rule.** Le bleu ciel occupe moins de 10 % de l'écran. Il marque la sélection et l'activité ; il n'est jamais utilisé pour du texte courant sur fond blanc.
**The Status Is Never Colour Alone Rule.** Un statut est toujours un badge avec un libellé français explicite. La teinte renforce le texte, elle ne le remplace pas.

## Typography

**Display Font:** Inter (avec `sans-serif`)
**Body Font:** Inter (avec `sans-serif`)

**Character:** Une seule famille, plusieurs graisses. Inter donne un rendu net, contemporain et administratif ; les graisses 500 et 600 structurent la hiérarchie sans recourir à des tailles excessives.

### Hierarchy
- **Display** (600, 30 px, interligne 1,15) : valeur des indicateurs clés, uniquement dans les cartes KPI.
- **Headline** (600, 24 px, interligne 1,2) : titre d'accueil du tableau de bord (« Bonjour, Grâce »), titres de page exceptionnels.
- **Title** (600, 18 px, interligne 1,3) : titre de barre supérieure, titres de modales, titres de section forts.
- **Body** (400, 14 px, interligne 1,5) : texte courant, descriptions, formulaires. Les paragraphes restent courts ; viser 65–75 caractères par ligne.
- **Label** (500, 12 px, interligne 1,4) : libellés de champs, boutons compacts, métadonnées. Les en-têtes de section utilisent 12 px, 600, en majuscules avec `letter-spacing` modéré.

### Named Rules
**The One Family Rule.** Inter est la seule famille. La hiérarchie se construit par la taille et la graisse, jamais par une seconde police décorative.
**The Compact Scale Rule.** Aucun texte d'interface ne dépasse 30 px. Les titres de page restent entre 18 et 20 px ; les chiffres KPI sont la seule exception.

## Layout

Le modèle est un shell d'application à deux colonnes : navigation latérale fixe de 256 px (`w-64`) et zone principale fluide. La barre latérale est visible à partir de 768 px (`md`) ; en dessous, elle devient un tiroir superposé de 288 px ouvert par un bouton menu. La barre supérieure mesure 64 px sur ordinateur et 56 px sur mobile. Un bandeau d'information pleine largeur (mode démonstration) s'insère entre la barre supérieure et le contenu.

Le contenu utilise un canevas gris très clair (`muted/40`) avec un padding de 16 px sur mobile, 24 px sur tablette et 32 px sur grand écran. Les sections sont espacées de 24 px (`space-y-6`). Les grilles d'indicateurs passent de 2 colonnes sur mobile à 4 colonnes à partir de 1280 px. Les formulaires s'organisent en une colonne sur mobile et deux colonnes dès 640 px. Les cartes conservent 20 à 24 px de padding interne.

Points de rupture : 640 px (`sm`), 768 px (`md`, seuil de la navigation latérale), 1024 px (`lg`), 1280 px (`xl`). Aucun contenu essentiel ne doit provoquer de défilement horizontal sur téléphone.

### Named Rules
**The 768 Rule.** La navigation latérale n'apparaît qu'à partir de 768 px. En dessous, le tiroir et la barre supérieure compacte sont la seule navigation.
**The 24-Pixel Rhythm Rule.** L'espacement vertical entre sections est de 24 px ; à l'intérieur d'une carte, 16 à 24 px. Ne pas improviser des écarts de 30 ou 40 px.

## Elevation & Depth

Système hybride : les surfaces sont légèrement surélevées par une bordure de 1 px et une ombre ambiante très douce, jamais par un empilement d'ombres. Le canevas gris clair crée le premier plan ; les cartes blanches forment le second ; les modales et notifications passent au-dessus avec une ombre plus marquée. L'élévation sert la séparation, pas la décoration.

### Shadow Vocabulary
- **Carte au repos** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): cartes, panneaux, tableaux. Toujours accompagnée d'une bordure `#DAE0E7`.
- **Modale** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`): dialogues, tiroirs mobiles.
- **Notification** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): toasts Sonner.

### Named Rules
**The One-Step Elevation Rule.** Une carte ne s'élève que d'un cran au-dessus du canevas. Pas d'ombre au survol, pas de superposition de cartes flottantes.
**The Border Does the Work Rule.** La séparation vient d'abord de la bordure 1 px ; l'ombre confirme, elle ne structure pas.

## Shapes

Formes calmes et légèrement arrondies. Le rayon par défaut des surfaces est de 8 px (`lg`) ; les boutons, champs et éléments de navigation utilisent 6 px (`md`) ; les petits éléments 4 px (`sm`). Les pilules complètes (`9999px`) sont réservées aux badges de statut, aux avatars et aux barres de progression. Les modales et le carré du logo utilisent 12 px (`xl`). Les bordures sont toujours de 1 px. Aucun angle vif, aucune forme exagérément arrondie.

L'indicateur actif de la navigation est un liseré vertical de 2 px, arrondi, placé à gauche de l'élément sélectionné. Les icônes sont des traits Lucide de 16 à 20 px, jamais illustratives.

### Named Rules
**The 8-Pixel Default Rule.** En cas de doute, utiliser 8 px. 12 px est réservé aux modales et au logo ; au-delà, seulement les pilules.

## Components

### Buttons
- **Shape:** rayon 6 px, hauteur 40 px (32 px pour la taille compacte), padding horizontal 16 px.
- **Primary:** fond marine `#142D4E`, texte blanc, graisse 500, transition de couleur 150 ms. Utilisé pour l'action principale d'un écran, une seule fois par zone.
- **Hover / Focus:** fond éclairci à `#2C4260` au survol ; anneau de focus marine de 2 px avec décalage de 2 px. Jamais d'ombre portée sur le bouton.
- **Secondary / Ghost / Destructive:** contour blanc + bordure `#DAE0E7` pour les actions secondaires ; fantôme transparent avec fond gris clair au survol ; destructif rouge sur fond rouge très clair, sans remplissage plein.

### Chips
- **Style:** pilule complète, fond `#DCEDF9`, texte marine, 12 px, graisse 500. Utilisées pour les compétences et les filtres.
- **State:** un filtre actif passe en fond marine et texte blanc ; un badge de statut utilise la couleur fonctionnelle correspondante avec bordure de même teinte à 30 % d'opacité.

### Cards / Containers
- **Corner Style:** 8 px.
- **Background:** blanc pur sur canevas `#F1F5F9`.
- **Shadow Strategy:** ombre carte au repos uniquement ; voir Elevation & Depth.
- **Border:** 1 px `#DAE0E7`, systématique.
- **Internal Padding:** 20 à 24 px ; 16 px pour les cartes compactes de liste.

### Inputs / Fields
- **Style:** fond blanc, bordure 1 px `#DAE0E7`, rayon 6 px, hauteur 40 px, padding horizontal 12 px, texte 14 px.
- **Focus:** bordure bleu ciel + anneau de 2 px à 20 % d'opacité ; le focus reste visible au clavier.
- **Error / Disabled:** message rouge de 12 px sous le champ, bordure rouge ; état désactivé à 50 % d'opacité avec curseur interdit. Le libellé est toujours au-dessus, l'astérisque rouge signale un champ obligatoire.

### Navigation
- **Style:** barre latérale marine pleine hauteur, logo carré bleu ciel, nom en blanc 18 px.
- **Items:** texte blanc à 70 % d'opacité, 14 px, graisse 500, rayon 6 px, padding 8 × 12 px. Au survol : fond blanc à 5 %. Actif : fond blanc à 10 %, texte blanc et liseré bleu ciel de 2 px à gauche.
- **Mobile:** tiroir marine de 288 px avec overlay noir à 40 %, fermeture par bouton X ou clic extérieur.

### KPI Cards
Carte blanche, libellé 12–14 px gris, icône discrète dans une tuile marine adoucie, valeur 24–30 px en graisse 600, précision 12 px grise. Quatre cartes maximum par ligne à partir de 1280 px.

### Status Badges
Pilule complète, bordure teintée, fond très clair, texte 12 px en graisse 600. Toujours lisible sans couleur : « Publiée », « En attente », « Acceptée », « Refusée », « Programmé », « Réalisé », « Annulé ».

### Modals
Panneau blanc de 12 px de rayon, ombre élevée, largeur maximale 576 px (ou 768 px pour les formulaires longs), en-tête avec titre et bouton de fermeture, pied d'actions aligné à droite. Sur mobile, la modale s'ancre en bas avec des coins supérieurs arrondis.

## Do's and Don'ts

### Do:
- **Do** utiliser le marine `#142D4E` pour l'action principale et le cadre de navigation, et réserver le bleu ciel aux accents de sélection.
- **Do** accompagner chaque statut d'un libellé français explicite dans un badge.
- **Do** conserver les cartes blanches sur canevas `#F1F5F9` avec une bordure 1 px et une ombre `shadow-sm`.
- **Do** utiliser Inter à 14 px pour le corps de texte et 12 px pour les libellés, avec des libellés de champs au-dessus.
- **Do** employer des verbes précis en français : « Publier une offre », « Valider l'affectation », « Enregistrer les modifications ».
- **Do** respecter les rayons 6–8 px et la limite de 30 px pour les chiffres KPI.
- **Do** garder la navigation latérale visible dès 768 px et la remplacer par un tiroir en dessous.

### Don't:
- **Don't** utiliser le bleu ciel pour du texte courant ou de grands aplats de fond.
- **Don't** ajouter de dégradés, de néons, d'ombres colorées ou d'effets décoratifs absents du Design Brief.
- **Don't** dépasser 12 px de rayon, sauf pour les pilules, avatars et barres de progression.
- **Don't** coder un statut uniquement par la couleur.
- **Don't** empiler plusieurs ombres ou faire flotter les cartes au survol.
- **Don't** utiliser une seconde police ou des tailles de titre supérieures à 30 px.
- **Don't** inventer des icônes illustratives, des logos partenaires ou des visuels non fournis.
