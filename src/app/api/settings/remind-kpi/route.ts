import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendKpiReminders } from "@/lib/notifications-server";

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ユーザーの company_id を取得
        const { data: profile } = await supabase
            .from("users")
            .select("company_id, role")
            .eq("id", user.id)
            .single();

        const companyId = profile?.company_id;

        if (!companyId) {
            return NextResponse.json({ error: "No company associated" }, { status: 400 });
        }

        // 管理者権限チェック（必要に応じて）
        if (profile.role !== 'admin' && profile.role !== 'super_admin') {
            return NextResponse.json({ error: "Only admins can trigger reminders" }, { status: 403 });
        }

        // 非同期でリマインド送信を実行 (Fire-and-forget)
        void sendKpiReminders(companyId);

        return NextResponse.json({ 
            success: true, 
            message: "KPI入力リマインドを送信しました。" 
        });

    } catch (error: any) {
        console.error("Remind KPI API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
