import { Brackets, IsNull } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { AppError } from '../../common/errors/app-error';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { ProducerProfile } from '../../entities/producer-profile.entity';
import { Order } from '../../entities/order.entity';
import {
  AdminAuditTargetType,
} from '../../entities/admin-audit-log.entity';
import { adminAuditService } from './admin-audit.service';
import {
  sendAccountApprovedEmail,
  sendAccountModerationEmail,
} from '../../lib/email';

export interface AdminUserListFilters {
  page: number;
  pageSize: number;
  role?: UserRole;
  status?: UserStatus;
  q?: string;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyName: string | null;
  siret: string | null;
  city: string | null;
  postalCode: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  phone: string | null;
  description: string | null;
  nafCode: string | null;
  addressLine: string | null;
  profilePhotoUrl: string | null;
  locationLat: number | null;
  locationLng: number | null;
  producerProfile: {
    averageRating: number;
    totalRatings: number;
    reliabilityScore: number;
    totalOrders: number;
  } | null;
  ordersSummary: {
    asBuyer: number;
    asProducer: number;
  };
}

function toListItem(u: User): AdminUserListItem {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    status: u.status,
    companyName: u.companyName,
    siret: u.siret,
    city: u.city,
    postalCode: u.postalCode,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
  };
}

export const adminUsersService = {
  async list(
    filters: AdminUserListFilters,
  ): Promise<{ items: AdminUserListItem[]; total: number }> {
    const repo = AppDataSource.getRepository(User);
    const qb = repo.createQueryBuilder('u').withDeleted().orderBy('u.createdAt', 'DESC');

    if (filters.role) {
      qb.andWhere('u.role = :role', { role: filters.role });
    }
    if (filters.status) {
      qb.andWhere('u.status = :status', { status: filters.status });
    }
    if (filters.q && filters.q.trim().length > 0) {
      const like = `%${filters.q.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((b) => {
          b.where('LOWER(u.email) LIKE :like', { like })
            .orWhere('LOWER(COALESCE(u.companyName, \'\')) LIKE :like', { like })
            .orWhere('COALESCE(u.siret, \'\') LIKE :like', { like });
        }),
      );
    }

    const total = await qb.getCount();
    const items = await qb
      .skip((filters.page - 1) * filters.pageSize)
      .take(filters.pageSize)
      .getMany();

    return { items: items.map(toListItem), total };
  },

  async detail(id: string): Promise<AdminUserDetail> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id }, withDeleted: true });
    if (!user) {
      throw new AppError('NOT_FOUND', 'Utilisateur introuvable', 404);
    }

    let producerProfile: AdminUserDetail['producerProfile'] = null;
    if (user.role === UserRole.PRODUCER) {
      const profileRepo = AppDataSource.getRepository(ProducerProfile);
      const profile = await profileRepo.findOne({ where: { user: { id } } });
      if (profile) {
        producerProfile = {
          averageRating: profile.averageRating,
          totalRatings: profile.totalRatings,
          reliabilityScore: profile.reliabilityScore,
          totalOrders: profile.totalOrders,
        };
      }
    }

    const orderRepo = AppDataSource.getRepository(Order);
    const asBuyer = await orderRepo.count({ where: { buyerId: id } });
    const asProducer = await orderRepo.count({ where: { producerId: id } });

    return {
      ...toListItem(user),
      phone: user.phone,
      description: user.description,
      nafCode: user.nafCode,
      addressLine: user.addressLine,
      profilePhotoUrl: user.profilePhotoUrl,
      locationLat: user.locationLat,
      locationLng: user.locationLng,
      producerProfile,
      ordersSummary: { asBuyer, asProducer },
    };
  },

  async approve(adminId: string, userId: string): Promise<AdminUserDetail> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('NOT_FOUND', 'Utilisateur introuvable', 404);
    if (user.role === UserRole.ADMIN) {
      throw new AppError('FORBIDDEN', 'Compte admin non modifiable', 403);
    }
    if (user.status !== UserStatus.PENDING_ADMIN && user.status !== UserStatus.PENDING_EMAIL) {
      throw new AppError(
        'CONFLICT',
        'Seuls les comptes en attente peuvent être approuvés',
        409,
      );
    }

    user.status = UserStatus.ACTIVE;
    await userRepo.save(user);

    await adminAuditService.record({
      adminId,
      action: 'user.approve',
      targetType: AdminAuditTargetType.USER,
      targetId: userId,
      payload: { previousStatus: UserStatus.PENDING_ADMIN },
    });
    await sendAccountApprovedEmail(user.email);
    return adminUsersService.detail(userId);
  },

  async reject(adminId: string, userId: string, reason: string): Promise<AdminUserDetail> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('NOT_FOUND', 'Utilisateur introuvable', 404);
    if (user.role === UserRole.ADMIN) {
      throw new AppError('FORBIDDEN', 'Compte admin non modifiable', 403);
    }
    if (user.status !== UserStatus.PENDING_ADMIN && user.status !== UserStatus.PENDING_EMAIL) {
      throw new AppError(
        'CONFLICT',
        'Seuls les comptes en attente peuvent être refusés',
        409,
      );
    }

    user.status = UserStatus.SUSPENDED;
    await userRepo.save(user);

    await adminAuditService.record({
      adminId,
      action: 'user.reject',
      targetType: AdminAuditTargetType.USER,
      targetId: userId,
      payload: { reason },
    });
    await sendAccountModerationEmail(user.email, 'rejected', reason);
    return adminUsersService.detail(userId);
  },

  async suspend(adminId: string, userId: string, reason: string): Promise<AdminUserDetail> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('NOT_FOUND', 'Utilisateur introuvable', 404);
    if (user.role === UserRole.ADMIN) {
      throw new AppError('FORBIDDEN', 'Compte admin non modifiable', 403);
    }
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw new AppError('CONFLICT', 'Compte déjà suspendu ou supprimé', 409);
    }

    user.status = UserStatus.SUSPENDED;
    await userRepo.save(user);

    await adminAuditService.record({
      adminId,
      action: 'user.suspend',
      targetType: AdminAuditTargetType.USER,
      targetId: userId,
      payload: { reason },
    });
    await sendAccountModerationEmail(user.email, 'suspended', reason);
    return adminUsersService.detail(userId);
  },

  async reactivate(adminId: string, userId: string): Promise<AdminUserDetail> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('NOT_FOUND', 'Utilisateur introuvable', 404);
    if (user.role === UserRole.ADMIN) {
      throw new AppError('FORBIDDEN', 'Compte admin non modifiable', 403);
    }
    if (user.status !== UserStatus.SUSPENDED) {
      throw new AppError('CONFLICT', 'Seuls les comptes suspendus sont réactivables', 409);
    }

    user.status = UserStatus.ACTIVE;
    await userRepo.save(user);

    await adminAuditService.record({
      adminId,
      action: 'user.reactivate',
      targetType: AdminAuditTargetType.USER,
      targetId: userId,
    });
    await sendAccountModerationEmail(user.email, 'reactivated', null);
    return adminUsersService.detail(userId);
  },

  async softDelete(adminId: string, userId: string): Promise<{ ok: true }> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('NOT_FOUND', 'Utilisateur introuvable', 404);
    if (user.role === UserRole.ADMIN) {
      throw new AppError('FORBIDDEN', 'Compte admin non supprimable', 403);
    }

    user.status = UserStatus.DELETED;
    await userRepo.save(user);
    await userRepo.softDelete({ id: userId, deletedAt: IsNull() });

    await adminAuditService.record({
      adminId,
      action: 'user.delete',
      targetType: AdminAuditTargetType.USER,
      targetId: userId,
    });
    return { ok: true };
  },
};
