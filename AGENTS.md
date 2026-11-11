# AGENTS.md — 项目开发宪法（AI 编码必读）

> 首次接手：完整来龙去脉（需求/设计/数据流/模块 API/部署/backlog/踩坑）见 `docs/DEVELOPER_HANDOFF.md`，先读它再动手；本文件是不可违背的铁律。

## 定位与边界

- 这是**通用 SaaS 模板**（overseas-saas-starter），不是具体产品。接入新业务时：
  1) 建新业务表（必须带 `organizationId` 外键，见 schema.ts 的 note 表示例）；
  2) 页面/API 写在 `app/`，服务端逻辑写 `lib/server/`；
  3) 免费额度用 `lib/server/usage.ts`（按 subject 计次），付费判断用 `lib/billing/entitlements.ts`。
- 模板不得混入任何具体业务文案、Logo、素材；"Your SaaS" 是占位品牌，新项目替换为真实品牌。
- 合规红线：不做任何侵入式客户端操作、不收集密码/Cookie/Token/精确定位/未成年人数据；支付只走 merchant of record（MoR）。

## 架构铁律

1. **多租户**：任何新业务表必须带 `organizationId` 外键；查询按会话的 active organization 过滤；写入带当前组织 ID。禁止全局无过滤查询业务数据。
2. 数据分级：A=外部 API（Stripe/Gumroad/Resend 等）、B=静态数据、C=业务规则（确定性）；D=LLM 仅允许表达层润色，默认关闭（LLM_PROVIDER=none）。LLM 永远不得生成/修改任何数字、概率、规则。
3. IO/编排放 `lib/server/**` 与 `app/api/**`；纯逻辑（解析/规则/计算）独立成纯函数模块，禁止反向依赖 IO。
4. 访问 better-sqlite3 类原生模块（satori / @resvg/resvg-js）的路由必须 `export const runtime = 'nodejs'`（不能 edge）。
5. Billing 三铁律：验签失败即拒；事件 ID 幂等 upsert；只信服务端 webhook，前端回调不发权益。供应商差异收敛在 `lib/billing`，业务代码只依赖其抽象接口（切换 Stripe 只改配置/新增 adapter，不改业务代码）。
6. 外部输入（请求体、第三方响应）一律 zod 校验/防御式读取，不假设字段存在。

## 代码规范

- TypeScript strict；不使用 `any`（确需时用 `unknown` 并收窄，加注释）。
- 命名：对外字段 camelCase；外部原始 snake_case 只在适配边界接触。
- 提交遵循 Conventional Commits（feat/fix/docs/test/refactor/chore/build/ci）。
- 合并前必须 `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 全绿。
- 改动纯逻辑/阈值时，先改/加 tests/ 用例，再改实现；不允许无测试调整阈值。
- 不引入重型 UI 组件库/状态库；UI 用 Tailwind + components/ 手写小组件。
- 新增原生依赖需加入 package.json `pnpm.onlyBuiltDependencies`。

## 配置与密钥

- 只读 `config/env.ts` 声明过的环境变量；`.env` 不入库，新增变量同步更新 `.env.example`。
- 不在代码/日志/错误信息中回显完整密钥、token、cookie。

## 数据库

- 改 schema 后 `pnpm db:generate` 生成迁移并提交 lib/db/migrations/；禁止手改已生成的历史迁移。
- 全新库：`pnpm db:generate`（首次）→ `pnpm db:migrate`。
- 写操作考虑幂等；时间统一毫秒时间戳或 Postgres timestamptz。

## 文档与交付物命名（铁律）

- **给用户看的文档**（手册/教程/报告等，中文为主）：文件名用 `中文名_YYYY-MM-DD_vX.Y.<ext>`，日期为**文档创建日期**，版本从 v1.0 递增；旧版本保留不覆盖。
- **给系统/AI 看的文件**（README/AGENTS.md/CLAUDE.md/DEVELOPER_HANDOFF/配置类）保持英文名、不带日期，不汉化。
- 给用户看的交付物正文用中文，保留必要英文专有名词；给系统看的注释/配置用英文。
