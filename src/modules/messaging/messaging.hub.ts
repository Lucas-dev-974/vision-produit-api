import { WebSocket } from 'ws';

const socketsByUser = new Map<string, Set<WebSocket>>();

export function addMessagingSocket(userId: string, ws: WebSocket): void {
  let set = socketsByUser.get(userId);
  if (!set) {
    set = new Set();
    socketsByUser.set(userId, set);
  }
  set.add(ws);
}

export function removeMessagingSocket(userId: string, ws: WebSocket): void {
  const set = socketsByUser.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) socketsByUser.delete(userId);
}

/** Envoie un message JSON à toutes les sessions WebSocket ouvertes des utilisateurs donnés. */
export function broadcastToUsers(userIds: string[], payload: unknown): void {
  const str = JSON.stringify(payload);
  for (const uid of new Set(userIds)) {
    const set = socketsByUser.get(uid);
    if (!set) continue;
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(str);
      }
    }
  }
}
