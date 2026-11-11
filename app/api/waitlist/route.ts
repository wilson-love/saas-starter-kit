import { NextResponse } from 'next/server';
import { z } from 'zod';
import { joinWaitlist } from '@/lib/server/waitlist';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  source: z.string().trim().max(40).optional().default('homepage'),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { status: 'error', message: 'Enter a valid email address.' },
      { status: 400 },
    );
  }
  try {
    const outcome = await joinWaitlist(parsed.data.email, parsed.data.source);
    return NextResponse.json(outcome, { status: outcome.status === 'added' ? 201 : 200 });
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Could not join the waitlist. Please retry.' },
      { status: 500 },
    );
  }
}
