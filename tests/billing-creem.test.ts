import { describe, expect, it } from 'vitest';
import { normalizeCreemEvent } from '@/lib/billing/creem';

describe('normalizeCreemEvent', () => {
  it('maps checkout.completed to an active oneoff entitlement', () => {
    // 事件负载形状与 lib/billing/creem.ts 的防御式读取契约一致
    const event = {
      id: 'evt_123',
      eventType: 'checkout.completed',
      object: {
        id: 'evt_123',
        customer: { id: 'cus_1', email: 'buyer@example.com' },
        product: { externalId: 'prod_oneoff' },
      },
    };
    const normalized = normalizeCreemEvent(event);
    expect(normalized).not.toBeNull();
    expect(normalized!.eventId).toBe('evt_123');
    expect(normalized!.plan).toBe('oneoff');
    expect(normalized!.status).toBe('active');
    expect(normalized!.email).toBe('buyer@example.com');
    expect(normalized!.customerRef).toBe('cus_1');
  });

  it('maps subscription.canceled to canceled status', () => {
    const event = {
      eventType: 'subscription.canceled',
      object: { id: 'sub_9', customer: { email: 'leaver@example.com' } },
    };
    const normalized = normalizeCreemEvent(event);
    expect(normalized).not.toBeNull();
    expect(normalized!.status).toBe('canceled');
  });

  it('ignores unknown event types', () => {
    const normalized = normalizeCreemEvent({ eventType: 'pizza.baked', object: {} });
    expect(normalized).toBeNull();
  });
});
