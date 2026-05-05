# Comptes de démonstration (seed)

## Sécurité et comportement

- **`npm run seed`** n'est autorisé qu'avec **`NODE_ENV=development`** (le script npm force cette valeur via `cross-env`). En `production` ou `test`, le processus s'arrête sans toucher à la base.
- À chaque exécution, **toutes les tables du schéma PostgreSQL courant sont vidées** (`TRUNCATE … CASCADE`, identités réinitialisées), **sauf** la table **`migrations`** (historique TypeORM conservé). Toute donnée non seed est donc **définitivement supprimée**.

Ces comptes sont recréés par `npm run seed` dans le dossier `backend/`, avec les producteurs factices (`*@seed.monappli.re`).

**Mot de passe commun** (tous les comptes seed, y compris admins, producteurs « catalogue », pending, suspendu) :

| Champ | Valeur |
|--------|--------|
| Mot de passe | `SeedMonAppli2026!` |

---

## 1. Admins

Indispensables pour ouvrir le back-office, surtout pendant la phase de pré-lancement (`APP_ACCESS_OPEN=false`) où seuls les admins peuvent se connecter.

| Rôle | UUID | E-mail (connexion) | Statut |
|------|------|-------------------|--------|
| Admin principal | `a0000001-0000-4000-8000-0000000000a1` | `admin@seed.monappli.re` | `active` |
| Admin secondaire (test audit) | `a0000001-0000-4000-8000-0000000000a2` | `admin-test@seed.monappli.re` | `active` |

---

## 2. Producteur démo

| Champ | Valeur |
|--------|--------|
| **ID utilisateur (UUID)** | `a0000001-0000-4000-8000-000000000001` |
| **ID profil producteur (UUID)** | `b0000001-0000-4000-8000-000000000001` |
| E-mail (connexion) | `demo-producteur@seed.monappli.re` |
| Mot de passe | `SeedMonAppli2026!` |
| Rôle | `producer` |
| Statut | `active` |

Catalogue de démo (6 produits), stocks et 3 précommandes entre le commerçant et ce producteur (1 acceptée, 2 en attente).

---

## 3. Commerçant démo

| Champ | Valeur |
|--------|--------|
| **ID utilisateur (UUID)** | `a0000001-0000-4000-8000-000000000002` |
| E-mail (connexion) | `demo-commercant@seed.monappli.re` |
| Mot de passe | `SeedMonAppli2026!` |
| Rôle | `buyer` |
| Statut | `active` |

---

## 4. Comptes pour tester les flux d'administration

| But | UUID | E-mail | Rôle | Statut |
|-----|------|--------|------|--------|
| Approbation producteur | `a0000001-0000-4000-8000-0000000000b1` | `attente-producteur@seed.monappli.re` | `producer` | `pending_admin` |
| Approbation commerçant | `a0000001-0000-4000-8000-0000000000b2` | `attente-commercant@seed.monappli.re` | `buyer` | `pending_admin` |
| Réactivation | `a0000001-0000-4000-8000-0000000000b3` | `suspendu-producteur@seed.monappli.re` | `producer` | `suspended` |

Les comptes `pending_admin` n'ont pas accès à la plateforme tant qu'un admin ne les approuve pas depuis `/admin/users/pending`.

---

## 5. Pré-inscriptions de seed (5 statuts)

| ID | E-mail | Rôle | Statut |
|----|--------|------|--------|
| `d0000001-0000-4000-8000-000000000001` | `attente-email@seed.monappli.re` | `producer` | `pending_email` |
| `d0000001-0000-4000-8000-000000000002` | `a-revoir@seed.monappli.re` | `buyer` | `pending_review` |
| `d0000001-0000-4000-8000-000000000003` | `contacte@seed.monappli.re` | `producer` | `contacted` |
| `d0000001-0000-4000-8000-000000000004` | `invite@seed.monappli.re` | `buyer` | `invited` |
| `d0000001-0000-4000-8000-000000000005` | `refuse@seed.monappli.re` | `undecided` | `rejected` |

La pré-inscription `invited` a un token connu pour faciliter le test manuel : `seed-invite-d0000001-0000-4000-8000-000000000004`.
Le lien d'invitation correspondant : `${PUBLIC_APP_URL}/inscription?token=seed-invite-d0000001-0000-4000-8000-000000000004`.

---

## 6. Signalements de seed

| ID | Catégorie | Statut | Cible |
|----|-----------|--------|-------|
| `c0000003-0000-4000-8000-000000000001` | `fake_profile` | `open` | Producteur démo |
| `c0000003-0000-4000-8000-000000000002` | `inappropriate_content` | `reviewed` | Message de la conversation démo |
| `c0000003-0000-4000-8000-000000000003` | `scam` | `resolved` | Producteur démo |

Reporter : commerçant démo. Le signalement résolu a une `adminNotes` remplie pour visualisation.

---

## 7. Journal d'actions admin

Le seed crée 3 entrées dans `admin_audit_logs` (action `seed.bootstrap`, `user.approve` sur le commerçant démo, `report.resolve` sur le signalement résolu) afin que la page « Journal d'actions » du back-office ne soit pas vide à la première ouverture.

---

Après un nouveau seed, la base a été entièrement vidée puis rechargée : les **UUID des comptes ci-dessus restent les mêmes** (fixes dans le code).
