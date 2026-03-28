import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("users")
            .select("company_id")
            .eq("id", user.id)
            .single();

        if (!profile?.company_id) {
            return NextResponse.json({ error: "No company associated" }, { status: 400 });
        }

        const body = await req.json();
        const { title, description, priority, department_id, owner, is_ai_generated, status } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("action_items")
            .insert({
                company_id: profile.company_id,
                department_id: department_id || null,
                title,
                description: description || "",
                priority: priority || "normal",
                status: status || "pending",
                owner: owner || "",
                is_ai_generated: is_ai_generated || false,
                is_archived: false
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error("Action Create Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, updates } = body;

        if (!id || !updates) {
            return NextResponse.json({ error: "id and updates are required" }, { status: 400 });
        }

        // 削除ではなくアーカイブする場合もあるためupdatesには is_archived 等が含まれる
        const { data, error } = await supabase
            .from("action_items")
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error("Action Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
