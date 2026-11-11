/** 免费额度：按 subject 统计最近 7 天使用次数（Free 每周 quota 次）。
 *  subject = 外部实体标识（user_id / email / 第三方 ID），接入业务时传你的实体键即可。 */
import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { usage } from '@/lib/db/schema';
import { PRICING } from '@/config/pricing';

const WEEK_MS = 7 * 24 * 3600_000;

export async function weeklyUsage(subject: string): Promise<number> {
  const rows = await db
    .select()
    .from(usage)
    .where(and(eq(usage.subject, subject), gte(usage.createdAt, new Date(Date.now() - WEEK_MS))));
  return rows.length;
}

export async function remainingFree(subject: string): Promise<number> {
  return Math.max(0, PRICING.free.weeklyQuota - (await weeklyUsage(subject)));
}

export async function recordUsage(subject: string): Promise<void> {
  await db.insert(usage).values({ subject });
}

export async function recentUsageTimeline(limit = 50) {
  return db.select().from(usage).orderBy(desc(usage.createdAt)).limit(limit);
}
