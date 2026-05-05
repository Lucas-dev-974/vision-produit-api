import { AppDataSource } from '../../config/data-source';
import {
  AdminAuditLog,
  AdminAuditTargetType,
} from '../../entities/admin-audit-log.entity';

export interface AdminAuditEntry {
  adminId: string | null;
  action: string;
  targetType: AdminAuditTargetType;
  targetId?: string | null;
  payload?: Record<string, unknown> | null;
}

/**
 * Helpers pour insérer des entrées dans `admin_audit_logs`. Toutes les actions
 * sensibles du back-office (approve, reject, suspend, resolve, invite, …)
 * doivent passer par là afin de conserver une traçabilité.
 *
 * Les erreurs d'écriture ne doivent pas casser l'action métier : on log et on
 * laisse passer.
 */
export const adminAuditService = {
  async record(entry: AdminAuditEntry): Promise<void> {
    try {
      const repo = AppDataSource.getRepository(AdminAuditLog);
      await repo.save(
        repo.create({
          adminId: entry.adminId,
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId ?? null,
          payload: entry.payload ?? null,
        }),
      );
    } catch {
      // Volontairement silencieux : pas de blocage métier sur un audit.
    }
  },
};
