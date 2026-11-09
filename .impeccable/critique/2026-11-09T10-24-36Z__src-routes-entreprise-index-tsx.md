---
target: carte Activité récente du tableau de bord entreprise
total_score: 16
max_score: 28
na_heuristics: 5,9,10
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\Martha\\Documents\\Stage Manager app web\\src\\routes\\entreprise.index.tsx"
target_fingerprint: "sha256:aaf34bbc623bd0a571d2dad0a4f73e933d36679e7a3233a00b82758c070b97d5"
target_path: "C:\\Users\\Martha\\Documents\\Stage Manager app web\\src\\routes\\entreprise.index.tsx"
timestamp: 2026-11-09T10-24-36Z
slug: src-routes-entreprise-index-tsx
---
Method: dual-agent (A: revue de design · B: détecteur + navigateur) — périmètre : carte « Activité récente »

## Design Health Score — 16/28 (Acceptable, 57 %) — heuristiques 5, 9, 10 n/a

| # | Heuristique | Note | Problème clé |
|---|---|---|---|
| 1 | Visibilité de l'état | 2 | Le badge montre le statut au moment de l'événement, lu comme statut actuel (Sarah « En entretien » alors qu'elle est acceptée) |
| 2 | Monde réel | 2 | Statut sans verbe : « En entretien · il y a 7 jours » — programmé ou passé ? |
| 3 | Contrôle | 3 | Liens en lecture seule, retour possible |
| 4 | Cohérence | 2 | Frise contraire à la règle « lignes séparées par un filet », « Refusée » rouge ici et gris dans le pipeline, avatar fait main, pas de survol de ligne |
| 6 | Reconnaissance | 2 | Même personne sur deux lignes |
| 7 | Efficacité | 2 | Le lien mène à une liste filtrée, pas au candidat |
| 8 | Minimalisme | 3 | Propre, mais la ligne verticale n'apporte aucune information |

## Verdict
Modèle « activité récente » générique (initiales sur une frise). Le contenu est l'historique brut des statuts, pas un fil d'événements écrit pour la RH.
Détecteur : 0 alerte dans la carte (CLI, overlay 1440 et 375). Mesures : contrastes conformes (5,35:1 ; badges 6,19 et 8,88:1), aucune troncature, focus non rogné ; la carte finit 19,7 px plus haut que « Offres publiées » ; frise décalée de 0,5 px.

## Priorités
- [P1] Statuts au lieu d'événements, doublons → libellés d'événement (« Nouvelle candidature », « Entretien programmé le 18 nov. », « Candidature acceptée », « Profil non retenu »), une ligne par candidat — /impeccable clarify
- [P1] Frise contraire au modèle de liste → lignes séparées par un filet, avatar partagé 28 px — /impeccable distill
- [P2] Couleurs des badges : refus en rouge (alerte) alors que c'est une décision normale → refus en gris, nouvelle candidature en bleu — /impeccable colorize
- [P2] Anatomie : badge en colonne irrégulière, date cachée → nom + date à droite sur la ligne 1, badge d'événement + offre sur la ligne 2 — /impeccable layout
- [P3] 1024–1279 px : 60 % de la ligne vide → grille 2 × 2 ; lien vers le candidat ; nom accessible en phrase — /impeccable harden
