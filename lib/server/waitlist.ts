import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { waitlistEntry } from '@/lib/db/schema';
import { sendWaitlistEmail } from '@/lib/email';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type WaitlistOutcome = { status: 'added' | 'already_registered' };

export async function joinWaitlist(email: string, source = 'homepage'): Promise<WaitlistOutcome> {
  const normalized = normalizeEmail(email);
  const existingRows = await db
    .select({ id: waitlistEntry.id })
    .from(waitlistEntry)
    .where(eq(waitlistEntry.email, normalized))
    .limit(1);
  if (existingRows[0]) return { status: 'already_registered' };

  await db.insert(waitlistEntry).values({
    id: crypto.randomUUID(),
    email: normalized,
    source: source.trim().slice(0, 40) || 'homepage',
  });
  try {
    await sendWaitlistEmail(normalized);
  } catch (error) {
    console.error('[waitlist] confirmation email failed', error);
  }
  return { status: 'added' };
}
