/**
 * 收款供应商抽象层（基座默认实现：Gumroad 托管结账链接）。
 * 三个档位对应三条 hosted link，零 SDK；新增供应商只需加 adapter，业务代码不动。
 *
 * 注意：Gumroad 的托管链接**不支持** Creem 那套 `success_url / prefilled_email / metadata[...]`
 * 参数，所以这里只追加 `wanted=true`（跳过商品页直达结账）。
 * 权益归属靠 webhook 里的 email，与登录邮箱一致即可自动开通；不一致时走 /account 人工认领。
 */
import { env } from '@/config/env';
import type { CheckoutOptions } from './types';

const HOSTED_URL: Record<CheckoutOptions['plan'], string> = {
  oneoff: env.PAYMENT_LINK_ONEOFF,
  pro: env.CHECKOUT_URL_PRO,
  creator: env.CHECKOUT_URL_CREATOR,
};

class GumroadProvider {
  readonly name = 'gumroad' as const;

  async createCheckoutUrl(opts: CheckoutOptions): Promise<string> {
    const base = HOSTED_URL[opts.plan];
    if (!base) {
      throw new Error(`Checkout URL for plan "${opts.plan}" is not configured (set it in .env)`);
    }
    const url = new URL(base);
    url.searchParams.set('wanted', 'true');
    return url.toString();
  }
}

const provider = new GumroadProvider(); // 未来：Stripe / LemonSqueezy adapter 挂在这里

export function getBillingProvider() {
  return provider;
}

export async function createCheckoutUrl(opts: CheckoutOptions): Promise<string> {
  return getBillingProvider().createCheckoutUrl(opts);
}

export { verifyGumroadSecret, normalizeGumroadEvent } from './gumroad';
export {
  grantFromEvent,
  revokeFromEvent,
  isEntitled,
  activePlan,
  countActive,
} from './entitlements';
