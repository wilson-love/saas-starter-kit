#!/usr/bin/env bash
# ============================================================
# new-saas.sh — 从 overseas-saas-starter 生成一个新 SaaS 项目
# 用法：
#   bash scripts/new-saas.sh my-saas           # 生成到 ../my-saas
#   bash scripts/new-saas.sh my-saas /abs/path # 生成到指定目录
# 效果：复制模板 -> 改名（package.json/README 占位）-> 提示下一步
# 注意：模板本身不改动；生成的目录不含 .git，由你自己 git init。
# ============================================================
set -euo pipefail

NAME="${1:-}"
DEST_DIR="${2:-}"

if [[ -z "$NAME" ]]; then
  echo "用法: bash scripts/new-saas.sh <项目名> [目标目录]" >&2
  exit 1
fi

# 项目名规约：小写字母/数字/连字符（npm 包名要求）
if [[ ! "$NAME" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "项目名必须是小写字母/数字/连字符（npm 包名规约），例如 my-saas" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -z "$DEST_DIR" ]]; then
  DEST_DIR="$(cd "$TEMPLATE_DIR/.." && pwd)/$NAME"
fi

if [[ -e "$DEST_DIR" ]]; then
  echo "目标目录已存在: $DEST_DIR （请删除或换个名字）" >&2
  exit 1
fi

echo "▶ 从模板复制到 $DEST_DIR ..."
mkdir -p "$DEST_DIR"
# 排除：git/产物/依赖/本脚本自身/构建缓存
rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'scripts/new-saas.sh' \
  --exclude '.DS_Store' \
  "$TEMPLATE_DIR"/ "$DEST_DIR"/

echo "▶ 改名 $NAME ..."
# package.json 的 name 字段
if [[ "$(uname -s)" == "Darwin" ]]; then
  sed -i '' "s/\"name\": \"overseas-saas-starter\"/\"name\": \"$NAME\"/" "$DEST_DIR/package.json"
else
  sed -i "s/\"name\": \"overseas-saas-starter\"/\"name\": \"$NAME\"/" "$DEST_DIR/package.json"
fi

cat <<EOF

✅ 新项目已生成: $DEST_DIR

下一步（逐条执行）：
  cd $DEST_DIR
  pnpm install
  cp .env.example .env            # 填 DATABASE_URL（Neon 连接串）
  pnpm setup:local                # 生成 BETTER_AUTH_SECRET + 跑迁移
  pnpm dev                        # http://localhost:3000

改名清单（写代码前手动替换，或让 AI 编码工具按 docs/DEVELOPER_HANDOFF.md 执行）：
  - 站点品牌：app/layout.tsx 的 SITE_TITLE/SITE_DESC、components/SiteHeader.tsx、SiteFooter.tsx、opengraph-image.tsx 中的 "Your SaaS"
  - 邮件发件人：.env 的 EMAIL_FROM（必须用你验证过的域名）
  - APP_URL / BETTER_AUTH_URL：生产填最终 HTTPS 域名
  - 数据库：Neon 新建数据库，DATABASE_URL 用新连接串
  - 域名：Cloudflare DNS 指向 Vercel，绑定子域（如 xxx.yourdomain.com）

部署与支付配置详见 docs/DEVELOPER_HANDOFF.md。
EOF
