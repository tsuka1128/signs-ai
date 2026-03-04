/**
 * オンボーディング API Route
 *
 * フロントエンドから受け取ったオンボーディングデータを Supabase に一括保存します。
 * 認証済みユーザーのみアクセス可能です。
 *
 * POST /api/onboarding
 */

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

/** リクエストボディの型定義 */
interface OnboardingPayload {
    companyName?: string;
    invitationToken?: string;
    selectedDeptId?: string;
    selectedKpiIds?: string[];
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

    const { companyName, departments, kpis, semanticContent, invitationToken, selectedDeptId, selectedKpiIds, websiteUrl } = payload;

    // A. 招待トークンがある場合の処理
    if (invitationToken) {
        // ダミートークン「TAION」の場合はデモデータを作成
        if (invitationToken === "TAION") {
            try {
                // 1. Free プラン取得
                const { data: freePlan } = await supabase.from("plans").select("id").eq("name", "Free").single();
                if (!freePlan) throw new Error("Freeプランが見つかりません。シードデータを確認してください。");

                // 2. デモ企業作成
                const { data: company, error: cErr } = await supabase.from("companies").insert({
                    name: "株式会社 TAION (デモ)",
                    plan_id: freePlan.id,
                    status: "active"
                }).select("id").single();
                if (cErr || !company) throw new Error("デモ企業の作成に失敗しました");

                // 3. ユーザーと紐付け
                const { error: uErr } = await supabase.from("users").upsert({
                    id: user.id,
                    company_id: company.id,
                    role: "admin",
                    email: user.email ?? "",
                    display_name: user.user_metadata?.full_name ?? user.email ?? ""
                });
                if (uErr) throw new Error(`ユーザーの紐付けに失敗しました: ${uErr.message}`);

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
                if (kErr) throw new Error(`デモKPIの作成に失敗しました: ${kErr.message}`);

                return NextResponse.json({ success: true, companyId: company.id });
            } catch (e: any) {
                console.error("TAIONデモ作成エラー:", e.message);
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

            // ユーザーを招待元の会社とロールに紐付け
            const { error: userUpdateError } = await supabase.from("users").upsert({
                id: user.id,
                company_id: invite.company_id,
                department_id: selectedDeptId || null,
                email: user.email ?? "",
                display_name: user.user_metadata?.full_name ?? user.email ?? "",
                role: invite.role,
            });

            if (userUpdateError) {
                throw new Error(`ユーザーの登録に失敗しました: ${userUpdateError.message}`);
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
    if (!companyName?.trim()) {
        return NextResponse.json({ message: "企業名は必須です" }, { status: 400 });
    }
    if (!departments?.length || departments.some((d) => !d.name?.trim())) {
        return NextResponse.json({ message: "部署名を入力してください" }, { status: 400 });
    }
    if (!kpis?.length || kpis.some((k) => !k.name?.trim())) {
        return NextResponse.json({ message: "KPI名を入力してください" }, { status: 400 });
    }

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
        const { data: company, error: companyError } = await supabase
            .from("companies")
            .insert({
                name: companyName.trim(),
                plan_id: freePlan.id,
                status: "trial",
                website_url: websiteUrl?.trim() || null
            })
            .select("id")
            .single();

        if (companyError || !company) {
            throw new Error(`企業の作成に失敗しました: ${companyError?.message || "データが取得できません"}`);
        }

        // 2. ユーザープロフィールの更新
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

        // 3. 部署を一括作成
        const { data: createdDepts, error: deptError } = await supabase
            .from("departments")
            .insert(
                departments.map((d) => ({
                    company_id: company.id,
                    name: d.name.trim(),
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
        return NextResponse.json({ message }, { status: 500 });
    }
}
