/**
 * 数据库表结构（Postgres / Drizzle，Neon serverless）。
 * - better-auth 标准四表（user/session/account/verification）
 * - organizations plugin 表（organization/member/invitation）——多租户
 * - 通用 SaaS 表（cache/usage/entitlement/analytics_event/waitlist_entry/activity_log）
 * - note（示例业务表）：演示「新业务表如何带 organization_id 做租户隔离」
 *
 * 多租户开发约定：任何新业务表都必须带 `organizationId` 外键，
 * 查询时用当前会话的 active organization 过滤（见 docs/DEVELOPER_HANDOFF.md）。
 */
import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// ============ better-auth 标准表 ============
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'date' }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'date' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ============ organizations plugin 表（多租户）============
export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  metadata: text('metadata'),
});

export const member = pgTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ============ 通用 SaaS 表 ============
/** 通用 KV 缓存（外部 API 响应等），expiresAt 为绝对时间 */
export const cache = pgTable('cache', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

/** 免费额度流水：按 subject 计次（subject = 外部实体标识，如 user_id / email / 第三方 ID）。
 *  支撑「每周 N 次」类免费额度；付费判断见 entitlement。 */
export const usage = pgTable('usage', {
  id: serial('id').primaryKey(),
  subject: text('subject').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

/** 匿名产品漏斗事件 */
export const analyticsEvent = pgTable('analytics_event', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  userId: text('user_id'),
  plan: text('plan'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

/** 付费权益（billing webhook 写入；providerEventId 唯一保证幂等） */
export const entitlement = pgTable('entitlement', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  providerEventId: text('provider_event_id').unique(),
  customerRef: text('customer_ref'),
  email: text('email'),
  subject: text('subject'),
  organizationId: text('organization_id'),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }),
  raw: text('raw'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

/** Pre-launch waitlist */
export const waitlistEntry = pgTable('waitlist_entry', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  source: text('source').notNull().default('homepage'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

/** 审计日志（登录/支付/业务事件等） */
export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id'),
  userId: text('user_id'),
  action: text('action').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ============ 示例业务表（演示多租户隔离，可删除）============
/**
 * 示例：组织内「笔记」。演示新业务接入三步：
 * 1) 建表时带 organizationId 外键；
 * 2) 查询按当前组织过滤；
 * 3) 写入时带当前组织 ID。
 * 接入你自己的业务时，删掉本表并把 app/notes、app/api/notes 换成你的页面。
 */
export const note = pgTable('note', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  authorId: text('author_id')
    .references(() => user.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type Member = typeof member.$inferSelect;
export type Entitlement = typeof entitlement.$inferSelect;
export type Note = typeof note.$inferSelect;
