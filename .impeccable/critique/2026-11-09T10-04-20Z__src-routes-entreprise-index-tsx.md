---
target: carte À traiter du tableau de bord entreprise
total_score: 19
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\Martha\\Documents\\Stage Manager app web\\src\\routes\\entreprise.index.tsx"
target_fingerprint: "sha256:7cb5fdc2cf5bc6fd9f082f4b282171c71fe79b69f01c9b172f0301dfa971ffe2"
target_path: "C:\\Users\\Martha\\Documents\\Stage Manager app web\\src\\routes\\entreprise.index.tsx"
timestamp: 2026-11-09T10-04-20Z
slug: src-routes-entreprise-index-tsx
---
Method: dual-agent (A: revue de design · B: détecteur + navigateur) — périmètre : carte « À traiter »

## Design Health Score — 19/32 (Acceptable, 59 %) — heuristiques 9 et 10 n/a

| # | Heuristique | Note | Problème clé |
|---|---|---|---|
| 1 | Visibilité de l'état | 3 | L'urgence n'a pas de forme visuelle : « 14 jours » ressemble à « à compléter » |
| 2 | Monde réel | 3 | « décision attendue » sans âge ; « Mettre à jour les besoins — … » sonne comme un texte système |
| 3 | Contrôle | 2 | Pas de report ni de « traité » ; changer de filtre replie la liste |
| 4 | Cohérence | 2 | Verbe en double (libellé + bouton), filtre actif en bleu roi plein (DESIGN.md : le glacier marque la sélection), boutons de largeurs variées |
| 5 | Prévention | 3 | Ligne d'affectation qui mène à l'explication, pas à une décision |
| 6 | Reconnaissance | 3 | Quoi et qui sont dits ; icônes redondantes |
| 7 | Efficacité | 1 | Pas de navigation clavier dans la liste, pas d'action rapide |
| 8 | Minimalisme | 2 | 5 boutons identiques, compteur en double, icône = verbe = filtre |
| 9 | Erreurs | n/a | Pas d'état d'erreur dans la carte |
| 10 | Aide | n/a | Explication sur la page cible |

## Verdict de spécificité
Liste générique « icône + deux lignes + bouton à contour ». Les deux éléments propres au produit (délais en clair, recommandation) n'ont aucun poids visuel. L'élément le plus fort est le filtre actif, pas la tâche la plus urgente.
Détecteur : 0 alerte dans la carte (CLI et overlay, 1440 et 375). Mesures : contrastes conformes (5,35:1 méta), boutons 32 px de haut et 97 à 142 px de large, ligne d'affectation sur fond quasi blanc (#F5F9FF), contour de focus rogné à gauche et à droite par la carte, lignes de 81 à 138 px sur téléphone.

## Priorités
- [P1] L'urgence est invisible : délai mêlé à la méta en 12 px gris → colonne de délai alignée à droite, ambre au-delà de 7 jours ou pour un entretien aujourd'hui/demain — /impeccable clarify, typeset
- [P1] Bouton « Examiner → » à contour sur chaque ligne : poids maximal répété, verbe en double → chevron discret, verbe révélé au survol, seule exception la ligne d'affectation — /impeccable distill, quieter
- [P1] Hiérarchie interne plate, sujet en fin de phrase → la personne en gras en tête, la tâche ensuite, le contexte en dessous ; remplacer l'icône « étincelles » (cliché IA) — /impeccable typeset, layout
- [P2] Ligne du système expert sous-signalée → glacier plein + liseré bleu roi, jauge de critères — /impeccable colorize, bolder
- [P2] En-tête et filtres plus lourds que le contenu → titre et filtres sur une ligne, filtre actif en glacier — /impeccable quieter, adapt

## Personas
Alex : pas de navigation clavier, animation rejouée à chaque filtre. Sam : nom accessible de 151 caractères, la ligne d'affectation annonce « Valider… » alors que le lien mène à l'explication, contour de focus rogné. RH FINCA : ne voit pas ce qui est en retard, rappels de service aussi visibles qu'un candidat qui attend 14 jours.
