# DEVELOPER_HANDOFF — saas-starter-kit 开发手册（面向 codex / claude code）

> 本手册是给 **AI 编程工具**（codex、claude code 等）和接手开发者的一站式交接文档。
> 目标：你拿着本手册 + 基座仓库，能从 0 独立完成一个新 SaaS 的本地跑通与生产部署。
> 权威规则见 `AGENTS.md`；本手册描述「怎么做」，AGENTS.md 定义「不可违背的约束」。
> 基座定位与「单向流动」规则见 `README.md` —— 项目改动不得回流基座。

---

## 0. 速览

| 项 | 值 |
|---|---|
| 框架 | Next.js 16（App Router, Turbopack）+ React 19 + TypeScript strict |
| 数据库 | PostgreSQL（Neon serverless），ORM Drizzle（`drizzle-orm/neon-http`） |
| 认证 | better-auth 1.7：magic-link 邮箱登录（无密码）+ organizations 插件（多租户） |
| 支付 | **Gumroad**（托管结账 + Ping webhook），抽象层预留 Stripe / LemonSqueezy 挂载点 |
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
    checkout/           POST：生成 Gumroad 结账 URL（传 plan；email/successUrl/metadata 被 Gumroad 忽略）
    billing/gumroad/webhook/  POST：Gumroad Ping 回调（共享密钥 + seller 白名单 + 幂等）；GET：健康检查
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
    gumroad.ts          Gumroad 适配器：共享密钥校验 + seller 白名单 + 事件归一化（纯函数，可单测）
    entitlements.ts     ★ 权益存储唯一写入点（幂等 grantFromEvent / revokeFromEvent / isEntitled / activePlan）
    index.ts            抽象层入口（当前固定 GumroadProvider；新增供应商在此挂 adapter）
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
  new-saas.sh           ★ 从基座生成新项目（复制→改名→提示下一步）
  setup-local.ts        本地 .env 引导（生成 BETTER_AUTH_SECRET）+ 跑迁移
  check-config.ts       环境就绪度检查（pnpm check:config）
tests/                  vitest 单测（billing-gumroad 归一化 / pricing 配置）
drizzle.config.ts       drizzle-kit 配置（读 DATABASE_URL）
middleware.ts           路由保护（双 cookie 名兼容 http/https）
.github/workflows/ci.yml  CI：typecheck + lint + test + build 四闸门
```

★ = 新项目改动频率最高的文件。

---

## 2. 复制基座到新项目（改名清单）

### 方式 A：脚本（推荐）

```bash
git clone https://github.com/wilson-love/saas-starter-kit.git
cd saas-starter-kit
bash scripts/new-saas.sh my-saas            # 生成到 ../my-saas
```

脚本做的事：rsync 复制（排除 .git/node_modules/.next/脚本自身）→ package.json `name` 改为 `my-saas` → 打印改名清单与下一步。

### 方式 B：手动复制

```bash
rsync -a --exclude '.git' --exclude 'node_modules' --exclude '.next' \
  saas-starter-kit/ my-saas/
```

### 改名清单（必须逐项执行，AI 工具按此 grep 替换）

| 位置 | 原值 | 改为 |
|---|---|---|
| `package.json` name | `saas-starter-kit` | `my-saas`（npm 包名规约：小写字母数字连字符） |
| `app/layout.tsx` | `Your SaaS` 站点名/描述（SITE_TITLE/SITE_DESC/applicationName/openGraph） | 你的产品名 + 一句话描述 |
| `components/SiteHeader.tsx` | 品牌块 `S` + `Your SaaS` | 你的 Logo 字母 + 产品名；导航换成你的页面 |
| `components/SiteFooter.tsx` | `support@yourdomain.com` | 你的客服邮箱 |
| `app/opengraph-image.tsx` | `Your SaaS` 文案 | 产品名/标语 |
| `app/terms`、`app/privacy` | 占位条款 | 按你产品补全（或接入平台生成器生成） |
| `.env`（见 §3） | `EMAIL_FROM` / `APP_URL` 等 | 你的域名与邮箱 |
| `middleware.ts` protectedRoutes | `/dashboard /account /orgs /notes` | 保留通用项，新增你的受保护页面前缀 |
| 数据库 | `DATABASE_URL` | 新库连接串（Neon 新建数据库，不要复用基座/其他项目库） |

> 提示：基座里的 "Your SaaS" 是刻意统一的占位品牌，grep `Your SaaS` 可一次定位全部需要替换的点。

### 接入你自己的业务（三步，基座的 note 示例即样板）

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
| `PAYMENT_PROVIDER` | 支付供应商 | 当前仅 `gumroad`（默认）。新增 Stripe/LemonSqueezy 时先扩枚举再实现 adapter，见 §4.3 |
| `PAYMENT_LINK_ONEOFF` | 一次性档托管结账链接 | Gumroad 产品页 URL（形如 `https://<shop>.gumroad.com/l/<permalink>`） |
| `CHECKOUT_URL_PRO` | Pro 月订档托管结账链接 | 同上，Pro 产品页 URL |
| `CHECKOUT_URL_CREATOR` | Creator 月订档托管结账链接 | 同上，Creator 产品页 URL |
| `GUMROAD_PRODUCT_ONEOFF` | 一次性产品 ID | Gumroad 产品编辑页可查；webhook 用它反查档位 |
| `GUMROAD_PRODUCT_PRO` | Pro 产品 ID | 同上 |
| `GUMROAD_PRODUCT_CREATOR` | Creator 产品 ID | 同上 |
| `GUMROAD_WEBHOOK_SECRET` | webhook URL 共享密钥 | 自己生成随机串（`openssl rand -hex 24`），拼进 Ping URL 的 `?token=` |
| `GUMROAD_SELLER_ID` | 店铺 ID，webhook 白名单 | Gumroad 后台/首条 Ping payload 的 `seller_id`；不匹配的回调一律忽略 |
| `RESEND_API_KEY` | Resend 发信密钥 | https://resend.com/api-keys |
| `EMAIL_FROM` | 发件人 | 形如 `Name <noreply@yourdomain.com>`，**域名必须在 Resend 验证过**（SPF/DKIM），不能用 `@resend.dev` |
| `ANALYTICS_TOKEN` | 漏斗报表 token | 自定义随机串；留空则 /api/analytics 关闭 |
| `LLM_PROVIDER` / `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | （可选）表达层润色 | 默认 `none`（纯确定性）。接入时用 OpenAI 兼容端点；LLM 不得生成数字/规则 |

### 获取步骤速查（外部服务）

- **Neon**：注册 → 建项目（免费档即可）→ Dashboard 复制连接串 → 建议建独立数据库 per 新 SaaS。
- **Vercel**：github 导入仓库 → 项目设置里逐个填上述变量（Production/Preview 分开）→ Deploy。
- **Resend**：注册 → API Keys 建 key → Domains 添加并验证你的域名（配 3 条 DNS 记录：SPF/DKIM/可选 MX）→ 用验证后域名做 EMAIL_FROM。
- **Gumroad**：见 §4.1。
- **Stripe**（可选，未来）：注册 → 开发者模式拿 `sk_test_*` → 建产品与价格 → 建 webhook；切换见 §4.3。
- **Cloudflare**：你的域名 DNS 加 `CNAME xxx → cname.vercel-dns.com`（或按 Vercel 提示），HTTPS 自动由 Vercel 签发。

---

## 4. 支付接入（Gumroad）

> **为什么不是 Creem**：Creem 已被公司否决并停用，新项目收款统一走 Gumroad；不要再引入 Creem SDK、接口或文档口径。

### 4.1 Gumroad 全流程

1. **开店**：Gumroad 注册并完成收款设置（个人可开；MoR 模式，收单/税务/退款合规由 Gumroad 承担）。
2. **建三个产品**（对应 `config/pricing.ts` 四档中的三档）：
   - One-time $4.99（一次性买断）→ 复制产品页 URL 填 `PAYMENT_LINK_ONEOFF`，产品 ID 填 `GUMROAD_PRODUCT_ONEOFF`
   - Pro $9.99/month（订阅，`recurrence=monthly`）→ `CHECKOUT_URL_PRO` + `GUMROAD_PRODUCT_PRO`
   - Creator $19/month（订阅）→ `CHECKOUT_URL_CREATOR` + `GUMROAD_PRODUCT_CREATOR`
3. **生成 webhook 共享密钥**：`openssl rand -hex 24`，填 `GUMROAD_WEBHOOK_SECRET`。
4. **配置 Ping（webhook）**：Gumroad 后台 → Settings → Advanced → Ping URL，填：
   ```
   https://你的域名/api/billing/gumroad/webhook?token=<GUMROAD_WEBHOOK_SECRET>
   ```
   Gumroad 的 Ping **没有请求签名**，`?token=` 就是唯一鉴权；不要把它写进代码或日志。
5. **填 seller 白名单**：`GUMROAD_SELLER_ID`（可从后台或第一条 Ping payload 的 `seller_id` 取）。不填等于关闭来源校验，生产必填。
6. **测试支付**：
   - 本地：`pnpm dev` → `/pricing` 点 Choose → 跳 Gumroad 产品页（带 `?wanted=true` 直达结账）→ 用 Gumroad 测试/低价商品完成支付。
   - Gumroad 云端回调本地：用 cloudflare tunnel / ngrok 把公网地址指到 `localhost:3000`，Ping URL 填隧道地址，终端应看到 `[billing:gumroad] ... granted=true`。
   - 验证幂等：Gumroad 后台重发 Ping → 返回 `duplicate: true`，权益不重复发放。
   - 验证退款：对测试订单退款 → 终端 `status=canceled revoked=1` → `/account` 权益失效。
7. **上线**：Ping URL 换生产域名；确认三条产品链接与三个产品 ID 都是生产商品。

### 4.2 支付链路代码走查（改动前必读）

```
定价页(PricingCards) → POST /api/checkout {plan}
  → lib/billing/index.ts createCheckoutUrl（GumroadProvider）
  → 产品页 URL + ?wanted=true → 跳转 Gumroad 结账
Gumroad 支付成功 → POST /api/billing/gumroad/webhook?token=...
  → verifyGumroadSecret(token) 常量时间比较（失败 401）
  → normalizeGumroadEvent(payload)
       seller_id 不在白名单 / 商品 ID 未登记 / 无 sale_id → 忽略（200，避免重投）
       sale → active；refunded|disputed|refund|dispute → canceled；cancellation|cancel → expired
       customerRef = subscription_id || sale_id；到期时间按 recurrence 推算（monthly +1月 / yearly +1年）
  → grantFromEvent 幂等写入 entitlement（providerEventId 唯一约束）
  → status !== active 时 revokeFromEvent 翻掉同 customerRef 的旧 active 行
  → trackEvent('payment_granted')
业务侧：isEntitled({email, subject}) / activePlan({email, subject}) 判断权益
```

铁律（不可违反）：密钥不匹配即 401；事件幂等（重复投递只生效一次）；撤销必须同时翻旧行（否则退款后用户仍保留权益）；**前端 success 回调绝不发放权益**。

Gumroad 能力边界（必须知道的取舍）：
- hosted checkout **不支持** `success_url` / `prefilled_email` / `metadata` 透传，所以 `CheckoutOptions` 里的这三个字段在 Gumroad 下被忽略；换 Stripe 时可原样启用。
- 权益归属靠 Ping 的 `email` 与登录邮箱一致；不一致时用户在 `/account` 人工认领（模板已保留该入口）。
- 一次性买断的 license key 校验/授权**尚未抽取**（当前只有买断支付本身），需要时按 Gumroad `/licenses/verify` 接口单独实现。

### 4.3 新增其他供应商（Stripe / LemonSqueezy，预留入口）

1. `config/env.ts`：扩展 `PAYMENT_PROVIDER` 枚举，新增对应密钥（如 `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`）。
2. `lib/billing/stripe.ts`：新增 `StripeProvider implements PaymentProvider`：
   - `createCheckoutUrl(opts)`：创建 Checkout Session（可用 `success_url` / `metadata` / customer email）；
   - 事件归一化：`checkout.session.completed` → `active`；`customer.subscription.updated/deleted` → 更新/取消。
3. `lib/billing/index.ts`：把当前固定的 `new GumroadProvider()` 改成按 `PAYMENT_PROVIDER` 选择。
4. `app/api/billing/stripe/webhook/route.ts`：参照 gumroad webhook 骨架（验签用 `stripe.webhooks.constructEvent`）→ 归一化 → `grantFromEvent` / `revokeFromEvent`。中间件路由表不动。
5. `.env`：`PAYMENT_PROVIDER=stripe` + 填密钥，业务代码（entitlements/usage/页面）零改动。

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

- 基座架构**同时兼容单租户**：单租户部署时，为每个用户自动建一个个人组织（或让所有数据挂在同一组织下），代码路径不变——这就是「多租户结构保留，单租户也能跑」的设计。新业务不要写死「当前用户=当前数据」而绕过组织 ID。

### 邀请流程

- 邀请：owner/admin 在 `/orgs` 输入邮箱+角色 → `organization.inviteMember` → invitation 表落库（状态 pending）。
- 接受：被邀人登录后在 `/orgs` 的 **Invitations for you** 区块（`listInvitations()` 不带 orgId 查到自己的 pending 邀请）点 Accept → `organization.acceptInvitation`。注意：非成员**不能**带 organizationId 查组织邀请（会被拒），必须用无 orgId 的"我的邀请"查询。
- 想发邀请邮件：在 inviteMember 成功后调 `lib/email` 发一封带 `acceptInvitation` 链接的邮件（可自行扩展；基座演示的是站内接受）。

---

## 7. 部署上线清单（Vercel）

### 前置（一次性）

1. GitHub 建仓库并推送（见 §8 常见坑中的推送）。
2. **Neon**：建数据库；生产用独立库（不要与本地/预发布混用）。
3. **Resend**：验证发信域名（SPF/DKIM）。
4. **Gumroad**：完成 §4.1 的三个产品、Ping URL（带 token）与 seller 白名单。
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
#    DATABASE_URL / RESEND_API_KEY / EMAIL_FROM
#    PAYMENT_PROVIDER / PAYMENT_LINK_ONEOFF / CHECKOUT_URL_PRO / CHECKOUT_URL_CREATOR
#    GUMROAD_PRODUCT_* / GUMROAD_WEBHOOK_SECRET / GUMROAD_SELLER_ID
#    APP_URL / BETTER_AUTH_URL / ANALYTICS_TOKEN(可选)

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
#    Gumroad 后台：Ping URL 改生产域名（带 ?token=）
#    先自己买一单验证 → /account 出现付费档 → 再测一次退款撤权 → 成功后再对外宣传

# 8) 冒烟
#    https://app.yourdomain.com/api/health  → {"ok":true}
#    https://app.yourdomain.com/api/billing/gumroad/webhook
#      → {provider, secretConfigured, sellerWhitelisted, productsConfigured}
#    登录（收信点魔链）→ 建组织 → 邀请第二账号 → 定价页测试支付
```

### 灰度注意

- `CI`（.github/workflows/ci.yml）每次 push 自动跑四闸门；失败会阻断合并，先本地跑通再推。
- Preview 环境（Vercel 自动生成）默认共享 Production 环境变量，注意 Gumroad 的 Ping 只有一个 URL——预览环境建议单独配一个测试商品，否则预览支付会写生产库。

---

## 8. 常见坑（踩过并修复的，全部保留在代码里）

1. **Gumroad 没有签名**：不要照 Stripe/Creem 找 `X-Signature` 头。鉴权全靠 Ping URL 的 `?token=` + `seller_id` 白名单；少配一个，任何人都能伪造「已付款」事件。上线前必须 `pnpm check:config` 确认两项都 configured。
2. **`.env` 引号**：值含空格/特殊字符时用双引号包裹；`.env` 不以 `#` 开头留注释空格（`#` 是注释符）。编辑后 `pnpm check:config` 校验。
3. **迁移**：`db:migrate` 之前必须 `db:generate`（schema 变更后）；**不要手改**已生成的迁移文件；全新库顺序 `db:generate → db:migrate`。`drizzle.config.ts` 读 `DATABASE_URL`（不是 `POSTGRES_URL`，旧项目遗留坑已修）。
4. **构建不连库**：`lib/db/index.ts` 在 build 阶段不查库；CI 里 build 只传 `BETTER_AUTH_SECRET` 即可。运行时缺 `DATABASE_URL` 会在首次查询时报错（本地 `setup:local` 会引导）。
5. **魔法链接被邮件网关预扫描**：某些网关会点击链接导致 token 一次性失效——登录页 `INVALID_TOKEN` 兜底文案 + `errorCallbackURL=/sign-in` 已处理，不要改成自动重发（防滥用）。
6. **runtime=edge 陷阱**：任何用到 `crypto` 原生模块（webhook 密钥比较）或 `satori/@resvg/resvg-js`（分享图）的路由必须 `export const runtime = 'nodejs'`，否则部署后 500。
7. **rate limit**：Gumroad/Resend/Neon 都有额度。Resend 免费档每日 100 封；Neon 免费档有并发限制——批量任务用 `lib/db/cache-store.ts` 缓存外部响应，避免重复请求。
8. **多租户泄漏**：grep 检查业务表查询是否都带 `organizationId` 条件；`app/api/notes` 是正确样板。权限：只有 owner/admin 能改成员/邀请（better-auth 默认 roles 已实现，页面按钮按 `m.role` 控制）。
9. **双 cookie 名**：middleware 必须同时查 `better-auth.session_token` 与 `__Secure-better-auth.session_token`（本地 http / 生产 https 不同），漏一个会导致生产反复跳登录页。
10. **推送 GitHub**：仓库是私有的，用 HTTPS + Personal Access Token（`https://<token>@github.com/...`）或 SSH。首次 push 前 `git remote add origin ...` 且确认分支名 `main`（Vercel 默认分支）。

---

## 9. 给 codex / claude code 的开场 Prompt（可直接粘贴）

```
你是资深 Next.js 全栈工程师。这是 saas-starter-kit 基座项目。
请先完整阅读 docs/DEVELOPER_HANDOFF.md 和 AGENTS.md，然后：
1. 运行 scripts/new-saas.sh <我的项目名> 生成新项目（或在当前目录改名）；
2. 按手册 §2 改名清单替换 "Your SaaS" 占位为我的产品名；
3. 按 §3 让我提供各外部服务的密钥，填 .env（支付走 Gumroad，不要引入 Creem）；
4. 按 §6 把 app/notes 示例业务替换为我的业务（表/页面/API/额度）；
5. 跑通 pnpm typecheck && lint && test && build，然后按 §7 部署到 Vercel。
每完成一步向我汇报，涉及外部账号（Neon/Resend/Gumroad/Vercel/Cloudflare）的操作给明确指引。
```

---

_Last updated: 2026-11-12 · 基座版本 v1.1.0（Gumroad 支付）_
