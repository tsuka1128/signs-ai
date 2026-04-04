/**
 * Next.js ミドルウェア
 *
 * Supabase Auth のセッションを更新し、認証が必要なルートを保護します。
 * 未認証ユーザーはログインページへリダイレクトします。
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const { pathname } = request.nextUrl;

    // 認証不要のパス（パブリックルート）の判定を簡素化・堅牢化
    const publicPrefixes = ["/login", "/register", "/marketing", "/survey", "/auth/callback", "/form", "/forgot-password", "/password-update"];
    const isPublic = publicPrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));

    // パブリックルートの場合は早期リターンまたは認証チェックをスキップする設定も検討可能ですが、
    // Supabase SSR ではセッション更新のために一連の処理を推奨しています。
    
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

    // セッションを最新の状態に更新
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 未認証かつ保護されたルートへのアクセス → ログインページへ
    if (!user && !isPublic) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 認証済みかつ /login へのアクセス → ダッシュボードへ
    if (user && (pathname === "/login" || pathname === "/register")) {
        const dashboardUrl = request.nextUrl.clone();
        dashboardUrl.pathname = "/";
        return NextResponse.redirect(dashboardUrl);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * 次のパスを除くすべてのリクエストパスにマッチします:
         * - _next/static (静的ファイル)
         * - _next/image (画像最適化ファイル)
         * - favicon.ico (ファビコンファイル)
         * - 静的アセット（svg, png, jpg, jpeg, gif, webp）
         * - /form (アンケート回答ページ - ミドルウェア自体で確実に除外されるように正規表現でも指定)
         */
        "/((?!_next/static|_next/image|favicon.ico|form|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
