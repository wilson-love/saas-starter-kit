/**
 * 数据库迁移入口：pnpm db:migrate
 * 读取 lib/db/migrations 下 drizzle-kit 生成的 SQL 并按序应用。
 * 全新库：pnpm db:generate（首次从 schema 生成）→ pnpm db:migrate
 */
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { db } from './index';

async function main() {
  await migrate(db, { migrationsFolder: './lib/db/migrations' });
  console.log('✅ Migrations applied.');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
