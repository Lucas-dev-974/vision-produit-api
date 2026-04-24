import { AppError } from '../common/errors/app-error';
import { env } from '../config/env';

export interface SiretValidationResult {
  companyName: string;
  nafCode: string;
}

interface InseeSiretResponse {
  etablissement?: {
    etatAdministratifEtablissement?: string;
    uniteLegale?: {
      denominationUniteLegale?: string;
    };
    activitePrincipaleEtablissement?: string;
  };
}

export async function validateSiretWithInsee(siret: string): Promise<SiretValidationResult> {
  if (!env.INSEE_API_KEY) {
    if (env.NODE_ENV !== 'development') {
      throw new AppError('INTERNAL_ERROR', 'Service INSEE non configuré', 500);
    }
    return {
      companyName: 'Entreprise (mode développement)',
      nafCode: '01.11Z',
    };
  }

  const url = `https://api.insee.fr/entreprises/sirene/V3.11/siret/${siret}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.INSEE_API_KEY}` },
  });

  if (res.status === 404) {
    throw new AppError('SIRET_INVALID', 'SIRET inconnu ou invalide', 400);
  }

  if (!res.ok) {
    throw new AppError('INTERNAL_ERROR', 'Erreur lors de la vérification SIRET', 502);
  }

  const data = (await res.json()) as InseeSiretResponse;
  const etab = data.etablissement;
  if (!etab || etab.etatAdministratifEtablissement !== 'A') {
    throw new AppError('SIRET_INVALID', "L'établissement n'est pas actif", 400);
  }

  const companyName = etab.uniteLegale?.denominationUniteLegale ?? '';
  const nafCode = etab.activitePrincipaleEtablissement ?? '';

  return { companyName, nafCode };
}
