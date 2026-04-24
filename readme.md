# DigitalRunMarket — Backend

API REST + WebSocket du projet **MonAppli.re / DigitalRunMarket** : une marketplace mettant en relation des **producteurs** locaux et des **commerçants** (réassorts, précommandes, messagerie temps réel).

Stack : **Node.js 20+**, **TypeScript**, **Express**, **TypeORM**, **PostgreSQL**, **WebSocket (`ws`)**, **Zod**, **Argon2**, **JWT**, **Pino**, **Vitest**.

---

## Sommaire

- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d’environnement](#variables-denvironnement)
- [Base de données & migrations](#base-de-données--migrations)
- [Lancer le serveur](#lancer-le-serveur)
- [Seed de démo](#seed-de-démo)
- [Tests & qualité](#tests--qualité)
- [Structure du projet](#structure-du-projet)
- [Routes HTTP (v1)](#routes-http-v1)
- [Sécurité](#sécurité)

---

## Architecture

Le backend expose :

- une **API REST versionnée** sous le préfixe `/v1` (voir [Routes HTTP](#routes-http-v1)),
- un **WebSocket** de messagerie attaché au même serveur HTTP (cf. `src/modules/messaging/messaging.ws.ts`),
- un **modèle de données PostgreSQL** géré par TypeORM (entités + migrations versionnées).

Chaque domaine fonctionnel est isolé dans `src/modules/<domaine>/` (routes, contrôleurs, services, schémas Zod). Les entités TypeORM sont centralisées dans `src/entities/`, et les migrations dans `src/migrations/`.

## Prérequis

- **Node.js ≥ 20** (voir `engines` dans `package.json`)
- **npm** (livré avec Node)
- Une instance **PostgreSQL** accessible (locale ou distante)

## Installation

```bash
# depuis le dossier backend/
npm install
cp .env.example .env
# éditer .env (au minimum : DB_* et les deux secrets JWT ≥ 64 caractères)
```

> Les secrets `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` sont validés par Zod : **≥ 64 caractères** chacun, sinon le démarrage échoue.

## Variables d’environnement

Validées au démarrage par Zod (`src/config/env.ts`). Voir `.env.example` pour le gabarit complet.

| Variable | Obligatoire | Défaut | Description |
|---|---|---|---|
| `NODE_ENV` | non | `development` | `development` \| `test` \| `production` |
| `PORT` | non | `3000` | Port HTTP + WebSocket |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | oui | — | Connexion PostgreSQL |
| `DB_SYNC` | non | `false` | **Ne pas activer en prod.** `true` = `synchronize` TypeORM |
| `RUN_MIGRATIONS_ON_START` | non | — | `true`/`false` pour forcer. Si non défini : exécute les migrations au démarrage en `development` (tant que `DB_SYNC=false`) |
| `CORS_ORIGIN` | oui | — | Origine autorisée (ex. `http://localhost:5173`) |
| `JWT_ACCESS_SECRET` | oui | — | Secret signature access token (**≥ 64 car.**) |
| `JWT_REFRESH_SECRET` | oui | — | Secret signature refresh token (**≥ 64 car.**) |
| `JWT_ACCESS_EXPIRES` | non | `15m` | Durée de vie de l’access token |
| `JWT_REFRESH_EXPIRES` | non | `7d` | Durée de vie du refresh token |
| `INSEE_API_KEY` | non | — | Vérification SIRET (API INSEE) |
| `BREVO_API_KEY` | non | — | Envoi d’e-mails transactionnels |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | non | — | Stockage d’objets (images produits, etc.) |

## Base de données & migrations

Les migrations TypeORM sont dans `src/migrations/` et pilotées via `src/config/data-source.ts`.

```bash
# Appliquer toutes les migrations
npm run migration:run

# Revenir à la migration précédente
npm run migration:revert

# Générer une nouvelle migration depuis les diffs d'entités
npm run migration:generate src/migrations/NomDeLaMigration
```

> En `development`, les migrations sont appliquées automatiquement au démarrage du serveur (sauf si `DB_SYNC=true` ou `RUN_MIGRATIONS_ON_START=false`).

## Lancer le serveur

```bash
# Développement (hot reload via tsx)
npm run dev

# Build + exécution compilée
npm run build
npm start
```

Le serveur écoute sur `PORT` (défaut `3000`) et expose :

- REST : `http://localhost:3000/v1/…`
- Healthcheck : `GET /v1/health` → `{ "data": { "status": "ok" } }`
- WebSocket messagerie : sur le même port (voir module `messaging`)

## Seed de démo

```bash
npm run seed
```

- **Réservé à `NODE_ENV=development`** (le script force cette valeur via `cross-env`).
- **Vide toutes les tables** du schéma courant (`TRUNCATE … CASCADE`), **sauf `migrations`**, avant de re-créer les données de démo.
- Crée un **compte producteur** et un **compte commerçant** de démo, un **catalogue** (6 produits), des **lots de stock** et **3 précommandes** d’exemple.

Les identifiants et UUID des comptes seed sont décrits dans [`SEED-COMPTES.md`](./SEED-COMPTES.md).

## Tests & qualité

```bash
npm test          # Vitest (run unique)
npm run typecheck # tsc --noEmit
```

Configuration Vitest : `vitest.config.ts`. TypeScript en mode **strict** (`strict`, `noUnusedLocals`, `noUnusedParameters`, `strictNullChecks`, …).

## Structure du projet

```
backend/
├── src/
│   ├── app.ts                  # Création de l’app Express (helmet, cors, cookies, pino, router v1)
│   ├── index.ts                # Bootstrap : DataSource + migrations + HTTP + WebSocket
│   ├── config/                 # env (Zod), data-source TypeORM
│   ├── common/                 # utilitaires transverses
│   ├── lib/                    # logger Pino, intégrations
│   ├── middlewares/            # error-handler, auth, etc.
│   ├── entities/               # entités TypeORM (users, products, stocks, orders, messaging…)
│   ├── migrations/             # migrations SQL versionnées
│   ├── modules/
│   │   ├── auth/               # inscription, login, refresh, reset password
│   │   ├── users/              # profils utilisateurs
│   │   ├── public/             # endpoints publics (catalogue, fiches producteurs)
│   │   ├── products/           # CRUD produits (producteur)
│   │   ├── stocks/             # lots / disponibilités
│   │   ├── search/             # recherche catalogue
│   │   ├── orders/             # précommandes producteur ↔ commerçant
│   │   ├── conversations/      # fils de discussion
│   │   ├── messaging/          # messages + WebSocket temps réel
│   │   └── notifications/      # notifications in-app
│   ├── routes/v1-router.ts     # montage des sous-routeurs sous /v1
│   └── scripts/                # seed.ts + seed-data.ts
├── migrations/                 # dossier de sortie (placeholder)
├── workflows/                  # GitHub Actions composite action
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Routes HTTP (v1)

Toutes les routes sont préfixées par `/v1` (voir `src/routes/v1-router.ts`).

| Préfixe | Module | Description |
|---|---|---|
| `GET /v1/health` | — | Healthcheck |
| `/v1/public` | `public` | Endpoints non authentifiés (vitrine) |
| `/v1/auth` | `auth` | Inscription, connexion, refresh, mot de passe oublié |
| `/v1/users` | `users` | Profil de l’utilisateur courant |
| `/v1/products` | `products` | Catalogue côté producteur |
| `/v1/stocks` | `stocks` | Gestion des lots / disponibilités |
| `/v1/search` | `search` | Recherche catalogue |
| `/v1/orders` | `orders` | Précommandes producteur ↔ commerçant |
| `/v1/conversations` | `conversations` | Fils de discussion |
| `/v1/messaging` | `messaging` | Messages (REST + WS temps réel) |
| `/v1/notifications` | `notifications` | Notifications in-app |

Format de réponse uniforme :
- Succès : `{ "data": ... }`
- Erreur : gérée par `errorHandler` (`src/middlewares/error-handler.ts`)

## Sécurité

- **Helmet** pour les en-têtes HTTP, **CORS** restreint à `CORS_ORIGIN`, **cookies** via `cookie-parser`, limite JSON **1 Mo**.
- **Mots de passe** hachés avec **Argon2**.
- **Authentification JWT** (access + refresh) — secrets contraints à ≥ 64 caractères.
- **Validation des entrées** : Zod sur chaque endpoint.
- **Rate limiting** via `express-rate-limit` sur les endpoints sensibles.
- **Logs** structurés Pino (`pino-http`).

---

> Pour le frontend associé, voir le dépôt `frontend/` (Vite + React) à la racine du projet.
