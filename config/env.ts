/**
 * 服务端环境变量（zod 校验，Fail Fast：缺失关键配置时给出可读错误）。
 * 仅在服务端 import；构建期允许缺少密钥（不连真实服务）。
 */
import { z } from 'zod';

const schema = z.object({
  // 构建环境可能传空字符串，preprocess 转成 undefined 后走 default
  NODE_ENV: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.enum(['development', 'test', 'production']).default('development'),
  ),

  // ---- Web ----
  APP_URL: z.string().default('http://localhost:3000'),
  // better-auth 密钥；生产必须显式设置（>=32 字符随机串）
  BETTER_AUTH_SECRET: z.string().default('dev-insecure-change-me'),
  BETTER_AUTH_URL: z.string().default('http://localhost:3000'),

  // ---- DB ----
  // neon() 在模块加载时校验连接串格式，默认值必须是合法格式（构建期不抛错；运行时未配置才失败）
  DATABASE_URL: z
    .string()
    .default('postgresql://user:password@localhost:5432/db'),

  // ---- Billing: Creem（默认 MoR；Stripe/LemonSqueezy 预留）----
  PAYMENT_PROVIDER: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.enum(['creem', 'lemonsqueezy', 'stripe']).default('creem'),
  ),
  CREEM_API_KEY: z.string().default(''),
  CREEM_WEBHOOK_SECRET: z.string().default(''),
  // 注意：不能用 z.coerce.boolean()——它会把字符串 "false" 解析成 true（Boolean("false") === true），
  // 导致生产环境误走 Creem test server 而 401。必须显式解析 'true'/'false' 字符串。
  CREEM_TEST_MODE: z
    .string()
    .default('false')
    .transform((v) => v.trim().toLowerCase() === 'true'),
  // 阶段 0：在 Creem 后台建好产品后，把托管结账链接填到这里（零 SDK）
  PAYMENT_LINK_ONEOFF: z.string().default(''),
  CHECKOUT_URL_PRO: z.string().default(''),
  CHECKOUT_URL_CREATOR: z.string().default(''),
  // 阶段 1：webhook 用产品 ID 反查套餐
  CREEM_PRODUCT_PRO: z.string().default(''),
  CREEM_PRODUCT_CREATOR: z.string().default(''),
  CREEM_PRODUCT_ONEOFF: z.string().default(''),

  // ---- Email: Resend ----
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('Your SaaS <noreply@yourdomain.com>'),

  // 漏斗报表 API；留空则关闭，仅允许本地 CLI 读取
  ANALYTICS_TOKEN: z.string().default(''),

  // ---- LLM（可选，仅表达层润色；不填保持纯确定性）----
  LLM_PROVIDER: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.enum(['none', 'openai_compatible']).default('none'),
  ),
  LLM_BASE_URL: z.string().default(''),
  LLM_API_KEY: z.string().default(''),
  LLM_MODEL: z.string().default('deepseek-chat'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
