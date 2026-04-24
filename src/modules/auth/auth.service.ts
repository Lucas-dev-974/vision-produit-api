import { createHash } from 'crypto';
import { AppDataSource } from '../../config/data-source';
import { env } from '../../config/env';
import { AppError } from '../../common/errors/app-error';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { hashPassword, verifyPassword } from '../../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { validateSiretWithInsee } from '../../lib/insee';
import { sendVerificationEmail } from '../../lib/email';
import { Not } from 'typeorm';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  siret: string | null;
  nafCode: string | null;
  companyName: string | null;
  phone: string | null;
  description: string | null;
  profilePhotoUrl: string | null;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  locationLat: number | null;
  locationLng: number | null;
  createdAt: string;
  updatedAt: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    siret: user.siret,
    nafCode: user.nafCode,
    companyName: user.companyName,
    phone: user.phone,
    description: user.description,
    profilePhotoUrl: user.profilePhotoUrl,
    addressLine: user.addressLine,
    city: user.city,
    postalCode: user.postalCode,
    locationLat: user.locationLat,
    locationLng: user.locationLng,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

const ACCESS_COOKIE_MS = 15 * 60 * 1000;
const REFRESH_COOKIE_MS = 7 * 24 * 60 * 60 * 1000;

export const authService = {
  async register(input: {
    email: string;
    password: string;
    siret: string;
    role: 'producer' | 'buyer';
  }): Promise<{ user: PublicUser }> {
    const userRepo = AppDataSource.getRepository(User);
    const existingEmail = await userRepo.findOne({ where: { email: input.email.toLowerCase() } });
    if (existingEmail && existingEmail.status !== UserStatus.DELETED) {
      throw new AppError('EMAIL_ALREADY_USED', 'Cette adresse e-mail est déjà utilisée', 409);
    }

    const siretBusy = await userRepo.exists({
      where: {
        siret: input.siret,
        status: Not(UserStatus.DELETED),
      },
    });
    if (siretBusy) {
      throw new AppError('SIRET_ALREADY_USED', 'Ce SIRET est déjà associé à un compte', 409);
    }

    const insee = await validateSiretWithInsee(input.siret);
    const passwordHash = await hashPassword(input.password);

    const user = userRepo.create({
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role === 'producer' ? UserRole.PRODUCER : UserRole.BUYER,
      status: UserStatus.PENDING_EMAIL,
      siret: input.siret,
      companyName: insee.companyName || null,
      nafCode: insee.nafCode || null,
    });

    await userRepo.save(user);
    await sendVerificationEmail(user.email, 'stub-token');

    return { user: toPublicUser(user) };
  },

  async login(
    email: string,
    password: string,
    ip: string | undefined,
    userAgent: string | undefined,
  ): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Identifiants incorrects', 401);
    }

    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) {
      throw new AppError('UNAUTHORIZED', 'Identifiants incorrects', 401);
    }

    if (user.status === UserStatus.PENDING_EMAIL) {
      throw new AppError(
        'FORBIDDEN',
        'Vérifiez votre adresse e-mail avant de vous connecter',
        403,
      );
    }
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw new AppError('UNAUTHORIZED', 'Compte indisponible', 401);
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken(user.id);
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const refreshRepo = AppDataSource.getRepository(RefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_COOKIE_MS);
    await refreshRepo.save(
      refreshRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt,
        revoked: false,
        ipAddress: ip ?? null,
        userAgent: userAgent ?? null,
      }),
    );

    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async refreshSession(
    refreshToken: string,
    ip: string | undefined,
    userAgent: string | undefined,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let sub: string;
    try {
      ({ sub } = verifyRefreshToken(refreshToken));
    } catch {
      throw new AppError('UNAUTHORIZED', 'Session expirée', 401);
    }

    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const refreshRepo = AppDataSource.getRepository(RefreshToken);
    const row = await refreshRepo.findOne({
      where: { tokenHash: hash, revoked: false, userId: sub },
    });
    if (!row || row.expiresAt.getTime() < Date.now()) {
      throw new AppError('UNAUTHORIZED', 'Session expirée', 401);
    }

    row.revoked = true;
    await refreshRepo.save(row);

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: sub } });
    if (!user || user.status === UserStatus.DELETED || user.status === UserStatus.SUSPENDED) {
      throw new AppError('UNAUTHORIZED', 'Compte indisponible', 401);
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const newRefresh = signRefreshToken(user.id);
    const newHash = createHash('sha256').update(newRefresh).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_COOKIE_MS);
    await refreshRepo.save(
      refreshRepo.create({
        userId: user.id,
        tokenHash: newHash,
        expiresAt,
        revoked: false,
        ipAddress: ip ?? null,
        userAgent: userAgent ?? null,
      }),
    );

    return { accessToken, refreshToken: newRefresh };
  },

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      verifyRefreshToken(refreshToken);
    } catch {
      return;
    }
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const refreshRepo = AppDataSource.getRepository(RefreshToken);
    const row = await refreshRepo.findOne({ where: { tokenHash: hash } });
    if (row) {
      row.revoked = true;
      await refreshRepo.save(row);
    }
  },

  async getMe(userId: string): Promise<PublicUser> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('NOT_FOUND', 'Utilisateur introuvable', 404);
    }
    return toPublicUser(user);
  },

  cookieOptions(access: boolean) {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: access ? ACCESS_COOKIE_MS : REFRESH_COOKIE_MS,
      path: '/',
    };
  },
};
