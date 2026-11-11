import { createAuthClient } from 'better-auth/react';
import { organizationClient, magicLinkClient } from 'better-auth/client/plugins';

/**
 * 浏览器端 baseURL 解析（优先级）：
 * 1. NEXT_PUBLIC_BETTER_AUTH_URL —— 显式指定时优先；
 * 2. window.location.origin —— 默认自动取当前站点域名，
 *    天然适配任意自定义域名 / 多子域名（每个 SaaS、每个子域开箱即用，无需配置）；
 * 3. SSR / 构建期无 window 时回退 BETTER_AUTH_URL 或 localhost。
 */
function resolveBaseURL(): string {
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
}

export const authClient = createAuthClient({
  baseURL: resolveBaseURL(),
  plugins: [organizationClient(), magicLinkClient()],
});

// 常用导出：登录/登出/会话
export const { signIn, signOut, useSession } = authClient;

// 组织相关 hooks/actions 挂在 authClient 实例上：
//   authClient.useListOrganizations() / useActiveOrganization() / useListMembers({organizationId}) / useListInvitations({organizationId})
//   authClient.organization.create / setActive / inviteMember / removeMember / acceptInvitation / cancelInvitation ...
export { authClient as client };
