# Design Brief définitif — StageManager

**Version :** 1.0  
**Date :** 6 novembre 2026  
**Statut :** Document de référence pour la conception de l’interface utilisateur

---

## 1. Présentation du projet

StageManager est une plateforme web qui facilite la mise en relation entre les étudiants et les entreprises pour le recrutement, la gestion et le suivi des stages.

La plateforme comprend trois espaces distincts :

- **Espace étudiant** : création et gestion du profil, recherche de stages, candidatures, suivi du stage et consultation des documents.
- **Espace entreprise** : gestion du profil de l’entreprise, publication des offres, traitement des candidatures, organisation des entretiens et suivi des stagiaires.
- **Espace administrateur** : supervision générale de la plateforme, gestion des comptes et des entreprises, contrôle des offres et suivi du système expert.

Le système expert constitue un sous-système de StageManager. Il aide l’entreprise à affecter les stagiaires retenus aux services qui correspondent le mieux à leurs profils et aux besoins déclarés. Il ne remplace pas la décision finale de l’entreprise.

La plateforme est conçue pour accueillir plusieurs entreprises. Chaque entreprise dispose de son propre espace privé et ne peut accéder qu’à ses propres données. FINCA RDC est la première entreprise intégrée dans le cadre de la version initiale du projet.

## 2. Objectifs de l’expérience utilisateur

L’interface doit permettre à chaque utilisateur de :

1. comprendre rapidement où il se trouve et quelles actions sont disponibles ;
2. accomplir les tâches principales avec un minimum d’étapes ;
3. retrouver facilement ses informations et ses activités ;
4. comprendre clairement les statuts des offres, candidatures et stages ;
5. utiliser la plateforme sans connaissances techniques particulières ;
6. accéder à une interface cohérente sur ordinateur, tablette et téléphone.

La priorité est donnée à la clarté, à la simplicité et à la fiabilité plutôt qu’à une interface chargée d’effets visuels.

## 3. Identité visuelle

### 3.1 Palette de couleurs

La palette officielle repose sur trois couleurs principales :

| Couleur | Code hexadécimal | Utilisation |
|---|---|---|
| Bleu marine | `#142D4E` | Couleur principale, navigation, titres importants et boutons principaux |
| Blanc | `#FFFFFF` | Arrière-plans, surfaces et espaces de respiration |
| Bleu ciel | `#75B8E7` | Accents, éléments secondaires, liens et indicateurs visuels |

Couleurs fonctionnelles complémentaires recommandées :

- **Vert** : succès, validation et statut accepté.
- **Orange** : attente, avertissement ou action à traiter.
- **Rouge** : erreur, refus ou action destructive.
- **Gris** : textes secondaires, bordures, fonds discrets et états désactivés.

Ces couleurs fonctionnelles doivent rester cohérentes et ne pas remplacer la palette principale.

### 3.2 Typographie

**Police principale : Inter**

- Titres : Inter SemiBold ou Bold.
- Sous-titres : Inter Medium.
- Texte courant : Inter Regular.
- Boutons, menus et libellés : Inter Medium.

La hiérarchie typographique doit être nette et lisible. Éviter les tailles excessives et les variations décoratives inutiles.

### 3.3 Ton visuel

L’identité visuelle doit transmettre :

- le professionnalisme ;
- la confiance ;
- la simplicité ;
- la modernité ;
- la sécurité.

Le rendu doit être classique et professionnel, avec une apparence moderne sans extravagance.

## 4. Principes d’interface

### 4.1 Mise en page

- Utiliser une structure régulière et cohérente sur les trois espaces.
- Prévoir une navigation latérale sur les tableaux de bord de bureau.
- Afficher une barre supérieure pour les informations utiles : titre de la page, notifications et menu du compte.
- Organiser le contenu en sections clairement identifiées.
- Utiliser des cartes pour les indicateurs et les informations synthétiques.
- Utiliser des tableaux pour les listes qui nécessitent comparaison, recherche ou filtrage.
- Préserver suffisamment d’espace blanc afin d’éviter la surcharge.

### 4.2 Formes et composants

- Coins légèrement arrondis, sans formes excessivement arrondies.
- Cartes et panneaux avec bordures discrètes.
- Ombres légères, uniquement lorsqu’elles améliorent la séparation visuelle.
- Boutons principaux en bleu marine avec texte blanc.
- Boutons secondaires plus discrets, avec contour ou fond neutre.
- Champs de formulaire simples, bien espacés et accompagnés de libellés explicites.
- Icônes sobres, cohérentes et immédiatement compréhensibles.

### 4.3 Boutons et actions

Chaque action doit avoir une importance visuelle proportionnelle à son impact :

- **Action principale** : bouton plein bleu marine.
- **Action secondaire** : bouton neutre ou contour.
- **Action destructive** : style d’alerte rouge et demande de confirmation lorsque nécessaire.
- **Action indisponible** : état désactivé clairement perceptible.

Les libellés doivent utiliser des verbes précis : « Publier une offre », « Envoyer ma candidature », « Valider l’affectation », « Enregistrer les modifications ».

## 5. Navigation et structure des espaces

Les trois espaces doivent partager les mêmes principes graphiques, mais leurs menus et leurs fonctionnalités doivent rester adaptés à chaque rôle.

### 5.1 Espace étudiant

Menu principal :

1. Tableau de bord
2. Mon profil
3. Trouver un stage
4. Mes candidatures
5. Mon stage
6. Mes documents
7. Paramètres

Le tableau de bord présente notamment les candidatures envoyées, les candidatures en attente, les candidatures acceptées, les stages en cours, les offres recommandées et la progression du profil.

### 5.2 Espace entreprise

Menu principal :

1. Tableau de bord
2. Mon profil entreprise
3. Mes offres
4. Candidatures
5. Entretiens
6. Mes stagiaires
7. Services et besoins
8. Paramètres

Le tableau de bord présente les offres actives, les candidatures reçues, les candidatures à examiner et les stagiaires actuellement accueillis.

L’espace entreprise doit rendre visibles les tâches de recrutement et de suivi sans transformer l’interface en outil complexe de gestion interne de l’entreprise.

### 5.3 Espace administrateur

Menu principal :

1. Tableau de bord
2. Gestion des étudiants
3. Gestion des entreprises
4. Gestion des offres
5. Gestion des candidatures
6. Suivi du système expert
7. Journal d’activité
8. Paramètres

Le tableau de bord présente les indicateurs globaux : nombre d’étudiants, d’entreprises, d’offres, de candidatures et de stages en cours.

L’administrateur dispose d’une vue globale. Les décisions de recrutement et la validation finale de l’affectation des stagiaires restent du ressort de l’entreprise.

## 6. Tableaux de bord et indicateurs

Les indicateurs clés doivent être présentés sous forme de cartes synthétiques en haut du tableau de bord.

Chaque carte comprend, selon le cas :

- un intitulé court ;
- une valeur clairement visible ;
- une icône discrète si elle apporte une information ;
- éventuellement une indication d’évolution ou un lien vers la liste correspondante.

Les chiffres doivent être lisibles et ne pas être accompagnés de graphiques décoratifs inutiles.

Les tableaux de bord étudiant, entreprise et administrateur doivent être visuellement cohérents, mais afficher uniquement les données utiles au rôle connecté.

## 7. Formulaires et saisie des données

Les formulaires doivent être simples, progressifs et faciles à corriger.

Principes à respecter :

- regrouper les champs par thème ;
- afficher un libellé au-dessus de chaque champ ;
- préciser les champs obligatoires ;
- fournir des indications courtes lorsque le format attendu n’est pas évident ;
- afficher les erreurs près du champ concerné ;
- conserver les données déjà saisies en cas d’erreur de validation ;
- confirmer clairement l’enregistrement réussi ;
- éviter les formulaires trop longs sur une seule page lorsque plusieurs étapes logiques sont possibles.

Pour l’inscription et la première configuration d’un espace, utiliser un parcours d’accueil progressif avec indicateur d’avancement.

## 8. Statuts et retours visuels

Les statuts doivent être affichés sous forme de libellés ou badges cohérents, avec une couleur fonctionnelle et un texte explicite. La couleur ne doit jamais être le seul moyen de communiquer une information.

Exemples :

| Élément | Statuts |
|---|---|
| Demande d’intégration d’une entreprise | En attente, Approuvée, Refusée |
| Offre de stage | Brouillon, Publiée, Clôturée, Désactivée |
| Candidature | En attente, En cours d’examen, En entretien, Acceptée, Refusée, Retirée |
| Entretien | Programmé, Réalisé, Annulé |
| Stage | À venir, En cours, Terminé |

Les actions importantes doivent produire un retour visuel compréhensible : confirmation, message de succès, avertissement ou explication de l’erreur.

## 9. Recherche, filtres et tableaux

Les listes d’offres, d’étudiants, de candidatures et de stagiaires doivent proposer des outils adaptés à leur volume :

- recherche par mot-clé lorsque cela est pertinent ;
- filtres selon les critères utiles à l’écran ;
- tri des colonnes lorsque cela facilite la consultation ;
- pagination ou chargement progressif pour les longues listes ;
- état vide explicite lorsqu’aucun résultat ne correspond.

Les filtres doivent rester simples et ne pas multiplier les options sans nécessité.

## 10. Notifications et confirmations

Prévoir un système visuel de notifications accessible depuis la barre supérieure.

Les notifications doivent être courtes, compréhensibles et liées à une action concrète : nouvelle candidature, invitation à un entretien, changement de statut, rapport à consulter ou document disponible.

Les opérations sensibles ou difficiles à annuler doivent demander une confirmation. Les messages de confirmation doivent expliquer clairement ce qui va se produire.

## 11. Animations et micro-interactions

Le style d’animation souhaité est inspiré de la fluidité des interfaces Apple, tout en restant discret et professionnel.

Animations recommandées :

- apparition progressive et légère des sections ;
- transitions naturelles lors de l’ouverture des menus et fenêtres modales ;
- retours subtils au survol et au clic des boutons ;
- transitions fluides entre les états d’un composant ;
- indicateurs de chargement sobres.

Les animations ne doivent jamais ralentir les tâches ni détourner l’attention. Respecter le paramètre système de réduction des animations (`prefers-reduced-motion`).

## 12. Responsive design

StageManager doit être utilisable sur ordinateur, tablette et téléphone.

### Ordinateur

- navigation latérale visible ;
- tableaux exploitant la largeur disponible ;
- contenu organisé en colonnes lorsque cela améliore la lecture ;
- tableaux de bord avec plusieurs cartes sur une même ligne.

### Tablette

- navigation latérale compacte ou repliable ;
- cartes réorganisées selon la largeur ;
- tableaux adaptés sans perte d’informations essentielles.

### Téléphone

- navigation adaptée à un petit écran, par exemple menu repliable ;
- cartes empilées verticalement ;
- formulaires sur une seule colonne ;
- tableaux transformés en présentations adaptées lorsque leur largeur devient insuffisante ;
- boutons et zones tactiles suffisamment grands.

Le contenu essentiel ne doit pas nécessiter de défilement horizontal sur téléphone.

## 13. Accessibilité et lisibilité

L’interface doit suivre de bonnes pratiques d’accessibilité :

- contraste suffisant entre texte et arrière-plan ;
- taille de texte confortable ;
- navigation possible au clavier ;
- focus clavier visible ;
- libellés associés aux champs ;
- messages d’erreur compréhensibles ;
- textes alternatifs pour les images utiles ;
- informations non communiquées uniquement par la couleur ;
- respect de la préférence de réduction des animations.

## 14. Confidentialité et confiance dans l’interface

Les informations privées doivent être présentées et accessibles selon les droits du rôle connecté.

Exemples de principes à respecter dans l’interface :

- les espaces des entreprises sont clairement séparés ;
- les informations personnelles de l’étudiant ne sont pas exposées sans autorisation ;
- le CV n’est accessible à l’entreprise que dans le cadre prévu après une candidature ;
- les actions de l’administrateur sont distinctes des décisions de recrutement de l’entreprise ;
- les recommandations du système expert sont présentées comme une aide à la décision et non comme une décision automatique.

La conception visuelle ne remplace pas les contrôles de sécurité côté serveur. Les autorisations et l’isolation des données doivent être assurées techniquement.

## 15. Écrans prioritaires à concevoir

Ordre recommandé pour les maquettes :

1. Page d’accueil publique
2. Connexion et inscription étudiant
3. Demande d’intégration d’une entreprise
4. Activation du compte entreprise
5. Parcours de configuration initiale étudiant
6. Parcours de configuration initiale entreprise
7. Tableau de bord étudiant
8. Tableau de bord entreprise
9. Tableau de bord administrateur
10. Écrans de publication et de consultation des offres
11. Écrans de gestion des candidatures et des entretiens
12. Écrans de gestion des services et besoins
13. Écrans d’affectation et d’explication du système expert
14. Écrans de suivi des stagiaires et des documents

Les maquettes doivent d’abord couvrir les parcours essentiels avant les écrans secondaires.

## 16. Cohérence entre design et fonctionnement

Le design doit représenter fidèlement les règles fonctionnelles définies dans le PRD.

En particulier :

- ne pas afficher une action à un utilisateur qui n’a pas le droit de l’effectuer ;
- distinguer les recommandations du système expert des décisions humaines ;
- rendre les statuts et prochaines étapes compréhensibles ;
- ne pas exposer les données d’une autre entreprise ;
- éviter les fonctionnalités visuelles qui ne sont pas prévues dans le périmètre de la version initiale.

Toute modification importante du fonctionnement doit être validée dans le PRD avant d’être ajoutée aux maquettes.

## 17. Technologies et mise en œuvre

Le design sera réalisé dans le cadre de l’architecture technique envisagée :

- **Frontend :** React et TypeScript
- **Outil de build :** Vite
- **Interface :** Tailwind CSS et shadcn/ui
- **Backend et base de données :** Supabase et PostgreSQL
- **Authentification :** Supabase Auth
- **Sécurité des données :** Row Level Security (RLS)
- **Fonctions serveur :** Supabase Edge Functions
- **Déploiement :** Vercel

Ces technologies constituent le socle technique prévu. Le choix définitif de l’outil de Vibe Coding reste à arrêter.

## 18. Critères de validation du design

Le design brief sera considéré comme respecté si :

- les trois espaces utilisateurs sont clairement différenciés tout en partageant une identité commune ;
- la palette et la typographie sont utilisées de manière cohérente ;
- les tableaux de bord mettent en avant les indicateurs utiles ;
- les formulaires sont lisibles et compréhensibles ;
- les statuts sont immédiatement identifiables ;
- les interfaces sont adaptées aux différentes tailles d’écran ;
- les animations restent discrètes et fluides ;
- les informations privées et les actions sensibles sont clairement encadrées ;
- les écrans correspondent au périmètre fonctionnel défini dans le PRD.

---

## 19. Conclusion

Le présent Design Brief définit la direction visuelle et les principes d’expérience utilisateur de StageManager. Il sert de référence pour la création des maquettes et pour la réalisation de l’interface.

L’objectif est de produire une plateforme sobre, professionnelle, moderne et facile à utiliser, tout en mettant en valeur la fonction centrale du système expert : aider l’entreprise à affecter les stagiaires aux services les plus adaptés, avec une explication des recommandations et une validation humaine finale.
