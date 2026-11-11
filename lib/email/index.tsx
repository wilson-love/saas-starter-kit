/**
 * 事务邮件（Resend + React Email）。
 * 未配置 RESEND_API_KEY 时（本地开发）不真正发送，只在服务端打印链接，Fail Fast 可见。
 * 发信地址由 EMAIL_FROM 控制（形如 'Display Name <noreply@example.com>'）。
 */
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { env } from '@/config/env';
import MagicLinkEmail from './templates/MagicLinkEmail';
import WaitlistEmail from './templates/WaitlistEmail';

// 配置了 API key 才实例化真实客户端；否则为 null（dev 模式只打印不发送）
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const EMAIL_FROM = env.EMAIL_FROM;

export async function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  const html = await render(<MagicLinkEmail url={url} />);
  if (!resend) {
    console.info(`\n[email:dev] Magic link for ${to}:\n${url}\n`);
    return;
  }
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: 'Your sign-in link',
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendWaitlistEmail(to: string): Promise<void> {
  const html = await render(<WaitlistEmail />);
  if (!resend) {
    console.info(`[email:dev] Waitlist confirmation for ${to}`);
    return;
  }
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "You're on the waitlist",
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
