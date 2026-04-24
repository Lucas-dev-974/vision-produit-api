import { AppDataSource } from '../../config/data-source';
import { AppError } from '../../common/errors/app-error';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { ProducerProfile } from '../../entities/producer-profile.entity';
import { toPublicUser } from '../auth/auth.service';
import type { PublicUser } from '../auth/auth.service';
import { blurCoordinates } from '../../lib/geo';
import { publicService } from '../public/public.service';

export const usersService = {
  async updateMe(
    userId: string,
    input: {
      phone?: string | null;
      description?: string | null;
      profilePhotoUrl?: string | null;
      locationLat?: number;
      locationLng?: number;
      addressLine?: string | null;
      city?: string | null;
      postalCode?: string | null;
    },
  ): Promise<PublicUser> {
    const userRepo = AppDataSource.getRepository(User);
    const profileRepo = AppDataSource.getRepository(ProducerProfile);

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new AppError('NOT_FOUND', 'Utilisateur introuvable', 404);
    }

    if (input.phone !== undefined) user.phone = input.phone;
    if (input.description !== undefined) user.description = input.description;
    if (input.profilePhotoUrl !== undefined) user.profilePhotoUrl = input.profilePhotoUrl;
    if (input.addressLine !== undefined) user.addressLine = input.addressLine;
    if (input.city !== undefined) user.city = input.city;
    if (input.postalCode !== undefined) user.postalCode = input.postalCode;

    if (input.locationLat !== undefined && input.locationLng !== undefined) {
      user.locationLat = input.locationLat;
      user.locationLng = input.locationLng;

      if (user.role === UserRole.PRODUCER) {
        const profile = await profileRepo.findOne({
          where: { user: { id: userId } },
        });
        if (profile) {
          const blurred = blurCoordinates(input.locationLat, input.locationLng);
          profile.publicLocationLat = blurred.lat;
          profile.publicLocationLng = blurred.lng;
          await profileRepo.save(profile);
        }
      }
    }

    await userRepo.save(user);
    const fresh = await userRepo.findOneOrFail({ where: { id: userId } });
    return toPublicUser(fresh);
  },

  async exportMe(userId: string): Promise<Record<string, unknown>> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new AppError('NOT_FOUND', 'Utilisateur introuvable', 404);
    }

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        siret: user.siret,
        companyName: user.companyName,
        nafCode: user.nafCode,
        phone: user.phone,
        description: user.description,
        profilePhotoUrl: user.profilePhotoUrl,
        locationLat: user.locationLat,
        locationLng: user.locationLng,
        addressLine: user.addressLine,
        city: user.city,
        postalCode: user.postalCode,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  },

  async softDeleteMe(userId: string): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new AppError('NOT_FOUND', 'Utilisateur introuvable', 404);
    }
    user.status = UserStatus.DELETED;
    await userRepo.save(user);
    await userRepo.softDelete({ id: userId });
  },

  getProducerPublicProfile(producerUserId: string) {
    return publicService.getProducerCardByUserId(producerUserId);
  },
};
