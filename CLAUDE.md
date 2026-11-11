# CLAUDE.md

首次接手请先读 **`docs/DEVELOPER_HANDOFF.md`**（架构、数据流、模块 API、部署、踩坑一站式承接）；开发规范、架构铁律与合规红线以 **AGENTS.md** 为唯一权威来源，开始任何改动前完整阅读并严格遵守。

快速要点（细节以 AGENTS.md 为准）：

1. 这是**通用 SaaS 模板**：新业务表必须带 `organizationId` 外键并按 active organization 隔离（参考 `lib/db/schema.ts` 的 note 表与 `lib/server/notes.ts`）。
2. 纯逻辑（解析/规则/计算）独立成纯函数模块，禁止网络/DB/LLM；数值只由纯逻辑 + `config` 产生且有测试锁定。
3. LLM 仅做表达层润色，默认关闭，绝不生成数字/概率/规则。
4. 原生模块路由必须 `runtime = 'nodejs'`（satori / resvg 等）。
5. Billing：验签、事件 ID 幂等、只信服务端 webhook；供应商差异收敛在 `lib/billing`（Gumroad 默认，Stripe 预留 adapter）。
6. 合并闸门：`pnpm typecheck && pnpm lint && pnpm test && pnpm build` 必须全绿；改纯逻辑先改测试。
7. Conventional Commits；不入库 `.env`，新增变量同步 `.env.example` 与 `config/env.ts`。
8. 合规：不做侵入式客户端操作、不碰密码/Token/未成年人数据；支付只走 MoR。
9. 给用户看的文档命名：`中文名_创建日期_版本号`，日期用创建日期；给系统看的文件保持英文名不带日期。详见 AGENTS.md「文档与交付物命名」。
