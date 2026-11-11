/**
 * Neon Postgres + Drizzle 单例（Vercel serverless 友好）。
 * 使用 @neondatabase/serverless（HTTP），无需长连接池。
 * build 阶段不连接数据库；仅运行时 query 才需要真实 DATABASE_URL。
 *
 * DATABASE_URL 通过环境变量注入（Vercel → Settings → Environment Variables），
 * 使用 Neon 的 pooler 连接串（-pooler. 主机名，sslmode=require）。
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { env } from '@/config/env';

const connectionString = env.DATABASE_URL;
const isRealPg = /^postgres(ql)?:\/\//.test(connectionString) && !connectionString.includes('localhost');

if (!isRealPg) {
  console.warn(
    `[db] DATABASE_URL 未配置或不是真实 Postgres 连接串，运行时数据库调用将失败（不影响 build）。`,
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
