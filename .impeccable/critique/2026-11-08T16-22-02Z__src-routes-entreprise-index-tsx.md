---
target: tableau de bord entreprise
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\Martha\\Documents\\Stage Manager app web\\src\\routes\\entreprise.index.tsx"
target_fingerprint: "sha256:dd0c7c960c7dcc9e49280b1452fd79c0470f155cdf8c92155b1ae03a3ec296c6"
target_path: "C:\\Users\\Martha\\Documents\\Stage Manager app web\\src\\routes\\entreprise.index.tsx"
timestamp: 2026-11-08T16-22-02Z
slug: src-routes-entreprise-index-tsx
---
Method: dual-agent (A: revue de design · B: détecteur + navigateur)

## Design Health Score — 24/40 (Acceptable)

| # | Heuristique | Note | Problème clé |
|---|---|---|---|
| 1 | Visibilité de l'état du système | 3 | Compteurs partout ; « + N autres actions » n'est pas cliquable ; pas d'états de chargement |
| 2 | Correspondance avec le monde réel | 3 | Bon vocabulaire PRD ; « 8 candidatures en cours » inclut acceptées et refusées |
| 3 | Contrôle et liberté | 3 | Peu de risque ; filtre réinitialisé, actions masquées inaccessibles |
| 4 | Cohérence et standards | 2 | Écarts avec DESIGN.md (cartes qui flottent, ombre colorée, ~11 tailles de texte), onglets ARIA incomplets |
| 5 | Prévention des erreurs | 3 | Données incohérentes non gardées (rapport daté du futur, 0 % sans décision) |
| 6 | Reconnaissance plutôt que rappel | 3 | Agenda sans lieu ; liens KPI vers listes non filtrées |
| 7 | Flexibilité et efficacité | 2 | Aucune décision en ligne ; liens profonds génériques |
| 8 | Esthétique et minimalisme | 2 | Les 3 candidatures en attente apparaissent 6 fois ; anneau + barres codent les mêmes 5 chiffres |
| 9 | Récupération des erreurs | 2 | Bons états vides, aucun état d'erreur |
| 10 | Aide et documentation | 1 | Rien n'explique la recommandation du système expert ni l'ordre d'urgence |

## Verdict de spécificité
Données et libellés propres au métier ; composition = modèle SaaS générique (4 KPI, anneau, fil d'activité, tableau, colonne droite). Le « Guichet de confiance » (la prochaine action évidente) n'est pas porté par la composition.
Détecteur : 42 alertes CLI (40 tailles de police hors échelle DESIGN.md, 2 couleurs du pipeline non documentées) ; overlay navigateur : 11 textes à 10 px, 1 débordement à droite des cartes de services sur téléphone.

## Priorités
- [P1] Vide dans la colonne droite (ligne 3) et carte Offres étirée — /impeccable layout
- [P1] Pas de point focal, informations répétées — /impeccable distill
- [P1] « À traiter » non trié par urgence réelle, débordement sans issue, 6 onglets — /impeccable harden
- [P2] Recommandation du système expert noyée dans une ligne — /impeccable clarify
- [P2] Responsive : téléphone (débordement, libellés tronqués, pas de bouton Publier) et 1280 px (tableau Offres serré) — /impeccable adapt

## Personas
Alex : pas de décision en ligne, compteurs qui repartent de 0 à chaque visite, liens non filtrés.
Sam : surbrillance du pipeline à la souris seulement, trois « Tout voir » identiques, textes de 10–11 px, gris « En attente » à 1,4:1.
Responsable RH FINCA : accueillie « FINCA RDC » et non par son nom, réponse à « que dois-je décider ? » sous les KPI et le graphique, entretiens en double.

## Observations mineures
relativeDay ne gère pas le futur ; taux « 0 % » au lieu de « — » ; date UTC ; liste d'offres non bornée ; fil d'activité sans verbe ; DESIGN.md en retard sur les décisions prises.
