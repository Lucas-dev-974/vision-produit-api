import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import { parse as parseUrl } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../../lib/logger';
import { verifyMessagingWsTicket } from '../../lib/jwt';
import { UserRole } from '../../entities/user.entity';
import { addMessagingSocket, removeMessagingSocket } from './messaging.hub';
import { checkMessagingWsRateLimit } from './messaging.rate-limit';
import { conversationsService } from '../conversations/conversations.service';
import { AppError } from '../../common/errors/app-error';
import { z } from 'zod';

const WS_PATH = '/v1/messaging/ws';

const clientSendSchema = z.object({
  type: z.literal('send'),
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

const clientPingSchema = z.object({
  type: z.literal('ping'),
});

function parseTicket(req: IncomingMessage): string | null {
  const q = parseUrl(req.url ?? '', true).query;
  const t = q.ticket;
  return typeof t === 'string' && t.length > 0 ? t : null;
}

function safeSend(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

export function attachMessagingWebSocket(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = parseUrl(request.url ?? '', true).pathname ?? '';
    if (pathname !== WS_PATH) {
      return;
    }
    const ticket = parseTicket(request);
    if (!ticket) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    let userId: string;
    try {
      const p = verifyMessagingWsTicket(ticket);
      userId = p.sub;
      if (p.role === UserRole.ADMIN) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, userId);
    });
  });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage, userId: string) => {
    addMessagingSocket(userId, ws);
    safeSend(ws, { type: 'ready', userId });

    ws.on('message', async (raw) => {
      let data: unknown;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        safeSend(ws, { type: 'error', code: 'BAD_JSON', message: 'JSON invalide' });
        return;
      }

      const ping = clientPingSchema.safeParse(data);
      if (ping.success) {
        safeSend(ws, { type: 'pong' });
        return;
      }

      const send = clientSendSchema.safeParse(data);
      if (!send.success) {
        safeSend(ws, {
          type: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Message client invalide',
        });
        return;
      }

      if (!checkMessagingWsRateLimit(userId, 90, 60_000)) {
        safeSend(ws, { type: 'error', code: 'RATE_LIMIT', message: 'Trop de messages' });
        return;
      }

      try {
        const msg = await conversationsService.postMessage(
          send.data.conversationId,
          userId,
          send.data.content,
        );
        safeSend(ws, { type: 'ack', message: msg });
      } catch (err: unknown) {
        if (err instanceof AppError) {
          safeSend(ws, { type: 'error', code: err.code, message: err.message });
          return;
        }
        safeSend(ws, { type: 'error', code: 'SEND_FAILED', message: 'Envoi impossible' });
      }
    });

    ws.on('close', () => {
      removeMessagingSocket(userId, ws);
    });

    ws.on('error', (err) => {
      logger.warn({ err, userId }, 'WebSocket messagerie erreur');
      removeMessagingSocket(userId, ws);
    });
  });
}
