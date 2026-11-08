# eStudyFlow — MVP

Application web de suivi des démarches étudiantes, des documents, des heures travaillées et des candidatures. Les comptes sont authentifiés par Firebase et leurs données sont enregistrées dans Firestore.

## Démarrer en local

Prérequis : Node.js 20 ou plus récent et Java 21 ou plus récent (requis par les émulateurs Firebase).

```bash
npm install
npm run dev:local
```

Ouvre ensuite [http://localhost:3003](http://localhost:3003). Firebase Authentication et Firestore tournent localement ; la console des émulateurs est disponible sur [http://localhost:4000](http://localhost:4000). Pour tester sur un téléphone connecté au même Wi-Fi, ouvre `http://<adresse-IP-de-l’ordinateur>:3003`. Les émulateurs écoutent sur le réseau local et le navigateur utilise automatiquement le même nom d’hôte pour les joindre. Les comptes et les données de cette instance sont de test, locaux et effacés lorsque les émulateurs s’arrêtent.

## Firebase en production

Le mode local utilise un identifiant de projet de démonstration et ne contacte pas le projet Firebase distant. En production, l’application utilise la configuration de [`firebase-applet-config.json`](./firebase-applet-config.json) : un administrateur doit activer **Anonymous** dans Firebase Authentication, publier [`firestore.rules`](./firestore.rules) et créer les documents `/admins/{uid}` nécessaires depuis un processus de confiance. Si le fournisseur **Email/Password** est activé, l’inscription accepte un nom d’utilisateur de 1 à 64 caractères et un mot de passe d’au moins 6 caractères ; le profil est créé automatiquement. Si Firebase refuse la connexion par mot de passe (fournisseur désactivé, identifiants invalides ou mot de passe trop faible), l’inscription et la connexion ouvrent automatiquement une session invitée et conservent le nom dans le profil, sans vérifier ni enregistrer le mot de passe. Dans ce cas, la session ne peut pas être récupérée après déconnexion ou sur un autre appareil. Le nom est transformé en identifiant interne Firebase ; aucune adresse email n’est demandée, donc la récupération du mot de passe n’est pas disponible.

Le bouton « Continuer avec Google » est un raccourci invité MVP et ne lance pas OAuth Google. Firebase crée un compte anonyme dont les données restent accessibles dans le navigateur où il a été créé ; elles ne peuvent pas être récupérées après une déconnexion ou sur un autre appareil. Lier cet invité à un compte récupérable nécessite une authentification réelle, non configurée pour ce parcours. Le fournisseur **Anonymous** doit donc rester activé même si les comptes par mot de passe ne le sont pas.

Les offres sont lues depuis la collection Firestore `jobs` ; aucune API d’offres n’est connectée. Cette collection doit être alimentée uniquement avec des offres vérifiées et des liens de candidature autorisés. Les actualités sont récupérées côté serveur depuis les pages officielles de Service-Public.fr et de l’Assurance Maladie, avec un cache de 30 minutes ; les vues Accueil et Actualités utilisent la même source. Les sources temporairement inaccessibles sont signalées dans l’interface.

Les dossiers et statuts, heures travaillées, préférences d’affichage des notifications, candidatures enregistrées, idées envoyées et conversations IA sont associés au compte authentifié. Les notifications push et la génération automatique des alertes ne sont pas encore configurées ; les rappels calendrier sont exportés sous forme de fichier `.ics`. L’application ne conserve pas les données Firestore hors ligne après fermeture/rechargement : seul le shell PWA est précaché. L’export est généré depuis les données Firestore ; la suppression de compte efface les sous-collections prises en charge et demande le mot de passe pour les comptes nom d’utilisateur (pas pour les comptes invités anonymes).

Les comptes par nom d’utilisateur n’ont pas d’adresse email de récupération. Le parcours invité est anonyme et irrécupérable après déconnexion ou changement d’appareil ; ces limites doivent être résolues avant un lancement public. La publication bêta nécessite également une politique de confidentialité et une information sur les traitements Firebase, les actualités récupérées et le fournisseur IA.

## Assistant IA (facultatif)

Ajoute une clé Gemini **côté serveur uniquement** dans `.env` :

```dotenv
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

Sans clé, l’assistant indique qu’il n’est pas configuré et ne fournit pas de réponse juridique de secours. Son endpoint exige un jeton Firebase valide et applique un quota en mémoire par compte.

## Vérification avant déploiement

1. Configurer Firebase Authentication (Anonymous requis ; Email/Password facultatif), les règles Firestore et les domaines autorisés dans Firebase Console.
2. Ajouter la clé Gemini au `.env` du serveur si eStudy AI doit être activé ; ne pas la préfixer avec `VITE_`.
3. Alimenter `jobs` avec des offres réelles et maintenir leurs dates et URL de candidature.
4. Choisir un stockage partagé du quota IA si plusieurs instances serveur sont déployées.
5. Configurer un domaine HTTPS et la politique de confidentialité avant d’ouvrir l’application à des utilisateurs externes.

En production, générer le client avec `npm run build`, puis démarrer le serveur API et les fichiers statiques avec `npm start`.

## Vérifications

```bash
npm run lint
npm run build
```

Le projet ne dispose pas encore d’une suite de tests automatisés.
