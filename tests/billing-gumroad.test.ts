import { describe, expect, it } from 'vitest';
import { normalizeGumroadEvent, verifyGumroadSecret } from '@/lib/billing/gumroad';

// 测试用虚构店铺与产品，不依赖真实账号配置
const SELLER = 'test_seller';
const PRODUCTS = {
  prod_oneoff: 'oneoff',
  prod_pro: 'pro',
  prod_creator: 'creator',
} as const;

const baseSale = {
  seller_id: SELLER,
  product_id: 'prod_pro',
  sale_id: 'sale_123',
  email: 'buyer@example.com',
  price: '9.99',
  recurrence: 'monthly',
  subscription_id: 'sub_456',
  refunded: 'false',
};

describe('normalizeGumroadEvent', () => {
  it('把正常销售归一为 active，并按订阅 ID 归属', () => {
    const e = normalizeGumroadEvent(baseSale, { sellerId: SELLER, productMap: { ...PRODUCTS } });
    expect(e).not.toBeNull();
    expect(e!.status).toBe('active');
    expect(e!.plan).toBe('pro');
    expect(e!.customerRef).toBe('sub_456');
    expect(e!.email).toBe('buyer@example.com');
    expect(e!.currentPeriodEnd).toBeGreaterThan(Date.now());
  });

  it('seller_id 不在白名单时忽略（防伪造）', () => {
    const e = normalizeGumroadEvent(
      { ...baseSale, seller_id: 'attacker' },
      { sellerId: SELLER, productMap: { ...PRODUCTS } },
    );
    expect(e).toBeNull();
  });

  it('未登记的商品 ID 忽略', () => {
    const e = normalizeGumroadEvent(
      { ...baseSale, product_id: 'unknown' },
      { sellerId: SELLER, productMap: { ...PRODUCTS } },
    );
    expect(e).toBeNull();
  });

  it('refunded=true 归一为 canceled，事件 ID 与首购区分', () => {
    const e = normalizeGumroadEvent(
      { ...baseSale, refunded: 'true' },
      { sellerId: SELLER, productMap: { ...PRODUCTS } },
    );
    expect(e!.status).toBe('canceled');
    expect(e!.eventId).toBe('sale_123:refund');
  });

  it('cancellation 事件归一为 expired 并绑定订阅 ID', () => {
    const e = normalizeGumroadEvent(
      { ...baseSale, resource_name: 'cancellation' },
      { sellerId: SELLER, productMap: { ...PRODUCTS } },
    );
    expect(e!.status).toBe('expired');
    expect(e!.eventId).toBe('sub_456:cancel');
  });

  it('一次性产品不设到期时间（null = 永久）', () => {
    const e = normalizeGumroadEvent(
      { ...baseSale, product_id: 'prod_oneoff', recurrence: '', subscription_id: '' },
      { sellerId: SELLER, productMap: { ...PRODUCTS } },
    );
    expect(e!.plan).toBe('oneoff');
    expect(e!.customerRef).toBe('sale_123');
    expect(e!.currentPeriodEnd).toBeNull();
  });

  it('年付订阅按 12 个月推算到期', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const e = normalizeGumroadEvent(
      { ...baseSale, recurrence: 'yearly' },
      { sellerId: SELLER, productMap: { ...PRODUCTS }, now },
    );
    expect(new Date(e!.currentPeriodEnd!).getUTCFullYear()).toBe(2027);
  });
});

describe('verifyGumroadSecret', () => {
  it('未配置密钥时一律拒绝', () => {
    expect(verifyGumroadSecret('anything')).toBe(false);
    expect(verifyGumroadSecret(null)).toBe(false);
  });
});
