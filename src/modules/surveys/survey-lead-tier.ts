/**
 * Paliers de qualification des réponses au questionnaire « pitch ».
 *
 * Règles (évaluées dans cet ordre implicite via des retours précoces) :
 * - `out` : intérêt explicite pour la plateforme = « non ».
 * - `hot` : intérêt « oui », consentement au recontact, et volonté de payer
 *   autre que « gratuit uniquement » (code présent et différent de `free`).
 * - `warm` : « peut-être », ou « oui » sans remplir toutes les conditions « chaud ».
 * - `cold` : pas de réponse claire d’intérêt (ex. champs manquants) sans être `out`.
 */

export type SurveyLeadTier = 'hot' | 'warm' | 'cold' | 'out';

const PAID_OR_COMMISSION = new Set(['lt10', '10_30', '30_50', 'plus50', 'commission']);

function strAnswer(answers: Record<string, unknown>, key: string): string | undefined {
  const v = answers[key];
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

export function computeSurveyLeadTier(
  answers: Record<string, unknown>,
  consentRecontact: boolean,
): SurveyLeadTier {
  const platformInterest = strAnswer(answers, 'platformInterest');
  const paymentWillingness = strAnswer(answers, 'paymentWillingness');

  if (platformInterest === 'no') {
    return 'out';
  }

  const willingToPay =
    paymentWillingness !== undefined &&
    paymentWillingness !== 'free' &&
    PAID_OR_COMMISSION.has(paymentWillingness);

  if (platformInterest === 'yes' && consentRecontact && willingToPay) {
    return 'hot';
  }

  if (platformInterest === 'maybe' || platformInterest === 'yes') {
    return 'warm';
  }

  return 'cold';
}
