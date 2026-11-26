import 'server-only';
import { turso } from '@/server/db/turso';

export interface MobileAuthHandoffPayload {
  setCookie: string;
  user: {
    id: string;
    email?: string;
    name?: string;
    image?: string | null;
  };
}

const HANDOFF_PREFIX = 'mobile-handoff:';

export async function saveMobileAuthHandoff(
  token: string,
  payload: MobileAuthHandoffPayload
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes TTL
  const identifier = `${HANDOFF_PREFIX}${token}`;
  const id = `mah_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  // Clear any stale entries with same token first
  await turso.execute({
    sql: 'DELETE FROM verification WHERE identifier = ?',
    args: [identifier],
  });

  await turso.execute({
    sql: `INSERT INTO verification (id, identifier, value, expiresAt, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      identifier,
      JSON.stringify(payload),
      expiresAt.toISOString(),
      now.toISOString(),
      now.toISOString(),
    ],
  });
}

export async function consumeMobileAuthHandoff(
  token: string
): Promise<MobileAuthHandoffPayload | null> {
  const identifier = `${HANDOFF_PREFIX}${token}`;
  const res = await turso.execute({
    sql: 'SELECT id, value, expiresAt FROM verification WHERE identifier = ? LIMIT 1',
    args: [identifier],
  });

  if (!res.rows || res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0] as any;
  const expiresMs = new Date(String(row.expiresAt)).getTime();

  // Delete immediately (one-time handoff consumption)
  await turso.execute({
    sql: 'DELETE FROM verification WHERE id = ?',
    args: [String(row.id)],
  });

  if (Number.isNaN(expiresMs) || expiresMs < Date.now()) {
    return null;
  }

  try {
    return JSON.parse(String(row.value)) as MobileAuthHandoffPayload;
  } catch {
    return null;
  }
}
