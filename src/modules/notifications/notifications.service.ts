import { AppDataSource } from '../../config/data-source';
import { AppError } from '../../common/errors/app-error';
import { UserRole } from '../../entities/user.entity';
import { Message } from '../../entities/message.entity';
import { Order } from '../../entities/order.entity';

export const notificationsService = {
  async summary(
    userId: string,
    role: UserRole,
  ): Promise<{ unreadMessages: number; unreadOrders: number }> {
    if (role !== UserRole.BUYER && role !== UserRole.PRODUCER) {
      throw new AppError('FORBIDDEN', 'Non disponible pour ce rôle', 403);
    }

    const msgRepo = AppDataSource.getRepository(Message);
    const unreadMessages = await msgRepo
      .createQueryBuilder('m')
      .innerJoin('m.conversation', 'c')
      .where('(c.buyerId = :uid OR c.producerId = :uid)', { uid: userId })
      .andWhere('m.senderId != :uid', { uid: userId })
      .andWhere('m.readAt IS NULL')
      .getCount();

    const orderRepo = AppDataSource.getRepository(Order);
    const qb = orderRepo.createQueryBuilder('o');
    if (role === UserRole.BUYER) {
      qb.where('o.buyerId = :uid', { uid: userId }).andWhere(
        'o.notifRevision > o.buyerNotifRevisionAck',
      );
    } else {
      qb.where('o.producerId = :uid', { uid: userId }).andWhere(
        'o.notifRevision > o.producerNotifRevisionAck',
      );
    }
    const unreadOrders = await qb.getCount();

    return { unreadMessages, unreadOrders };
  },
};
