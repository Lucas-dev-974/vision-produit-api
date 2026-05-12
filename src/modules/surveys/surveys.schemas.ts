import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().max(max);
const optionalTrimmed = (max: number) =>
  trimmed(max).optional().or(z.literal(''));

const enumOption = <T extends [string, ...string[]]>(values: T) =>
  z.enum(values).optional().or(z.literal(''));

const GEO_ZONE_CODES = ['north', 'south', 'east', 'west', 'all'] as const;

/** Plusieurs zones ; si `all` est présent, il doit être seul. */
const zoneBodySchema = z
  .array(z.enum(GEO_ZONE_CODES))
  .max(5)
  .optional()
  .refine(
    (arr) =>
      !arr ||
      arr.length === 0 ||
      !arr.includes('all') ||
      arr.length === 1,
    {
      message:
        'Si « toute La Réunion » est sélectionné, aucune autre zone ne doit l’être.',
    },
  )
  .refine((arr) => !arr || arr.length === new Set(arr).size, {
    message: 'Zones en double.',
  });

/** Liste de codes (cases à cocher). On limite à 20 entrées de 60 char max. */
const optionList = z.array(trimmed(60)).max(20).optional();

/**
 * Toutes les réponses du questionnaire. On les laisse optionnelles côté
 * validation pour ne pas bloquer l'envoi si une question évolue, mais le
 * frontend fournit normalement chaque clé.
 */
export const surveyAnswersSchema = z
  .object({
    // Section : Stocks & ventes
    sellOutInTime: enumOption(['always', 'often', 'sometimes', 'rarely', 'never']),
    lossPercentage: enumOption(['none', 'lt10', '10_25', 'gt25']),
    newStockFrequency: enumOption(['daily', 'weekly', 'monthly', 'seasonal']),
    pricing: enumOption(['mercuriale', 'case_by_case', 'fixed', 'negotiated']),
    refusedOrderForLackOfVisibility: enumOption(['yes', 'no']),

    // Section : Relation commerciale
    hasContactList: enumOption(['yes', 'no', 'partial']),
    regularClientsCount: enumOption(['lt5', '5_15', '15_50', 'plus50']),
    newClientAcquisition: optionList,
    newStockMessageBroadcast: enumOption(['all', 'selective', 'no']),
    tools: optionList,
    paymentDelay: enumOption(['immediate', '7d', '30d', '60d', 'plus60d']),
    hasUnpaid: enumOption(['yes', 'no']),
    expandZone: enumOption(['yes', 'no', 'maybe']),

    // Section : Gestion & visibilité
    invoiceManagement: enumOption(['paper', 'excel', 'dedicated_software', 'external_accountant']),
    invoiceSoftware: enumOption(['none', 'excel', 'sage_ebp', 'other']),
    onlineVisibility: optionList,
    platformReferencing: optionList,
    invoiceTimeOver2h: enumOption(['yes', 'no']),

    // Section : Pain points & solution
    biggestPainPoint: optionalTrimmed(2000),
    platformInterest: enumOption(['yes', 'maybe', 'no']),
    paymentWillingness: enumOption([
      'free',
      'lt10',
      '10_30',
      '30_50',
      'plus50',
      'commission',
    ]),
  })
  .strict();

export const createSurveyResponseBodySchema = z.object({
  contactName: optionalTrimmed(120),
  contactEmail: z.string().trim().toLowerCase().email().max(255),
  contactPhone: trimmed(30).min(6, 'Téléphone trop court'),

  role: z.enum(['producer', 'merchant', 'both']),
  activityType: optionalTrimmed(120),
  zone: zoneBodySchema,
  sizeBracket: enumOption(['solo', '2_5', 'plus_5']),

  answers: surveyAnswersSchema,

  consentRgpd: z.literal(true, {
    errorMap: () => ({ message: 'Le consentement RGPD est requis' }),
  }),
  consentRecontact: z.boolean().default(false),
  source: optionalTrimmed(100),
});

export const listSurveyResponsesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['new', 'reviewed', 'archived']).optional(),
  role: z.enum(['producer', 'merchant', 'both']).optional(),
});

export const surveyResponseIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const updateSurveyResponseStatusBodySchema = z.object({
  status: z.enum(['new', 'reviewed', 'archived']),
});
