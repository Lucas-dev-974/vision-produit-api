import { env } from '../config/env';
import { logger } from './logger';

/**
 * Client minimal Brevo (Sendinblue) — API HTTP `smtp/email`.
 *
 * On évite d'ajouter une dépendance lourde : un simple `fetch` suffit pour
 * V1. Si `BREVO_API_KEY` n'est pas définie (dev local sans secret), on
 * retombe sur un log structuré pour ne pas casser les flux applicatifs.
 */

export interface BrevoRecipient {
  email: string;
  name?: string;
}

export interface BrevoEmailInput {
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: BrevoRecipient;
  tags?: string[];
}

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export async function sendBrevoEmail(input: BrevoEmailInput): Promise<void> {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    logger.warn(
      {
        msg: 'brevo.skip.missing-config',
        to: input.to.map((r) => r.email),
        subject: input.subject,
      },
      'Brevo non configuré : email simulé en log',
    );
    return;
  }

  const sender: BrevoRecipient = {
    email: env.BREVO_SENDER_EMAIL,
    name: env.BREVO_SENDER_NAME ?? 'MonAppli',
  };

  const payload = {
    sender,
    to: input.to,
    subject: input.subject,
    htmlContent: input.htmlContent,
    textContent: input.textContent,
    replyTo: input.replyTo,
    tags: input.tags,
  };

  let res: Response;
  try {
    res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    logger.error({ err, to: input.to }, 'Brevo : échec réseau');
    return;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error(
      { status: res.status, body, to: input.to, subject: input.subject },
      'Brevo : échec API',
    );
    return;
  }

  logger.info(
    { to: input.to.map((r) => r.email), subject: input.subject },
    'Brevo : email envoyé',
  );
}
