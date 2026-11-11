/**
 * 收款供应商抽象层。阶段 0 用 Creem 后台托管结账链接（env 配置，零 SDK 调用）；
 * 阶段 1 需要动态创建 checkout 时，在 creem adapter 内懒加载 SDK，调用方不变。
 * 切换 LemonSqueezy/Polar 只需新增 adapter，不动业务代码。
 */
import { env } from '@/config/env';
import type { CheckoutOptions } from './types';

const HOSTED_URL: Record<CheckoutOptions['plan'], string> = {
  oneoff: env.PAYMENT_LINK_ONEOFF,
  pro: env.CHECKOUT_URL_PRO,
  creator: env.CHECKOUT_URL_CREATOR,
};

class CreemProvider {
  readonly name = 'creem' as const;

  async createCheckoutUrl(opts: CheckoutOptions): Promise<string> {
    const productId = productIdFor(opts.plan);
    if (env.CREEM_API_KEY && productId) {
      return createApiCheckoutUrl(opts, productId);
    }

    const base = HOSTED_URL[opts.plan];
    if (!base) {
      throw new Error(`Checkout URL for plan "${opts.plan}" is not configured (set it in .env)`);
    }
    const url = new URL(base);
    if (opts.successUrl) url.searchParams.set('success_url', opts.successUrl);
    if (opts.email) url.searchParams.set('prefilled_email', opts.email);
    for (const [k, v] of Object.entries(opts.metadata ?? {})) {
      url.searchParams.set(`metadata[${k}]`, v);
    }
    return url.toString();
  }
}

function productIdFor(plan: CheckoutOptions['plan']): string {
  if (plan === 'oneoff') return env.CREEM_PRODUCT_ONEOFF;
  if (plan === 'pro') return env.CREEM_PRODUCT_PRO;
  if (plan === 'creator') return env.CREEM_PRODUCT_CREATOR;
  return '';
}

async function createApiCheckoutUrl(opts: CheckoutOptions, productId: string): Promise<string> {
  // SDK is loaded only when API mode is configured; hosted links remain zero-dependency.
  const { Creem } = await import('creem');
  const client = new Creem({
    apiKey: env.CREEM_API_KEY,
    server: env.CREEM_TEST_MODE ? 'test' : 'prod',
  });
  const checkout = await client.checkouts.create({
    productId,
    customer: opts.email ? { email: opts.email } : undefined,
    successUrl: opts.successUrl,
    metadata: opts.metadata,
  });
  if (!checkout.checkoutUrl) throw new Error('Creem API returned no checkout URL');
  return checkout.checkoutUrl;
}

const provider = env.PAYMENT_PROVIDER === 'creem' ? new CreemProvider() : null; // 未来：new LemonSqueezyProvider() / new StripeProvider()

export function getBillingProvider() {
  if (!provider) throw new Error(`Unsupported PAYMENT_PROVIDER: ${env.PAYMENT_PROVIDER}`);
  return provider;
}

export async function createCheckoutUrl(opts: CheckoutOptions): Promise<string> {
  return getBillingProvider().createCheckoutUrl(opts);
}

export { verifyCreemSignature, normalizeCreemEvent } from './creem';
export { grantFromEvent, isEntitled, activePlan, countActive } from './entitlements';
