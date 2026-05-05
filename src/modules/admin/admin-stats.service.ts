import { AppDataSource } from '../../config/data-source';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { Report, ReportStatus } from '../../entities/report.entity';
import { ProducerProfile } from '../../entities/producer-profile.entity';
import {
  PreRegistration,
  PreRegistrationStatus,
} from '../../entities/pre-registration.entity';

export interface AdminStats {
  preRegistrations: Record<PreRegistrationStatus | 'total', number>;
  users: {
    total: number;
    active: number;
    pendingAdmin: number;
    pendingEmail: number;
    suspended: number;
    deleted: number;
    byRole: { producer: number; buyer: number; admin: number };
  };
  orders: {
    last7d: Record<OrderStatus, number>;
    last30d: Record<OrderStatus, number>;
    acceptanceRate30d: number; // accepted / (accepted + refused), 0..1
    honorRate30d: number; // honored / (honored + not_honored), 0..1
  };
  reports: Record<ReportStatus, number>;
  quality: {
    averageRating: number;
    averageReliability: number;
  };
}

const ALL_ORDER_STATUS: OrderStatus[] = Object.values(OrderStatus);
const ALL_REPORT_STATUS: ReportStatus[] = Object.values(ReportStatus);
const ALL_PRE_REG_STATUS: PreRegistrationStatus[] = Object.values(PreRegistrationStatus);

function emptyOrderRecord(): Record<OrderStatus, number> {
  return ALL_ORDER_STATUS.reduce(
    (acc, s) => {
      acc[s] = 0;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );
}

export const adminStatsService = {
  async compute(): Promise<AdminStats> {
    const ds = AppDataSource;

    const userRepo = ds.getRepository(User);
    const orderRepo = ds.getRepository(Order);
    const reportRepo = ds.getRepository(Report);
    const profileRepo = ds.getRepository(ProducerProfile);
    const preRegRepo = ds.getRepository(PreRegistration);

    // --- Pré-inscriptions ---
    const preRegs = ALL_PRE_REG_STATUS.reduce(
      (acc, s) => {
        acc[s] = 0;
        return acc;
      },
      {} as Record<PreRegistrationStatus | 'total', number>,
    );
    preRegs.total = 0;
    const preRegRows: Array<{ status: PreRegistrationStatus; count: string }> =
      await preRegRepo
        .createQueryBuilder('p')
        .select('p.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('p.status')
        .getRawMany();
    for (const r of preRegRows) {
      const n = Number(r.count) || 0;
      preRegs[r.status] = n;
      preRegs.total += n;
    }

    // --- Utilisateurs ---
    const userTotals = await userRepo
      .createQueryBuilder('u')
      .select('u.status', 'status')
      .addSelect('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.status')
      .addGroupBy('u.role')
      .getRawMany<{ status: UserStatus; role: UserRole; count: string }>();

    const users = {
      total: 0,
      active: 0,
      pendingAdmin: 0,
      pendingEmail: 0,
      suspended: 0,
      deleted: 0,
      byRole: { producer: 0, buyer: 0, admin: 0 },
    };
    for (const r of userTotals) {
      const n = Number(r.count) || 0;
      users.total += n;
      if (r.status === UserStatus.ACTIVE) users.active += n;
      if (r.status === UserStatus.PENDING_ADMIN) users.pendingAdmin += n;
      if (r.status === UserStatus.PENDING_EMAIL) users.pendingEmail += n;
      if (r.status === UserStatus.SUSPENDED) users.suspended += n;
      if (r.status === UserStatus.DELETED) users.deleted += n;
      if (r.role === UserRole.PRODUCER) users.byRole.producer += n;
      if (r.role === UserRole.BUYER) users.byRole.buyer += n;
      if (r.role === UserRole.ADMIN) users.byRole.admin += n;
    }

    // --- Commandes (7j / 30j) ---
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    async function countOrders(since: Date): Promise<Record<OrderStatus, number>> {
      const rows = await orderRepo
        .createQueryBuilder('o')
        .select('o.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('o.createdAt >= :since', { since })
        .groupBy('o.status')
        .getRawMany<{ status: OrderStatus; count: string }>();
      const out = emptyOrderRecord();
      for (const r of rows) out[r.status] = Number(r.count) || 0;
      return out;
    }

    const last7d = await countOrders(d7);
    const last30d = await countOrders(d30);
    const acc30 = last30d[OrderStatus.ACCEPTED] + last30d[OrderStatus.CONFIRMED] +
      last30d[OrderStatus.HONORED] + last30d[OrderStatus.NOT_HONORED];
    const ref30 = last30d[OrderStatus.REFUSED];
    const honoredVsNot =
      last30d[OrderStatus.HONORED] + last30d[OrderStatus.NOT_HONORED];

    const acceptanceRate30d =
      acc30 + ref30 === 0 ? 0 : acc30 / (acc30 + ref30);
    const honorRate30d =
      honoredVsNot === 0 ? 0 : last30d[OrderStatus.HONORED] / honoredVsNot;

    // --- Signalements ---
    const reportRows = await reportRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.status')
      .getRawMany<{ status: ReportStatus; count: string }>();
    const reports = ALL_REPORT_STATUS.reduce(
      (acc, s) => {
        acc[s] = 0;
        return acc;
      },
      {} as Record<ReportStatus, number>,
    );
    for (const r of reportRows) reports[r.status] = Number(r.count) || 0;

    // --- Qualité ---
    const qa = await profileRepo
      .createQueryBuilder('p')
      .select('AVG(p.average_rating)', 'avgRating')
      .addSelect('AVG(p.reliability_score)', 'avgRel')
      .getRawOne<{ avgRating: string | null; avgRel: string | null }>();
    const quality = {
      averageRating: Number(qa?.avgRating ?? 0) || 0,
      averageReliability: Number(qa?.avgRel ?? 0) || 0,
    };

    return {
      preRegistrations: preRegs,
      users,
      orders: { last7d, last30d, acceptanceRate30d, honorRate30d },
      reports,
      quality,
    };
  },
};
