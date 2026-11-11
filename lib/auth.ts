/**
 * better-auth：magic link 无密码登录 + organizations 多租户。
 * 数据库走 Drizzle（Neon Postgres），发信走 Resend。
 */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization, magicLink } from 'better-auth/plugins';
import { db } from './db';
import * as schema from './db/schema';
import { sendMagicLinkEmail } from './email';
import { env } from '@/config/env';

const baseURL = env.BETTER_AUTH_URL;
const secret = env.BETTER_AUTH_SECRET;

export const auth = betterAuth({
  secret,
  baseURL,
  trustedOrigins: [env.APP_URL, env.BETTER_AUTH_URL].filter(
    (v): v is string => !!v && !v.includes('localhost'),
  ),
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),
  emailAndPassword: { enabled: false },
  plugins: [
    organization({
      membersLimit: 10,
      teams: {
        enabled: false,
      },
    }),
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],
});
