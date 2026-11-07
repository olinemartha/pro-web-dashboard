# Brief de conception — Espace entreprise

**Mode : Operate.** Le visiteur accomplit une tâche administrative. Priorité à la scanabilité, à la cohérence et à la scène réelle d'usage : un responsable unique, souvent sur ordinateur, qui revient avec une action précise à faire.

**Statut :** propositions soumises à arbitrage. Voir « Décisions à confirmer » en fin de document.

---

## 1. Job et audience

- **Qui :** le titulaire unique du compte entreprise (FINCA RDC), responsable du recrutement et de l'encadrement. Il connaît son métier, pas l'interface. Il revient pour une raison précise : examiner une candidature, programmer un entretien, affecter un stagiaire, valider un rapport, générer une attestation.
- **Situation :** contexte administratif, français, terminologie PRD. Desktop principal ; tablette et téléphone pour consulter et valider, pas pour configurer.
- **Succès :** chaque dossier progresse sans ambiguïté ; l'affectation est expliquée et validée humainement ; rien d'important ne se fait sans trace.

## 2. Résultat et preuve

- **Tâche primaire :** faire avancer un dossier de candidature vers l'affectation, puis le suivi, sans quitter la chaîne.
- **Preuve produit :** le rapport d'expertise — faits utilisés, règles appliquées, critères satisfaits et non satisfaits, limites — puis l'enregistrement de la décision humaine. C'est ce qu'un tableau de bord RH générique ne peut pas copier.
- **Vérité produit :** le système recommande, l'entreprise décide (RG-16). L'affectation est le pivot du mémoire et de l'espace, pas un formulaire parmi d'autres.

## 3. Direction retenue

**« Le dossier de recrutement »** — extension de « Le Guichet de confiance », pas un nouveau monde.

L'espace actuel est une collection de listes parallèles. La direction le transforme en **une chaîne continue, trois moments** :

1. **Recruter** — offres, candidatures, entretiens.
2. **Affecter** — le rapport d'expertise et la décision humaine.
3. **Encadrer** — rapports, évaluation, attestation.

**Thèse structurelle :** l'unité de travail n'est pas le module, c'est le dossier d'une personne. Le tableau de bord devient le **bureau des affaires courantes** : la file « À traiter » occupe le premier viewport, pas un hero décoratif. La fiche offre devient un **pipeline** (candidatures par étape), pas seulement une annonce. Le dossier stagiaire devient le lieu où l'on travaille, pas un empilement de cartes.

**Moment focal :** l'écran **« Rapport d'expertise »**. Un rapport numéroté, des critères lisibles, une colonne de décision, une trace d'audit. Pas un chatbot, pas une jauge de score, pas une décision automatique. C'est le moment qui doit rester en mémoire après un viewport.

**Conséquence d'implémentation :** une sous-route de dossier (`/entreprise/stagiaires/$internId`, avec l'affectation en section ou sous-route), un modèle `ExpertRun` / `AssignmentDecision`, une révision du modèle de statuts et du gating des coordonnées. Aucun nouvel item de navigation : le menu en 8 entrées du Design Brief reste intact.

## 4. Périmètre et frontières

**Dans le périmètre :** tableau de bord, offres, candidatures, entretiens, stagiaires (dossier + affectation), services et besoins, profil, paramètres ; états vides/chargement/erreur ; responsive 390 → 1440 ; accessibilité.

**Hors périmètre pour ce brief :**
- Demande d'intégration entreprise, approbation admin, activation, configuration initiale (écrans 3–6 du Design Brief) : **surface suivante**, car RG-02/RG-03 bloquent l'usage réel.
- Connexion, espace étudiant, espace admin, Supabase/RLS/Edge Functions.
- Règles expertes réelles, fréquence des rapports, QR des attestations, canaux de notification, rétention.

**Intouché :** le monde DESIGN.md, les libellés et comportements existants qui fonctionnent, les données de démonstration, les routes étudiant/admin.

**Anti-goals :** pas de chatbot ni de persona d'assistant ; pas de décision automatique ; pas de score seul ; pas de kanban drag-and-drop (hors PRD, risqué sur mobile) ; pas de neuvième entrée de menu ; pas de nouveaux dégradés, polices, ombres ou graphiques décoratifs ; pas de règles, logos, témoignages ou chiffres inventés.

## 5. Constats sur l'existant (à corriger par le brief)

- **Le système expert est absent de l'interface.** « Mes stagiaires » propose directement service, superviseur et dates ; aucune analyse, aucune recommandation, aucune explication. C'est pourtant l'écran prioritaire n°13 du Design Brief et le différenciateur du produit.
- **Les coordonnées du candidat sont exposées sans condition.** `entreprise.candidatures.tsx` affiche e-mail et téléphone quel que soit le statut, alors que RG-11 (e-mail privé par défaut) et RG-12 (téléphone après sélection et confirmation) imposent un gating.
- **Le modèle de statuts diverge du PRD.** Le code ajoute « Présélectionnée » et n'a pas « Retirée ». La liste PRD est : En attente, En cours d'examen, En entretien, Acceptée, Refusée, Retirée.
- **Le tableau de bord ne priorise pas.** Le grand bandeau d'accueil et les raccourcis dupliquent la navigation ; la seule file d'action est le KPI « À examiner ». Le bouton « Publier une offre » navigue vers la liste au lieu d'ouvrir le formulaire.
- **Les offres n'ont pas d'espace de suivi propre.** « Détails et candidatures » ouvre une fiche qui ne liste pas les candidatures, alors que le PRD demande un suivi par offre.
- **Les services n'affichent pas la capacité.** On voit le besoin, pas les places pourvues/restantes ni la fraîcheur des besoins, alors que ces faits nourrissent l'expertise.
- **Le profil mélange public et administratif.** L'en-tête dit que tout est visible par les étudiants ; les références RCCM, le contact du responsable et les documents officiels ne devraient pas l'être par défaut.

## 6. États et volumétrie

- **Volumes réalistes :** 0, 1, 2–5, 20+ offres ; 0–200 candidatures ; 0–30 stagiaires ; 3–8 services. Noms longs, offres longues, plusieurs entretiens le même jour.
- **États par écran :** premier usage, vide, chargement, erreur, succès, permission, débordement, offre clôturée, candidature retirée, besoins obsolètes, données insuffisantes, aucune recommandation, décision déjà enregistrée.
- **États de l'affectation :** prête, analyse en cours, données insuffisantes, aucune proposition, proposition prête, décision enregistrée, nouvelle version disponible.
- **Mobile 390 px :** aucun défilement horizontal de page ; les propositions s'empilent ; la décision reste atteignable sans perdre le contexte.

## 7. Interaction et mise en page

### Tableau de bord — le bureau des affaires courantes

Conserver le titre d'accueil « Bonjour, {nom} » (prévu par DESIGN.md) et les cercles décoratifs sanctionnés, mais **compresser le bandeau** : à gauche l'accueil, le contexte et les deux actions ; à droite la file **« À traiter »** (3 à 5 lignes maximum). Chaque ligne = objet + action + échéance, et pointe vers l'objet exact, pas vers le module.

En dessous : les 4 KPI exigés par le Design Brief (offres actives, candidatures reçues, à examiner, stagiaires accueillis), puis deux colonnes « Dossiers en cours » et « Prochains entretiens ». Les raccourcis génériques disparaissent : ils dupliquent la navigation. L'astuce « services et besoins » devient une tâche réelle avec lien, ou disparaît. Le bouton « Publier une offre » ouvre directement le formulaire.

### Offres — la fiche devient un pipeline

Conserver les filtres à compteurs et la grille de cartes. Ajouter sur chaque carte une ligne de pipeline : « X candidatures · Y à examiner · Z en entretien ». Une seule action primaire selon le statut (Publier / Voir les candidatures / Rouvrir / Réactiver) ; les actions secondaires passent dans un menu. La fiche détail inclut le pipeline et un lien vers les candidatures filtrées. Une offre clôturée reste consultable, sans nouvelle action.

### Candidatures — la chaîne de décision

Un bandeau d'étapes avec compteurs (Toutes, En attente, En cours d'examen, En entretien, Acceptées, Refusées, Retirées), cliquable pour filtrer. Filtres offre + étape, recherche par nom réellement fonctionnelle (la barre supérieure actuelle ne filtre pas). Chaque ligne : candidat, formation, offre, date, étape, **prochaine action**, état des coordonnées. Une seule action primaire par ligne. Le détail s'ouvre en panneau latéral sur desktop, en pleine page sur mobile ; il contient le profil, le CV, la chronologie des statuts et le panneau de décision.

**Accepter** crée le dossier stagiaire avec « Affectation à confirmer » et propose « Affecter maintenant » ou « Plus tard ». **Refuser** demande un motif si le PRD le confirme. Les coordonnées sont masquées avant acceptation, avec une explication lisible ; l'e-mail se révèle à l'acceptation, le téléphone à la confirmation de l'affectation (à arbitrer, cf. décisions ouvertes).

### Entretiens — l'agenda utile

Conserver la liste et les compteurs. Grouper « À venir » / « Passés ». Le formulaire de création ne propose que les candidats éligibles (pas les refusés). Marquer « Réalisé » enchaîne sur la prochaine étape (« Décider de la candidature ») au lieu de laisser le dossier sans suite.

### Stagiaires — le dossier comme unité

La liste ouvre un dossier lisible : identité, offre, service, dates, superviseur, état d'affectation, rapports à examiner, attestation. Sur desktop, deux panneaux (liste + dossier) ; sur mobile, liste puis dossier. Une sous-navigation ancrée (Affectation, Suivi, Évaluation, Attestation) avec compteurs évite l'empilement actuel de cinq cartes. La fiche manuelle (service, superviseur, dates, missions, objectifs) passe **après** le rapport d'expertise, sous « Ajuster manuellement ».

### Écran signature — Rapport d'expertise

**En-tête :** candidat, offre, dates, badge « Affectation à confirmer », et un libellé « Recommandation » — jamais « Décision ».

**Corps :** un résumé d'une ligne (« 3 services comparés · 2 propositions · 4 règles appliquées »), puis les propositions classées. Chaque proposition affiche : rang, service, capacité (« 2 places, 1 déjà pourvue »), synthèse (« 3 critères satisfaits sur 4 »), critères satisfaits en chips vertes, critères non satisfaits et limites en ambre, références de règles, et un dépliant « Voir le raisonnement ».

**Colonne de décision (sticky sur desktop) :** « Votre décision ». Choix radio d'une proposition ou « Choisir un autre service » ; note explicite « Le système recommande ; la décision finale vous appartient » ; bouton primaire « Valider l'affectation ». En cas de choix hors recommandation, motif demandé. Après validation : carte de décision horodatée (auteur, service retenu, motif, version du moteur) et bouton « Voir la trace ».

**Bas de page :** « Trace de l'analyse » — faits utilisés, règles appliquées, services comparés, identifiant de l'exécution, horodatage, version. Immuable. « Relancer l'analyse » crée une nouvelle version, n'écrase pas l'ancienne.

**Cas limites :**
- Aucun service renseigné → une seule carte : « Le système expert a besoin de vos services et besoins », CTA vers la configuration, affectation manuelle possible avec motif.
- Faits candidat insuffisants → lister les données manquantes, proposer l'affectation manuelle avec motif ; ne jamais produire une fausse recommandation.
- Aucune proposition → expliquer pourquoi, proposer le manuel.
- Erreur → réessayer + repli manuel.
- Mobile : propositions empilées, décision après, barre d'action collante une fois un choix fait.

Pour la démonstration, un jeu de 3–4 règles illustratives **explicitement marquées « règles de démonstration »** est acceptable ; il ne doit jamais être présenté comme les règles réelles de FINCA.

### Services et besoins — la base de faits visible

Ajouter à chaque service : places nécessaires, places pourvues, places restantes, compétences, formations, dernière mise à jour. Un bandeau signale les besoins incomplets ou anciens et relie directement à l'affectation concernée. La suppression reste confirmée et expliquée.

### Profil et paramètres

Séparer visuellement **profil public** (nom, secteur, description, activités, domaines, site, ville) et **dossier administratif** (RCCM, références, responsable, documents), ce dernier n'étant pas exposé aux étudiants. Corriger la phrase d'en-tête en conséquence. Les six sections et l'enregistrement restent. Les réglages de notification ne doivent pas promettre des canaux non implémentés : les marquer comme démonstration tant que le PRD ne les a pas tranchés.

## 8. Données, contraintes et décisions ouvertes

**Contrat de données à prévoir (structure, pas code) :** une exécution experte conserve l'identifiant, le stagiaire, l'horodatage, la version du moteur, un instantané des faits, les règles appliquées, les propositions (service, rang, critères satisfaits/non satisfaits, limites, règles, capacité au moment du calcul) et la décision (service, auteur, date, source recommandation/manuel, motif). Les exécutions sont immuables ; une relance crée une version.

**Contraintes :**
- DESIGN.md : marine `#142D4E`, blanc, canevas `#F1F5F9`, Inter, rayons 6–8 px, badges texte + couleur, bleu ciel < 10 %, rythme 24 px, navigation latérale dès 768 px, aucun texte > 30 px hors KPI.
- Français uniquement, verbes précis : « Publier une offre », « Valider l'affectation », « Enregistrer les modifications ».
- Accessibilité : focus visible, navigation clavier, libellés liés, erreurs sous le champ, statut jamais par la couleur seule, `prefers-reduced-motion`, pas de débordement horizontal à 390 px.
- React + TypeScript + Vite + Tailwind + TanStack Router ; Zustand/mock aujourd'hui, Supabase ensuite. L'UI ne doit pas dépendre des formes de données mock.
- Ne pas inventer : règles expertes, priorités, départages, champs obligatoires, canaux de notification, fréquence des rapports, QR, rétention, délais.

## 9. Décisions arbitrées

1. **Placement de l'affectation — sous-route du dossier stagiaire.**
   Route `/entreprise/stagiaires/$internId` avec sections ancrées (Affectation, Suivi, Évaluation, Attestation). Le menu en 8 entrées du Design Brief reste intact.
2. **Statuts — alignés sur le PRD.**
   En attente, En cours d'examen, En entretien, Acceptée, Refusée, Retirée. « Présélectionnée » disparaît du modèle public et devient une étape interne de l'examen.
3. **Coordonnées — e-mail et téléphone révélés ensemble à l'acceptation.**
   ⚠️ Écart assumé par rapport à RG-12, qui prévoit le téléphone après sélection **et confirmation de l'affectation**. À réconcilier dans le PRD avant implémentation : soit RG-12 est amendé, soit le gating est resserré. Tant que l'arbitrage n'est pas écrit dans le PRD, le code doit rester paramétrable (un seul point de vérité pour la règle de révélation).
4. **Affectation manuelle — autorisée, motif obligatoire.**
   Le système recommande, l'entreprise décide (RG-16). Toute affectation hors recommandation enregistre un motif, l'auteur, la date et la source (`recommandation` | `manuel`).
5. **Périmètre suivant —** la demande d'intégration, l'approbation admin, l'activation et la configuration initiale entreprise doivent être shapées ensuite, car RG-02/RG-03 conditionnent l'accès réel à cet espace.
