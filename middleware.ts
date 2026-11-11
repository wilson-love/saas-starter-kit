import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 需要登录才能访问的路由前缀（新增受保护页面时加到这里）
const protectedRoutes = ['/dashboard', '/account', '/orgs', '/notes'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

  if (
    isProtected &&
    !request.cookies.get('better-auth.session_token') &&
    !request.cookies.get('__Secure-better-auth.session_token')
  ) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
