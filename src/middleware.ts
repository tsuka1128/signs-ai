/**
 * Next.js ミドルウェア
 *
 * Supabase Auth のセッションを更新し、認証が必要なルートを保護します。
 * 未認証ユーザーはログインページへリダイレクトします。
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 認証不要のパス（パブリックルート） */
const PUBLIC_ROUTES = ["/", "/login", "/marketing", "/survey", "/auth/callback"];

/**
 * パスがパブリックルートかどうかを判定する
 */
function isPublicRoute(path: string): boolean {
    return PUBLIC_ROUTES.some(
        (route) => path === route || path.startsWith(`${route}/`)
    );
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // セッションを最新の状態に更新（必須）
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // 未認証かつ保護されたルートへのアクセス → ログインページへ
    if (!user && !isPublicRoute(pathname)) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 認証済みかつ /login へのアクセス → ダッシュボードへ
    if (user && pathname === "/login") {
        const dashboardUrl = request.nextUrl.clone();
        dashboardUrl.pathname = "/";
        return NextResponse.redirect(dashboardUrl);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
