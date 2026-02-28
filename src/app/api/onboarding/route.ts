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
    companyName: string;
    departments: { name: string; headcount: number }[];
    kpis: {
        name: string;
        unit: string;
        target_default: string;
        owner_dept_index: number | null;
        sort_order: number;
    }[];
    semanticContent: string;
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

    const { companyName, departments, kpis, semanticContent } = payload;

    // バリデーション
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
            .insert({ name: companyName.trim(), plan_id: freePlan.id, status: "trial" })
            .select("id")
            .single();

        if (companyError || !company) {
            throw new Error("企業の作成に失敗しました");
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
            throw new Error("部署の作成に失敗しました");
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
            throw new Error("KPIの作成に失敗しました");
        }

        // 5. セマンティックレイヤーを作成（テキストがある場合のみ）
        if (semanticContent?.trim()) {
            const { error: semError } = await supabase.from("semantic_layers").insert({
                company_id: company.id,
                content: semanticContent.trim(),
                valid_from: new Date().toISOString(),
            });

            if (semError) {
                throw new Error("経営方針の保存に失敗しました");
            }
        }

        // 6. users テーブルにプロフィールを作成・更新
        const { error: userError } = await supabase.from("users").upsert({
            id: user.id,
            company_id: company.id,
            email: user.email ?? "",
            display_name: user.user_metadata?.full_name ?? user.email ?? "",
            role: "admin",
        });

        if (userError) {
            throw new Error("ユーザープロフィールの更新に失敗しました");
        }

        return NextResponse.json({ success: true, companyId: company.id });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "サーバーエラーが発生しました";
        console.error("オンボーディングエラー:", message);
        return NextResponse.json({ message }, { status: 500 });
    }
}
