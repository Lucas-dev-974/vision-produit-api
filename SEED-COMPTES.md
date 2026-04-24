# Comptes de démonstration (seed)

## Sécurité et comportement

- **`npm run seed`** n’est autorisé qu’avec **`NODE_ENV=development`** (le script npm force cette valeur via `cross-env`). En `production` ou `test`, le processus s’arrête sans toucher à la base.
- À chaque exécution, **toutes les tables du schéma PostgreSQL courant sont vidées** (`TRUNCATE … CASCADE`, identités réinitialisées), **sauf** la table **`migrations`** (historique TypeORM conservé). Toute donnée non seed est donc **définitivement supprimée**.

Ces comptes sont recréés par `npm run seed` dans le dossier `backend/`, avec les producteurs factices (`*@seed.monappli.re`).

**Mot de passe commun** (tous les comptes seed, y compris les 6 producteurs « catalogue ») :

| Champ | Valeur |
|--------|--------|
| Mot de passe | `SeedMonAppli2026!` |

---

## 1. Producteur (démo)

| Champ | Valeur |
|--------|--------|
| **ID utilisateur (UUID)** | `a0000001-0000-4000-8000-000000000001` |
| **ID profil producteur (UUID)** | `b0000001-0000-4000-8000-000000000001` |
| E-mail (connexion) | `demo-producteur@seed.monappli.re` |
| Mot de passe | `SeedMonAppli2026!` |
| Rôle | `producer` |
| Statut | `active` (prêt à se connecter) |

Un **catalogue de démo** (6 produits : légumes, fruits, œufs, miel, volaille) est créé pour ce producteur ; voir `src/scripts/seed-data.ts` (`SEED_DEMO_PRODUCTS`).

**Stocks et commandes démo** : le seed crée aussi des **lots** (`SEED_DEMO_STOCKS`) et **3 précommandes** entre le commerçant et le producteur démo (`SEED_DEMO_ORDERS`) : 2 en attente, 1 acceptée (les quantités d’œufs en stock sont ajustées en conséquence).

---

## 2. Commerçant (démo)

| Champ | Valeur |
|--------|--------|
| **ID utilisateur (UUID)** | `a0000001-0000-4000-8000-000000000002` |
| E-mail (connexion) | `demo-commercant@seed.monappli.re` |
| Mot de passe | `SeedMonAppli2026!` |
| Rôle | `buyer` |
| Statut | `active` (prêt à se connecter) |

---

Après un nouveau seed, la base a été entièrement vidée puis rechargée : les **UUID des comptes démo ci-dessus restent les mêmes** (fixes dans le code).
