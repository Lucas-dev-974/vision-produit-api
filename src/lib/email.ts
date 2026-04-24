import { logger } from './logger';

export async function sendVerificationEmail(_email: string, _token: string): Promise<void> {
  logger.info({ msg: 'email.verification.stub' });
}

export async function sendPasswordResetEmail(_email: string, _token: string): Promise<void> {
  logger.info({ msg: 'email.password-reset.stub' });
}

export async function sendAdminRejectionEmail(_email: string, _reason: string): Promise<void> {
  logger.info({ msg: 'email.admin-reject.stub' });
}
