import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase
            .from("users").select("company_id").eq("id", user.id).single();
        if (!profile?.company_id) return NextResponse.json({ error: "No company" }, { status: 400 });

        const body = await req.json();
        const { target_month, target_field, feedback_type, comment } = body;

        if (!target_month || !target_field || !feedback_type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { error } = await supabase.from("ai_feedback").insert({
            company_id: profile.company_id,
            user_id: user.id,
            target_month,
            target_field,
            feedback_type,
            comment: comment || null,
        });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("AI Feedback API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
