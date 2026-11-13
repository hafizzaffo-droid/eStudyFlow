# Guide de mise en production — eStudyFlow

Ce document t'est destiné. Je t'explique étape par étape comment passer l'application de la version de test locale à une vraie version en ligne, avec une vraie base de données, des offres d'emploi, l'assistant IA et un site accessible partout.

**Lis d'abord ceci :**

- Tu n'as pas besoin de savoir coder. Quand une étape demande de modifier du code, je te donne **le texte exact à copier-coller à ton IA** (ChatGPT, Claude, etc.).
- Si une étape bloque, **ne force pas** : envoie-moi le message d'erreur exact (copie-colle) et on regarde ensemble.
- Fais les étapes dans l'ordre et valide le « check » avant de passer à la suivante.
- Ne partage jamais de clé ou de mot de passe en clair dans un message ou un commit.

**Coût : 0 € pour démarrer** (Firebase Spark + Render gratuits).

---

## Étape 0 — Récupérer le projet à jour

Sur ton ordinateur :

```bash
git clone https://github.com/hafizzaffo-droid/eStudyFlow.git
cd eStudyFlow
npm install
```

**Check** : `npm install` se termine sans erreur rouge.

---

## Étape 1 — Créer le projet Firebase (la vraie base de données)

1. Va sur https://console.firebase.google.com avec ton compte Google et clique **« Créer un projet »**.
2. Nom suggéré : `estudyflow-prod`. Décoche Google Analytics. Clique **Créer**.
3. Menu de gauche → **Build → Authentication → Get started**.
4. Onglet **Sign-in method** : active **Anonymous** puis **Email/Password**, clique **Enregistrer**.
5. Menu **Build → Firestore Database → Create database** → choisis **« Start in production mode »** et la région `europe-west1` (ou la plus proche).
6. Clique l'icône ⚙️ **Project settings** en haut à gauche → descends à **« Your apps »** → clique l'icône Web `</>`.
7. Enregistre l'app (nom : `web`), puis **copie la config** affichée : `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.

**Check** : tu as un projet Firebase avec Auth configuré et une base Firestore vide.

---

## Étape 2 — Brancher le code sur la vraie base

### 2a. Remplacer la config

Ouvre le fichier `firebase-applet-config.json` à la racine du projet et remplace tout le contenu par ta vraie config (les valeurs de l'étape 1), **en gardant la dernière ligne** `"firestoreDatabaseId": "(default)"` :

```json
{
  "apiKey": "TA_VRAIE_API_KEY",
  "authDomain": "TON_PROJET.firebaseapp.com",
  "projectId": "TON_PROJET",
  "storageBucket": "TON_PROJET.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:ton_app_id",
  "firestoreDatabaseId": "(default)"
}
```

### 2b. Déployer les règles de sécurité

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules --project TON_PROJET
```

(`TON_PROJET` = ton `projectId`, sans les guillemets.)

### 2c. Tester avec les vraies données

```bash
npm run dev
```

Ouvre http://localhost:3000, crée un compte, remplis ton profil, recharge la page.

Puis vérifie dans la console Firebase → **Firestore Database** : tu dois voir les documents `users/...` se créer.

**Check** : les données survivent au rechargement et sont visibles dans Firebase. C'est la vraie base. ✅

> `npm run dev:local` existe toujours pour tester sans toucher aux vraies données (émulateurs, tout est effacé à l'arrêt).

---

## Étape 3 — Remplir les offres d'emploi

L'onglet « Trouver un emploi » lit la collection `jobs` de Firestore, vide au départ. Il faut y ajouter de **vraies offres** (jamais de lien de candidature inventé).

1. Console Firebase → **Firestore Database** → **Démarrer une collection** → ID de collection : `jobs`.
2. Pour chaque offre, crée un document et remplis ces champs (tous en type `string`) :

| Champ | Exemple de valeur |
|---|---|
| `title` | `Vendeur·e polyvalent·e (alternance)` |
| `company` | `Monoprix Paris 15` |
| `city` | `Paris` |
| `contractType` | `alternance` (choix : `job_etudiant`, `alternance`, `cdi`, `cdd`) |
| `workingHours` | `20h/semaine` |
| `salary` | `1 200 €/mois` |
| `date` | `2026-11-13` |
| `applyUrl` | `https://lien-reel-de-candidature.com/...` |
| `compatibilityTag` | `Compatible avec ton profil` |
| `compatibilityReason` | `Alternance accessible aux étudiants` |
| `sector` | `Commerce` |
| `remote` | `Sur site` |
| `description` | `Description courte de l'offre` |

3. Ajoute 5 à 10 offres pour commencer.

**Check** : les offres apparaissent dans l'onglet Emploi de l'app.

---

## Étape 4 — Activer l'assistant IA (eStudy AI)

1. Va sur https://aistudio.google.com → **Get API key** → **Create API key**.
2. Crée un fichier `.env` à la racine du projet (à côté de `package.json`) avec :

```env
GEMINI_API_KEY=ta_cle_ici
GEMINI_MODEL=gemini-2.5-flash
```

3. Redémarre `npm run dev` et teste l'onglet eStudy AI.

**Check** : l'assistant répond à une question et cite des sources officielles.

---

## Étape 5 — Mettre le site en ligne (Render, gratuit)

1. Envoie le projet sur GitHub :

```bash
git add -A
git commit -m "Configuration production"
git push
```

2. Va sur https://render.com → **Sign up with GitHub** → autorise l'accès à tes repos.
3. Clique **New → Web Service** → choisis le repo `eStudyFlow`.
4. Réglages :
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
   - **Plan** : Free
5. Onglet **Environment** → ajoute :
   - `GEMINI_API_KEY` = ta clé
   - `GEMINI_MODEL` = `gemini-2.5-flash`
   - `NODE_VERSION` = `22`
6. Clique **Create Web Service**. Premier déploiement : ~5 min.
7. Tu obtiens une URL `https://estudyflow-xxx.onrender.com`.

**Check** : ouvre l'URL → landing page, création de compte, profil, tâches, actualités, IA : tout marche en ligne.

> ⚠️ Le plan gratuit Render endort le site après ~15 min sans visite : le premier chargement peut prendre ~1 min. C'est normal.

---

## Étape 6 — Après le lancement

- [ ] **Offres** : mets à jour la collection `jobs` régulièrement (au moins hebdomadaire).
- [ ] **Politique de confidentialité** : à rédiger avant d'ouvrir aux utilisateurs (données Firebase, actualités scrapées, usage de Gemini).
- [ ] **Domaine** (optionnel) : un nom de domaine ~10 €/an, ou `estudyflow.web.app` via Firebase Hosting.
- [ ] **Sécurité** : ne jamais committer `.env` ni de vraies clés ; garder `firestore.rules` déployé.
- [ ] **Avant chaque push** : `npm run lint` et `npm run build` doivent passer sans erreur.

---

## Commandes utiles

```bash
npm install                 # installer les dépendances
npm run dev                 # dev avec la VRAIE base Firebase
npm run dev:local           # dev avec émulateurs (données jetables)
npm run lint                # vérifier le code
npm run build               # build de production
npm start                   # servir la version buildée (comme en prod)
firebase deploy --only firestore:rules   # déployer les règles
```

## Si tu bloques

1. Copie le **message d'erreur exact** (tout ce qui est rouge dans le terminal).
2. Envoie-le avec : la commande que tu as tapée + à quelle étape tu es.
3. Pour un problème de code, demande à ton IA : *« Voici le message d'erreur [colle l'erreur] dans le projet eStudyFlow, étape [X] du guide. Comment le corriger ? »*

## Glossaire

- **Firebase** : base de données + authentification (gratuit pour démarrer)
- **Firestore** : la base où vivent profils, tâches, offres, messages IA
- **Render** : l'hébergeur qui fait tourner le site en ligne
- **Gemini** : l'IA de Google derrière eStudy AI
- **Émulateurs** : faux Firebase en local, pour tester sans risque
