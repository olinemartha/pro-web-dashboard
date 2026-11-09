---
target: tableau de bord entreprise
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\Martha\\Documents\\Stage Manager app web\\src\\routes\\entreprise.index.tsx"
target_fingerprint: "sha256:b5a28a9ad0e681c660c22cff3dbcb053790d5fada71499b027a37a0c5d59dd50"
target_path: "C:\\Users\\Martha\\Documents\\Stage Manager app web\\src\\routes\\entreprise.index.tsx"
timestamp: 2026-11-08T17-42-06Z
slug: src-routes-entreprise-index-tsx
closed: true
---
Method: dual-agent (A: revue de design · B: détecteur + navigateur)

## Design Health Score — 27/40 (Good)

| # | Heuristique | Note | Problème clé |
|---|---|---|---|
| 1 | Visibilité de l'état du système | 3 | Compteurs non concordants entre cloche, file et menu (corrigé pour la cloche) |
| 2 | Correspondance avec le monde réel | 3 | « en cours » comptait des candidatures décidées (corrigé) |
| 3 | Contrôle et liberté | 3 | Filtre réinitialisé à chaque visite |
| 4 | Cohérence et standards | 2 | Doublons dans la file (corrigé), lignes cliquables ou non, styles de survol variés |
| 5 | Prévention des erreurs | 3 | « Voir l'explication » plutôt que « Valider » direct |
| 6 | Reconnaissance plutôt que rappel | 3 | Nom coupé sur téléphone (corrigé : deux lignes) |
| 7 | Flexibilité et efficacité | 2 | Aucune action en ligne, liens par recherche de nom |
| 8 | Esthétique et minimalisme | 3 | Redondances restantes (à examiner visible à plusieurs endroits) |
| 9 | Récupération des erreurs | 3 | Pas d'état de chargement ni d'erreur |
| 10 | Aide et documentation | 2 | Rien n'explique le classement ni « 4/4 critères » |

## Verdict de spécificité
Cohérent et sobre, encore proche d'un modèle d'administration générique ; la partie propre au produit (file par urgence, recommandation en ligne, échéances J-n, places par service) est la plus réussie.
Détecteur : 42 → 4 alertes CLI (3 vraies : KPI 26/28 px, titre de fenêtre 17 px — corrigées ; 1 fausse : compteur de la cloche) ; overlay : contraste 2,9:1 des intitulés de groupes du menu (corrigé), date au-dessus du titre et police unique Inter (documentés, intentionnels).

## Priorités (après corrections de fin de procédure)
- [P1] File gonflée et doublons — corrigé (candidature avec entretien programmé retirée, horizon des entretiens à 3 jours, « actions »)
- [P1] Nom tronqué sur téléphone — corrigé (deux lignes)
- [P2] Métriques discordantes — partiellement corrigé (cloche, libellé pipeline)
- [P2] Sémantique clavier — partiellement corrigé (arrêts de tabulation inutiles retirés, aria-hidden, aria-controls) ; tableau des offres à passer en <table>
- [P2] Hiérarchie plate sous la ligne de flottaison en 1366×768 — à traiter (/impeccable typeset puis layout)
- [P3] Incohérences d'interaction (lignes d'entretiens et d'activité non cliquables) — à traiter (/impeccable polish)
