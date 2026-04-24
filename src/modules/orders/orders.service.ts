import { In, type EntityManager } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { AppError } from '../../common/errors/app-error';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Stock } from '../../entities/stock.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';

export interface OrderListRow {
  id: string;
  status: OrderStatus;
  retrievalDate: string;
  retrievalTimeSlot: string | null;
  createdAt: Date;
  counterpartyCompanyName: string | null;
  itemsCount: number;
  /** True s’il y a un suivi d’évolution de commande (statut) non pris en compte par ce rôle. */
  unread: boolean;
}

export interface OrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  unit: string;
  unitPriceSnapshot: string;
}

export interface OrderDetailDto {
  id: string;
  buyerId: string;
  producerId: string;
  status: OrderStatus;
  retrievalDate: string;
  retrievalTimeSlot: string | null;
  note: string | null;
  cancellationReason: string | null;
  refusalReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  buyer: { id: string; companyName: string | null };
  producer: { id: string; companyName: string | null };
  items: OrderItemDetail[];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function orderUnreadForRole(order: Order, role: UserRole): boolean {
  const rev = order.notifRevision ?? 1;
  if (role === UserRole.BUYER) {
    const ack = order.buyerNotifRevisionAck ?? 0;
    return rev > ack;
  }
  if (role === UserRole.PRODUCER) {
    const ack = order.producerNotifRevisionAck ?? 0;
    return rev > ack;
  }
  return false;
}

/** Incrémente la révision « événement commande » et met l’acteur à jour (il a connaissance du nouvel état). */
function applyNotifOnMutation(order: Order, actor: 'buyer' | 'producer'): void {
  const r = (order.notifRevision ?? 1) + 1;
  order.notifRevision = r;
  if (actor === 'buyer') {
    order.buyerNotifRevisionAck = r;
  } else {
    order.producerNotifRevisionAck = r;
  }
}

async function allocateAndDecrement(
  manager: EntityManager,
  producerId: string,
  productId: string,
  quantityNeeded: number,
): Promise<void> {
  const stockRepo = manager.getRepository(Stock);
  const stocks = await stockRepo
    .createQueryBuilder('s')
    .innerJoin('s.product', 'p')
    .where('p.id = :productId', { productId })
    .andWhere('p.producer_id = :producerId', { producerId })
    .andWhere('s.expires_at >= CURRENT_DATE')
    .andWhere('s.quantity::numeric > 0')
    .orderBy('s.expires_at', 'ASC')
    .addOrderBy('s.id', 'ASC')
    .setLock('pessimistic_write')
    .getMany();

  let remaining = quantityNeeded;
  for (const s of stocks) {
    const avail = parseFloat(s.quantity);
    if (avail <= 1e-9) continue;
    if (avail + 1e-9 >= remaining) {
      s.quantity = (avail - remaining).toFixed(2);
      await stockRepo.save(s);
      remaining = 0;
      break;
    }
    remaining -= avail;
    s.quantity = '0.00';
    await stockRepo.save(s);
  }
  if (remaining > 1e-6) {
    throw new AppError(
      'CONFLICT',
      'Stock insuffisant pour honorer la commande',
      409,
    );
  }
}

export const ordersService = {
  async create(
    buyerId: string,
    input: {
      producerId: string;
      retrievalDate: string;
      retrievalTimeSlot: string | null | undefined;
      note: string | null | undefined;
      items: { stockId: string; quantity: number }[];
    },
  ): Promise<OrderDetailDto> {
    if (buyerId === input.producerId) {
      throw new AppError('VALIDATION_ERROR', 'Commande invalide', 400);
    }

    const userRepo = AppDataSource.getRepository(User);
    const buyer = await userRepo.findOne({ where: { id: buyerId } });
    if (!buyer || buyer.status !== UserStatus.ACTIVE || buyer.role !== UserRole.BUYER) {
      throw new AppError('FORBIDDEN', 'Compte acheteur invalide', 403);
    }

    const producer = await userRepo.findOne({ where: { id: input.producerId } });
    if (
      !producer ||
      producer.status !== UserStatus.ACTIVE ||
      producer.role !== UserRole.PRODUCER
    ) {
      throw new AppError('NOT_FOUND', 'Producteur introuvable', 404);
    }

    const today = todayIsoDate();
    if (input.retrievalDate < today) {
      throw new AppError(
        'VALIDATION_ERROR',
        'La date de retrait ne peut pas être dans le passé',
        400,
      );
    }

    const sortedIds = [...new Set(input.items.map((i) => i.stockId))].sort();
    let createdOrderId = '';
    await AppDataSource.transaction(async (manager) => {
      const stockRepo = manager.getRepository(Stock);
      const stocks = await stockRepo
        .createQueryBuilder('s')
        .innerJoinAndSelect('s.product', 'p')
        .where('s.id IN (:...ids)', { ids: sortedIds })
        .orderBy('s.id', 'ASC')
        .setLock('pessimistic_write')
        .getMany();

      if (stocks.length !== sortedIds.length) {
        throw new AppError('NOT_FOUND', 'Stock introuvable', 404);
      }

      const byId = new Map(stocks.map((s) => [s.id, s]));
      for (const line of input.items) {
        const s = byId.get(line.stockId)!;
        if (s.product.producerId !== input.producerId) {
          throw new AppError('VALIDATION_ERROR', 'Stock ne correspond pas au producteur', 400);
        }
        if (s.expiresAt < today) {
          throw new AppError('VALIDATION_ERROR', 'Stock expiré', 400);
        }
        if (s.availableFrom > input.retrievalDate || s.expiresAt < input.retrievalDate) {
          throw new AppError(
            'VALIDATION_ERROR',
            'La date de retrait est hors fenêtre de disponibilité du stock',
            400,
          );
        }
        const avail = parseFloat(s.quantity);
        if (avail + 1e-9 < line.quantity) {
          throw new AppError('CONFLICT', 'Quantité demandée supérieure au stock', 409);
        }
      }

      const orderRepo = manager.getRepository(Order);
      const order = orderRepo.create({
        buyerId,
        producerId: input.producerId,
        status: OrderStatus.PENDING,
        retrievalDate: input.retrievalDate,
        retrievalTimeSlot: input.retrievalTimeSlot ?? null,
        note: input.note ?? null,
        cancellationReason: null,
        refusalReason: null,
        notifRevision: 1,
        buyerNotifRevisionAck: 1,
        producerNotifRevisionAck: 0,
      });
      await orderRepo.save(order);
      createdOrderId = order.id;

      const itemRepo = manager.getRepository(OrderItem);
      for (const line of input.items) {
        const s = byId.get(line.stockId)!;
        const item = itemRepo.create({
          orderId: order.id,
          productId: s.productId,
          quantity: line.quantity.toFixed(2),
          unit: s.unit,
          unitPriceSnapshot: s.unitPrice,
        });
        await itemRepo.save(item);
      }
    });

    return ordersService.getByIdForParticipant(createdOrderId, buyerId);
  },

  async listMine(
    userId: string,
    role: UserRole,
    page: number,
    pageSize: number,
  ): Promise<{ rows: OrderListRow[]; total: number }> {
    if (role !== UserRole.BUYER && role !== UserRole.PRODUCER) {
      throw new AppError('FORBIDDEN', 'Droits insuffisants', 403);
    }

    const orderRepo = AppDataSource.getRepository(Order);
    const where =
      role === UserRole.BUYER ? { buyerId: userId } : { producerId: userId };

    const [orders, total] = await orderRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    if (orders.length === 0) {
      return { rows: [], total };
    }

    const ids = orders.map((o) => o.id);
    const itemRepo = AppDataSource.getRepository(OrderItem);
    const countRows = await itemRepo
      .createQueryBuilder('i')
      .select('i.order_id', 'order_id')
      .addSelect('COUNT(i.id)', 'cnt')
      .where('i.order_id IN (:...ids)', { ids })
      .groupBy('i.order_id')
      .getRawMany<{ order_id: string; cnt: string }>();

    const countMap = new Map<string, number>();
    for (const r of countRows) {
      countMap.set(r.order_id, Number(r.cnt));
    }

    const counterpartyIds = orders.map((o) =>
      role === UserRole.BUYER ? o.producerId : o.buyerId,
    );
    const counterparties = await AppDataSource.getRepository(User).find({
      where: { id: In(counterpartyIds) },
      select: ['id', 'companyName'],
    });
    const nameMap = new Map(counterparties.map((u) => [u.id, u.companyName]));

    const rows: OrderListRow[] = orders.map((o) => ({
      id: o.id,
      status: o.status,
      retrievalDate: o.retrievalDate,
      retrievalTimeSlot: o.retrievalTimeSlot,
      createdAt: o.createdAt,
      counterpartyCompanyName:
        nameMap.get(role === UserRole.BUYER ? o.producerId : o.buyerId) ?? null,
      itemsCount: countMap.get(o.id) ?? 0,
      unread: orderUnreadForRole(o, role),
    }));

    return { rows, total };
  },

  async acknowledgeSeen(orderId: string, userId: string, role: UserRole): Promise<void> {
    if (role !== UserRole.BUYER && role !== UserRole.PRODUCER) {
      throw new AppError('FORBIDDEN', 'Droits insuffisants', 403);
    }
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { id: orderId },
      select: ['id', 'buyerId', 'producerId'],
    });
    if (!order) {
      throw new AppError('NOT_FOUND', 'Commande introuvable', 404);
    }
    if (order.buyerId !== userId && order.producerId !== userId) {
      throw new AppError('FORBIDDEN', 'Accès refusé', 403);
    }

    // Aligner l’acquittement sur la dernière révision « suivi de statut » sans toucher
    // à updated_at (évite que la simple lecture fasse re-surgir des notifs côté autre rôle).
    if (role === UserRole.BUYER) {
      await orderRepo.query(
        `UPDATE orders SET buyer_notif_ack = notif_revision WHERE id = $1 AND buyer_id = $2`,
        [orderId, userId],
      );
    } else {
      await orderRepo.query(
        `UPDATE orders SET producer_notif_ack = notif_revision WHERE id = $1 AND producer_id = $2`,
        [orderId, userId],
      );
    }
  },

  async getByIdForParticipant(orderId: string, userId: string): Promise<OrderDetailDto> {
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new AppError('NOT_FOUND', 'Commande introuvable', 404);
    }
    if (order.buyerId !== userId && order.producerId !== userId) {
      throw new AppError('FORBIDDEN', 'Accès refusé', 403);
    }

    const userRepo = AppDataSource.getRepository(User);
    const [buyer, producer] = await Promise.all([
      userRepo.findOne({
        where: { id: order.buyerId },
        select: ['id', 'companyName'],
      }),
      userRepo.findOne({
        where: { id: order.producerId },
        select: ['id', 'companyName'],
      }),
    ]);

    const itemRepo = AppDataSource.getRepository(OrderItem);
    const items = await itemRepo.find({
      where: { orderId },
      relations: { product: true },
      order: { id: 'ASC' },
    });

    const itemDtos: OrderItemDetail[] = items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      unit: i.unit,
      unitPriceSnapshot: i.unitPriceSnapshot,
    }));

    return {
      id: order.id,
      buyerId: order.buyerId,
      producerId: order.producerId,
      status: order.status,
      retrievalDate: order.retrievalDate,
      retrievalTimeSlot: order.retrievalTimeSlot,
      note: order.note,
      cancellationReason: order.cancellationReason,
      refusalReason: order.refusalReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      buyer: { id: buyer!.id, companyName: buyer!.companyName },
      producer: { id: producer!.id, companyName: producer!.companyName },
      items: itemDtos,
    };
  },

  async accept(orderId: string, producerUserId: string): Promise<OrderDetailDto> {
    await AppDataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo.findOne({
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new AppError('NOT_FOUND', 'Commande introuvable', 404);
      }
      if (order.producerId !== producerUserId) {
        throw new AppError('FORBIDDEN', 'Accès refusé', 403);
      }
      if (order.status !== OrderStatus.PENDING) {
        throw new AppError('CONFLICT', 'La commande ne peut pas être acceptée', 409);
      }

      const itemRepo = manager.getRepository(OrderItem);
      const lines = await itemRepo.find({ where: { orderId: order.id } });
      for (const line of lines) {
        await allocateAndDecrement(
          manager,
          order.producerId,
          line.productId,
          parseFloat(line.quantity),
        );
      }
      applyNotifOnMutation(order, 'producer');
      order.status = OrderStatus.ACCEPTED;
      await orderRepo.save(order);
    });

    return ordersService.getByIdForParticipant(orderId, producerUserId);
  },

  async refuse(
    orderId: string,
    producerUserId: string,
    reason: string,
  ): Promise<OrderDetailDto> {
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new AppError('NOT_FOUND', 'Commande introuvable', 404);
    }
    if (order.producerId !== producerUserId) {
      throw new AppError('FORBIDDEN', 'Accès refusé', 403);
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new AppError('CONFLICT', 'La commande ne peut pas être refusée', 409);
    }
    applyNotifOnMutation(order, 'producer');
    order.status = OrderStatus.REFUSED;
    order.refusalReason = reason;
    await orderRepo.save(order);
    return ordersService.getByIdForParticipant(orderId, producerUserId);
  },

  async cancel(orderId: string, userId: string, reason: string): Promise<OrderDetailDto> {
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new AppError('NOT_FOUND', 'Commande introuvable', 404);
    }
    if (order.buyerId !== userId && order.producerId !== userId) {
      throw new AppError('FORBIDDEN', 'Accès refusé', 403);
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new AppError(
        'CONFLICT',
        'Seules les commandes en attente peuvent être annulées',
        409,
      );
    }
    const who: 'buyer' | 'producer' = order.buyerId === userId ? 'buyer' : 'producer';
    applyNotifOnMutation(order, who);
    order.status = OrderStatus.CANCELLED;
    order.cancellationReason = reason;
    await orderRepo.save(order);
    return ordersService.getByIdForParticipant(orderId, userId);
  },

  async markHonored(orderId: string, userId: string): Promise<OrderDetailDto> {
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new AppError('NOT_FOUND', 'Commande introuvable', 404);
    }
    if (order.buyerId !== userId && order.producerId !== userId) {
      throw new AppError('FORBIDDEN', 'Accès refusé', 403);
    }
    if (
      order.status !== OrderStatus.ACCEPTED &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new AppError('CONFLICT', 'Statut incompatible', 409);
    }
    const who: 'buyer' | 'producer' = order.buyerId === userId ? 'buyer' : 'producer';
    applyNotifOnMutation(order, who);
    order.status = OrderStatus.HONORED;
    await orderRepo.save(order);
    return ordersService.getByIdForParticipant(orderId, userId);
  },

  async markNotHonored(orderId: string, userId: string): Promise<OrderDetailDto> {
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new AppError('NOT_FOUND', 'Commande introuvable', 404);
    }
    if (order.buyerId !== userId && order.producerId !== userId) {
      throw new AppError('FORBIDDEN', 'Accès refusé', 403);
    }
    if (
      order.status !== OrderStatus.ACCEPTED &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new AppError('CONFLICT', 'Statut incompatible', 409);
    }
    const who: 'buyer' | 'producer' = order.buyerId === userId ? 'buyer' : 'producer';
    applyNotifOnMutation(order, who);
    order.status = OrderStatus.NOT_HONORED;
    await orderRepo.save(order);
    return ordersService.getByIdForParticipant(orderId, userId);
  },
};
