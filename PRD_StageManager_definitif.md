# PRODUCT REQUIREMENTS DOCUMENT (PRD) --- StageManager

**Version :** 1.1\
**Date :** 6 novembre 2026\
**Statut :** Version consolidée des décisions validées\
**Mémoire :** « Mise en place d'un système expert d'aide à l'affectation
des stagiaires chez FINCA RDC »

------------------------------------------------------------------------

## 1. Présentation générale

### 1.1. Description

StageManager est une plateforme web qui met en relation les étudiants à
la recherche d'un stage et les entreprises qui proposent des
opportunités. Elle permet de gérer les profils, les offres, les
candidatures, les entretiens et le suivi des stages.

La plateforme intègre un **système expert d'aide à l'affectation des
stagiaires aux services de l'entreprise**. Après la sélection d'un
candidat, le système analyse son profil et les besoins des services afin
de proposer une ou plusieurs affectations pertinentes. La décision
finale appartient à l'entreprise.

### 1.2. Périmètre initial

FINCA RDC sera la première entreprise intégrée. StageManager est
toutefois conçu comme une plateforme multi-entreprises : d'autres
entreprises pourront demander leur intégration ultérieurement. Chaque
entreprise dispose d'un espace privé et ne peut accéder qu'à ses propres
données.

### 1.3. Principes directeurs

-   Une plateforme commune avec trois espaces distincts : étudiant,
    entreprise et administrateur.
-   Une inscription directe pour les étudiants et une intégration sur
    validation pour les entreprises.
-   Un système expert explicable qui formule des recommandations sans
    prendre la décision finale.
-   Une séparation stricte des données entre entreprises.
-   Une première version utile, sécurisée et limitée aux fonctionnalités
    essentielles.

## 2. Objectifs

### 2.1. Objectif général

Mettre en place une plateforme web de gestion du recrutement et du suivi
des stagiaires, intégrant un système expert d'aide à leur affectation
aux services appropriés.

### 2.2. Objectifs spécifiques

-   Permettre aux étudiants de créer et gérer leur profil.
-   Faciliter la consultation des offres et le dépôt des candidatures.
-   Permettre aux entreprises de publier des offres et de gérer le
    recrutement.
-   Organiser les entretiens et le suivi des stagiaires.
-   Recueillir les besoins des services qui accueillent des stagiaires.
-   Proposer des affectations à partir de faits et de règles documentés.
-   Conserver l'historique des décisions et opérations importantes.
-   Permettre à l'administrateur de superviser la plateforme.

## 3. Utilisateurs et rôles

### 3.1. Étudiant

L'étudiant peut : - créer et gérer son compte ; - compléter son profil
et contrôler sa visibilité ; - consulter et filtrer les offres ; -
enregistrer des offres en favoris ; - déposer et suivre ses candidatures
; - recevoir les notifications liées au recrutement ; - consulter les
informations relatives à son stage ; - transmettre ses rapports
périodiques ; - consulter ses documents et son évaluation finale ; -
télécharger son attestation de fin de stage.

### 3.2. Entreprise

L'entreprise peut : - demander son intégration à StageManager ; - gérer
son espace après approbation ; - compléter son profil ; - gérer les
services qui accueillent des stagiaires et leurs besoins ; - publier et
gérer ses offres ; - consulter et traiter les candidatures ; - organiser
les entretiens ; - accepter ou refuser des candidats ; - examiner et
valider les propositions du système expert ou choisir une autre
affectation ; - désigner des superviseurs ; - suivre les stagiaires et
leurs rapports ; - saisir l'évaluation finale ; - générer et valider les
attestations.

**Limite v1 :** un compte principal par entreprise. Les comptes
distincts pour plusieurs employés et la gestion de permissions internes
ne sont pas inclus.

### 3.3. Administrateur

L'administrateur supervise la plateforme. Il peut : - consulter les
indicateurs généraux ; - gérer les comptes étudiants ; - traiter les
demandes d'intégration des entreprises ; - gérer les espaces entreprise
; - contrôler la conformité des offres ; - consulter les candidatures
sans décider du recrutement ; - suivre le système expert et les
affectations ; - consulter le journal d'activité ; - gérer les
paramètres généraux autorisés.

Un seul compte administrateur principal est prévu dans la première
version.

## 4. Espaces utilisateurs et fonctionnalités

## 4.1. Espace étudiant

### 4.1.1. Tableau de bord

Le tableau de bord présente : - un message de bienvenue ; - l'avancement
du profil ; - le nombre de candidatures envoyées ; - le nombre de
candidatures en attente ; - le nombre de candidatures acceptées ; - le
nombre de stages en cours ; - les candidatures récentes et leurs statuts
; - des offres recommandées ; - des raccourcis vers les fonctionnalités
principales.

### 4.1.2. Mon profil

Le profil comprend six sections :

1.  **Informations personnelles** : identité et coordonnées.
2.  **Informations académiques** : établissement, faculté, filière,
    niveau et formation.
3.  **Compétences** : ajout de plusieurs compétences.
4.  **Expériences professionnelles** : expériences et activités
    pertinentes.
5.  **Documents** : CV, lettres, diplômes et justificatifs.
6.  **Préférences de stage** : domaine, durée et autres préférences
    pertinentes.

Un indicateur de progression est affiché. L'étudiant peut rendre son
profil visible ou invisible.

Règles de confidentialité : - les entreprises ne consultent le profil
que si l'étudiant l'a rendu visible ; - l'adresse e-mail reste privée
par défaut ; - le numéro de téléphone reste privé et n'est communiqué à
l'entreprise qu'après sélection et confirmation du stage ; - le CV peut
être consulté ou téléchargé par une entreprise après le dépôt d'une
candidature à son offre.

### 4.1.3. Trouver un stage

L'étudiant peut : - consulter les offres publiées ; - rechercher par
mot-clé ou entreprise ; - filtrer par domaine, niveau d'études,
compétences et durée ; - consulter les détails d'une offre ; -
enregistrer une offre en favoris ; - déposer une candidature.

### 4.1.4. Mes candidatures

L'étudiant consulte ses candidatures, leur date, l'offre associée et
leur statut.

Statuts : **En attente, En cours d'examen, En entretien, Acceptée,
Refusée, Retirée.**

Règles : - un étudiant peut postuler à plusieurs offres ; - une seule
candidature est autorisée par étudiant et par offre ; - il peut retirer
librement sa candidature avant son examen ; - pendant l'examen, il peut
demander son retrait ; - après acceptation ou refus, le retrait n'est
plus possible ; - si plusieurs entreprises l'acceptent, l'étudiant
choisit une opportunité et la confirme ; les autres entreprises sont
informées et les autres opportunités acceptées sont clôturées.

### 4.1.5. Mon stage

Cette rubrique présente l'entreprise, le service d'affectation, les
dates, la durée, le superviseur, les missions et objectifs, ainsi que
l'état du stage : à venir, en cours ou terminé.

### 4.1.6. Mes documents

L'étudiant peut consulter, télécharger et imprimer ses documents : CV et
pièces déposées, diplômes et certificats, ainsi que l'attestation de fin
de stage validée par l'entreprise.

Après validation par l'entreprise, l'attestation est déposée
automatiquement dans cet espace. Elle comporte une référence unique et
un QR code permettant d'en vérifier l'authenticité.

### 4.1.7. Paramètres

-   Informations du compte.
-   Sécurité : modifier le mot de passe.
-   Confidentialité et visibilité du profil.
-   Préférences de notification.
-   Demande de désactivation ou de suppression du compte.
-   Déconnexion.

## 4.2. Espace entreprise

### 4.2.1. Tableau de bord

Indicateurs : - nombre d'offres actives ; - nombre de candidatures
reçues ; - nombre de candidatures en attente d'examen ; - nombre de
stagiaires actuellement accueillis.

Le tableau de bord présente également les candidatures récentes, les
offres publiées et des raccourcis vers la publication d'offres et la
gestion des candidatures.

### 4.2.2. Mon profil entreprise

Le profil comprend six sections :

1.  **Informations générales** : nom, logo facultatif, secteur et
    description.
2.  **Coordonnées** : adresse, ville, téléphone et e-mail professionnel.
3.  **Informations légales** : numéro d'enregistrement et références
    officielles.
4.  **Présentation** : activités principales, domaines d'intervention et
    site web.
5.  **Responsable** : identité et coordonnées du représentant principal.
6.  **Documents officiels** : pièces justificatives de l'existence de
    l'entreprise.

Le logo est facultatif. En son absence, les initiales de l'entreprise
peuvent être affichées. Les informations fournies lors de la demande
d'intégration peuvent être complétées ou modifiées après approbation.

### 4.2.3. Mes offres

L'entreprise peut publier plusieurs offres, les modifier, les
désactiver, les réactiver, les clôturer et consulter leurs détails et
candidatures.

Statuts : **Brouillon, Publiée, Clôturée, Désactivée.**

Chaque offre comporte notamment une description, des critères de
sélection, les compétences recherchées, les conditions et une date
limite.

Les offres sont publiées sans validation préalable de l'administrateur.
Celui-ci peut retirer une offre non conforme. Si une modification
importante ou une désactivation concerne une offre ayant déjà reçu des
candidatures, les candidats concernés sont informés.

### 4.2.4. Candidatures

L'entreprise peut : - consulter les candidatures par offre ; - consulter
les profils ; - consulter ou télécharger le CV d'un candidat ayant
postulé ; - présélectionner des candidats ; - inviter à un entretien ; -
accepter ou refuser une candidature ; - déclencher les notifications
correspondantes.

Chaque offre dispose de son propre espace de suivi. L'entreprise
conserve la responsabilité des décisions de recrutement.

### 4.2.5. Entretiens

Rubrique distincte de la gestion des candidatures. Elle permet de
consulter les entretiens programmés, planifier un entretien, définir la
date, l'heure et le lieu, inviter le candidat, modifier ou annuler
l'entretien et consulter les entretiens passés.

Statuts : **Programmé, Réalisé, Annulé.**

### 4.2.6. Mes stagiaires

L'entreprise peut : - consulter la liste des stagiaires recrutés et
leurs profils ; - examiner et confirmer leur service d'affectation ; -
désigner un superviseur ; - définir les dates, la durée, les missions et
les objectifs ; - assurer le suivi ; - examiner les rapports
périodiques, les valider ou les retourner pour correction avec
observations ; - saisir l'évaluation finale ; - générer et valider
l'attestation de fin de stage.

Un même superviseur peut encadrer plusieurs stagiaires. Chaque stagiaire
dispose d'une fiche individuelle regroupant les informations de
recrutement, le service, le superviseur, les dates, les missions,
l'évaluation finale et l'état de l'attestation.

L'évaluation finale reste une décision humaine de l'entreprise.
StageManager enregistre le résultat sans remplacer l'évaluation physique
ou professionnelle.

### 4.2.7. Services et besoins

L'entreprise enregistre uniquement les services qui accueillent des
stagiaires, sans reproduire toute son organisation interne.

Pour chaque service, elle renseigne : - le nom du service ; - le nombre
de stagiaires dont il a besoin ; - les profils souhaités ; - les
formations ou niveaux pertinents ; - les compétences attendues ; - les
besoins pour la période de recrutement concernée.

Ces informations alimentent la base de faits du système expert.

### 4.2.8. Paramètres

-   Informations du compte.
-   Sécurité : modifier le mot de passe.
-   Notifications.
-   Gestion de l'espace entreprise : désactivation temporaire et
    réactivation sans perte d'historique.
-   Déconnexion.

## 4.3. Espace administrateur

L'espace administrateur est privé. Il n'existe ni inscription
administrateur publique ni choix « administrateur » sur les pages
publiques.

### 4.3.1. Tableau de bord

Indicateurs : - nombre total d'étudiants inscrits ; - nombre total
d'entreprises enregistrées ; - nombre total d'offres ; - nombre total de
candidatures ; - nombre de stages en cours.

Informations complémentaires : dernières inscriptions, demandes
d'intégration en attente, activités récentes, alertes et notifications
importantes.

### 4.3.2. Gestion des étudiants

L'administrateur peut consulter et rechercher les étudiants, consulter
leurs profils et le statut de leurs comptes, suspendre temporairement ou
bloquer définitivement un compte, réactiver un compte suspendu et
traiter les demandes de suppression. Toute suspension ou tout blocage
exige un motif.

### 4.3.3. Gestion des entreprises

L'administrateur peut consulter les entreprises et leurs profils,
traiter les demandes d'intégration, approuver ou refuser une demande,
suspendre ou bloquer un espace, réactiver un espace suspendu, traiter
les demandes de suppression et consulter les offres publiées par chaque
entreprise. Toute sanction exige un motif.

### 4.3.4. Gestion des offres

L'administrateur peut consulter, rechercher et filtrer les offres,
consulter leurs détails, retirer une offre non conforme et consulter les
candidatures reçues ainsi que l'historique des modifications
importantes. L'entreprise est informée du retrait et de son motif.

### 4.3.5. Gestion des candidatures

L'administrateur peut consulter et rechercher toutes les candidatures,
consulter leurs détails et statuts, suivre l'historique des changements
et examiner les problèmes ou signalements. Il ne décide pas du
recrutement à la place des entreprises.

### 4.3.6. Suivi du système expert

L'administrateur peut consulter les affectations proposées, les profils
analysés, les services proposés, les règles utilisées par le moteur
d'inférence, la décision finale de l'entreprise et l'historique des
affectations. Il peut identifier les erreurs ou anomalies éventuelles.

Chaque analyse et décision importante doit laisser une trace.
L'administrateur contrôle le fonctionnement du système sans remplacer
l'entreprise dans la validation de l'affectation.

### 4.3.7. Journal d'activité

Le journal conserve les actions importantes : création et modification
des comptes, approbation ou refus des entreprises, publication,
modification et retrait des offres, suspension et réactivation des
comptes, analyses et recommandations du système expert, validation des
affectations.

Chaque entrée comporte, lorsque cela est applicable, l'utilisateur à
l'origine de l'action, la date et l'heure. Le journal est consultable,
mais ses traces ne peuvent pas être modifiées ou supprimées par les
utilisateurs.

### 4.3.8. Paramètres

-   Informations du compte.
-   Sécurité : modifier le mot de passe.
-   Notifications.
-   Paramètres généraux de la plateforme.
-   Déconnexion.

## 5. Authentification et onboarding

### 5.1. Principe général

StageManager dispose d'une page publique de connexion commune.
L'utilisateur saisit son adresse e-mail et son mot de passe. Après
vérification, le système identifie le rôle enregistré et le redirige
vers l'espace correspondant.

Rôles : - `student` : étudiant ; - `company` : entreprise ; - `admin` :
administrateur.

Le rôle est attribué et contrôlé côté serveur. L'utilisateur ne peut pas
le choisir ou le modifier librement.

### 5.2. Inscription étudiant

L'étudiant s'inscrit directement au moyen d'un formulaire comprenant : -
nom et prénom ; - adresse e-mail ; - création du mot de passe ; -
confirmation du mot de passe ; - acceptation des conditions applicables
; - vérification de l'adresse e-mail.

Après sa première authentification, il suit l'onboarding étudiant.

### 5.3. Intégration entreprise

L'entreprise soumet une demande d'intégration comprenant les
informations générales, coordonnées, informations légales, informations
du représentant et documents justificatifs.

États de la demande : **En attente, Approuvée, Refusée.**

Après approbation, l'entreprise reçoit une invitation sécurisée pour
activer son compte et créer son mot de passe. Après sa première
connexion, elle suit l'onboarding entreprise. En cas de refus, elle
reçoit une notification indiquant le motif.

### 5.4. Connexion commune

La page publique de connexion comprend : - adresse e-mail ; - mot de
passe ; - bouton « Se connecter » ; - lien « Mot de passe oublié ? ».

Le système détermine le rôle à partir du compte authentifié et redirige
vers l'espace étudiant, entreprise ou administrateur. L'accès
administrateur n'est pas présenté comme une option publique.

### 5.5. Gestion du mot de passe

À la création du compte : - Créer mon mot de passe ; - Confirmer mon mot
de passe.

Dans les paramètres de sécurité : - mot de passe actuel ; - nouveau mot
de passe ; - confirmer le nouveau mot de passe ; - bouton « Modifier le
mot de passe ».

Le parcours « Mot de passe oublié » permet de rétablir l'accès au compte
au moyen d'un mécanisme sécurisé.

### 5.6. Onboarding étudiant

Après sa première authentification, l'étudiant suit un parcours guidé
: 1. bienvenue et présentation ; 2. informations personnelles ; 3.
informations académiques ; 4. compétences et expériences ; 5. CV et
documents ; 6. préférences de stage ; 7. visibilité du profil.

Une progression est affichée. Les informations essentielles doivent être
complétées avant les actions qui en dépendent. L'onboarding terminé ne
réapparaît pas à chaque connexion.

### 5.7. Onboarding entreprise

Après activation et première authentification, l'entreprise suit un
parcours guidé : 1. bienvenue ; 2. vérification et complément des
informations de l'entreprise ; 3. ajout des services qui accueillent des
stagiaires ; 4. définition des besoins de chaque service ; 5.
préférences de notification ; 6. accès au tableau de bord.

Une progression est affichée. L'onboarding terminé ne réapparaît pas à
chaque connexion.

## 6. Système expert d'aide à l'affectation

### 6.1. Rôle

Le système expert est le composant central de l'objectif scientifique du
mémoire. Il aide l'entreprise à affecter un stagiaire sélectionné au
service le plus approprié.

Il ne s'agit ni d'un chatbot ni d'un assistant conversationnel général.
Il repose sur des faits, des règles et un moteur d'inférence.

### 6.2. Composants

1.  **Base de faits** : informations relatives au stagiaire, à sa
    formation, à ses compétences et aux besoins des services.
2.  **Base de règles** : règles métier reliant les caractéristiques du
    stagiaire aux besoins des services.
3.  **Moteur d'inférence** : applique les règles aux faits afin de
    produire une ou plusieurs propositions.
4.  **Module d'explication** : expose les raisons des propositions, les
    critères satisfaits et les éventuelles limites.

### 6.3. Données d'entrée

Les données exploitées peuvent comprendre : - formation et domaine
d'études ; - niveau académique ; - compétences ; - expériences
pertinentes ; - préférences de stage lorsqu'elles sont disponibles ; -
services qui accueillent des stagiaires ; - nombre de stagiaires
recherchés par service ; - profils et compétences attendus.

Seuls les éléments nécessaires à l'affectation doivent être utilisés.

### 6.4. Processus

1.  L'entreprise sélectionne un candidat.
2.  Le système récupère les informations utiles du profil.
3.  Le système récupère les besoins des services.
4.  Le moteur d'inférence applique les règles.
5.  Le système produit une ou plusieurs propositions.
6.  Le module d'explication présente les raisons des propositions.
7.  L'entreprise examine les propositions.
8.  Elle valide une proposition ou choisit un autre service.
9.  La décision finale et les éléments utiles sont enregistrés.

### 6.5. Autorité de décision

Le système expert formule des recommandations. Il ne recrute pas le
candidat et ne valide pas automatiquement son affectation. La décision
finale appartient à l'entreprise.

### 6.6. Formalisation des règles

Les règles précises, leurs priorités et les modalités de départage
doivent être formalisées à partir des critères réels de FINCA RDC. Elles
ne doivent pas être inventées arbitrairement. Chaque règle devra
documenter ses conditions, sa conclusion et son explication.

## 7. Règles de gestion

  -----------------------------------------------------------------------
  Référence                           Règle
  ----------------------------------- -----------------------------------
  RG-01                               Un étudiant peut créer directement
                                      un compte.

  RG-02                               Une entreprise doit soumettre une
                                      demande d'intégration.

  RG-03                               Une entreprise accède à son espace
                                      actif après approbation et
                                      activation.

  RG-04                               L'administrateur ne dispose pas
                                      d'une inscription publique.

  RG-05                               Le rôle d'un compte est attribué et
                                      contrôlé côté serveur.

  RG-06                               Chaque entreprise ne consulte que
                                      ses propres données privées.

  RG-07                               Un étudiant peut postuler à
                                      plusieurs offres.

  RG-08                               Un étudiant ne peut déposer qu'une
                                      candidature par offre.

  RG-09                               Le CV est accessible à une
                                      entreprise après candidature à son
                                      offre.

  RG-10                               Le profil étudiant n'est
                                      consultable que si sa visibilité
                                      est activée.

  RG-11                               L'adresse e-mail de l'étudiant
                                      reste privée par défaut.

  RG-12                               Le numéro de téléphone est
                                      communiqué après sélection et
                                      confirmation du stage.

  RG-13                               Une entreprise publie ses offres
                                      sans validation préalable de
                                      l'administrateur.

  RG-14                               L'administrateur peut retirer une
                                      offre non conforme en indiquant un
                                      motif.

  RG-15                               L'entreprise reste responsable de
                                      ses décisions de recrutement.

  RG-16                               Le système expert propose une
                                      affectation ; l'entreprise prend la
                                      décision finale.

  RG-17                               Les services renseignent leurs
                                      besoins et le nombre de stagiaires
                                      recherchés.

  RG-18                               Les actions importantes sont
                                      inscrites dans un journal non
                                      modifiable par les utilisateurs.

  RG-19                               Un même superviseur peut encadrer
                                      plusieurs stagiaires.

  RG-20                               L'attestation est générée et
                                      validée par l'entreprise avant son
                                      dépôt dans l'espace étudiant.

  RG-21                               Si plusieurs entreprises acceptent
                                      un étudiant, celui-ci confirme une
                                      seule opportunité ; les autres
                                      opportunités acceptées sont
                                      clôturées.

  RG-22                               Toute suspension ou tout blocage
                                      d'un compte doit comporter un
                                      motif.

  RG-23                               Une entreprise peut désactiver
                                      temporairement son espace et le
                                      réactiver sans perdre son
                                      historique.

  RG-24                               Les demandes de suppression sont
                                      traitées en tenant compte des
                                      obligations applicables de
                                      conservation des données.
  -----------------------------------------------------------------------

## 8. Notifications

La plateforme notifie les utilisateurs des événements qui les
concernent, notamment : - confirmation d'inscription et vérification de
l'adresse e-mail ; - décision relative à une demande d'intégration ; -
invitation à un entretien, modification ou annulation ; - changement de
statut d'une candidature ; - acceptation ou refus d'une candidature ; -
confirmation d'une opportunité de stage ; - retour ou validation d'un
rapport périodique ; - disponibilité de l'attestation ; - retrait ou
modification importante d'une offre ; - suspension, réactivation ou
décision concernant un compte.

Les préférences de notification sont accessibles dans les paramètres.
Les canaux exacts seront précisés lors de la conception technique.

## 9. Exigences non fonctionnelles

### 9.1. Sécurité

-   Authentification sécurisée.
-   Contrôle des accès selon le rôle.
-   Protection des routes et opérations côté serveur.
-   Isolation des données de chaque entreprise.
-   Politiques de sécurité au niveau des données, notamment PostgreSQL
    Row Level Security (RLS).
-   Protection des documents et fichiers privés.
-   Validation des données envoyées par les formulaires.
-   Journalisation des opérations sensibles.
-   Réinitialisation sécurisée du mot de passe.
-   Aucun secret ou identifiant sensible exposé dans le code client.

### 9.2. Confidentialité

-   Collecter uniquement les informations nécessaires.
-   Respecter les paramètres de visibilité du profil étudiant.
-   Limiter l'accès aux coordonnées privées.
-   Définir les conditions de conservation et de suppression des
    données.
-   Empêcher une entreprise d'accéder aux données privées d'une autre
    entreprise.

### 9.3. Utilisabilité

-   Interface claire et cohérente.
-   Navigation adaptée au rôle.
-   Formulaires compréhensibles et messages d'erreur utiles.
-   Progression visible pendant l'onboarding.
-   Conception responsive pour ordinateur, tablette et téléphone.
-   Animations fluides et discrètes, sans gêner l'utilisation ; respect
    des préférences de réduction des animations.

### 9.4. Fiabilité et traçabilité

-   Enregistrer les opérations importantes.
-   Préserver l'intégrité des candidatures et affectations.
-   Éviter les candidatures en double.
-   Assurer la disponibilité des documents autorisés.
-   Conserver l'historique nécessaire au suivi des stages.

## 10. Architecture technique proposée

  Couche                  Technologie
  ----------------------- --------------------------
  Frontend                React + TypeScript
  Outil de construction   Vite
  Interface utilisateur   Tailwind CSS + shadcn/ui
  Backend et services     Supabase
  Base de données         PostgreSQL
  Authentification        Supabase Auth
  Sécurité des données    PostgreSQL RLS
  Fonctions serveur       Supabase Edge Functions
  Déploiement frontend    Vercel

L'outil de Vibe Coding (par exemple Claude Code ou OpenCode) reste à
choisir. C'est un outil de réalisation, pas un composant fonctionnel de
la plateforme.

Architecture logique : - le frontend présente les interfaces adaptées
aux rôles ; - Supabase Auth gère l'authentification ; - PostgreSQL
conserve les données ; - les politiques RLS assurent l'isolation des
données ; - les Edge Functions exécutent les opérations sensibles côté
serveur ; - le système expert applique ses règles aux données autorisées
; - Vercel héberge et déploie l'application frontend.

## 11. Principales entités de données envisagées

La structure détaillée et les relations seront formalisées dans le
modèle de données et les diagrammes UML.

Entités principales : - Utilisateur / compte ; - Profil étudiant ; -
Profil entreprise ; - Demande d'intégration ; - Offre de stage ; -
Critère de sélection ; - Candidature ; - Entretien ; - Service de
l'entreprise ; - Besoin d'un service ; - Compétence ; - Formation ; -
Expérience ; - Document ; - Stage ; - Affectation ; - Superviseur ; -
Rapport périodique ; - Évaluation finale ; - Attestation ; -
Notification ; - Règle du système expert ; - Fait utilisé par le système
expert ; - Résultat d'inférence / recommandation ; - Journal d'activité.

Les données appartenant à une entreprise doivent être associées à cette
entreprise, par exemple au moyen d'un identifiant `company_id`, et
protégées côté serveur. La sécurité ne doit pas reposer uniquement sur
le masquage d'éléments dans l'interface.

## 12. Modèle économique

### 12.1. Phase initiale

StageManager est gratuit pour les étudiants et les entreprises pendant
la phase initiale, notamment durant la réalisation et la soutenance du
mémoire. Aucun paiement n'est exigé dans cette première version.

### 12.2. Évolution envisagée après la soutenance

Le modèle envisagé : - étudiants : accès gratuit ; - entreprises :
abonnement payant ; - possibilité d'un abonnement mensuel et annuel.

Les tarifs, avantages des formules et l'intégration du paiement seront
étudiés après la soutenance. Aucun prix n'est fixé dans ce PRD.

## 13. Fonctionnalités exclues de la première version

-   Gestion des présences, absences et retards.
-   Reproduction complète de l'organigramme interne des entreprises.
-   Statistiques avancées propres à chaque entreprise.
-   Messagerie générale ou chat entre utilisateurs.
-   Plusieurs comptes d'employés par entreprise avec permissions
    distinctes.
-   Plusieurs comptes administrateurs.
-   Recrutement automatique sans décision humaine.
-   Affectation définitive sans validation de l'entreprise.
-   Chatbot comme composant central.
-   Paiement et facturation pendant la phase initiale.

## 14. Critères d'acceptation principaux

La première version sera fonctionnellement acceptable lorsque les
scénarios essentiels suivants pourront être exécutés :

1.  Un étudiant peut créer son compte, vérifier son adresse e-mail, se
    connecter et compléter son onboarding.
2.  Une entreprise peut soumettre une demande d'intégration et recevoir
    une décision de l'administrateur.
3.  Une entreprise approuvée peut activer son compte, se connecter et
    compléter son onboarding.
4.  L'administrateur peut accéder à son espace privé sans inscription
    publique.
5.  Chaque utilisateur est redirigé vers l'espace correspondant à son
    rôle.
6.  Un étudiant peut rendre son profil visible ou invisible et contrôler
    l'accès à ses informations privées.
7.  Une entreprise peut publier une offre et gérer les candidatures
    reçues.
8.  Un étudiant peut postuler à une offre et suivre le statut de sa
    candidature.
9.  Une entreprise peut organiser un entretien et informer le candidat.
10. Une entreprise peut renseigner les besoins de ses services.
11. Le système expert peut analyser un candidat sélectionné, appliquer
    des règles documentées et présenter une proposition expliquée.
12. L'entreprise peut valider la proposition ou choisir un autre
    service.
13. Le stage, les rapports, l'évaluation et l'attestation peuvent être
    suivis dans les espaces concernés.
14. L'administrateur peut superviser les comptes, les offres, les
    candidatures et le système expert.
15. Les opérations importantes sont traçables.
16. Une entreprise ne peut pas accéder aux données privées d'une autre
    entreprise.
17. Les interfaces principales sont utilisables sur ordinateur et
    téléphone.

## 15. Priorisation

### Priorité 1 --- Fonctionnalités fondamentales

-   Authentification et gestion des rôles.
-   Onboarding étudiant et entreprise.
-   Gestion des profils.
-   Gestion des entreprises et demandes d'intégration.
-   Publication des offres.
-   Candidatures et suivi du recrutement.
-   Services et besoins.
-   Système expert et validation humaine de l'affectation.

### Priorité 2 --- Suivi du stage

-   Gestion des stagiaires.
-   Superviseurs.
-   Missions et objectifs.
-   Rapports périodiques.
-   Évaluation finale.
-   Attestation de fin de stage.

### Priorité 3 --- Supervision et amélioration

-   Journal d'activité.
-   Notifications complètes.
-   Contrôles administrateur.
-   Améliorations d'ergonomie et de sécurité.

Cette priorisation guide l'ordre de réalisation ; elle ne modifie pas le
périmètre fonctionnel décrit dans le document.

## 16. Paramètres à finaliser pendant la conception détaillée

Les décisions fonctionnelles principales sont consolidées. Certains
paramètres nécessitent encore une définition précise pendant la
conception technique et la validation avec FINCA RDC :

-   règles exactes du système expert, critères, priorités et traitement
    des égalités ;
-   fréquence des rapports périodiques de stage ;
-   champs obligatoires détaillés de chaque formulaire ;
-   canaux et préférences détaillés des notifications ;
-   durées de conservation des données et procédure de suppression ;
-   modalités de vérification du QR code des attestations ;
-   outil de Vibe Coding retenu ;
-   modalités précises de déploiement et de sauvegarde.

Ces éléments ne remettent pas en cause les décisions déjà validées. Ils
devront être documentés avant ou pendant leur implémentation.

## 17. Conclusion

StageManager est une plateforme web multi-entreprises organisée autour
de trois espaces distincts : étudiant, entreprise et administrateur.

Son objectif ne se limite pas à la publication d'offres et à la gestion
des candidatures. Son apport principal dans le cadre du mémoire est
l'intégration d'un système expert d'aide à l'affectation des stagiaires
aux services appropriés. Ce système exploite une base de faits, une base
de règles, un moteur d'inférence et un module d'explication, tout en
laissant la décision finale à l'entreprise.

Le présent PRD consolide les décisions fonctionnelles et techniques
retenues pour la première version de StageManager. Il sert de référence
pour la conception détaillée, le Design Brief, la modélisation UML et la
réalisation de l'application.
