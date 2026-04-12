/**
 * 組織方針（セマンティックレイヤー）API Route
 *
 * 方針履歴の削除を処理します。
 * 認証済みユーザーかつ同一企業のデータのみ削除可能です。
 *
 * DELETE /api/semantic-layers?id=<uuid>
 */

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE: 指定IDの方針履歴を削除
 * サーバーサイドで認証・所有権チェックを行い、削除を実行
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "削除対象のIDが指定されていません" },
                { status: 400 }
            );
        }

        // サーバーサイド Supabase クライアント（cookieベース認証）
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        // ユーザーのプロフィール取得
        const { data: userData } = await supabase
            .from("users")
            .select("company_id, role")
            .eq("id", user.id)
            .single();

        const isSuperAdmin = userData?.role === 'super_admin';

        if (!userData?.company_id && !isSuperAdmin) {
            return NextResponse.json(
                { error: "企業情報が見つかりません" },
                { status: 403 }
            );
        }

        // 削除対象の取得
        const { data: target } = await supabase
            .from("semantic_layers")
            .select("id, company_id")
            .eq("id", id)
            .single();

        if (!target) {
            return NextResponse.json(
                { error: "指定されたレコードが見つかりません" },
                { status: 404 }
            );
        }

        // 所有権チェック (管理者の場合はスキップ)
        if (!isSuperAdmin && target.company_id !== userData?.company_id) {
            return NextResponse.json(
                { error: "権限がありません" },
                { status: 403 }
            );
        }

        // 削除実行
        const { error: deleteError } = await supabase
            .from("semantic_layers")
            .delete()
            .eq("id", id);

        if (deleteError) {
            console.error("[API] semantic_layers 削除エラー:", deleteError);
            return NextResponse.json(
                { error: `削除に失敗しました: ${deleteError.message}` },
                { status: 500 }
            );
        }

        // 削除後に最新の履歴を返す
        const { data: freshHistory } = await supabase
            .from("semantic_layers")
            .select("*")
            .eq("company_id", target.company_id)
            .order("created_at", { ascending: false });

        return NextResponse.json({
            success: true,
            deletedId: id,
            history: freshHistory || []
        });
    } catch (err) {
        console.error("[API] semantic-layers DELETE 例外:", err);
        return NextResponse.json(
            { error: "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}
