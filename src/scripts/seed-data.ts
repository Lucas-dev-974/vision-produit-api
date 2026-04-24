/**
 * Données de démonstration (La Réunion). E-mails : *@seed.monappli.re
 * Identifiants des comptes principaux : voir `SEED-COMPTES.md` à la racine de `backend/`.
 */

/** Mot de passe commun à tous les comptes créés par le seed (@seed.monappli.re). */
export const SEED_SHARED_PASSWORD = 'SeedMonAppli2026!';

/** Producteur de démo : UUID fixes pour documentation et tests. */
export const SEED_DEMO_PRODUCER = {
  id: 'a0000001-0000-4000-8000-000000000001',
  profileId: 'b0000001-0000-4000-8000-000000000001',
  email: 'demo-producteur@seed.monappli.re',
  siret: '98403748900991',
  companyName: 'Démo — Maraîcher du Barachois',
  nafCode: '01.13Z',
  description: 'Compte de démonstration producteur (script seed).',
  city: 'Saint-Denis',
  postalCode: '97400',
  addressLine: 'Adresse de démonstration',
  phone: '+262692009901',
  locationLat: -20.8789,
  locationLng: 55.4481,
  publicLat: -20.881,
  publicLng: 55.451,
  averageRating: 4.5,
  totalRatings: 5,
  reliabilityScore: 95,
  totalOrders: 10,
} as const;

/**
 * Produits du producteur démo (plusieurs catégories du périmètre métier).
 * Liés à `SEED_DEMO_PRODUCER.id`.
 */
export const SEED_DEMO_PRODUCTS = [
  {
    id: 'c0000001-0000-4000-8000-000000000001',
    name: 'Chou pak choï',
    category: 'vegetables' as const,
    description: 'Botte fraîche, récolte du matin. Idéal wok et soupes.',
  },
  {
    id: 'c0000001-0000-4000-8000-000000000002',
    name: 'Tomates cerises multicolores',
    category: 'vegetables' as const,
    description: 'Mélange jaune, rouge et noir, goût sucré, barquettes de 500 g.',
  },
  {
    id: 'c0000001-0000-4000-8000-000000000003',
    name: 'Letchis de montagne',
    category: 'fruits' as const,
    description: 'Saison décembre–janvier, calibre moyen, cueillette à maturité.',
  },
  {
    id: 'c0000001-0000-4000-8000-000000000004',
    name: 'Œufs fermiers plein air',
    category: 'eggs' as const,
    description: 'Boîtes de 6 ou 12, poules élevées sous ombrière, date de ponte indiquée.',
  },
  {
    id: 'c0000001-0000-4000-8000-000000000005',
    name: 'Miel de tamarin',
    category: 'honey' as const,
    description: 'Pot 500 g, cristallisation naturelle, récolte locale.',
  },
  {
    id: 'c0000001-0000-4000-8000-000000000006',
    name: 'Poulets fermiers entiers',
    category: 'poultry' as const,
    description:
      "Poids 1,6 \u00e0 2 kg, commande 48 h \u00e0 l'avance, d\u00e9coupe possible sur demande.",
  },
] as const;

/**
 * Lots de stock démo (producteur démo). Les dates `available_from` / `expires_at`
 * sont calculées dans `seed.ts` pour rester valides dans le temps.
 */
export const SEED_DEMO_STOCKS = [
  {
    id: 'e0000001-0000-4000-8000-000000000001',
    productId: 'c0000001-0000-4000-8000-000000000001',
    quantity: '50.00',
    unit: 'kg' as const,
    unitPrice: '3.50',
  },
  {
    id: 'e0000001-0000-4000-8000-000000000002',
    productId: 'c0000001-0000-4000-8000-000000000002',
    quantity: '25.00',
    unit: 'kg' as const,
    unitPrice: '4.20',
  },
  {
    id: 'e0000001-0000-4000-8000-000000000003',
    productId: 'c0000001-0000-4000-8000-000000000004',
    quantity: '120.00',
    unit: 'unit' as const,
    unitPrice: '0.35',
  },
  {
    id: 'e0000001-0000-4000-8000-000000000004',
    productId: 'c0000001-0000-4000-8000-000000000005',
    quantity: '48.00',
    unit: 'unit' as const,
    unitPrice: '8.90',
  },
] as const;

/** Précommandes démo entre commerçant et producteur démo (UUID fixes). */
export const SEED_DEMO_ORDERS = [
  {
    id: 'f0000001-0000-4000-8000-000000000001',
    status: 'pending' as const,
    retrievalOffsetDays: 5,
    retrievalTimeSlot: '08:00-12:00',
    note: 'Commande démo — préparation matinale si possible.',
    items: [
      {
        id: 'f1000001-0000-4000-8000-000000000001',
        productId: 'c0000001-0000-4000-8000-000000000001',
        quantity: '3.00',
        unit: 'kg' as const,
        unitPriceSnapshot: '3.50',
      },
      {
        id: 'f1000001-0000-4000-8000-000000000002',
        productId: 'c0000001-0000-4000-8000-000000000002',
        quantity: '2.00',
        unit: 'kg' as const,
        unitPriceSnapshot: '4.20',
      },
    ],
  },
  {
    id: 'f0000001-0000-4000-8000-000000000002',
    status: 'accepted' as const,
    retrievalOffsetDays: 10,
    retrievalTimeSlot: null as string | null,
    note: null as string | null,
    items: [
      {
        id: 'f1000001-0000-4000-8000-000000000003',
        productId: 'c0000001-0000-4000-8000-000000000004',
        quantity: '12.00',
        unit: 'unit' as const,
        unitPriceSnapshot: '0.35',
      },
    ],
  },
  {
    id: 'f0000001-0000-4000-8000-000000000003',
    status: 'pending' as const,
    retrievalOffsetDays: 7,
    retrievalTimeSlot: '14:00-18:00',
    note: 'Pots de miel pour la carte desserts.',
    items: [
      {
        id: 'f1000001-0000-4000-8000-000000000004',
        productId: 'c0000001-0000-4000-8000-000000000005',
        quantity: '2.00',
        unit: 'unit' as const,
        unitPriceSnapshot: '8.90',
      },
    ],
  },
] as const;

/** Conversation démo acheteur ↔ producteur démo (messagerie). */
export const SEED_DEMO_CONVERSATION = {
  id: 'f0000001-0000-4000-8000-000000000001',
} as const;

export const SEED_DEMO_MESSAGES = [
  {
    id: 'f0000002-0000-4000-8000-000000000001',
    sender: 'buyer' as const,
    content: 'Bonjour, question sur le stock chou pak choï : disponible mardi ?',
  },
  {
    id: 'f0000002-0000-4000-8000-000000000002',
    sender: 'producer' as const,
    content: 'Bonjour, oui — récolte lundi soir, retrait mardi matin possible.',
  },
] as const;

/** Commerçant (acheteur) de démo : UUID fixe pour documentation et tests. */
export const SEED_DEMO_BUYER = {
  id: 'a0000001-0000-4000-8000-000000000002',
  email: 'demo-commercant@seed.monappli.re',
  siret: '98403748900992',
  companyName: 'Démo — Restaurant Le Kalban',
  nafCode: '56.10A',
  description: 'Compte de démonstration commerçant (script seed).',
  city: 'Saint-Denis',
  postalCode: '97400',
  addressLine: 'Adresse de démonstration',
  phone: '+262692009902',
  locationLat: -20.891,
  locationLng: 55.461,
} as const;

export interface SeedProducerRow {
  email: string;
  siret: string;
  companyName: string;
  nafCode: string;
  description: string;
  city: string;
  postalCode: string;
  addressLine: string;
  phone: string;
  locationLat: number;
  locationLng: number;
  publicLat: number;
  publicLng: number;
  averageRating: number;
  totalRatings: number;
  reliabilityScore: number;
  totalOrders: number;
}

export const SEED_PRODUCERS: SeedProducerRow[] = [
  {
    email: 'contact@ferme-des-hauts.seed.monappli.re',
    siret: '98403748900012',
    companyName: 'Ferme des Hauts — Légumes bio',
    nafCode: '01.13Z',
    description:
      'Légumes de saison, salades et herbes aromatiques. Culture raisonnée à Saint-Paul.',
    city: 'Saint-Paul',
    postalCode: '97460',
    addressLine: 'Chemin isolé (non affiché publiquement)',
    phone: '+262692000101',
    locationLat: -21.0096,
    locationLng: 55.2694,
    publicLat: -21.012,
    publicLng: 55.272,
    averageRating: 4.7,
    totalRatings: 23,
    reliabilityScore: 96.5,
    totalOrders: 41,
  },
  {
    email: 'commandes@vergers-plaine.seed.monappli.re',
    siret: '98403748900013',
    companyName: 'Vergers de la Plaine',
    nafCode: '01.24Z',
    description: 'Fruits tropicaux : letchis, mangues, ananas Victoria. Récolte au fil des saisons.',
    city: 'Saint-Pierre',
    postalCode: '97410',
    addressLine: 'Quartier agricole',
    phone: '+262692000102',
    locationLat: -21.3393,
    locationLng: 55.4781,
    publicLat: -21.341,
    publicLng: 55.476,
    averageRating: 4.5,
    totalRatings: 18,
    reliabilityScore: 94.0,
    totalOrders: 32,
  },
  {
    email: 'oeufs@ferme-tamarin.seed.monappli.re',
    siret: '98403748900014',
    companyName: 'Œufs fermiers Tamarin',
    nafCode: '01.47Z',
    description: 'Poules en plein air, œufs frais quotidiens pour restaurants et primeurs.',
    city: 'Tamarin',
    postalCode: '97425',
    addressLine: 'Exploitation familiale',
    phone: '+262692000103',
    locationLat: -21.3456,
    locationLng: 55.4529,
    publicLat: -21.348,
    publicLng: 55.455,
    averageRating: 4.9,
    totalRatings: 31,
    reliabilityScore: 98.2,
    totalOrders: 55,
  },
  {
    email: 'miel@ruche-creole.seed.monappli.re',
    siret: '98403748900015',
    companyName: 'Ruche créole — Miel & pollen',
    nafCode: '01.49Z',
    description: 'Miels de montagne et de tamarin, potions en petites séries pour épiceries fines.',
    city: 'Salazie',
    postalCode: '97433',
    addressLine: 'Hauts de l’île',
    phone: '+262692000104',
    locationLat: -21.0298,
    locationLng: 55.5398,
    publicLat: -21.027,
    publicLng: 55.542,
    averageRating: 4.8,
    totalRatings: 12,
    reliabilityScore: 100,
    totalOrders: 19,
  },
  {
    email: 'poisson@peche-cote.seed.monappli.re',
    siret: '98403748900016',
    companyName: 'Pêche côte Ouest',
    nafCode: '03.11Z',
    description: 'Poissons pélagiques et lagoonaires, débarquement du matin pour restaurateurs.',
    city: 'Le Port',
    postalCode: '97420',
    addressLine: 'Zone portuaire',
    phone: '+262692000105',
    locationLat: -20.9393,
    locationLng: 55.2917,
    publicLat: -20.941,
    publicLng: 55.289,
    averageRating: 4.4,
    totalRatings: 27,
    reliabilityScore: 91.0,
    totalOrders: 48,
  },
  {
    email: 'volailles@elevage-3000.seed.monappli.re',
    siret: '98403748900017',
    companyName: 'Volailles altitude 3000',
    nafCode: '01.47Z',
    description: 'Poulets et pintades label rouge, commandes groupées pour la zone Est.',
    city: 'Le Tampon',
    postalCode: '97430',
    addressLine: 'Les Hauts',
    phone: '+262692000106',
    locationLat: -21.2833,
    locationLng: 55.5167,
    publicLat: -21.281,
    publicLng: 55.514,
    averageRating: 4.6,
    totalRatings: 15,
    reliabilityScore: 93.5,
    totalOrders: 28,
  },
];
