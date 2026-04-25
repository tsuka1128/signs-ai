import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { sendVoiceCheckReminders } from "@/lib/notifications-server";

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();

        // 1. 認証チェック
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. 権限チェック（管理者のみ）
        const { data: profile } = await supabase
            .from("users")
            .select("company_id, role")
            .eq("id", user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const companyId = profile.company_id;
        if (!companyId) {
             return NextResponse.json({ error: "No company associated" }, { status: 400 });
        }

        // 3. 催促送信（非同期実行）
        void sendVoiceCheckReminders(companyId);

        return NextResponse.json({ success: true, message: "Reminders are being sent." });

    } catch (error: any) {
        console.error("Voice Check Reminder API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
