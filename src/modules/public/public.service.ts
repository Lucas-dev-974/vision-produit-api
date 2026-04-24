import { AppDataSource } from '../../config/data-source';
import { IS_MYSQL } from '../../config/db-types';
import { AppError } from '../../common/errors/app-error';
import { UserRole, UserStatus } from '../../entities/user.entity';
import { ProducerProfile } from '../../entities/producer-profile.entity';
import { Product, ProductCategory } from '../../entities/product.entity';
import { Stock } from '../../entities/stock.entity';

export interface PublicProducerCard {
  id: string;
  companyName: string | null;
  city: string | null;
  postalCode: string | null;
  description: string | null;
  profilePhotoUrl: string | null;
  publicLocation: { lat: number; lng: number } | null;
  averageRating: number;
  totalRatings: number;
  reliabilityScore: number;
  totalOrders: number;
}

export interface PublicProducerProductDto {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
}

export interface PublicProducerStockDto {
  stockId: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  description: string;
  unit: string;
  unitPrice: string;
  quantityAvailable: string;
  availableFrom: string;
  expiresAt: string;
}

export interface PublicProducerProfileDetail extends PublicProducerCard {
  additionalPhotos: string[];
  products: PublicProducerProductDto[];
  stocks: PublicProducerStockDto[];
}

export const publicService = {
  async listProducers(
    page: number,
    pageSize: number,
  ): Promise<{ items: PublicProducerCard[]; total: number }> {
    const profileRepo = AppDataSource.getRepository(ProducerProfile);
    const qb = profileRepo
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .where('user.role = :role', { role: UserRole.PRODUCER })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('user.deletedAt IS NULL');

    if (IS_MYSQL) {
      // MySQL ne supporte pas `NULLS LAST`. On trie d'abord les non-NULL
      // (`IS NULL = 0`) puis on ordonne alphabétiquement.
      qb.orderBy('user.company_name IS NULL', 'ASC').addOrderBy(
        'user.company_name',
        'ASC',
      );
    } else {
      qb.orderBy('user.companyName', 'ASC', 'NULLS LAST');
    }
    qb.addOrderBy('user.id', 'ASC');

    const total = await qb.getCount();
    const profiles = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const items: PublicProducerCard[] = profiles.map((p) => {
      const u = p.user;
      const loc =
        p.publicLocationLat != null && p.publicLocationLng != null
          ? { lat: p.publicLocationLat, lng: p.publicLocationLng }
          : null;
      return {
        id: u.id,
        companyName: u.companyName,
        city: u.city,
        postalCode: u.postalCode,
        description: u.description,
        profilePhotoUrl: u.profilePhotoUrl,
        publicLocation: loc,
        averageRating: p.averageRating,
        totalRatings: p.totalRatings,
        reliabilityScore: p.reliabilityScore,
        totalOrders: p.totalOrders,
      };
    });

    return { items, total };
  },

  async getProducerCardByUserId(userId: string): Promise<PublicProducerCard> {
    const profileRepo = AppDataSource.getRepository(ProducerProfile);
    const profile = await profileRepo
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('user.role = :role', { role: UserRole.PRODUCER })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('user.deletedAt IS NULL')
      .getOne();

    if (!profile) {
      throw new AppError('NOT_FOUND', 'Producteur introuvable', 404);
    }

    const u = profile.user;
    const loc =
      profile.publicLocationLat != null && profile.publicLocationLng != null
        ? { lat: profile.publicLocationLat, lng: profile.publicLocationLng }
        : null;

    return {
      id: u.id,
      companyName: u.companyName,
      city: u.city,
      postalCode: u.postalCode,
      description: u.description,
      profilePhotoUrl: u.profilePhotoUrl,
      publicLocation: loc,
      averageRating: profile.averageRating,
      totalRatings: profile.totalRatings,
      reliabilityScore: profile.reliabilityScore,
      totalOrders: profile.totalOrders,
    };
  },

  async getProducerProfileDetail(userId: string): Promise<PublicProducerProfileDetail> {
    const card = await publicService.getProducerCardByUserId(userId);
    const profileRepo = AppDataSource.getRepository(ProducerProfile);
    const profile = await profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!profile) {
      throw new AppError('NOT_FOUND', 'Producteur introuvable', 404);
    }

    const productRepo = AppDataSource.getRepository(Product);
    const productRows = await productRepo.find({
      where: { producerId: userId },
      order: { name: 'ASC' },
    });
    const products: PublicProducerProductDto[] = productRows.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
    }));

    const today = new Date().toISOString().slice(0, 10);
    const stockRepo = AppDataSource.getRepository(Stock);
    const stockRows = await stockRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.product', 'p')
      .where('p.producer_id = :producerId', { producerId: userId })
      .andWhere('s.expires_at >= :today', { today })
      .andWhere('s.quantity > 0')
      .orderBy('p.name', 'ASC')
      .addOrderBy('s.expires_at', 'ASC')
      .getMany();

    const stocks: PublicProducerStockDto[] = stockRows.map((s) => ({
      stockId: s.id,
      productId: s.productId,
      productName: s.product.name,
      category: s.product.category,
      description: s.product.description,
      unit: s.unit,
      unitPrice: s.unitPrice,
      quantityAvailable: s.quantity,
      availableFrom: s.availableFrom,
      expiresAt: s.expiresAt,
    }));

    return {
      ...card,
      additionalPhotos: profile.additionalPhotos ?? [],
      products,
      stocks,
    };
  },
};
