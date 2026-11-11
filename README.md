# saas-starter-kit

公司通用 **SaaS 基座仓**（基建性质）。**不是独立产品，不冲收入**，只负责沉淀可复用的 SaaS 底座，供各卖钱项目复制起步。

当前版本从生产项目抽取并验证，已移除全部业务代码，只剩通用能力。

## 三条铁律

1. **基座定位**：本仓库是基建，不立项、不做单独收入。任何"这个功能能不能赚钱"的讨论都不属于基座；基座只回答"这个能力是否通用、是否已验证"。
2. **单向流动**：只允许 **基座 → 项目**，不允许项目 → 基座。项目里的实现不得直接复制/PR 回基座；项目需要新的通用能力时，先在基座评估、实现、验证，再按版本同步到各项目。理由：防止业务耦合、项目私有逻辑和临时补丁污染基座。
3. **能力准入**：只沉淀被至少一个真实项目验证过的能力；未验证的探索留在项目里，不提前抽。

## 当前包含（只含五块）

| 模块 | 内容 |
| --- | --- |
| **登录** | better-auth magic-link 邮箱登录（无密码）、会话管理、邮箱验证；组织（organization）成员管理、邀请与角色（owner/admin/member），单租户与多租户双模式兼容 |
| **订阅** | 定价页与四档配置（free / oneoff / pro / creator）、免费额度（每周次数）、权益存储（entitlement）、`providerEventId` 唯一约束幂等、`isEntitled/activePlan` 判断 |
| **支付** | Gumroad 托管结账（`/api/checkout` → 产品页）+ Ping webhook（`/api/billing/gumroad/webhook`）；Gumroad 无请求签名，安全依赖 URL 共享密钥 + `seller_id` 白名单 + `sale_id` 幂等；退款/争议/订阅取消会撤销同 `customerRef` 的 active 权益 |
| **邮件** | Resend + React Email 模板（magic link、waitlist）；本地无 `RESEND_API_KEY` 时魔链打印到终端，便于开发 |
| **后台** | `/account` 账户与套餐状态、`/dashboard` 总览、`/orgs` 组织创建/切换/邀请/成员管理、`/notes` 租户隔离示例业务 |

配套：Postgres(Neon) + Drizzle 迁移、zod 环境变量校验、漏斗埋点 + Vercel Analytics、typecheck/lint/test/build 四闸门。

## 暂不包含（后续按需抽取）

- 具体业务（TFT 复盘、AEO 内容站、选品雷达等）——全部留在各自项目
- Gumroad license key 买断授权、退款独立处理、订阅管理 UI
- 多支付供应商实现（当前仅 Gumroad；抽象层已预留 Stripe/LemonSqueezy 挂载点）
- 国际化（i18n）

## 快速开始

```bash
# 1. 复制基座到新项目目录
bash scripts/new-saas.sh my-saas

# 2. 安装与初始化
cd my-saas
pnpm install
cp .env.example .env      # 填 DATABASE_URL 等
pnpm setup:local          # 生成 BETTER_AUTH_SECRET + 跑迁移 + 建本地环境

# 3. 运行
pnpm dev                  # http://localhost:3000
pnpm check:config         # 校验环境变量就绪度
```

本地用任意邮箱登录（未配 Resend 时魔链打印在终端），在 `/orgs` 建组织，`/notes` 验证租户隔离，`/pricing` 查看套餐。

## 改成自己的项目

按 `docs/DEVELOPER_HANDOFF.md` §2 的改名清单执行，至少覆盖：

- `package.json` 的 `name`
- `app/layout.tsx` 站点名/描述（`grep "Your SaaS"` 一次定位）
- 组织/产品名、`APP_URL` 与 `BETTER_AUTH_URL`
- 独立数据库（每项目一个 Neon 库，勿复用）
- Gumroad 产品链接与产品 ID（`.env`）

## 目录速览

```
app/
  sign-in/            magic-link 登录
  pricing/            定价页
  account/            账户与套餐
  dashboard/          总览
  orgs/               组织：创建/切换/邀请/角色
  notes/              示例业务（租户隔离 + 免费额度）
  api/
    auth/[...all]     better-auth 端点
    checkout/         生成 Gumroad 结账链接
    billing/gumroad/  webhook（共享密钥 + seller 白名单 + 幂等）
    notes/            示例业务 API
lib/
  auth.ts             better-auth 配置（magic link + organizations）
  billing/            gumroad / entitlements / index(抽象层) / types
  db/                 schema、Neon 客户端、迁移、TTL cache
  email/              Resend + React Email
  server/             额度、埋点、业务服务
scripts/
  new-saas.sh         复制基座 → 改名 → 初始化
  setup-local.ts      本地环境引导
  check-config.ts     环境就绪检查
docs/
  DEVELOPER_HANDOFF.md  AI 编程工具手册（支付章节正随 Gumroad 抽取同步更新）
```

## 技术栈

Next.js (App Router) + React 19 + TypeScript strict / Postgres(Neon) + Drizzle / better-auth / Gumroad / Resend / Tailwind v4 + shadcn/ui 风格组件 / Vercel 部署。

## License

MIT — 见 [LICENSE](./LICENSE)。
