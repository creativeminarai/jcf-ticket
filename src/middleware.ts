import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_TOKEN = "admin_session";

export async function middleware(request: NextRequest) {
  // ログインページとAPI routeは除外
  if (
    request.nextUrl.pathname === '/admin/login' ||
    request.nextUrl.pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  // 管理者ページへのアクセスをチェック
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // セッションクッキーをチェック
    const sessionCookie = request.cookies.get(SESSION_TOKEN)

    if (!sessionCookie || sessionCookie.value !== "authenticated") {
      // 未認証の場合はログインページへリダイレクト
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // 認証済みまたはその他のリクエストはそのまま通す
  return NextResponse.next()
}

export const config = {
  matcher: [
    // 管理者ページのパスのみマッチ
    '/admin/:path*'
  ],
}