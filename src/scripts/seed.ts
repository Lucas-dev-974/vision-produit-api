import 'reflect-metadata';
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
  SEED_DEMO_BUYER,
  SEED_DEMO_CONVERSATION,
  SEED_DEMO_MESSAGES,
  SEED_DEMO_ORDERS,
  SEED_DEMO_PRODUCTS,
  SEED_DEMO_PRODUCER,
  SEED_DEMO_STOCKS,
  SEED_PRODUCERS,
  SEED_SHARED_PASSWORD,
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

  logger.info(
    {
      bulkProducers: SEED_PRODUCERS.length,
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
