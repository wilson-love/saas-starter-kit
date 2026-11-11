import { redirect } from 'next/navigation';

// 受保护的用户中心首页：登录后落到 /account。
// middleware 已对 /dashboard 做登录保护，未登录先被拦到 /sign-in。
export default function DashboardPage() {
  redirect('/account');
}
