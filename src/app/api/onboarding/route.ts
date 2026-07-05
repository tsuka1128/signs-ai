/**
 * オンボーディング API Route
 *
 * フロントエンドから受け取ったオンボーディングデータを Supabase に一括保存します。
 * 認証済みユーザーのみアクセス可能です。
 *
 * POST /api/onboarding
 */

import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeText } from "@/lib/utils/index";

/**
 * オンボーディング失敗時の補償処理。
 * 企業レコードを削除すると、departments / kpi_definitions / semantic_layers は
 * ON DELETE CASCADE で、users.company_id は ON DELETE SET NULL で自動的に巻き戻る。
 * companies には DELETE 用 RLS ポリシーが無いため、サービスロールで削除する。
 */
async function rollbackOnboarding(companyId: string) {
    const admin = createServiceRoleClient();
    if (!admin) {
        console.error(
            `[Onboarding Rollback] SUPABASE_SERVICE_ROLE_KEY 未設定のため company=${companyId} を削除できませんでした。手動クリーンアップが必要です。`
        );
        return;
    }
    const { error } = await admin.from("companies").delete().eq("id", companyId);
    if (error) {
        console.error(`[Onboarding Rollback] company=${companyId} の削除に失敗: ${error.message}`);
    } else {
        console.warn(`[Onboarding Rollback] 不完全な company=${companyId} をロールバック削除しました。`);
    }
}

/** リクエストボディの型定義 */
interface OnboardingPayload {
    companyName?: string;
    invitationToken?: string;
    selectedDeptId?: string;
    selectedAxisId?: string;
    departments?: { name: string; headcount: number }[];
    kpis?: {
        name: string;
        unit: string;
        target_default: string;
        owner_dept_index: number | null;
        sort_order: number;
    }[];
    semanticContent?: string;
    websiteUrl?: string;
}

export async function POST(request: NextRequest) {
    const supabase = await createServerSupabaseClient();

    // 認証確認
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    let payload: OnboardingPayload;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ message: "リクエストの形式が不正です" }, { status: 400 });
    }

    const { 
        companyName: rawCompanyName, 
        departments: rawDepts, 
        kpis: rawKPIs, 
        semanticContent: rawSemanticContent, 
        invitationToken, 
        selectedDeptId, 
        selectedAxisId, 
        websiteUrl 
    } = payload;

    // サニタイズ適用
    const companyName = sanitizeText(rawCompanyName || "");
    const semanticContent = sanitizeText(rawSemanticContent || "");
    const departments = rawDepts?.map(d => ({ ...d, name: sanitizeText(d.name) }));
    const kpis = rawKPIs?.map(k => ({ ...k, name: sanitizeText(k.name), unit: sanitizeText(k.unit) }));

    // ユーザー現在のプロファイルを確認
    const { data: profile } = await supabase.from('users').select('role, company_id').eq('id', user.id).single();
    const isSuperAdmin = profile?.role === 'super_admin';

    // A. 招待トークンがある場合の処理
    if (invitationToken) {
        // ダミートークン「TAION」の場合はデモデータを作成
        if (invitationToken === "TAION") {
            let createdDemoCompanyId: string | null = null;
            try {
                // 1. Free プラン取得
                const { data: freePlan } = await supabase.from("plans").select("id").eq("name", "Free").single();
                if (!freePlan) throw new Error("Freeプランが見つかりません。シードデータを確認してください。");

                // 2. デモ企業作成
                // 企業レコードの作成・読み戻しはサービスロールで行う（profile.company_id 未設定のため
                // companies の RLS では insert 直後の .select() が通らない。テナント分離のため
                // companies_select_own の脆弱な "OR auth.uid() IS NOT NULL" 句は撤去済み）。
                const admin = createServiceRoleClient();
                if (!admin) {
                    throw new Error("サーバー設定エラー: SUPABASE_SERVICE_ROLE_KEY が未設定です");
                }
                const { data: company, error: cErr } = await admin.from("companies").insert({
                    name: "株式会社 TAION (デモ)",
                    plan_id: freePlan.id,
                    status: "active",
                    secondary_axis_name: "ブランド / エリア"
                }).select("id").single();
                if (cErr || !company) throw new Error("デモ企業の作成に失敗しました");
                createdDemoCompanyId = company.id;

                // 3. ユーザーと紐付け (管理者以外の場合のみ)
                if (!isSuperAdmin) {
                    const { error: uErr } = await supabase.from("users").upsert({
                        id: user.id,
                        company_id: company.id,
                        role: "admin",
                        email: user.email ?? "",
                        display_name: user.user_metadata?.full_name ?? user.email ?? ""
                    });
                    if (uErr) throw new Error(`ユーザーの紐付けに失敗しました: ${uErr.message}`);
                }

                // 4. デモ部署作成
                const depts = ["経営層", "経企・人事", "営業部", "カスタマーサクセス", "開発部"];
                const { data: createdDepts, error: dErr } = await supabase.from("departments").insert(
                    depts.map(name => ({ company_id: company.id, name, headcount: 10 }))
                ).select("id, name");
                if (dErr || !createdDepts) throw new Error(`デモ部署の作成に失敗しました: ${dErr?.message}`);

                // 5. デモKPI作成
                const kpiNames = ["MRR", "リード数", "商談化率", "解約率", "従業員体温スコア"];
                const units = ["万円", "件", "%", "%", "pt"];
                const { error: kErr } = await supabase.from("kpi_definitions").insert(
                    kpiNames.map((name, i) => ({
                        company_id: company.id,
                        name,
                        unit: units[i],
                        sort_order: i,
                        owner_dept_id: createdDepts ? createdDepts[i % createdDepts.length].id : null,
                        is_main: i < createdDepts.length // 各部署の最初の1つを代表にする
                    }))
                );
                // 6. デモ第2軸作成
                const axisNames = ["東京本店", "大阪支店", "名古屋支店", "福岡支店", "ECサイト"];
                const { data: createdAxes, error: aErr } = await supabase.from("kpi_axes").insert(
                    axisNames.map(name => ({ company_id: company.id, name }))
                ).select("id, name");
                if (aErr || !createdAxes) throw new Error(`デモ第2軸の作成に失敗しました: ${aErr?.message}`);

                // 7. ユーザーの初期 axis_id 設定 (選択されていた場合、あるいは1つ目)
                const targetAxisId = selectedAxisId || createdAxes[0].id;
                await supabase.from("users").update({ axis_id: targetAxisId }).eq("id", user.id);

                return NextResponse.json({ success: true, companyId: company.id });
            } catch (e: any) {
                console.error("TAIONデモ作成エラー:", e.message);
                if (createdDemoCompanyId) {
                    await rollbackOnboarding(createdDemoCompanyId);
                }
                return NextResponse.json({
                    message: "デモデータの作成に失敗しました",
                    detail: e.message
                }, { status: 500 });
            }
        }

        try {
            // 招待状を確認
            const { data: invite, error: inviteError } = await supabase
                .from("invitations")
                .select("*")
                .eq("token", invitationToken)
                .eq("status", "pending")
                .gt("expires_at", new Date().toISOString())
                .single();

            if (inviteError || !invite) {
                return NextResponse.json({ message: "無効または期限切れの招待リンクです" }, { status: 400 });
            }

            // 招待メールとログイン中ユーザーの一致チェック
            if (!isSuperAdmin && invite.email !== user.email) {
                return NextResponse.json({
                    message: "この招待リンクは別のメールアドレス宛です。招待されたメールアドレスでログインし直してください。"
                }, { status: 403 });
            }

            // ユーザーを招待元の会社とロールに紐付け (管理者以外の場合のみ)
            if (!isSuperAdmin) {
                const { error: userUpdateError } = await supabase.from("users").upsert({
                    id: user.id,
                    company_id: invite.company_id,
                    department_id: selectedDeptId || invite.department_id || null,
                    axis_id: selectedAxisId || invite.axis_id || null,
                    slack_user_id: invite.slack_user_id || null,
                    email: user.email ?? "",
                    display_name: user.user_metadata?.full_name ?? user.email ?? "",
                    role: invite.role,
                });

                if (userUpdateError) {
                    throw new Error(`ユーザーの登録に失敗しました: ${userUpdateError.message}`);
                }
            }

            // 招待を「承諾済み」に更新
            await supabase.from("invitations")
                .update({ status: "accepted" })
                .eq("id", invite.id);

            return NextResponse.json({ success: true, companyId: invite.company_id });
        } catch (e: any) {
            return NextResponse.json({ message: e.message || "招待の処理中にエラーが発生しました" }, { status: 500 });
        }
    }

    // B. 新規作成の場合のバリデーション
    if (!companyName) {
        return NextResponse.json({ message: "企業名は必須です" }, { status: 400 });
    }
    if (!departments?.length || departments.some((d) => !d.name)) {
        return NextResponse.json({ message: "部署名を入力してください" }, { status: 400 });
    }
    if (!kpis?.length || kpis.some((k) => !k.name)) {
        return NextResponse.json({ message: "KPI名を入力してください" }, { status: 400 });
    }

    // 企業作成後に後続ステップが失敗した場合、ゾンビデータ（紐付け不完全な企業・
    // company_id だけ設定されたユーザー）が残り再登録できなくなる。失敗時に削除して巻き戻すため
    // 作成済み企業 ID を保持する。
    let createdCompanyId: string | null = null;

    try {
        // 1. Free プランの ID を取得
        const { data: freePlan, error: planError } = await supabase
            .from("plans")
            .select("id")
            .eq("name", "Free")
            .single();

        if (planError || !freePlan) {
            throw new Error("プランの取得に失敗しました");
        }

        // 2. 企業を作成
        // Generate Short ID (P-YYMMDD-XXXX)
        const planRes = await supabase.from('plans').select('name').eq('id', freePlan.id).single();
        const planChar = planRes.data?.name?.[0]?.toUpperCase() || 'U';
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const tempId = Math.random().toString(36).substring(2, 6).toUpperCase();

        // 企業レコードの作成・読み戻し・short_id 更新はサービスロールで行う。
        // この時点ではユーザーの profile.company_id が未設定のため get_my_company_id() が null になり、
        // companies の RLS（id = get_my_company_id()）では insert 直後の .select() 読み戻しも update も通らない。
        // 以前は companies_select_own の "OR auth.uid() IS NOT NULL"（＝他社も読める脆弱な句）に依存していたが、
        // テナント分離のため当該句を撤去したので、ブートストラップ処理はサービスロールで実施する。
        const admin = createServiceRoleClient();
        if (!admin) {
            throw new Error("サーバー設定エラー: SUPABASE_SERVICE_ROLE_KEY が未設定です");
        }

        const { data: company, error: companyError } = await admin
            .from("companies")
            .insert({
                name: companyName,
                plan_id: freePlan.id,
                status: "trial",
                website_url: websiteUrl?.trim() || null,
                short_id: `${planChar}-${dateStr}-${tempId}`, // Temporary suffix
                trial_expires_at: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select("id")
            .single();

        if (companyError || !company) {
            throw new Error(`企業の作成に失敗しました: ${companyError?.message || "データが取得できません"}`);
        }
        createdCompanyId = company.id;

        // Update with actual UUID prefix
        const finalShortId = `${planChar}-${dateStr}-${company.id.split('-')[0].toUpperCase().slice(0, 4)}`;
        await admin.from('companies').update({ short_id: finalShortId }).eq('id', company.id);

        // 2. ユーザープロフィールの更新 (管理者以外の場合のみ)
        if (!isSuperAdmin) {
            const { error: userError } = await supabase.from("users").upsert({
                id: user.id,
                company_id: company.id,
                email: user.email ?? "",
                display_name: user.user_metadata?.full_name ?? user.email ?? "",
                role: "admin",
            });

            if (userError) {
                throw new Error(`ユーザープロフィールの更新に失敗しました: ${userError.message}`);
            }
        }

        // 3. 部署を一括作成
        const { data: createdDepts, error: deptError } = await supabase
            .from("departments")
            .insert(
                departments.map((d) => ({
                    company_id: company.id,
                    name: d.name,
                    headcount: d.headcount || 0,
                }))
            )
            .select("id, name");

        if (deptError || !createdDepts) {
            throw new Error(`部署の作成に失敗しました: ${deptError?.message}`);
        }

        // 4. KPI定義を一括作成（owner_dept_index を実際の部署 ID に変換）
        const { error: kpiError } = await supabase.from("kpi_definitions").insert(
            kpis.map((k, i) => ({
                company_id: company.id,
                name: k.name.trim(),
                unit: k.unit || "",
                target_default: k.target_default ? parseFloat(k.target_default) : null,
                owner_dept_id:
                    k.owner_dept_index !== null ? createdDepts[k.owner_dept_index]?.id ?? null : null,
                sort_order: i,
            }))
        );

        if (kpiError) {
            throw new Error(`KPIの作成に失敗しました: ${kpiError.message}`);
        }

        // 5. セマンティックレイヤーを作成（テキストがある場合のみ）
        if (semanticContent?.trim()) {
            const { error: semError } = await supabase.from("semantic_layers").insert({
                company_id: company.id,
                content: semanticContent.trim(),
                valid_from: new Date().toISOString(),
            });

            if (semError) {
                throw new Error(`組織方針の保存に失敗しました: ${semError.message}`);
            }
        }

        return NextResponse.json({ success: true, companyId: company.id });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "サーバーエラーが発生しました";
        console.error("オンボーディングエラー:", message);
        // 企業作成後に失敗した場合は巻き戻して、再登録可能な状態に戻す。
        if (createdCompanyId) {
            await rollbackOnboarding(createdCompanyId);
        }
        return NextResponse.json({ message }, { status: 500 });
    }
}
