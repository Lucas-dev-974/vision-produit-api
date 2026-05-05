import { env, getPublicAppUrl } from '../config/env';
import { logger } from './logger';
import { sendBrevoEmail } from './brevo';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendVerificationEmail(_email: string, _token: string): Promise<void> {
  logger.info({ msg: 'email.verification.stub' });
}

export async function sendPasswordResetEmail(_email: string, _token: string): Promise<void> {
  logger.info({ msg: 'email.password-reset.stub' });
}

export async function sendAdminRejectionEmail(_email: string, _reason: string): Promise<void> {
  logger.info({ msg: 'email.admin-reject.stub' });
}

/**
 * Envoie l'e-mail de confirmation d'une pré-inscription. Le lien pointe vers
 * la page front qui appellera `/v1/public/pre-registrations/confirm`.
 */
export async function sendPreRegistrationConfirmationEmail(
  email: string,
  token: string,
): Promise<void> {
  const link = `${getPublicAppUrl()}/pre-inscription/confirme?token=${encodeURIComponent(token)}`;
  const safeLink = escapeHtml(link);

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h1 style="font-size:20px;margin:0 0 16px">Confirmez votre pré-inscription</h1>
      <p>Bonjour,</p>
      <p>
        Merci pour votre intérêt pour notre plateforme. Pour finaliser votre
        pré-inscription, merci de confirmer votre adresse e-mail en cliquant sur le lien
        ci-dessous :
      </p>
      <p style="margin:24px 0">
        <a href="${safeLink}" style="background:#3f6b3a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">
          Confirmer mon e-mail
        </a>
      </p>
      <p style="font-size:13px;color:#555">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <span style="word-break:break-all">${safeLink}</span>
      </p>
      <p style="font-size:13px;color:#555">
        Le lien est valide 7 jours. Si vous n'êtes pas à l'origine de cette demande,
        ignorez ce message.
      </p>
    </div>
  `;

  const text =
    `Confirmez votre pré-inscription en ouvrant ce lien (valide 7 jours) :\n${link}\n\n` +
    `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`;

  await sendBrevoEmail({
    to: [{ email }],
    subject: 'Confirmez votre pré-inscription',
    htmlContent: html,
    textContent: text,
    tags: ['pre-registration', 'confirmation'],
  });
}

/**
 * Invitation envoyée par un admin à une personne pré-inscrite : lien direct
 * vers le formulaire d'inscription accélérée (`/inscription?token=…`).
 */
export async function sendPreRegistrationInvitationEmail(
  email: string,
  token: string,
  customMessage: string | null,
): Promise<void> {
  const link = `${getPublicAppUrl()}/inscription?token=${encodeURIComponent(token)}`;
  const safeLink = escapeHtml(link);
  const safeMsg = customMessage ? escapeHtml(customMessage) : null;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h1 style="font-size:20px;margin:0 0 16px">Votre invitation à rejoindre la plateforme</h1>
      <p>Bonjour,</p>
      <p>Votre pré-inscription a été acceptée. Vous pouvez maintenant créer votre compte.</p>
      ${safeMsg ? `<blockquote style="border-left:3px solid #3f6b3a;padding:8px 12px;background:#f6f5ef;color:#333">${safeMsg}</blockquote>` : ''}
      <p style="margin:24px 0">
        <a href="${safeLink}" style="background:#3f6b3a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">
          Créer mon compte
        </a>
      </p>
      <p style="font-size:13px;color:#555">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <span style="word-break:break-all">${safeLink}</span>
      </p>
      <p style="font-size:13px;color:#555">Le lien est valide 14 jours.</p>
    </div>
  `;

  const text =
    `Votre invitation à créer un compte (valide 14 jours) :\n${link}\n\n` +
    (customMessage ? `Message de l'équipe :\n${customMessage}\n\n` : '');

  await sendBrevoEmail({
    to: [{ email }],
    subject: 'Invitation à créer votre compte',
    htmlContent: html,
    textContent: text,
    tags: ['pre-registration', 'invitation'],
  });
}

/** Email envoyé à un utilisateur dont le compte vient d'être activé par un admin. */
export async function sendAccountApprovedEmail(email: string): Promise<void> {
  const link = getPublicAppUrl();
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h1 style="font-size:20px">Votre compte est activé</h1>
      <p>Bonjour, votre compte a été validé par notre équipe. Vous pouvez vous connecter dès maintenant&nbsp;:</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(link)}" style="background:#3f6b3a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">
          Accéder à la plateforme
        </a>
      </p>
    </div>
  `;
  await sendBrevoEmail({
    to: [{ email }],
    subject: 'Votre compte est activé',
    htmlContent: html,
    textContent: `Votre compte a été validé. Connectez-vous : ${link}`,
    tags: ['account', 'approved'],
  });
}

/** Email envoyé à un utilisateur dont le compte a été refusé / suspendu. */
export async function sendAccountModerationEmail(
  email: string,
  variant: 'rejected' | 'suspended' | 'reactivated',
  reason: string | null,
): Promise<void> {
  const subjects: Record<typeof variant, string> = {
    rejected: 'Votre demande a été refusée',
    suspended: 'Votre compte a été suspendu',
    reactivated: 'Votre compte a été réactivé',
  };
  const intro: Record<typeof variant, string> = {
    rejected:
      "Bonjour, après examen, nous ne pouvons pas donner suite à votre demande d'inscription.",
    suspended:
      'Bonjour, votre compte a été suspendu. Vous ne pouvez plus vous connecter à la plateforme pour le moment.',
    reactivated: 'Bonjour, votre compte a été réactivé.',
  };

  const safeReason = reason ? escapeHtml(reason) : null;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h1 style="font-size:20px">${escapeHtml(subjects[variant])}</h1>
      <p>${escapeHtml(intro[variant])}</p>
      ${safeReason ? `<p><strong>Motif&nbsp;:</strong></p><blockquote style="border-left:3px solid #b15a3a;padding:8px 12px;background:#fbf3ef">${safeReason}</blockquote>` : ''}
      <p style="font-size:13px;color:#555">Pour toute question, contactez l'équipe.</p>
    </div>
  `;
  const text =
    `${subjects[variant]}\n\n${intro[variant]}\n` +
    (reason ? `Motif : ${reason}\n` : '');

  await sendBrevoEmail({
    to: [{ email }],
    subject: subjects[variant],
    htmlContent: html,
    textContent: text,
    tags: ['account', variant],
  });
}

/** Notification interne (équipe) à chaque pré-inscription confirmée. */
export async function sendPreRegistrationAdminNotification(input: {
  email: string;
  role: string;
  companyName: string | null;
  city: string | null;
}): Promise<void> {
  if (!env.ADMIN_NOTIFICATION_EMAIL) return;

  const lines = [
    `Nouvelle pré-inscription confirmée :`,
    ``,
    `E-mail : ${input.email}`,
    `Rôle : ${input.role}`,
    `Entreprise : ${input.companyName ?? '—'}`,
    `Ville : ${input.city ?? '—'}`,
  ];

  await sendBrevoEmail({
    to: [{ email: env.ADMIN_NOTIFICATION_EMAIL }],
    subject: `[Pré-inscription] ${input.email}`,
    htmlContent: `<pre style="font-family:monospace">${escapeHtml(lines.join('\n'))}</pre>`,
    textContent: lines.join('\n'),
    tags: ['pre-registration', 'admin-notif'],
  });
}
