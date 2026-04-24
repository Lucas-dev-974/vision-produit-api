import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserRole } from '../entities/user.entity';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

const accessSignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES,
} as SignOptions;
const refreshSignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES,
} as SignOptions;

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, accessSignOptions);

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, refreshSignOptions);

export const verifyRefreshToken = (token: string): { sub: string } =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };

const MESSAGING_WS_AUDIENCE = 'messaging-ws';

/** Jeton très court (2 min) dédié à la poignée de main WebSocket (évite de passer le cookie cross-origin). */
export const signMessagingWsTicket = (payload: AccessTokenPayload): string =>
  jwt.sign(
    { sub: payload.sub, role: payload.role, aud: MESSAGING_WS_AUDIENCE },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '120s' },
  );

export function verifyMessagingWsTicket(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload & {
    aud?: string;
  };
  if (decoded.aud !== MESSAGING_WS_AUDIENCE) {
    throw new Error('Invalid WS ticket');
  }
  return { sub: decoded.sub, role: decoded.role };
}
