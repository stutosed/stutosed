import 'server-only';
import { turso } from '@/server/db/turso';

export interface PushTokenRecord {
  token: string;
  userId: string | null;
  platform: string;
  deviceName: string | null;
  updatedAt: string;
}

let tableEnsured = false;

async function ensurePushTokensTable(): Promise<void> {
  if (tableEnsured) return;
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS user_push_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT,
      platform TEXT NOT NULL DEFAULT 'android',
      device_name TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  tableEnsured = true;
}

export async function upsertPushToken(params: {
  token: string;
  userId?: string | null;
  platform: string;
  deviceName?: string | null;
}): Promise<void> {
  await ensurePushTokensTable();
  await turso.execute({
    sql: `INSERT INTO user_push_tokens (token, user_id, platform, device_name, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'))
          ON CONFLICT(token) DO UPDATE SET
            user_id = COALESCE(excluded.user_id, user_push_tokens.user_id),
            platform = excluded.platform,
            device_name = COALESCE(excluded.device_name, user_push_tokens.device_name),
            updated_at = datetime('now')`,
    args: [params.token, params.userId || null, params.platform, params.deviceName || null],
  });
}

export async function listPushTokens(userId?: string): Promise<PushTokenRecord[]> {
  await ensurePushTokensTable();
  const res = userId
    ? await turso.execute({
        sql: 'SELECT token, user_id, platform, device_name, updated_at FROM user_push_tokens WHERE user_id = ?',
        args: [userId],
      })
    : await turso.execute({
        sql: 'SELECT token, user_id, platform, device_name, updated_at FROM user_push_tokens',
        args: [],
      });

  return res.rows.map((r: any) => ({
    token: String(r.token),
    userId: r.user_id ? String(r.user_id) : null,
    platform: String(r.platform || 'android'),
    deviceName: r.device_name ? String(r.device_name) : null,
    updatedAt: String(r.updated_at || ''),
  }));
}
