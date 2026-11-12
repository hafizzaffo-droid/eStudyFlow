# Guide de déploiement — eStudyFlow

Objectif : passer de la version locale (émulateurs, données temporaires) à une version en ligne avec une **vraie base de données Firebase**, des **offres d'emploi réelles**, l'**assistant IA fonctionnel** et un **site toujours accessible**.

> Coût estimé : **0 €** pour démarrer (plans gratuits Firebase Spark + Render).

---

## Avant de commencer

- [ ] Le projet est sur GitHub et à jour (le code local contient des corrections : `index.html`, `package.json`, etc. — il faut les pousser)
- [ ] Tu as un compte Google (pour Firebase et pour la clé Gemini)
- [ ] Tu as un compte GitHub (pour Render)
- [ ] Tu peux ouvrir un terminal et taper des commandes simples

**Règle d'or** : à chaque étape, on teste avant de passer à la suivante. Si quelque chose ne marche pas, on note le message d'erreur exact et on demande de l'aide (à un ami, ou à une IA en collant le message d'erreur).

---

## Phase 1 — Créer le projet Firebase (vraie base de données)

1. Va sur https://console.firebase.google.com et clique **"Créer un projet"** (Add project).
2. Donne un nom, par exemple `estudyflow-prod`. Désactive Google Analytics (pas nécessaire). Clique **Créer**.
3. Dans le menu de gauche, ouvre **Build → Authentication → Get started**.
4. Onglet **Sign-in method** : active **Anonymous** et **Email/Password**, puis **Enregistrer**.
5. Menu **Build → Firestore Database → Create database** : choisis le mode **"Start in production mode"** (les règles du projet sont déjà restrictives, c'est bon) et une région proche (ex. `europe-west1`).
6. Va dans **Project settings** (⚙️ en haut à gauche) → ta carte "Your apps" → clique l'icône Web `</>` pour ajouter une app web.
7. Copie la config affichée : `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.

**Check** : tu as une base Firestore vide et l'authentification configurée.

---

## Phase 2 — Connecter le code à la vraie base

1. À la racine du projet, ouvre `firebase-applet-config.json` (il contient actuellement des fausses valeurs de test).
2. Remplace le contenu par ta vraie config, en gardant la clé `firestoreDatabaseId` :

```json
{
  "apiKey": "TA_VRAIE_API_KEY",
  "authDomain": "TON_PROJET.firebaseapp.com",
  "projectId": "TON_PROJET",
  "storageBucket": "TON_PROJET.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc...",
  "firestoreDatabaseId": "(default)"
}
```

3. Déploie les règles de sécurité Firestore :

```bash
npm install -g firebase-tools   # si pas déjà installé
firebase login                  # ouvre le navigateur pour te connecter
firebase deploy --only firestore:rules --project TON_PROJET
```

4. Teste en conditions réelles (plus les émulateurs) :

```bash
npm install
npm run dev
```

5. Ouvre http://localhost:3000, crée un compte, remplis le profil. Vérifie dans la console Firebase → **Firestore Database** que les documents `users/{ton-id}/...` apparaissent.

**Check** : les données survivent à un rechargement de page et sont visibles dans la console Firebase. 🎉 C'est la vraie base.

> Astuce : `npm run dev:local` reste utile pour tester sans toucher aux vraies données (émulateurs), mais tout ce qui est créé là est effacé à l'arrêt.

---

## Phase 3 — Remplir les offres d'emploi

L'onglet "Trouver un emploi" lit la collection Firestore `jobs`, qui est vide par défaut.

### Méthode simple (console Firebase)

1. Console Firebase → **Firestore Database** → **Démarrer une collection** → nom : `jobs`.
2. Pour chaque offre, crée un document avec ces champs (tous en `string` sauf indication) :

| Champ | Exemple |
|---|---|
| `title` | "Vendeur·e polyvalent·e (alternance)" |
| `company` | "Monoprix Paris 15" |
| `city` | "Paris" |
| `contractType` | `alternance` (ou `job_etudiant`, `cdi`, `cdd`) |
| `workingHours` | "20h/semaine" |
| `salary` | "1 200 €/mois" |
| `date` | "2026-11-13" |
| `applyUrl` | "https://..." (lien réel de candidature) |
| `compatibilityTag` | `Compatible avec ton profil` |
| `compatibilityReason` | "Alternance accessible aux étudiants" |
| `sector` | "Commerce" |
| `remote` | "Sur site" |
| `description` | "Description courte de l'offre" |

3. Recommence pour 5–10 offres de départ (lien de candidature **réel**, jamais d'URL inventée).

> Amélioration future possible : un script qui importe automatiquement des offres depuis une API ou une source fiable. À voir après le lancement.

**Check** : les offres apparaissent dans l'onglet Emploi de l'app.

---

## Phase 4 — Activer l'assistant IA (eStudy AI)

1. Va sur https://aistudio.google.com → **Get API key** → crée une clé.
2. Ajoute un fichier `.env` à la racine du projet :

```env
GEMINI_API_KEY=ta_cle_ici
GEMINI_MODEL=gemini-2.5-flash
```

3. Redémarre `npm run dev` et teste l'onglet eStudy AI.

**Check** : l'assistant répond et cite des sources officielles.

---

## Phase 5 — Mettre l'app en ligne (toujours accessible)

On utilise **Render** (plan gratuit, se connecte directement à GitHub).

1. Pousse le projet à jour sur GitHub (`git add`, `git commit`, `git push`).
2. Crée un compte sur https://render.com avec le bouton **"Sign up with GitHub"**.
3. **New → Web Service** → sélectionne le repo `eStudyFlow`.
4. Réglages :
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
   - **Plan** : Free
5. **Environment Variables** (onglet Environment) :
   - `GEMINI_API_KEY` = ta clé
   - `GEMINI_MODEL` = `gemini-2.5-flash`
   - `NODE_VERSION` = `22`
6. Clique **Create Web Service**. Le premier déploiement prend ~5 min.
7. Tu obtiens une URL du type `https://estudyflow.onrender.com`.

**Check** : ouvre l'URL → landing page, login, profil, tâches, actualités, IA : tout fonctionne en ligne. Les données vont dans ta vraie Firestore.

> ⚠️ Le plan gratuit Render **endort le site** après ~15 min sans visite : le premier chargement peut prendre ~30–60 s. C'est normal à ce stade. Si ça devient un problème, l'upgrade payant (~7 $/mois) ou un autre hébergeur (Railway, Fly.io) règle ça.

---

## Phase 6 — Après le lancement

- [ ] **Domaine** (optionnel) : acheter un nom de domaine (~10 €/an) et le brancher sur Render, ou utiliser gratuitement `estudyflow.web.app` via Firebase Hosting pour le front.
- [ ] **Politique de confidentialité** : obligatoire avant d'ouvrir aux utilisateurs — page simple décrivant les données Firebase, les actualités récupérées et l'usage de Gemini.
- [ ] **Offres d'emploi** : prévoir une mise à jour régulière (hebdomadaire) des offres dans `jobs`.
- [ ] **Sécurité** : ne jamais committer `.env` ni de vraies clés ; vérifier que `firestore.rules` reste déployé.
- [ ] **Tests** : `npm run lint` (TypeScript) et `npm run build` avant chaque push.

---

## Commandes utiles (à garder sous la main)

```bash
npm install          # installer les dépendances
npm run dev          # dev avec la VRAIE base Firebase
npm run dev:local    # dev avec émulateurs (données jetables)
npm run lint         # vérifier le code
npm run build        # build de production
npm start            # servir la version buildée (comme en prod)
firebase deploy --only firestore:rules   # déployer les règles
```

## Glossaire rapide

- **Firebase** : la base de données + l'authentification (gratuit pour démarrer)
- **Firestore** : la base de données où vivent profils, tâches, offres, messages IA
- **Render** : l'hébergeur qui fait tourner le site en ligne
- **Gemini** : l'IA de Google qui répond aux questions des étudiants
- **Émulateurs** : faux Firebase en local pour tester sans risque

## Répartition des rôles

- **Toi (ou la personne technique)** : phases 1, 2 et 5 — création des comptes, clés, déploiement, pushing sur GitHub.
- **Ton cousin + IA** : phases 3 et 4 (remplir les offres, tester l'IA), puis maintenance (ajouter des offres, corriger des bugs avec l'aide de l'IA en collant les erreurs).
