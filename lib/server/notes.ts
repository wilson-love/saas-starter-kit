/**
 * 示例业务：组织内「笔记」服务端逻辑。
 * 演示多租户隔离三原则：
 *  1) 建表带 organizationId 外键（见 schema.ts 的 note 表）；
 *  2) 查询按当前组织过滤（listNotes 的 where 条件）；
 *  3) 写入带当前组织 ID（createNote 强制 organizationId）。
 * 复制此模式即可接入你自己的业务表。
 */
import { desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { note } from '@/lib/db/schema';

export async function listNotes(organizationId: string) {
  return db
    .select()
    .from(note)
    .where(eq(note.organizationId, organizationId))
    .orderBy(desc(note.createdAt));
}

export async function createNote(
  organizationId: string,
  authorId: string,
  title: string,
  body: string,
): Promise<string> {
  const id = randomUUID();
  await db.insert(note).values({ id, organizationId, authorId, title, body });
  return id;
}
