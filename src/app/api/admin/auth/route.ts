import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const SESSION_TOKEN = "admin_session";

export async function GET(request: NextRequest) {
  const pathname = request.headers.get("x-pathname") || "/admin";
  
  // セッションクッキーをチェック
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_TOKEN);

  if (!sessionCookie || sessionCookie.value !== "authenticated") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 認証済みの場合は元のページへ
  return NextResponse.redirect(new URL(pathname, request.url));
}