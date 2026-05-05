import 'reflect-metadata';
import { createHash, randomBytes } from 'crypto';
import type { DataSource } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { hashPassword } from '../lib/password';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { ProducerProfile } from '../entities/producer-profile.entity';
import { Product, ProductCategory } from '../entities/product.entity';
import { Stock, StockUnit } from '../entities/stock.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import {
  PreRegistration,
  PreRegistrationRole,
  PreRegistrationStatus,
} from '../entities/pre-registration.entity';
import { Report, ReportCategory, ReportStatus } from '../entities/report.entity';
import {
  AdminAuditLog,
  AdminAuditTargetType,
} from '../entities/admin-audit-log.entity';
import {
  SEED_ADMINS,
  SEED_DEMO_BUYER,
  SEED_DEMO_CONVERSATION,
  SEED_DEMO_MESSAGES,
  SEED_DEMO_ORDERS,
  SEED_DEMO_PRODUCTS,
  SEED_DEMO_PRODUCER,
  SEED_DEMO_STOCKS,
  SEED_PENDING_BUYER,
  SEED_PENDING_PRODUCER,
  SEED_PRE_REGISTRATIONS,
  SEED_PRODUCERS,
  SEED_REPORTS,
  SEED_SHARED_PASSWORD,
  SEED_SUSPENDED_PRODUCER,
} from './seed-data';

function addDaysIso(from: Date, days: number): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Vide toutes les tables du schéma courant sauf l’historique TypeORM (`migrations`).
 * À n’utiliser qu’en développement (appelé depuis `run()` après garde NODE_ENV).
 */
async function wipeApplicationData(dataSource: DataSource): Promise<void> {
  const excluded = new Set(['migrations']);
  const isMysql = env.DB_TYPE === 'mysql';

  const rows: Array<Record<string, string>> = await dataSource.query(
    isMysql
      ? `SELECT table_name AS tablename FROM information_schema.tables WHERE table_schema = DATABASE()`
      : `SELECT tablename FROM pg_tables WHERE schemaname = current_schema()`,
  );
  const tables = rows
    .map((r) => r.tablename ?? r.TABLE_NAME)
    .filter((t): t is string => typeof t === 'string' && !excluded.has(t));

  if (tables.length === 0) {
    logger.warn('Aucune table à vider (schéma vide ?)');
    return;
  }

  if (isMysql) {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
      for (const t of tables) {
        await dataSource.query(`TRUNCATE TABLE \`${t.replace(/`/g, '``')}\``);
      }
    } finally {
      await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  } else {
    const ident = tables.map((t) => `"${t.replace(/"/g, '""')}"`).join(', ');
    await dataSource.query(`TRUNCATE TABLE ${ident} RESTART IDENTITY CASCADE`);
  }

  logger.info(
    { tableCount: tables.length },
    'Base applicative vidée (table migrations conservée)',
  );
}

async function run(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    logger.error(
      {
        nodeEnv: process.env.NODE_ENV ?? '(non défini)',
      },
      'Refusé : le seed et le vidage de base sont réservés à NODE_ENV=development. Utilisez npm run seed (cross-env inclus).',
    );
    process.exit(1);
  }

  await AppDataSource.initialize();
  await wipeApplicationData(AppDataSource);

  const userRepo = AppDataSource.getRepository(User);
  const profileRepo = AppDataSource.getRepository(ProducerProfile);

  const passwordHash = await hashPassword(SEED_SHARED_PASSWORD);

  const demoProducer = userRepo.create({
    id: SEED_DEMO_PRODUCER.id,
    email: SEED_DEMO_PRODUCER.email,
    passwordHash,
    role: UserRole.PRODUCER,
    status: UserStatus.ACTIVE,
    siret: SEED_DEMO_PRODUCER.siret,
    companyName: SEED_DEMO_PRODUCER.companyName,
    nafCode: SEED_DEMO_PRODUCER.nafCode,
    phone: SEED_DEMO_PRODUCER.phone,
    description: SEED_DEMO_PRODUCER.description,
    profilePhotoUrl: null,
    locationLat: SEED_DEMO_PRODUCER.locationLat,
    locationLng: SEED_DEMO_PRODUCER.locationLng,
    addressLine: SEED_DEMO_PRODUCER.addressLine,
    city: SEED_DEMO_PRODUCER.city,
    postalCode: SEED_DEMO_PRODUCER.postalCode,
  });
  await userRepo.save(demoProducer);

  const demoProfile = profileRepo.create({
    id: SEED_DEMO_PRODUCER.profileId,
    user: demoProducer,
    publicLocationLat: SEED_DEMO_PRODUCER.publicLat,
    publicLocationLng: SEED_DEMO_PRODUCER.publicLng,
    averageRating: SEED_DEMO_PRODUCER.averageRating,
    totalRatings: SEED_DEMO_PRODUCER.totalRatings,
    reliabilityScore: SEED_DEMO_PRODUCER.reliabilityScore,
    totalOrders: SEED_DEMO_PRODUCER.totalOrders,
    additionalPhotos: [],
  });
  await profileRepo.save(demoProfile);
  logger.info(
    { id: SEED_DEMO_PRODUCER.id, email: SEED_DEMO_PRODUCER.email },
    'Compte démo producteur créé',
  );

  const productRepo = AppDataSource.getRepository(Product);
  for (const row of SEED_DEMO_PRODUCTS) {
    await productRepo.save(
      productRepo.create({
        id: row.id,
        producerId: demoProducer.id,
        producer: demoProducer,
        name: row.name,
        category: row.category as ProductCategory,
        description: row.description,
      }),
    );
  }
  logger.info({ count: SEED_DEMO_PRODUCTS.length }, 'Produits démo producteur créés');

  const demoBuyer = userRepo.create({
    id: SEED_DEMO_BUYER.id,
    email: SEED_DEMO_BUYER.email,
    passwordHash,
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
    siret: SEED_DEMO_BUYER.siret,
    companyName: SEED_DEMO_BUYER.companyName,
    nafCode: SEED_DEMO_BUYER.nafCode,
    phone: SEED_DEMO_BUYER.phone,
    description: SEED_DEMO_BUYER.description,
    profilePhotoUrl: null,
    locationLat: SEED_DEMO_BUYER.locationLat,
    locationLng: SEED_DEMO_BUYER.locationLng,
    addressLine: SEED_DEMO_BUYER.addressLine,
    city: SEED_DEMO_BUYER.city,
    postalCode: SEED_DEMO_BUYER.postalCode,
  });
  await userRepo.save(demoBuyer);
  logger.info(
    { id: SEED_DEMO_BUYER.id, email: SEED_DEMO_BUYER.email },
    'Compte démo commerçant créé',
  );

  const convRepo = AppDataSource.getRepository(Conversation);
  const msgRepo = AppDataSource.getRepository(Message);
  const demoConv = convRepo.create({
    id: SEED_DEMO_CONVERSATION.id,
    buyerId: demoBuyer.id,
    producerId: demoProducer.id,
    lastMessageAt: new Date(),
  });
  await convRepo.save(demoConv);
  for (const row of SEED_DEMO_MESSAGES) {
    const senderId =
      row.sender === 'buyer' ? demoBuyer.id : demoProducer.id;
    const m = msgRepo.create({
      id: row.id,
      conversationId: demoConv.id,
      senderId,
      content: row.content,
    });
    await msgRepo.save(m);
    demoConv.lastMessageAt = m.createdAt;
  }
  await convRepo.save(demoConv);
  logger.info(
    { conversationId: demoConv.id, messages: SEED_DEMO_MESSAGES.length },
    'Conversation démo messagerie créée',
  );

  const stockRepo = AppDataSource.getRepository(Stock);
  const stockFrom = addDaysIso(new Date(), 0);
  const stockTo = addDaysIso(new Date(), 120);
  for (const row of SEED_DEMO_STOCKS) {
    await stockRepo.save(
      stockRepo.create({
        id: row.id,
        productId: row.productId,
        quantity: row.quantity,
        unit: row.unit as StockUnit,
        unitPrice: row.unitPrice,
        availableFrom: stockFrom,
        expiresAt: stockTo,
      }),
    );
  }
  logger.info({ count: SEED_DEMO_STOCKS.length }, 'Stocks démo créés');

  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);
  for (const row of SEED_DEMO_ORDERS) {
    const seen = new Date();
    await orderRepo.save(
      orderRepo.create({
        id: row.id,
        buyerId: demoBuyer.id,
        producerId: demoProducer.id,
        status: row.status as OrderStatus,
        retrievalDate: addDaysIso(new Date(), row.retrievalOffsetDays),
        retrievalTimeSlot: row.retrievalTimeSlot,
        note: row.note,
        cancellationReason: null,
        refusalReason: null,
        notifRevision: 1,
        buyerNotifRevisionAck: 1,
        producerNotifRevisionAck: 1,
        buyerSeenAt: seen,
        producerSeenAt: seen,
      }),
    );
    for (const it of row.items) {
      await orderItemRepo.save(
        orderItemRepo.create({
          id: it.id,
          orderId: row.id,
          productId: it.productId,
          quantity: it.quantity,
          unit: it.unit as StockUnit,
          unitPriceSnapshot: it.unitPriceSnapshot,
        }),
      );
    }
    if (row.status === 'accepted') {
      const eggStock = await stockRepo.findOne({
        where: { id: 'e0000001-0000-4000-8000-000000000003' },
      });
      if (eggStock) {
        eggStock.quantity = (
          parseFloat(eggStock.quantity) - parseFloat(row.items[0].quantity)
        ).toFixed(2);
        await stockRepo.save(eggStock);
      }
    }
  }
  logger.info({ count: SEED_DEMO_ORDERS.length }, 'Commandes démo créées');

  for (const row of SEED_PRODUCERS) {
    const user = userRepo.create({
      email: row.email,
      passwordHash,
      role: UserRole.PRODUCER,
      status: UserStatus.ACTIVE,
      siret: row.siret,
      companyName: row.companyName,
      nafCode: row.nafCode,
      phone: row.phone,
      description: row.description,
      profilePhotoUrl: null,
      locationLat: row.locationLat,
      locationLng: row.locationLng,
      addressLine: row.addressLine,
      city: row.city,
      postalCode: row.postalCode,
    });
    await userRepo.save(user);

    const profile = profileRepo.create({
      user,
      publicLocationLat: row.publicLat,
      publicLocationLng: row.publicLng,
      averageRating: row.averageRating,
      totalRatings: row.totalRatings,
      reliabilityScore: row.reliabilityScore,
      totalOrders: row.totalOrders,
      additionalPhotos: [],
    });
    await profileRepo.save(profile);
    logger.info({ email: row.email }, 'Producteur seed créé');
  }

  // --- Comptes admin ---
  const admins: User[] = [];
  for (const a of SEED_ADMINS) {
    const admin = userRepo.create({
      id: a.id,
      email: a.email,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      siret: a.siret,
      companyName: a.companyName,
      nafCode: a.nafCode,
      phone: null,
      description: 'Compte admin (seed).',
      profilePhotoUrl: null,
      locationLat: null,
      locationLng: null,
      addressLine: null,
      city: 'Saint-Denis',
      postalCode: '97400',
    });
    await userRepo.save(admin);
    admins.push(admin);
    logger.info({ id: a.id, email: a.email }, 'Admin seed créé');
  }
  const primaryAdminId = admins[0].id;

  // --- Compte producteur en attente d'approbation ---
  const pendingProducer = userRepo.create({
    id: SEED_PENDING_PRODUCER.id,
    email: SEED_PENDING_PRODUCER.email,
    passwordHash,
    role: UserRole.PRODUCER,
    status: UserStatus.PENDING_ADMIN,
    siret: SEED_PENDING_PRODUCER.siret,
    companyName: SEED_PENDING_PRODUCER.companyName,
    nafCode: SEED_PENDING_PRODUCER.nafCode,
    phone: SEED_PENDING_PRODUCER.phone,
    description: SEED_PENDING_PRODUCER.description,
    profilePhotoUrl: null,
    locationLat: SEED_PENDING_PRODUCER.locationLat,
    locationLng: SEED_PENDING_PRODUCER.locationLng,
    addressLine: SEED_PENDING_PRODUCER.addressLine,
    city: SEED_PENDING_PRODUCER.city,
    postalCode: SEED_PENDING_PRODUCER.postalCode,
  });
  await userRepo.save(pendingProducer);
  await profileRepo.save(
    profileRepo.create({
      user: pendingProducer,
      publicLocationLat: SEED_PENDING_PRODUCER.locationLat,
      publicLocationLng: SEED_PENDING_PRODUCER.locationLng,
      averageRating: 0,
      totalRatings: 0,
      reliabilityScore: 0,
      totalOrders: 0,
      additionalPhotos: [],
    }),
  );

  // --- Compte commerçant en attente d'approbation ---
  const pendingBuyer = userRepo.create({
    id: SEED_PENDING_BUYER.id,
    email: SEED_PENDING_BUYER.email,
    passwordHash,
    role: UserRole.BUYER,
    status: UserStatus.PENDING_ADMIN,
    siret: SEED_PENDING_BUYER.siret,
    companyName: SEED_PENDING_BUYER.companyName,
    nafCode: SEED_PENDING_BUYER.nafCode,
    phone: SEED_PENDING_BUYER.phone,
    description: SEED_PENDING_BUYER.description,
    profilePhotoUrl: null,
    locationLat: SEED_PENDING_BUYER.locationLat,
    locationLng: SEED_PENDING_BUYER.locationLng,
    addressLine: SEED_PENDING_BUYER.addressLine,
    city: SEED_PENDING_BUYER.city,
    postalCode: SEED_PENDING_BUYER.postalCode,
  });
  await userRepo.save(pendingBuyer);

  // --- Compte producteur suspendu ---
  const suspendedProducer = userRepo.create({
    id: SEED_SUSPENDED_PRODUCER.id,
    email: SEED_SUSPENDED_PRODUCER.email,
    passwordHash,
    role: UserRole.PRODUCER,
    status: UserStatus.SUSPENDED,
    siret: SEED_SUSPENDED_PRODUCER.siret,
    companyName: SEED_SUSPENDED_PRODUCER.companyName,
    nafCode: SEED_SUSPENDED_PRODUCER.nafCode,
    phone: SEED_SUSPENDED_PRODUCER.phone,
    description: SEED_SUSPENDED_PRODUCER.description,
    profilePhotoUrl: null,
    locationLat: SEED_SUSPENDED_PRODUCER.locationLat,
    locationLng: SEED_SUSPENDED_PRODUCER.locationLng,
    addressLine: SEED_SUSPENDED_PRODUCER.addressLine,
    city: SEED_SUSPENDED_PRODUCER.city,
    postalCode: SEED_SUSPENDED_PRODUCER.postalCode,
  });
  await userRepo.save(suspendedProducer);
  await profileRepo.save(
    profileRepo.create({
      user: suspendedProducer,
      publicLocationLat: SEED_SUSPENDED_PRODUCER.locationLat,
      publicLocationLng: SEED_SUSPENDED_PRODUCER.locationLng,
      averageRating: 3.4,
      totalRatings: 4,
      reliabilityScore: 60,
      totalOrders: 3,
      additionalPhotos: [],
    }),
  );

  logger.info(
    {
      pendingProducerId: pendingProducer.id,
      pendingBuyerId: pendingBuyer.id,
      suspendedProducerId: suspendedProducer.id,
    },
    'Comptes en attente / suspendu créés',
  );

  // --- Pré-inscriptions ---
  const preRegRepo = AppDataSource.getRepository(PreRegistration);
  const fourteenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  for (const row of SEED_PRE_REGISTRATIONS) {
    const isPendingEmail = row.status === 'pending_email';
    const isInvited = row.status === 'invited';
    let confirmationTokenHash: string | null = null;
    let confirmationTokenExpiresAt: Date | null = null;
    let inviteTokenHash: string | null = null;

    if (isPendingEmail) {
      const t = randomBytes(32).toString('hex');
      confirmationTokenHash = createHash('sha256').update(t).digest('hex');
      confirmationTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    if (isInvited) {
      // Token connu pour pouvoir tester l'invitation à la main si besoin.
      const t = `seed-invite-${row.id}`;
      inviteTokenHash = createHash('sha256').update(t).digest('hex');
    }

    await preRegRepo.save(
      preRegRepo.create({
        id: row.id,
        email: row.email,
        role: row.role as PreRegistrationRole,
        companyName: row.companyName,
        siret: row.siret,
        phone: row.phone,
        city: row.city,
        postalCode: row.postalCode,
        message: row.message,
        consentRgpd: row.consentRgpd,
        status: row.status as PreRegistrationStatus,
        source: 'seed',
        confirmationTokenHash,
        confirmationTokenExpiresAt,
        emailConfirmedAt:
          'emailConfirmed' in row && row.emailConfirmed ? new Date() : null,
        inviteTokenHash,
        inviteTokenExpiresAt: isInvited ? fourteenDaysFromNow : null,
        invitedAt: isInvited ? new Date() : null,
        acceptedAt: null,
        acceptedUserId: null,
        createdIp: null,
      }),
    );
  }
  logger.info(
    { count: SEED_PRE_REGISTRATIONS.length },
    'Pré-inscriptions seed créées',
  );

  // --- Signalements ---
  const reportRepo = AppDataSource.getRepository(Report);
  const reporterId = demoBuyer.id;
  const targetUserId = demoProducer.id;
  const targetMessageId = SEED_DEMO_MESSAGES[1].id;

  for (const row of SEED_REPORTS) {
    await reportRepo.save(
      reportRepo.create({
        id: row.id,
        reporterId,
        targetUserId: row.targetType === 'user' ? targetUserId : null,
        targetMessageId: row.targetType === 'message' ? targetMessageId : null,
        category: row.category as ReportCategory,
        description: row.description,
        status: row.status as ReportStatus,
        adminNotes: row.adminNotes,
        resolvedAt:
          row.status === 'resolved' || (row.status as string) === 'dismissed'
            ? new Date()
            : null,
      }),
    );
  }
  logger.info({ count: SEED_REPORTS.length }, 'Signalements seed créés');

  // --- Audit log : trace initiale "seed" ---
  const auditRepo = AppDataSource.getRepository(AdminAuditLog);
  await auditRepo.save(
    auditRepo.create({
      adminId: primaryAdminId,
      action: 'seed.bootstrap',
      targetType: AdminAuditTargetType.SYSTEM,
      targetId: null,
      payload: {
        producers: SEED_PRODUCERS.length,
        demoOrders: SEED_DEMO_ORDERS.length,
        preRegistrations: SEED_PRE_REGISTRATIONS.length,
        reports: SEED_REPORTS.length,
      },
    }),
  );
  // Une trace réaliste : l'admin a "approuvé" le commerçant démo (déjà actif).
  await auditRepo.save(
    auditRepo.create({
      adminId: primaryAdminId,
      action: 'user.approve',
      targetType: AdminAuditTargetType.USER,
      targetId: demoBuyer.id,
      payload: { source: 'seed' },
    }),
  );
  // Et un signalement "résolu" est tracé.
  const resolvedReport = SEED_REPORTS.find((r) => r.status === 'resolved');
  if (resolvedReport) {
    await auditRepo.save(
      auditRepo.create({
        adminId: primaryAdminId,
        action: 'report.resolve',
        targetType: AdminAuditTargetType.REPORT,
        targetId: resolvedReport.id,
        payload: { status: 'resolved', source: 'seed' },
      }),
    );
  }

  logger.info(
    {
      bulkProducers: SEED_PRODUCERS.length,
      admins: SEED_ADMINS.length,
      preRegistrations: SEED_PRE_REGISTRATIONS.length,
      reports: SEED_REPORTS.length,
      demoProducerId: SEED_DEMO_PRODUCER.id,
      demoBuyerId: SEED_DEMO_BUYER.id,
      password: SEED_SHARED_PASSWORD,
    },
    'Seed terminé — voir backend/SEED-COMPTES.md pour les identifiants des comptes démo',
  );

  await AppDataSource.destroy();
}

run().catch((err: unknown) => {
  logger.error({ err }, 'Échec du seed');
  process.exit(1);
});
