/** 通用 TTL 缓存（落在 Postgres cache 表），用于外部 API 响应等。async（Neon HTTP driver）。 */
import { eq } from 'drizzle-orm';
import { db } from './index';
import { cache } from './schema';

export async function cacheGet<T>(key: string): Promise<T | null> {
  const rows = await db.select().from(cache).where(eq(cache.key, key)).limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt < new Date()) {
    await db.delete(cache).where(eq(cache.key, key));
    return null;
  }
  return JSON.parse(row.value) as T;
}

export async function cacheSet(key: string, value: unknown, ttlHours: number): Promise<void> {
  const now = new Date();
  const expires = new Date(now.getTime() + ttlHours * 3600_000);
  await db
    .insert(cache)
    .values({
      key,
      value: JSON.stringify(value),
      expiresAt: expires,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: cache.key,
      set: { value: JSON.stringify(value), expiresAt: expires },
    });
}
