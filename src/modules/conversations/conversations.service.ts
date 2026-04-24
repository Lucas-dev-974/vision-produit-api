import { AppDataSource } from '../../config/data-source';
import { AppError } from '../../common/errors/app-error';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Conversation } from '../../entities/conversation.entity';
import { Message } from '../../entities/message.entity';
import { In, IsNull, Not } from 'typeorm';
import { broadcastToUsers } from '../messaging/messaging.hub';

export interface ConversationPeerDto {
  id: string;
  email: string;
  companyName: string | null;
  role: UserRole;
}

export interface ConversationListItemDto {
  id: string;
  peer: ConversationPeerDto;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  /** Messages reçus non lus (interlocuteur). */
  unreadCount: number;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

function assertParticipant(conv: Conversation, userId: string): void {
  if (conv.buyerId !== userId && conv.producerId !== userId) {
    throw new AppError('FORBIDDEN', 'Accès à cette conversation refusé', 403);
  }
}

function toMessageDto(m: Message): MessageDto {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    content: m.content,
    readAt: m.readAt ? m.readAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
  };
}

async function unreadCountsForConversations(
  userId: string,
  conversationIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (conversationIds.length === 0) return map;
  const msgRepo = AppDataSource.getRepository(Message);
  const rows = await msgRepo
    .createQueryBuilder('m')
    .select('m.conversationId', 'cid')
    .addSelect('COUNT(m.id)', 'cnt')
    .where('m.conversationId IN (:...ids)', { ids: conversationIds })
    .andWhere('m.senderId != :uid', { uid: userId })
    .andWhere('m.readAt IS NULL')
    .groupBy('m.conversationId')
    .getRawMany<{ cid: string; cnt: string }>();
  for (const r of rows) {
    map.set(r.cid, Number(r.cnt));
  }
  return map;
}

async function loadLastPreviews(
  conversationIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (conversationIds.length === 0) return map;
  const msgRepo = AppDataSource.getRepository(Message);
  const rows = await msgRepo
    .createQueryBuilder('m')
    .distinctOn(['m.conversationId'])
    .where('m.conversationId IN (:...ids)', { ids: conversationIds })
    .orderBy('m.conversationId')
    .addOrderBy('m.createdAt', 'DESC')
    .getMany();
  for (const m of rows) {
    map.set(m.conversationId, m.content.length > 120 ? `${m.content.slice(0, 117)}…` : m.content);
  }
  return map;
}

export const conversationsService = {
  async listMine(userId: string, role: UserRole): Promise<ConversationListItemDto[]> {
    if (role === UserRole.ADMIN) {
      throw new AppError('FORBIDDEN', 'Messagerie réservée aux comptes acheteur et producteur', 403);
    }
    const convRepo = AppDataSource.getRepository(Conversation);
    const qb = convRepo
      .createQueryBuilder('c')
      .where(
        role === UserRole.BUYER ? 'c.buyer_id = :uid' : 'c.producer_id = :uid',
        { uid: userId },
      )
      .orderBy('c.last_message_at', 'DESC');
    const convs = await qb.getMany();
    if (convs.length === 0) return [];

    const peerIds = convs.map((c) => (role === UserRole.BUYER ? c.producerId : c.buyerId));
    const userRepo = AppDataSource.getRepository(User);
    const peers = await userRepo.find({ where: { id: In(peerIds) } });
    const peerById = new Map(peers.map((u) => [u.id, u]));
    const previews = await loadLastPreviews(convs.map((c) => c.id));
    const unreadMap = await unreadCountsForConversations(userId, convs.map((c) => c.id));

    return convs.map((c) => {
      const peerId = role === UserRole.BUYER ? c.producerId : c.buyerId;
      const peer = peerById.get(peerId);
      if (!peer) {
        throw new AppError('INTERNAL_ERROR', 'Interlocuteur introuvable', 500);
      }
      return {
        id: c.id,
        peer: {
          id: peer.id,
          email: peer.email,
          companyName: peer.companyName,
          role: peer.role,
        },
        lastMessageAt: c.lastMessageAt.toISOString(),
        lastMessagePreview: previews.get(c.id) ?? null,
        unreadCount: unreadMap.get(c.id) ?? 0,
      };
    });
  },

  async getOrCreate(
    userId: string,
    role: UserRole,
    input: { producerId?: string; buyerId?: string },
  ): Promise<ConversationListItemDto> {
    if (role === UserRole.ADMIN) {
      throw new AppError('FORBIDDEN', 'Messagerie réservée aux comptes acheteur et producteur', 403);
    }

    let buyerId: string;
    let producerId: string;
    if (role === UserRole.BUYER) {
      const pid = input.producerId;
      if (!pid) {
        throw new AppError('VALIDATION_ERROR', 'producerId requis', 400);
      }
      buyerId = userId;
      producerId = pid;
    } else {
      const bid = input.buyerId;
      if (!bid) {
        throw new AppError('VALIDATION_ERROR', 'buyerId requis', 400);
      }
      producerId = userId;
      buyerId = bid;
    }

    if (buyerId === producerId) {
      throw new AppError('VALIDATION_ERROR', 'Interlocuteur invalide', 400);
    }

    const userRepo = AppDataSource.getRepository(User);
    const peer = await userRepo.findOne({
      where: { id: role === UserRole.BUYER ? producerId : buyerId },
    });
    if (!peer || peer.status !== UserStatus.ACTIVE) {
      throw new AppError('NOT_FOUND', 'Utilisateur introuvable ou inactif', 404);
    }
    if (role === UserRole.BUYER && peer.role !== UserRole.PRODUCER) {
      throw new AppError('VALIDATION_ERROR', 'L’interlocuteur doit être un producteur', 400);
    }
    if (role === UserRole.PRODUCER && peer.role !== UserRole.BUYER) {
      throw new AppError('VALIDATION_ERROR', 'L’interlocuteur doit être un commerçant', 400);
    }

    const convRepo = AppDataSource.getRepository(Conversation);
    let conv = await convRepo.findOne({ where: { buyerId, producerId } });
    if (!conv) {
      conv = convRepo.create({
        buyerId,
        producerId,
        lastMessageAt: new Date(),
      });
      await convRepo.save(conv);
    }

    const list = await conversationsService.listMine(userId, role);
    const item = list.find((x) => x.id === conv!.id);
    if (!item) {
      throw new AppError('INTERNAL_ERROR', 'Conversation créée mais non listable', 500);
    }
    return item;
  },

  async listMessages(
    conversationId: string,
    userId: string,
    beforeIso: string | undefined,
    limit: number,
  ): Promise<MessageDto[]> {
    const convRepo = AppDataSource.getRepository(Conversation);
    const conv = await convRepo.findOne({ where: { id: conversationId } });
    if (!conv) {
      throw new AppError('NOT_FOUND', 'Conversation introuvable', 404);
    }
    assertParticipant(conv, userId);

    const msgRepo = AppDataSource.getRepository(Message);
    const qb = msgRepo
      .createQueryBuilder('m')
      .where('m.conversation_id = :cid', { cid: conversationId })
      .orderBy('m.created_at', 'DESC')
      .take(limit);
    if (beforeIso) {
      qb.andWhere('m.created_at < :before', { before: new Date(beforeIso) });
    }
    const rows = await qb.getMany();
    return rows.map(toMessageDto).reverse();
  },

  async postMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<MessageDto> {
    const convRepo = AppDataSource.getRepository(Conversation);
    const conv = await convRepo.findOne({ where: { id: conversationId } });
    if (!conv) {
      throw new AppError('NOT_FOUND', 'Conversation introuvable', 404);
    }
    assertParticipant(conv, senderId);

    const trimmed = content.trim();
    if (!trimmed) {
      throw new AppError('VALIDATION_ERROR', 'Message vide', 400);
    }

    const msgRepo = AppDataSource.getRepository(Message);
    const msg = msgRepo.create({
      conversationId,
      senderId,
      content: trimmed.slice(0, 2000),
    });
    await msgRepo.save(msg);
    conv.lastMessageAt = msg.createdAt;
    await convRepo.save(conv);

    const dto = toMessageDto(msg);
    broadcastToUsers([conv.buyerId, conv.producerId], {
      type: 'new_message',
      conversationId,
      message: dto,
    });
    return dto;
  },

  async markMessagesRead(conversationId: string, userId: string): Promise<void> {
    const convRepo = AppDataSource.getRepository(Conversation);
    const conv = await convRepo.findOne({ where: { id: conversationId } });
    if (!conv) {
      throw new AppError('NOT_FOUND', 'Conversation introuvable', 404);
    }
    assertParticipant(conv, userId);
    const msgRepo = AppDataSource.getRepository(Message);
    await msgRepo.update(
      {
        conversationId,
        senderId: Not(userId),
        readAt: IsNull(),
      },
      { readAt: new Date() },
    );
  },

};
