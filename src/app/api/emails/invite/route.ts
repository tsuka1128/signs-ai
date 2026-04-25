import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendInvitationEmail } from "@/lib/mail";
import { getBaseURL } from "@/lib/utils/index";

export async function POST(req: NextRequest) {
    try {
        const { invitationId } = await req.json();
        if (!invitationId) return NextResponse.json({ error: "invitationId is required" }, { status: 400 });

        const supabase = await createServerSupabaseClient();
        
        // 招待情報の取得 (会社名もJOIN)
        const { data: inv, error: invErr } = await supabase
            .from('invitations')
            .select('*, companies(name)')
            .eq('id', invitationId)
            .single();

        if (invErr || !inv) throw new Error("招待情報が見つかりません");
        if (inv.status !== 'pending') throw new Error("この招待は既に使用されているか、無効です");

        const inviteUrl = `${getBaseURL()}/onboarding#token=${inv.token}`;
        const companyName = inv.companies?.name || "Signs AI";

        console.log(`Sending invite email to ${inv.email} for ${companyName}`);

        // メール送信
        await sendInvitationEmail(inv.email, companyName, inviteUrl);

        // 送信日時を更新
        await supabase.from('invitations').update({ 
            updated_at: new Date().toISOString() 
        } as any).eq('id', invitationId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Invitation Email API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
