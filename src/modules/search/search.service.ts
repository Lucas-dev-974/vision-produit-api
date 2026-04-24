import { AppDataSource } from '../../config/data-source';
import { UserRole, UserStatus } from '../../entities/user.entity';
import { ProducerProfile } from '../../entities/producer-profile.entity';
import { ProductCategory } from '../../entities/product.entity';
import { Stock } from '../../entities/stock.entity';
import type { PublicProducerCard } from '../public/public.service';

export interface SearchProducerHit extends PublicProducerCard {
  distanceKm: number;
}

export interface SearchProductHit {
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
  producerId: string;
  companyName: string | null;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const searchService = {
  async searchProducers(
    lat: number,
    lng: number,
    radiusKm: number,
    category: ProductCategory | undefined,
    q: string | undefined,
    sort: 'distance' | 'name' | 'rating',
    page: number,
    pageSize: number,
  ): Promise<{ items: SearchProducerHit[]; total: number }> {
    const profileRepo = AppDataSource.getRepository(ProducerProfile);
    const qb = profileRepo
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .where('user.role = :role', { role: UserRole.PRODUCER })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('user.deletedAt IS NULL')
      .andWhere('profile.public_location_lat IS NOT NULL')
      .andWhere('profile.public_location_lng IS NOT NULL');

    if (category) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM products p
          WHERE p.producer_id = user.id AND p.category = :category
        )`,
        { category },
      );
    }

    if (q && q.trim()) {
      const term = `%${q.trim().replace(/%/g, '\\%')}%`;
      qb.andWhere(
        '(user.company_name ILIKE :term OR user.description ILIKE :term)',
        { term },
      );
    }

    const profiles = await qb.getMany();

    const withDist: SearchProducerHit[] = profiles
      .map((p) => {
        const u = p.user;
        const plat = p.publicLocationLat!;
        const plng = p.publicLocationLng!;
        const distanceKm = haversineKm(lat, lng, plat, plng);
        const loc = { lat: plat, lng: plng };
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
          distanceKm,
        };
      })
      .filter((h) => h.distanceKm <= radiusKm);

    if (sort === 'name') {
      withDist.sort((a, b) =>
        (a.companyName ?? '').localeCompare(b.companyName ?? '', 'fr'),
      );
    } else if (sort === 'rating') {
      withDist.sort((a, b) => b.averageRating - a.averageRating);
    } else {
      withDist.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    const total = withDist.length;
    const slice = withDist.slice((page - 1) * pageSize, page * pageSize);
    return { items: slice, total };
  },

  async searchProducts(
    query: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: SearchProductHit[]; total: number }> {
    const today = new Date().toISOString().slice(0, 10);
    const term = `%${query.trim().replace(/%/g, '\\%')}%`;
    const stockRepo = AppDataSource.getRepository(Stock);
    const qb = stockRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.product', 'p')
      .innerJoinAndSelect('p.producer', 'producer')
      .where('s.expires_at >= :today', { today })
      .andWhere('s.quantity::numeric > 0')
      .andWhere('producer.role = :role', { role: UserRole.PRODUCER })
      .andWhere('producer.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('producer.deletedAt IS NULL')
      .andWhere('(p.name ILIKE :term OR p.description ILIKE :term)', { term })
      .orderBy('s.expires_at', 'ASC');

    const all = await qb.getMany();
    const items: SearchProductHit[] = all.map((s) => ({
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
      producerId: s.product.producerId,
      companyName: s.product.producer.companyName,
    }));
    const total = items.length;
    const slice = items.slice((page - 1) * pageSize, page * pageSize);
    return { items: slice, total };
  },
};
