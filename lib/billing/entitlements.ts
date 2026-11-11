/**
 * 权益存储：billing webhook 唯一写入点。
 * 铁律：① 只信服务端 webhook；② providerEventId 唯一约束保证幂等（重复投递只生效一次）；
 * ③ 前端 success 回调绝不发放权益。
 * subject = 权益归属的外部实体标识（user_id / email / 第三方 ID），与 usage 表口径一致。
 */
import { and, desc, eq, or } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { entitlement as entitlementTable, type Entitlement } from '@/lib/db/schema';
import type { PlanId } from '@/config/pricing';

export type EntitlementStatus = 'active' | 'canceled' | 'expired';

export interface GrantInput {
  provider: string;
  eventId: string;
  plan: PlanId;
  status: EntitlementStatus;
  customerRef?: string | null;
  email?: string | null;
  subject?: string | null;
  organizationId?: string | null;
  currentPeriodEnd?: number | null;
  raw?: unknown;
}

/** 幂等写入一条权益事件。返回 false 表示该事件已处理过（重复投递）。 */
export async function grantFromEvent(input: GrantInput): Promise<boolean> {
  const existingRows = await db
    .select()
    .from(entitlementTable)
    .where(eq(entitlementTable.providerEventId, input.eventId))
    .limit(1);
  if (existingRows[0]) return false;

  await db.insert(entitlementTable).values({
    id: randomUUID(),
    provider: input.provider,
    providerEventId: input.eventId,
    customerRef: input.customerRef ?? null,
    email: input.email ?? null,
    subject: input.subject ?? null,
    organizationId: input.organizationId ?? null,
    plan: input.plan,
    status: input.status,
    currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null,
    raw: input.raw ? JSON.stringify(input.raw) : null,
  });
  return true;
}

/**
 * 撤销：把同一 customerRef 下所有 active 权益翻成 canceled/expired。
 * 场景：Gumroad 的退款/争议/订阅取消事件与首次购买共用 customerRef，
 * 只插入一条 canceled 记录不足以让 latestActive 失效，必须同步翻旧行。
 */
export async function revokeFromEvent(input: {
  provider: string;
  customerRef: string;
  status: Exclude<EntitlementStatus, 'active'>;
}): Promise<number> {
  const rows = await db
    .update(entitlementTable)
    .set({ status: input.status, updatedAt: new Date() })
    .where(
      and(
        eq(entitlementTable.provider, input.provider),
        eq(entitlementTable.customerRef, input.customerRef),
        eq(entitlementTable.status, 'active'),
      ),
    )
    .returning({ id: entitlementTable.id });
  return rows.length;
}

async function latestActive(where: { subject?: string; email?: string }): Promise<Entitlement | undefined> {
  const conditions = [];
  if (where.subject) conditions.push(eq(entitlementTable.subject, where.subject));
  if (where.email) conditions.push(eq(entitlementTable.email, where.email));
  if (conditions.length === 0) return undefined;

  const match = conditions.length === 1 ? conditions[0] : or(...conditions);
  const rows = await db
    .select()
    .from(entitlementTable)
    .where(and(match, eq(entitlementTable.status, 'active')))
    .orderBy(desc(entitlementTable.updatedAt));

  const now = new Date();
  return rows.find((r) => r.currentPeriodEnd === null || r.currentPeriodEnd > now);
}

export async function isEntitled(where: { subject?: string; email?: string }): Promise<boolean> {
  return !!(await latestActive(where));
}

export async function activePlan(where: { subject?: string; email?: string }): Promise<PlanId | 'free'> {
  const row = await latestActive(where);
  return (row?.plan as PlanId) ?? 'free';
}

export async function countActive(): Promise<number> {
  const rows = await db
    .select()
    .from(entitlementTable)
    .where(eq(entitlementTable.status, 'active'));
  const now = new Date();
  return rows.filter((r) => r.currentPeriodEnd === null || r.currentPeriodEnd > now).length;
}
