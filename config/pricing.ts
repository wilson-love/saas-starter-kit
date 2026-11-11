/**
 * 定价与免费额度。改这里即可调价，不动代码。
 * 四档结构（通用）：免费引流 -> 单次验证付款 -> 月订阅 -> Creator/高阶档。
 * 档位 ID 与文案是模板默认值，接入新业务时改 features/label 即可。
 */
export const PRICING = {
  free: {
    /** 免费额度：每周可用次数（usage 表按 subject 计次） */
    weeklyQuota: 3,
    features: [
      'Core feature with weekly quota',
      'Standard output / reports',
      'Community support',
    ],
  },
  oneoff: {
    priceUsd: 4.99,
    label: 'One-time deep access',
    /** Gumroad 后台建好产品后的 checkout 链接，env 未配置时显示 coming soon */
    checkoutUrlEnv: 'PAYMENT_LINK_ONEOFF',
  },
  pro: {
    priceUsd: 9.99,
    label: 'Pro (monthly)',
    variantIdEnv: 'GUMROAD_PRODUCT_PRO',
    features: [
      'Unlimited usage',
      'All advanced features',
      'Priority support',
    ],
  },
  creator: {
    priceUsd: 19.0,
    label: 'Creator (monthly)',
    variantIdEnv: 'GUMROAD_PRODUCT_CREATOR',
    features: [
      'Everything in Pro',
      'Content & export tools',
      'Batch operations',
    ],
  },
  /** 内部倒推展示用：约 $1,400 MRR（≈¥10,000/月）需要多少订阅 */
  mrrTargetUsd: 1400,
} as const;

export type PlanId = 'free' | 'oneoff' | 'pro' | 'creator';
