# DEVELOPER_HANDOFF — overseas-saas-starter 开发手册（面向 codex / claude code）

> 本手册是给 **AI 编程工具**（codex、claude code 等）和接手开发者的一站式交接文档。
> 目标：你拿着本手册 + 模板仓库，能从 0 独立完成一个新 SaaS 的本地跑通与生产部署。
> 权威规则见 `AGENTS.md`；本手册描述「怎么做」，AGENTS.md 定义「不可违背的约束」。

---

## 0. 速览

| 项 | 值 |
|---|---|
| 框架 | Next.js 16（App Router, Turbopack）+ React 19 + TypeScript strict |
| 数据库 | PostgreSQL（Neon serverless），ORM Drizzle（`drizzle-orm/neon-http`） |
| 认证 | better-auth 1.7：magic-link 邮箱登录（无密码）+ organizations 插件（多租户） |
| 支付 | **Creem 默认**（MoR），抽象层预留 Stripe / LemonSqueezy（`PAYMENT_PROVIDER` 切换） |
| 邮件 | Resend + React Email（无 key 时终端打印降级） |
| 部署 | Vercel；域名 Cloudflare DNS → Vercel 子域绑定 |
| 关键命令 | `pnpm dev / typecheck / lint / test / build / db:generate / db:migrate / db:push / db:studio / setup:local / check:config` |

---

## 1. 项目结构与各目录职责

```
app/
  page.tsx              落地页（占位品牌 "Your SaaS"，新项目重写）
  sign-in/              登录页（magic-link 错误兜底文案在 page.tsx 的 ERROR_MESSAGES）
  pricing/              定价页（四档：free / oneoff / pro / creator）
  account/              账户页（当前计划 + 权益判断，登录保护）
  orgs/                 组织管理页（创建/切换/邀请/角色/撤销邀请）——多租户 UI 参考
  notes/                示例业务页（org 隔离 + 免费额度演示，接入新业务时替换）
  api/
    auth/[...all]       better-auth 全部端点（勿动）
    checkout/           POST：创建 Creem 结账 URL（传 plan/email/subject）
    billing/creem/webhook/  POST：支付回调（验签+幂等+落库）；GET：健康检查
    notes/              GET/POST：示例业务（租户隔离 + 免费额度）
    waitlist/           POST：waitlist 登记
    analytics/          GET：漏斗报表（Bearer ANALYTICS_TOKEN）
    health/             GET：健康检查
  layout.tsx / globals.css   全局布局与 Tailwind v4 主题（品牌色 teal）
  robots.ts / sitemap.ts / opengraph-image.tsx   SEO 基础
components/
  SiteHeader / SiteFooter / AuthNav / SignInForm / WaitlistForm / PricingCards
  ui.tsx + ui/          shadcn/ui 风格组件（button/card/input/label/avatar/...）
config/
  env.ts                ★ zod 环境变量 schema（新增环境变量必须同步这里）
  pricing.ts            ★ 定价与免费额度（改这里即可调价）
lib/
  auth.ts               ★ better-auth 服务端配置（magicLink + organizations）
  auth-client.ts        better-auth 客户端（baseURL 自动取当前域名）
  billing/
    types.ts            ★ 供应商无关接口（CheckoutOptions / PaymentProvider / NormalizedEvent）
    creem.ts            Creem 适配器：HMAC 验签 + 事件归一化（纯函数，可单测）
    entitlements.ts     ★ 权益存储唯一写入点（幂等 grantFromEvent / isEntitled / activePlan）
    index.ts            抽象层入口（按 PAYMENT_PROVIDER 选择 adapter；新增 Stripe 在此挂）
  db/
    schema.ts           ★ 全部表结构（含 note 示例表）
    index.ts            Neon HTTP 单例（build 不连库）
    migrate.ts          pnpm db:migrate 入口
    cache-store.ts      TTL KV 缓存（cache 表）
  email/                Resend 封装 + React Email 模板（MagicLinkEmail / WaitlistEmail）
  server/
    usage.ts            ★ 免费额度：weeklyUsage / remainingFree / recordUsage（按 subject）
    analytics.ts        ★ 漏斗埋点：trackEvent / getFunnelSummary
    notes.ts            示例业务服务端逻辑（org 隔离三原则的样板）
    waitlist.ts         waitlist 写入
  card/render.tsx       通用分享图渲染（satori SVG→PNG，Node runtime）
  cn.ts / utils.ts      样式工具
scripts/
  new-saas.sh           ★ 从模板生成新项目（复制→改名→提示下一步）
  setup-local.ts        本地 .env 引导（生成 BETTER_AUTH_SECRET）+ 跑迁移
  check-config.ts       环境就绪度检查（pnpm check:config）
tests/                  vitest 单测（billing 归一化 / pricing 配置）
drizzle.config.ts       drizzle-kit 配置（读 DATABASE_URL）
middleware.ts           路由保护（双 cookie 名兼容 http/https）
.github/workflows/ci.yml  CI：typecheck + lint + test + build 四闸门
```

★ = 新项目改动频率最高的文件。

---

## 2. 复制模板到新项目（改名清单）

### 方式 A：脚本（推荐）

```bash
git clone https://github.com/wilson-love/overseas-saas-starter.git
cd overseas-saas-starter
bash scripts/new-saas.sh my-saas            # 生成到 ../my-saas
```

脚本做的事：rsync 复制（排除 .git/node_modules/.next/脚本自身）→ package.json `name` 改为 `my-saas` → 打印改名清单与下一步。

### 方式 B：手动复制

```bash
rsync -a --exclude '.git' --exclude 'node_modules' --exclude '.next' \
  overseas-saas-starter/ my-saas/
```

### 改名清单（必须逐项执行，AI 工具按此 grep 替换）

| 位置 | 原值 | 改为 |
|---|---|---|
| `package.json` name | `overseas-saas-starter` | `my-saas`（npm 包名规约：小写字母数字连字符） |
| `app/layout.tsx` | `Your SaaS` 站点名/描述（SITE_TITLE/SITE_DESC/applicationName/openGraph） | 你的产品名 + 一句话描述 |
| `components/SiteHeader.tsx` | 品牌块 `S` + `Your SaaS` | 你的 Logo 字母 + 产品名；导航换成你的页面 |
| `components/SiteFooter.tsx` | `support@yourdomain.com` | 你的客服邮箱 |
| `app/opengraph-image.tsx` | `Your SaaS` 文案 | 产品名/标语 |
| `app/terms`、`app/privacy` | 占位条款 | 按你产品补全（或接入平台如 Stripe Terms Generator 生成） |
| `.env`（见 §3） | `EMAIL_FROM` / `APP_URL` 等 | 你的域名与邮箱 |
| `middleware.ts` protectedRoutes | `/dashboard /account /orgs /notes` | 保留通用项，新增你的受保护页面前缀 |
| 数据库 | `DATABASE_URL` | 新库连接串（Neon 新建数据库，不要复用模板库） |

> 提示：模板里的 "Your SaaS" 是刻意统一的占位品牌，grep `Your SaaS` 可一次定位全部需要替换的点。

### 接入你自己的业务（三步，模板的 note 示例即样板）

1. `lib/db/schema.ts` 加业务表：**必须带** `organizationId` 外键（`references(() => organization.id, { onDelete: 'cascade' })`），参考 `note` 表；
2. `lib/server/` 写服务端逻辑：查询用 `eq(表.organizationId, 当前orgId)` 过滤；写入强制带当前 orgId（参考 `lib/server/notes.ts`）；
3. `app/` 写页面/API：从会话取 `activeOrganizationId`（`auth.api.getSession`），参考 `app/api/notes/route.ts`。
4. 免费额度：业务动作前 `remainingFree(userId)` 判断，通过后 `recordUsage(userId)`；付费用户跳过额度（参考 notes API）。
5. 重新生成迁移：`pnpm db:generate && pnpm db:migrate`。

---

## 3. 环境变量完整清单

> 规则：新增变量必须**同时**更新 `config/env.ts`（zod schema）、`.env.example`、本文档。`.env` 不入库。

| 变量 | 含义 | 如何获取 / 取值 |
|---|---|---|
| `NODE_ENV` | 环境 | 无需手动设（框架自动） |
| `APP_URL` | 站点最终 URL | 本地 `http://localhost:3000`；生产 = 你的 HTTPS 域名 |
| `BETTER_AUTH_SECRET` | better-auth 签名密钥，≥32 字符 | `openssl rand -base64 48`；生产必填 |
| `BETTER_AUTH_URL` | 认证 base URL | 本地同 APP_URL；生产 = 同一 HTTPS 域名 |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | （可选）客户端显式指定 | 多域名/SSR 异常时用；默认客户端自动取 window.location.origin |
| `DATABASE_URL` | Neon Postgres 连接串 | Neon 控制台 → 项目 → Connect → 复制 pooled 串（`-pooler.` 主机名，`sslmode=require`） |
| `PAYMENT_PROVIDER` | 支付供应商 | `creem`（默认）/ `stripe` / `lemonsqueezy`；切换见 §4.3 |
| `CREEM_API_KEY` | Creem API 密钥 | Creem 控制台 → Settings → API Keys |
| `CREEM_WEBHOOK_SECRET` | webhook 签名密钥（HMAC） | Creem 控制台创建 webhook 时生成，**只显示一次**，立即保存 |
| `CREEM_TEST_MODE` | 测试/生产切换 | 字符串 `true`/`false`。**陷阱**：代码显式解析字符串，不能写 `1`/`0`；生产必须 `false` |
| `PAYMENT_LINK_ONEOFF` | 单次档托管结账链接 | Creem 后台创建产品后复制 checkout URL（阶段 0 零 SDK） |
| `CHECKOUT_URL_PRO` / `CHECKOUT_URL_CREATOR` | 月订档托管结账链接 | 同上 |
| `CREEM_PRODUCT_*` | 各档产品 ID | Creem 后台 → 产品详情（阶段 1：API 模式 + webhook 反查套餐） |
| `RESEND_API_KEY` | Resend 发信密钥 | https://resend.com/api-keys |
| `EMAIL_FROM` | 发件人 | 形如 `Name <noreply@yourdomain.com>`，**域名必须在 Resend 验证过**（SPF/DKIM），不能用 `@resend.dev` |
| `ANALYTICS_TOKEN` | 漏斗报表 token | 自定义随机串；留空则 /api/analytics 关闭 |
| `LLM_PROVIDER` / `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | （可选）表达层润色 | 默认 `none`（纯确定性）。接入时用 OpenAI 兼容端点；LLM 不得生成数字/规则 |

### 获取步骤速查（外部服务）

- **Neon**：注册 → 建项目（免费档即可）→ Dashboard 复制连接串 → 建议建独立数据库 per 新 SaaS。
- **Vercel**：github 导入仓库 → 项目设置里逐个填上述变量（Production/Preview 分开）→ Deploy。
- **Resend**：注册 → API Keys 建 key → Domains 添加并验证你的域名（配 3 条 DNS 记录：SPF/DKIM/可选 MX）→ 用验证后域名做 EMAIL_FROM。
- **Creem**：见 §4.1。
- **Stripe**：注册 → 开发者模式拿 `sk_test_*` → 建产品与价格 → 建 webhook；切换见 §4.3。
- **Cloudflare**：你的域名 DNS 加 `CNAME xxx → cname.vercel-dns.com`（或按 Vercel 提示），HTTPS 自动由 Vercel 签发。

---

## 4. 支付接入

> ⚠️ **本节（4.1–4.3）仍是 Creem 口径，已停用，待重写。**
> 当前基座实现为 **Gumroad**（`lib/billing/gumroad.ts` + `/api/billing/gumroad/webhook`）：
> 环境变量见 `.env.example` 的 `GUMROAD_*` 段；结账为托管产品链接（`?wanted=true`）；
> webhook 无签名，安全靠 URL 共享密钥 + `seller_id` 白名单 + `sale_id` 幂等。
> 接入新项目时以 README 与 `lib/billing` 代码为准，不要照下文 Creem 步骤操作。

### 4.1 Creem 全流程（已停用，仅留档）

1. **商户注册**：Creem 官网注册（个人可开，Merchant of Record，收单/税务/退款合规由 Creem 承担）。
2. **创建产品**：Creem 控制台 → Products → 建三个产品（对应 `config/pricing.ts` 四档中的三档）：
   - One-time（$4.99，单次付费）→ 复制 **checkout URL** 填 `PAYMENT_LINK_ONEOFF`
   - Pro（$9.99/mo，订阅）→ checkout URL 填 `CHECKOUT_URL_PRO`，产品 ID 填 `CREEM_PRODUCT_PRO`
   - Creator（$19/mo，订阅）→ `CHECKOUT_URL_CREATOR` + `CREEM_PRODUCT_CREATOR`
3. **Webhook 配置**：Creem 控制台 → Webhooks → 新建，URL 填 `https://你的域名/api/billing/creem/webhook`，保存后**立即复制签名密钥**填 `CREEM_WEBHOOK_SECRET`（只显示一次）。
4. **env 配置**：按 §3 填 `CREEM_API_KEY`（API 模式）或仅填三个 checkout URL（托管模式，零 SDK）。`CREEM_TEST_MODE=true` 走 Creem 测试服务器。
5. **测试支付**：
   - 本地：`pnpm dev` → 定价页点 Choose → 跳转 Creem 测试结账页（Creem 测试模式用测试卡/测试钱包）→ 完成 → Creem 向你的 webhook 投递事件 → 本地终端应看到 `[billing] ... granted=true` → `/account` 显示付费档。
   - 本地接收 webhook：用 cloudflare tunnel / ngrok 把公网地址指到 localhost:3000，在 Creem 后台把 webhook URL 配成该地址。
   - 验证幂等：Creem 后台「重放事件」，应返回 `duplicate: true`，权益不重复发放。
6. **上线**：`CREEM_TEST_MODE=false`，确认 webhook URL 是生产域名，`CREEM_PRODUCT_*`/checkout URL 是生产产品。

### 4.2 支付链路代码走查（改动前必读）

```
定价页(PricingCards) → POST /api/checkout {plan,email?,subject?}
  → lib/billing/index.ts createCheckoutUrl（按 PAYMENT_PROVIDER 选 adapter）
  → Creem 托管链接 / API 创建 → 302 跳转结账
Creem 结账完成 → POST /api/billing/creem/webhook
  → verifyCreemSignature(raw, 'creem-signature') 验签（失败 401）
  → normalizeCreemEvent 归一化（未知事件忽略）
  → grantFromEvent 幂等写入 entitlement（providerEventId 唯一约束）
  → trackEvent('payment_granted')
业务侧：isEntitled({email, subject}) / activePlan({email, subject}) 判断权益
```

铁律（不可违反）：验签失败即拒；事件幂等（重复投递只生效一次）；**前端 success 回调绝不发放权益**。

### 4.3 切换 Stripe（预留入口，只改配置/新增 adapter，不改业务代码）

1. `config/env.ts` 增加 `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`（+ 可选 `STRIPE_PRICE_*`）。
2. `lib/billing/stripe.ts` 新增 `StripeProvider implements PaymentProvider`：
   - `createCheckoutUrl(opts)`：Stripe Checkout Session 创建（传 `success_url=opts.successUrl`、`metadata: opts.metadata`、customer email）；
   - 事件归一化：`checkout.session.completed` → `active`；`customer.subscription.updated/deleted` → 更新/取消。
3. `lib/billing/index.ts` 把 `PAYMENT_PROVIDER === 'stripe'` 分支挂上新 adapter（当前为 `new CreemProvider()`，`stripe/lemonsqueezy` 返回 null 抛错——这就是预留的挂载点）。
4. `app/api/billing/stripe/webhook/route.ts` 参照 creem webhook：验签（`stripe.webhooks.constructEvent`）→ 归一化 → `grantFromEvent`。中间件路由表不动。
5. `.env`：`PAYMENT_PROVIDER=stripe` + 填 Stripe 密钥/webhook secret，即可无缝切换；业务代码（entitlements/usage/页面）零改动。

---

## 5. 认证配置（better-auth）

核心文件：`lib/auth.ts`（服务端）、`lib/auth-client.ts`（客户端）、`app/api/auth/[...all]/route.ts`。

- **magic-link**：`expiresIn: 60*15`（15 分钟）；`sendMagicLink` 走 `lib/email`（Resend；无 key 时终端打印链接，本地开发用）。
- **邮箱验证**：新用户首次登录即视为已验证（无密码方案天然免验证流）；如将来开 `emailAndPassword`，记得 `requireEmailVerification: true`。
- **organizations 插件**：`membersLimit: 10`（免费上限），`teams: { enabled: false }`。改上限改这里。
- **双 cookie 名**：`middleware.ts` 同时检查 `better-auth.session_token` 与 `__Secure-better-auth.session_token`——本地 http 用前者，生产 https 用后者，不要只查一个。
- **域名**：`BETTER_AUTH_URL` 必须等于实际访问域名；客户端 `resolveBaseURL()` 优先 `NEXT_PUBLIC_BETTER_AUTH_URL`，否则自动取 `window.location.origin`（天然适配多子域）。`trustedOrigins` 自动过滤 localhost，生产多域名时手动补充。
- **登录页错误兜底**：`app/sign-in/page.tsx` 的 `ERROR_MESSAGES` 覆盖 `INVALID_TOKEN`（链接过期/已用/被邮件网关预扫描）等，magic-link 的 `errorCallbackURL` 指向 `/sign-in` 而不是业务页。
- **会话**：默认 7 天，滑动续期 `updateAge` 见官方默认；登出在 `AuthNav` 调 `signOut()`。

客户端速查（`lib/auth-client.ts` 已导出 `organization` 与 hooks；`app/orgs/page.tsx` 有完整样板）：
hooks：`useListOrganizations()`、`useActiveOrganization()`（均返回 `{data,isPending,refetch}`）。
**注意：better-auth 1.7 没有 `useListMembers/useListInvitations` hooks**，成员/邀请用 action 拉取（**均为 GET 请求**）：
`organization.listMembers({ query: { organizationId } })`（返回 `{ members, total }`）、`organization.listInvitations({ query: { organizationId } })`；
**"我的邀请"（非成员视角）**：`listInvitations()` **不带 organizationId** 即返回当前登录用户收到的邀请（含 status），这是站内接受邀请的唯一入口，见 orgs 页 "Invitations for you" 区块；
动作：`create({name, slug})`、`setActive({organizationId})`、`inviteMember({organizationId, email, role:'member'|'admin'})`、`removeMember({organizationId, memberIdOrEmail})`（参数名是 **memberIdOrEmail**，不是 memberId）、`acceptInvitation({invitationId})`、`cancelInvitation({invitationId})`。
**两个实测行为（真实 Neon 全流程冒烟验证）**：① `create` 不会自动 set-active，建组织后必须手动 `setActive({organizationId})`，否则成员列表/业务数据为空（orgs 页已内置）；② 带 organizationId 查 `listInvitations/listMembers` 需要成员身份，非成员会得到 "You are not a member"——被邀请人查自己的邀请必须用不带 orgId 的调用。

---

## 6. 多租户开发指南（新业务表如何做隔离）

### 数据模型层（schema.ts）

```ts
// 正确样板（note 表）
export const note = pgTable('note', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),  // ← 必须
  authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
  // ...你的业务字段
});
```

- 每张业务表**必须**有 `organizationId` 外键，`onDelete: 'cascade'`（删组织即删数据）。
- 可选：`authorId` 记录创建人，用于展示/审计。

### 服务端查询/写入（lib/server/*）

```ts
// 查询：永远按当前组织过滤
db.select().from(note).where(eq(note.organizationId, orgId));
// 写入：强制带当前组织
db.insert(note).values({ id, organizationId: orgId, /* ... */ });
```

- 禁止出现「不带 organizationId 条件的业务表全表查询」——这是最常见的多租户数据泄漏点。

### 路由层（app/api/*）

```ts
const session = await auth.api.getSession({ headers: await headers() });
const orgId = session?.session.activeOrganizationId;   // ← 当前活跃组织
if (!orgId) return 400; // 引导先建组织
```

### 页面层（app/*）

- 用 `useActiveOrganization()` 读当前组织；用户可随时在 `/orgs` 切换组织，切换后业务数据随之变化（`session.activeOrganizationId` 由 better-auth 管理，业务代码只读）。

### 单租户模式兼容

- 模板的架构**同时兼容单租户**：单租户部署时，为每个用户自动建一个个人组织（或让所有数据挂在同一组织下），代码路径不变——这就是「多租户结构保留，单租户也能跑」的设计。新业务不要写死「当前用户=当前数据」而绕过组织 ID。

### 邀请流程

- 邀请：owner/admin 在 `/orgs` 输入邮箱+角色 → `organization.inviteMember` → invitation 表落库（状态 pending）。
- 接受：被邀人登录后在 `/orgs` 的 **Invitations for you** 区块（`listInvitations()` 不带 orgId 查到自己的 pending 邀请）点 Accept → `organization.acceptInvitation`。注意：非成员**不能**带 organizationId 查组织邀请（会被拒），必须用无 orgId 的"我的邀请"查询。
- 想发邀请邮件：在 inviteMember 成功后调 `lib/email` 发一封带 `acceptInvitation` 链接的邮件（可自行扩展；模板演示的是站内接受）。

---

## 7. 部署上线清单（Vercel）

### 前置（一次性）

1. GitHub 建仓库并推送（见 §8 常见坑中的推送）。
2. **Neon**：建数据库；生产用独立库（不要与本地/预发布混用）。
3. **Resend**：验证发信域名（SPF/DKIM）。
4. **Creem**：完成 §4.1 的商户/产品/webhook，拿到密钥。
5. **Cloudflare**：确认你的域名 DNS 管理在 Cloudflare（或在 Cloudflare 添加站点）。

### 步骤

```bash
# 0) 本地全绿
pnpm typecheck && pnpm lint && pnpm test && pnpm build

# 1) 生成并提交迁移（schema 有变时）
pnpm db:generate   # 生成 lib/db/migrations/*.sql
git add -A && git commit -m "feat: ..." && git push

# 2) Vercel 建项目
#    vercel.com → Add New Project → Import 你的仓库（Framework 自动识别 Next.js）
#    Build Command: pnpm build ; Install: pnpm install

# 3) 填环境变量（Production 环境，逐个对照 §3 清单）
#    BETTER_AUTH_SECRET（必须新生成，勿用 dev 值）
#    DATABASE_URL / RESEND_API_KEY / EMAIL_FROM / CREEM_* / PAYMENT_PROVIDER / APP_URL / BETTER_AUTH_URL / ANALYTICS_TOKEN(可选)

# 4) 部署后跑迁移（schema 有变时；Neon HTTP 驱动支持在服务端跑）
vercel env pull && pnpm db:migrate    # 本地用生产 DATABASE_URL 跑一次；或 CI 里跑
# 更稳妥的做法：Vercel 部署后在 Project → Deployments → 用一次性命令/脚本跑迁移（勿在 build 阶段自动跑）

# 5) 域名绑定
#    Vercel → Project → Settings → Domains → Add 子域（如 app.yourdomain.com）
#    Cloudflare → DNS → CNAME app → cname.vercel-dns.com（Vercel 会给出具体值）
#    HTTPS：Vercel 自动签发；等待生效（~几分钟）

# 6) 回填环境变量中的域名（此时才确定）
#    APP_URL=https://app.yourdomain.com ; BETTER_AUTH_URL=https://app.yourdomain.com
#    Redeploy 使生效

# 7) 支付上线
#    Creem 后台：webhook URL 改生产域名；CREEM_TEST_MODE=false
#    先自己买一单验证 → /account 出现付费档 → 成功后再对外宣传

# 8) 冒烟
#    https://app.yourdomain.com/api/health  → {"ok":true}
#    登录（收信点魔链）→ 建组织 → 邀请第二账号 → 定价页测试支付
```

### 灰度注意

- `CI`（.github/workflows/ci.yml）每次 push 自动跑四闸门；失败会阻断合并，先本地跑通再推。
- Preview 环境（Vercel 自动生成）默认共享 Production 环境变量，注意 Creem 测试模式区分。

---

## 8. 常见坑（踩过并修复的，全部保留在代码里）

1. **`CREEM_TEST_MODE` 字符串陷阱**：zod 不能 `z.coerce.boolean()`——`"false"` 会被解析成 `true`，生产误走测试服务器导致 401。代码显式解析字符串 `'true'`；改 env 时只写 `true`/`false`。
2. **`.env` 引号**：值含空格/特殊字符时用双引号包裹；`.env` 不以 `#` 开头留注释空格（`#` 是注释符）。编辑后 `pnpm check:config` 校验。
3. **迁移**：`db:migrate` 之前必须 `db:generate`（schema 变更后）；**不要手改**已生成的迁移文件；全新库顺序 `db:generate → db:migrate`。`drizzle.config.ts` 读 `DATABASE_URL`（不是 `POSTGRES_URL`，旧项目遗留坑已修）。
4. **构建不连库**：`lib/db/index.ts` 在 build 阶段不查库；CI 里 build 只传 `BETTER_AUTH_SECRET` 即可。运行时缺 `DATABASE_URL` 会在首次查询时报错（本地 `setup:local` 会引导）。
5. **魔法链接被邮件网关预扫描**：某些网关会点击链接导致 token 一次性失效——登录页 `INVALID_TOKEN` 兜底文案 + `errorCallbackURL=/sign-in` 已处理，不要改成自动重发（防滥用）。
6. **runtime=edge 陷阱**：任何用到 `crypto` 原生模块（webhook 验签）或 `satori/@resvg/resvg-js`（分享图）的路由必须 `export const runtime = 'nodejs'`，否则部署后 500。
7. **rate limit**：Creem/Resend/Neon 都有额度。Resend 免费档每日 100 封；Neon 免费档有并发限制——批量任务用 `lib/db/cache-store.ts` 缓存外部响应，避免重复请求。
8. **多租户泄漏**：grep 检查业务表查询是否都带 `organizationId` 条件；`app/api/notes` 是正确样板。权限：只有 owner/admin 能改成员/邀请（better-auth 默认 roles 已实现，页面按钮按 `m.role` 控制）。
9. **双 cookie 名**：middleware 必须同时查 `better-auth.session_token` 与 `__Secure-better-auth.session_token`（本地 http / 生产 https 不同），漏一个会导致生产反复跳登录页。
10. **推送 GitHub**：仓库是私有的，用 HTTPS + Personal Access Token（`https://<token>@github.com/...`）或 SSH。首次 push 前 `git remote add origin ...` 且确认分支名 `main`（Vercel 默认分支）。

---

## 9. 给 codex / claude code 的开场 Prompt（可直接粘贴）

```
你是资深 Next.js 全栈工程师。这是 overseas-saas-starter 模板项目。
请先完整阅读 docs/DEVELOPER_HANDOFF.md 和 AGENTS.md，然后：
1. 运行 scripts/new-saas.sh <我的项目名> 生成新项目（或在当前目录改名）；
2. 按手册 §2 改名清单替换 "Your SaaS" 占位为我的产品名；
3. 按 §3 让我提供各外部服务的密钥，填 .env；
4. 按 §6 把 app/notes 示例业务替换为我的业务（表/页面/API/额度）；
5. 跑通 pnpm typecheck && lint && test && build，然后按 §7 部署到 Vercel。
每完成一步向我汇报，涉及外部账号（Neon/Resend/Creem/Vercel/Cloudflare）的操作给明确指引。
```

---

_Last updated: 2026-09-29 · 模板版本 v1.0.0_
