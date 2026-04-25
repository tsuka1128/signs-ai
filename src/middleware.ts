/**
 * Next.js ミドルウェア
 *
 * Supabase Auth のセッションを更新し、認証が必要なルートを保護します。
 * 未認証ユーザーはログインページへリダイレクトします。
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hostname = request.headers.get("host");

    // ドメインを統一（Canonical Redirect）
    // 本番環境かつ、プライマリドメイン(NEXT_PUBLIC_CANONICAL_DOMAIN)以外からのアクセスの場合に実施
    const canonicalDomain = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN;
    if (
        process.env.NODE_ENV === "production" && 
        canonicalDomain &&
        hostname && 
        hostname !== canonicalDomain &&
        !hostname.includes("localhost")
    ) {
        return NextResponse.redirect(`https://${canonicalDomain}${pathname}${request.nextUrl.search}`, 301);
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    // 認証不要のパス（パブリックルート）の判定を簡素化・堅牢化
    const publicPrefixes = ["/login", "/register", "/marketing", "/survey", "/auth/callback", "/form", "/forgot-password", "/password-update", "/terms", "/privacy"];
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

    // ── トライアル期限切れチェック (書き込み操作のみ制限) ──
    const isMutateRequest = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    const isDocExport = pathname.includes("/export"); // エクスポートは許可したい場合など
    
    if (user && isMutateRequest && !isPublic && !isDocExport) {
        // ユーザーの所属企業情報を取得
        const { data: userData } = await supabase
            .from('users')
            .select('company_id, role')
            .eq('id', user.id)
            .single();

        if (userData?.company_id && userData.role !== 'super_admin') {
            const { data: company } = await supabase
                .from('companies')
                .select('status, trial_expires_at')
                .eq('id', userData.company_id)
                .single();

            const now = new Date();
            const isExpired = company?.status === 'trial' && 
                             company.trial_expires_at && 
                             new Date(company.trial_expires_at) < now;

            if (isExpired) {
                // トライアル期限切れの場合、403を返す（フロントエンドで検知してアラート表示想定）
                return new NextResponse(
                    JSON.stringify({ 
                        error: "Trial period has expired", 
                        message: "トライアル期間が終了しました。プランのアップグレードをご検討ください。" 
                    }),
                    { status: 403, headers: { 'content-type': 'application/json' } }
                );
            }
        }
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
